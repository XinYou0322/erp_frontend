import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { INITIAL_USERS } from "../data/initialData";
import {
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_SECURITY_AUDIT_LOGS,
} from "../data/permissionData";
import { StorageService } from "../service/storage.service";
import httpClient from "@/service/httpClient";

export const useAuthStore = defineStore("auth", () => {
  // --- State ---
  const users = ref(StorageService.get("system_users", INITIAL_USERS));
  const currentUser = ref(
    StorageService.get("current_user", users.value[0] || INITIAL_USERS[0]),
  );
  const isAuthenticated = ref(StorageService.get("is_authenticated", false));
  const rolePermissions = ref(
    StorageService.get("role_permissions_matrix", DEFAULT_ROLE_PERMISSIONS),
  );
  const auditLogs = ref(
    StorageService.get("security_audit_logs", INITIAL_SECURITY_AUDIT_LOGS),
  );

  // 後端真實角色清單
  const serverRoles = ref([]);

  // 刷卡打卡狀態
  const isClockedIn = ref(StorageService.get("is_clocked_in", true));
  const clockTime = ref("08:55 AM");

  // --- 角色映射 (後端中文職稱 <-> 前端四級 RBAC 角色) ---
  function mapRoleToSystemRole(role) {
    if (!role) return "guest";
    const str = String(role).trim().toLowerCase();
    if (str === "admin" || str.includes("店長") || str.includes("管理員"))
      return "admin";
    if (str === "manager" || str.includes("經理") || str.includes("組長"))
      return "manager";
    if (
      str === "employee" ||
      str.includes("正職") ||
      str.includes("pt") ||
      str.includes("班長") ||
      str.includes("員工") ||
      str.includes("收銀")
    )
      return "employee";
    return "guest";
  }

  // --- Computed Roles ---
  const currentRole = computed(() => currentUser.value?.role);
  const normalizedRole = computed(() =>
    mapRoleToSystemRole(currentUser.value?.role),
  );
  const isAdmin = computed(() => normalizedRole.value === "admin");
  const isManager = computed(
    () =>
      normalizedRole.value === "manager" || normalizedRole.value === "admin",
  );
  const isEmployee = computed(() => normalizedRole.value === "employee");
  const isGuest = computed(() => normalizedRole.value === "guest");

  // 當前使用者的權限清單
  const userPermissions = computed(() => {
    if (!currentUser.value?.role) return [];
    // 優先匹配原始角色，若無則依標準映射角色匹配權限
    return (
      rolePermissions.value[currentUser.value.role] ||
      rolePermissions.value[normalizedRole.value] ||
      []
    );
  });

  // --- Permission Helpers ---
  function hasPermission(key) {
    if (isAdmin.value) return true;
    return userPermissions.value.includes(key);
  }

  function canAccessModule(moduleName) {
    if (isAdmin.value) return true;
    const prefix = `${moduleName}.`;
    return userPermissions.value.some((p) => p.startsWith(prefix));
  }

  // --- Audit Log Helper ---
  function recordAuditLog(action, module, details, status = "success") {
    if (!currentUser.value) return;

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      userId: currentUser.value.id,
      userName: currentUser.value.name,
      action,
      module,
      details,
      ipAddress: "192.168.1.10",
      status,
    };

    auditLogs.value = [newLog, ...auditLogs.value];
    if (auditLogs.value.length > 50) auditLogs.value.pop();
    StorageService.set("security_audit_logs", auditLogs.value);
  }

  // --- Core Actions ---
  function login(user) {
    currentUser.value = user;
    isAuthenticated.value = true;

    // 更新本地與持久化狀態中的最後登入時間
    const idx = users.value.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users.value[idx].lastLogin = new Date()
        .toISOString()
        .replace("T", " ")
        .slice(0, 16);
      StorageService.set("system_users", users.value);
    }

    StorageService.set("current_user", currentUser.value);
    StorageService.set("is_authenticated", true);

    recordAuditLog(
      "系統登入",
      "auth",
      `使用者「${user.name}」登入系統成功 (${user.roleName || user.role})。`,
      "success",
    );
  }

  /**
   * 整合後的非同步憑證登入（優先走 API，失敗時可選擇是否降級走本地比對）
   */
  async function loginWithCredentials(email, password) {
    const cleanEmail = email.trim();

    try {
      // 1. 呼叫後端驗證 API (Spring Boot Session 寫入)
      const response = await httpClient.post("/api/users/login", {
        username: cleanEmail,
        password: password,
      });
      const { user, message } = response.data;

      const authenticatedUser = {
        ...user,
        role: user.role?.name || user.role,
        roleName: user.role?.description || user.role?.name || "使用者",
      };

      login(authenticatedUser);

      return {
        success: true,
        message: message || `歡迎回來，${authenticatedUser.name}！`,
        user: authenticatedUser,
      };
    } catch (error) {
      // 2. API 失敗時的防禦機制：若後端掛掉，可改由本地 LocalStorage 進行緊急比對
      const matched = users.value.find(
        (u) =>
          u.email.toLowerCase() === cleanEmail.toLowerCase() ||
          u.name === cleanEmail,
      );

      if (matched) {
        if (matched.status === "inactive" || matched.status === "INACTIVE") {
          return {
            success: false,
            message: "該帳號已被系統管理員停用，無法登入。",
          };
        }
        if (password && matched.password && matched.password === password) {
          login(matched);
          return {
            success: true,
            message: `[本地認證] 歡迎回來，${matched.name}！`,
            user: matched,
          };
        }
      }

      const errorMsg =
        error.response?.data?.message || "帳號或密碼錯誤，請重新確認。";
      return { success: false, message: errorMsg };
    }
  }

  async function logout() {
    if (currentUser.value) {
      recordAuditLog(
        "系統登出",
        "auth",
        `使用者「${currentUser.value.name}」主動登出。`,
        "warning",
      );
    }
    try {
      await httpClient.post("/api/users/logout");
    } catch (e) {
      console.warn("後端登出 Session 銷毀失敗:", e);
    }
    isAuthenticated.value = false;
    currentUser.value = null;
    StorageService.set("is_authenticated", false);
    StorageService.remove("current_user");
  }

  function switchUser(user) {
    currentUser.value = user;
    StorageService.set("current_user", user);
    recordAuditLog(
      "切換身分",
      "auth",
      `身分快速切換至「${user.name}」(${user.roleName || user.role})。`,
      "success",
    );
  }

  function switchRole(role) {
    const matched = users.value.find((u) => u.role === role);
    if (matched) {
      switchUser(matched);
    }
  }

  // --- Permission Matrix Operations ---
  function toggleRolePermission(role, key) {
    const currentList = rolePermissions.value[role] || [];
    const exists = currentList.includes(key);

    if (exists) {
      rolePermissions.value[role] = currentList.filter((k) => k !== key);
    } else {
      rolePermissions.value[role] = [...currentList, key];
    }

    StorageService.set("role_permissions_matrix", rolePermissions.value);
    recordAuditLog(
      "權限矩陣異動",
      "permissions",
      `修改了角色【${role}】的權限「${key}」為：${!exists ? "開啟" : "關閉"}。`,
      "warning",
    );
  }

  function resetPermissionsToDefault() {
    rolePermissions.value = JSON.parse(
      JSON.stringify(DEFAULT_ROLE_PERMISSIONS),
    );
    StorageService.set("role_permissions_matrix", rolePermissions.value);
    recordAuditLog(
      "重設權限矩陣",
      "permissions",
      "已將所有角色的權限矩陣復原至系統出廠預設值。",
      "warning",
    );
  }

  // =========================================================================
  // 後端真實 API 串接：使用者管理 (User Management RESTful CRUD)
  // =========================================================================

  /** 從後端取得分頁使用者清單 */
  async function fetchUsersFromApi(keyword = "", page = 0, size = 50) {
    try {
      const res = await httpClient.get("/api/users", {
        params: { keyword, page, size, sortBy: "id", direction: "desc" },
      });
      if (res.data && res.data.content) {
        // 將後端 UserResponseDTO 轉換對齊為前端使用者資料結構
        const mappedUsers = res.data.content.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          role: u.role?.name || "employee",
          roleName: u.role?.description || u.role?.name || "一般員工",
          roleId: u.role?.id,
          department: u.department?.name || "門市營運部",
          status: (u.status || "ACTIVE").toLowerCase(),
          createdAt: u.createdAt
            ? u.createdAt.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          lastLogin: "已連線",
        }));
        users.value = mappedUsers;
        StorageService.set("system_users", users.value);
        return res.data;
      }
    } catch (err) {
      console.warn("從後端載入使用者列表失敗，使用本地備援資料:", err);
    }
  }

  /** 從後端取得所有角色清單 */
  async function fetchRolesFromApi() {
    try {
      const res = await httpClient.get("/api/roles");
      if (res.data) {
        serverRoles.value = res.data;
        return res.data;
      }
    } catch (err) {
      console.warn("載入角色清單失敗:", err);
    }
    return [];
  }

  /** 呼叫後端新增使用者 API */
  async function createUserApi(userDto) {
    try {
      const res = await httpClient.post("/api/users", {
        username: userDto.username || userDto.email.split("@")[0],
        password: userDto.password || "Test1234!",
        name: userDto.name,
        email: userDto.email,
        roleId: Number(userDto.roleId) || 1,
      });
      await fetchUsersFromApi();
      recordAuditLog(
        "開立帳號",
        "permissions",
        `成功建立使用者「${userDto.name}」(${userDto.email})。`,
      );
      return res.data;
    } catch (err) {
      // 降級為本地新增
      return addUser(userDto);
    }
  }

  /** 呼叫後端修改使用者 API */
  async function updateUserApi(id, userDto) {
    try {
      const statusUpper = (userDto.status || "active").toUpperCase();
      const res = await httpClient.put(`/api/users/${id}`, {
        name: userDto.name,
        email: userDto.email,
        roleId: Number(userDto.roleId) || 1,
        status: statusUpper === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      await fetchUsersFromApi();
      recordAuditLog(
        "修改使用者",
        "permissions",
        `成功更新使用者 ID ${id} 資料。`,
      );
      return res.data;
    } catch (err) {
      return updateUser(id, userDto);
    }
  }

  /** 呼叫後端修改狀態 API */
  async function toggleUserStatusApi(id, currentStatus) {
    try {
      const nextStatus =
        currentStatus === "active" || currentStatus === "ACTIVE"
          ? "INACTIVE"
          : "ACTIVE";
      const res = await httpClient.patch(
        `/api/users/${id}/status?status=${nextStatus}`,
      );
      await fetchUsersFromApi();
      recordAuditLog(
        "使用者狀態異動",
        "permissions",
        `變更使用者 ID ${id} 狀態為 ${nextStatus}。`,
      );
      return res.data;
    } catch (err) {
      return toggleUserStatus(id);
    }
  }

  /** 呼叫後端刪除使用者 API */
  async function deleteUserApi(id) {
    try {
      const res = await httpClient.delete(`/api/users/${id}`);
      await fetchUsersFromApi();
      recordAuditLog(
        "刪除帳號",
        "permissions",
        `成功刪除使用者 ID ${id}。`,
        "danger",
      );
      return res.data;
    } catch (err) {
      return deleteUser(id);
    }
  }

  // --- Local Fallback CRUD ---
  function addUser(user) {
    const roleNames = {
      admin: "系統管理員",
      manager: "營運經理",
      employee: "現場員工",
      guest: "訪客審計",
    };

    const newUser = {
      id: `usr-${Date.now()}`,
      name: user.name,
      email: user.email,
      password: user.password || "123456",
      role: user.role,
      roleName: roleNames[user.role] || user.role || "使用者",
      department: user.department || "門市部",
      avatar: user.avatar || "https://unsplash.com",
      phone: user.phone || "+886 900-000-000",
      status: "active",
      createdAt: new Date().toISOString().slice(0, 10),
      lastLogin: "尚未登入",
    };

    users.value = [...users.value, newUser];
    StorageService.set("system_users", users.value);
    return newUser;
  }

  function updateUser(id, updates) {
    const idx = users.value.findIndex((u) => u.id === id);
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...updates };
      if (currentUser.value?.id === id) {
        currentUser.value = { ...currentUser.value, ...updates };
        StorageService.set("current_user", currentUser.value);
      }
      StorageService.set("system_users", users.value);
    }
  }

  function toggleUserStatus(id) {
    const idx = users.value.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const currentStatus = users.value[idx].status;
      const newStatus =
        currentStatus === "active" || currentStatus === "ACTIVE"
          ? "inactive"
          : "active";
      users.value[idx].status = newStatus;
      StorageService.set("system_users", users.value);
      if (currentUser.value?.id === id && newStatus === "inactive") {
        logout();
      }
    }
  }

  function deleteUser(id) {
    if (currentUser.value?.id === id) {
      throw new Error("無法刪除當前登入中的帳號！");
    }
    users.value = users.value.filter((u) => u.id !== id);
    StorageService.set("system_users", users.value);
  }

  return {
    users,
    currentUser,
    isAuthenticated,
    rolePermissions,
    auditLogs,
    serverRoles,
    isClockedIn,
    clockTime,
    currentRole,
    normalizedRole,
    isAdmin,
    isManager,
    isEmployee,
    isGuest,
    userPermissions,
    hasPermission,
    canAccessModule,
    recordAuditLog,
    login,
    loginWithCredentials,
    logout,
    switchUser,
    switchRole,
    toggleRolePermission,
    resetPermissionsToDefault,
    fetchUsersFromApi,
    fetchRolesFromApi,
    createUserApi,
    updateUserApi,
    toggleUserStatusApi,
    deleteUserApi,
    addUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
  };
});
