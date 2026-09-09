import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { INITIAL_USERS } from "../data/initialData";
import {
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_SECURITY_AUDIT_LOGS,
} from "../data/permissionData";
import { StorageService } from "../services/storage.service";
import httpClient from "@/service/httpClient";

export const useAuthStore = defineStore("auth", () => {
  // --- State ---
  const users = ref(StorageService.get("system_users", INITIAL_USERS));
  const currentUser = ref(
    StorageService.get("current_user", users.value[0] || INITIAL_USERS[0]),
  );
  const isAuthenticated = ref(StorageService.get("is_authenticated", true));
  const rolePermissions = ref(
    StorageService.get("role_permissions_matrix", DEFAULT_ROLE_PERMISSIONS),
  );
  const auditLogs = ref(
    StorageService.get("security_audit_logs", INITIAL_SECURITY_AUDIT_LOGS),
  );

  // 刷卡打卡狀態
  const isClockedIn = ref(StorageService.get("is_clocked_in", true));
  const clockTime = ref("08:55 AM");

  // --- Computed Roles ---
  const currentRole = computed(() => currentUser.value?.role);
  const isAdmin = computed(() => currentUser.value?.role === "admin");
  const isManager = computed(
    () =>
      currentUser.value?.role === "manager" ||
      currentUser.value?.role === "admin",
  );
  const isEmployee = computed(() => currentUser.value?.role === "employee");
  const isGuest = computed(() => currentUser.value?.role === "guest");

  // 當前使用者的權限清單
  const userPermissions = computed(() => {
    if (!currentUser.value?.role) return [];
    return rolePermissions.value[currentUser.value.role] || [];
  });

  // --- Permission Helpers ---
  function hasPermission(key) {
    if (currentUser.value?.role === "admin") return true;
    return userPermissions.value.includes(key);
  }

  function canAccessModule(moduleName) {
    if (currentUser.value?.role === "admin") return true;
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
      ipAddress: "192.168.1.10", // 建議未來由後端提供或透過 API 獲取
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
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. 呼叫後端驗證 API
      const response = await httpClient.post("/api/users/login", {
        username: cleanEmail,
        password: password,
      });
      const { user, message } = response.data;

      const authenticatedUser = {
        ...user,
        role: user.role?.name || user.role,
        roleName: user.role?.description || "一般使用者",
      };

      login(authenticatedUser);

      return {
        success: true,
        message: message || `歡迎回來，${authenticatedUser.name}！`,
        user: authenticatedUser,
      };
    } catch (error) {
      // 2. API 失敗時的防禦機制：若後端掛掉，可改由本地 LocalStorage 進行緊急比對（或直接回傳錯誤）
      const matched = users.value.find(
        (u) => u.email.toLowerCase() === cleanEmail,
      );

      if (matched) {
        if (matched.status === "inactive") {
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

  function logout() {
    if (currentUser.value) {
      recordAuditLog(
        "系統登出",
        "auth",
        `使用者「${currentUser.value.name}」主動登出。`,
        "warning",
      );
    }
    isAuthenticated.value = false;
    StorageService.set("is_authenticated", false);
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

  // --- User Accounts CRUD (補全與優化) ---
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
      roleName: roleNames[user.role] || "使用者",
      department: user.department,
      avatar: user.avatar || "https://unsplash.com", // 使用更穩定的預設頭像
      phone: user.phone || "+886 900-000-000",
      status: "active",
      createdAt: new Date().toISOString().slice(0, 10),
      lastLogin: "尚未登入",
    };

    users.value = [...users.value, newUser];
    StorageService.set("system_users", users.value);

    recordAuditLog(
      "開立帳號",
      "permissions",
      `新增使用者「${newUser.name}」(${newUser.email})，指派為 ${newUser.roleName}。`,
      "success",
    );
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
      recordAuditLog(
        "修改使用者",
        "permissions",
        `更新了使用者「${users.value[idx].name}」的個人與權限資料。`,
        "success",
      );
    }
  }

  /**
   * 補全：切換使用者啟用/停用狀態
   */
  function toggleUserStatus(id) {
    const idx = users.value.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const currentStatus = users.value[idx].status;
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      users.value[idx].status = newStatus;
      StorageService.set("system_users", users.value);

      recordAuditLog(
        "使用者狀態異動",
        "permissions",
        `將使用者「${users.value[idx].name}」的帳號狀態變更為：${newStatus === "active" ? "啟用" : "停用"}。`,
        "warning",
      );

      // 如果被停用的是目前登入者，強制登出
      if (currentUser.value?.id === id && newStatus === "inactive") {
        logout();
      }
    }
  }

  // 補全：刪除使用者帳號
  function deleteUser(id) {
    if (currentUser.value?.id === id) {
      throw new Error("無法刪除當前登入中的帳號！");
    }
    users.value = users.value.filter((u) => u.id !== id);
    StorageService.set("system_users", users.value);

    recordAuditLog(
      "刪除帳號",
      "permissions",
      `管理員刪除了 ID 為 ${id} 的使用者帳號。`,
      "danger",
    );
  }

  return {
    users,
    currentUser,
    isAuthenticated,
    rolePermissions,
    auditLogs,
    isClockedIn,
    clockTime,
    currentRole,
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
    addUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
  };
});
