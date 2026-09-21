import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_SECURITY_AUDIT_LOGS,
} from "../data/permissionData";
import { StorageService } from "../service/storage.service";
import httpClient from "@/service/httpClient";
import {
  DEFAULT_AVATARS,
  getDefaultAvatar,
  normalizeAvatarUrl,
} from "../data/defaultAvatars";
import { useNotificationStore } from "./notification.store";

const DEFAULT_AVATAR = getDefaultAvatar();

export const useAuthStore = defineStore("auth", () => {
  // --- State ---
  /** @type {import('vue').Ref<any[]>} */
  const users = ref(StorageService.get("system_users", []));
  /** @type {import('vue').Ref<any>} */
  const currentUser = ref(StorageService.get("current_user", null));
  const isAuthenticated = ref(StorageService.get("is_authenticated", false));
  const rolePermissions = ref(
    StorageService.get("role_permissions_matrix", DEFAULT_ROLE_PERMISSIONS),
  );
  const auditLogs = ref(
    StorageService.get("security_audit_logs", INITIAL_SECURITY_AUDIT_LOGS),
  );

  // 後端真實角色清單
  /** @type {import('vue').Ref<any[]>} */
  const serverRoles = ref([]);

  // 刷卡打卡狀態
  const isClockedIn = ref(StorageService.get("is_clocked_in", true));
  const clockTime = ref(StorageService.get("clock_time", "08:55 AM"));
  const clockTimeline = ref(StorageService.get("clock_timeline", []));
  const clockRecords = ref(StorageService.get("clock_records", []));

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
  function normalizeUserStatus(status) {
    const value = String(status || "active").toLowerCase();
    if (
      [
        "pending",
        "approved",
        "rejected",
        "active",
        "inactive",
        "locked",
      ].includes(value)
    ) {
      return value;
    }
    return "active";
  }

  function canUserLogin(status) {
    const normalized = normalizeUserStatus(status);
    return normalized === "approved" || normalized === "active";
  }

  function isValidBackendUserId(value) {
    if (value === null || value === undefined) return false;
    if (Number.isInteger(value)) return value >= 0;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return false;
      const parsed = Number(trimmed);
      return Number.isInteger(parsed) && parsed >= 0;
    }
    return false;
  }

  function clearFrontendSession() {
    isAuthenticated.value = false;
    currentUser.value = null;
    StorageService.set("is_authenticated", false);
    StorageService.remove("current_user");
  }

  async function restoreSessionFromBackend() {
    try {
      const response = await httpClient.get("/api/users/now");
      const user = response?.data;

      if (!user || !user.name) {
        clearFrontendSession();
        return false;
      }

      // 💡 修正點：使用你原本就寫好的對應轉換函式，把後端 role 物件拍平成前端要的欄位
      const normalizedUser = mapBackendUserToFrontend(user);

      currentUser.value = normalizedUser;
      isAuthenticated.value = true;
      StorageService.set("current_user", normalizedUser);
      StorageService.set("is_authenticated", true);
      return true;
    } catch (error) {
      clearFrontendSession();
      if (error?.response?.status === 401) {
        console.log("當前處於未登入狀態，請進行登入。");
      } else {
        console.warn("回復 Session 時發生其他錯誤:", error);
      }
      return false;
    }
  }

  function login(user) {
    const status = normalizeUserStatus(user?.status);

    if (status === "pending") {
      return {
        success: false,
        message: "此帳號尚待管理員審核，請等待審核結果後再登入。",
      };
    }

    if (status === "rejected") {
      return {
        success: false,
        message: "此帳號申請已被駁回，請重新提出申請或聯絡管理員。",
      };
    }

    if (status === "inactive" || status === "locked") {
      return {
        success: false,
        message: "該帳號已被停用或鎖定，無法登入。",
      };
    }

    const normalizedUser = {
      ...user,
      id: isValidBackendUserId(user?.id) ? Number(user.id) : user?.id,
    };

    currentUser.value = normalizedUser;
    isAuthenticated.value = true;

    const idx = users.value.findIndex((u) => u.id === normalizedUser.id);
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

    return {
      success: true,
      message: `歡迎回來，${user.name}！`,
      user: normalizedUser,
    };
  }

  async function loginWithCredentials(cleanEmail, password) {
    const email = String(cleanEmail || "").trim();
    const passwordValue = String(password || "");

    if (!email || !passwordValue) {
      return {
        success: false,
        message: "請輸入帳號與密碼。",
      };
    }

    try {
      const response = await httpClient.post("/api/users/login", {
        username: email,
        password: passwordValue,
      });

      const { user, message } = response.data || {};
      const backendUserId = user?.id;
      const authenticatedUser = {
        ...user,
        id: isValidBackendUserId(backendUserId)
          ? Number(backendUserId)
          : backendUserId,
        avatar: normalizeAvatarUrl(user?.avatar || DEFAULT_AVATAR),
        role: user?.role?.name || user?.role,
        roleName: user?.role?.description || user?.role?.name || "使用者",
      };

      const loginResult = login(authenticatedUser);
      if (!loginResult.success) {
        return loginResult;
      }

      return {
        success: true,
        message: message || loginResult.message,
        user: authenticatedUser,
      };
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || "帳號或密碼錯誤，請重新確認。";
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
    clearFrontendSession();
  }

  async function loginQuickly(user) {
    try {
      // 1. 先去後端成功建立 Session
      await httpClient.post(`/api/users/switch-test-user/${user.id}`);

      // 2. 💡 確保格式一致（user 傳進來時已經是前端格式，但補強對齊）
      currentUser.value = user;
      isAuthenticated.value = true;

      StorageService.set("current_user", user);
      StorageService.set("is_authenticated", true);

      // 💡 觸發一次更新最後登入時間，維持系統使用者狀態同步
      const idx = users.value.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        users.value[idx].lastLogin = new Date()
          .toISOString()
          .replace("T", " ")
          .slice(0, 16);
        StorageService.set("system_users", users.value);
      }

      return { success: true };
    } catch (error) {
      console.error("後端快速登入同步失敗:", error);
      return { success: false };
    }
  }

  async function switchUser(user) {
    try {
      // 發請求告訴後端，我們要切換 Session 裡的角色
      await httpClient.post(`/api/users/switch-test-user/${user.id}`);

      // 後端切換成功後，前端同步更新狀態
      currentUser.value = user;
      StorageService.set("current_user", user);

      // 💡 確保登入標記也是 true
      isAuthenticated.value = true;
      StorageService.set("is_authenticated", true);

      recordAuditLog(
        "切換身分",
        "auth",
        `身分快速切換至「${user.name}」(${user.roleName || user.role})。`,
        "success",
      );
    } catch (err) {
      console.error("後端身分切換失敗:", err);
    }
  }

  function switchRole(role) {
    const matched = users.value.find((u) => u.role === role);
    if (matched) {
      switchUser(matched);
    }
  }

  // --- Permission Matrix Operations ---
  function toggleRolePermission(role, key) {
    if (!isAdmin.value) {
      return;
    }

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
    if (!isAdmin.value) {
      return;
    }

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

  function mapBackendUserToFrontend(u) {
    return {
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      avatar: normalizeAvatarUrl(u.avatar || getDefaultAvatar()),
      role: u.role?.name || "employee",
      roleName: u.role?.description || u.role?.name || "一般員工",
      roleId: u.role?.id,
      department: u.department?.name || "門市營運部",
      status: normalizeUserStatus(u.status || "ACTIVE"),
      createdAt: u.createdAt
        ? u.createdAt.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      lastLogin: "已連線",
    };
  }

  /** 從後端取得分頁使用者清單 */
  async function fetchUsersFromApi(keyword = "", page = 0, size = 50) {
    try {
      const res = await httpClient.get("/api/users", {
        params: { keyword, page, size, sortBy: "id", direction: "desc" },
      });
      if (res.data && res.data.content) {
        const mappedUsers = res.data.content.map(mapBackendUserToFrontend);
        users.value = mappedUsers;
        StorageService.set("system_users", users.value);
        return res.data;
      }
      if (Array.isArray(res.data)) {
        const mappedUsers = res.data.map(mapBackendUserToFrontend);
        users.value = mappedUsers;
        StorageService.set("system_users", users.value);
        return { content: mappedUsers };
      }
    } catch (err) {
      try {
        const fallbackRes = await httpClient.get("/api/users/all");
        if (Array.isArray(fallbackRes.data)) {
          const mappedUsers = fallbackRes.data.map(mapBackendUserToFrontend);
          users.value = mappedUsers;
          StorageService.set("system_users", users.value);
          return { content: mappedUsers };
        }
      } catch (fallbackErr) {
        console.warn("從後端載入使用者列表失敗:", fallbackErr);
      }
    }
    users.value = [];
    StorageService.set("system_users", users.value);
    return { content: [] };
  }

  async function fetchPublicUsersForLogin() {
    try {
      const res = await httpClient.get("/api/users/all");
      if (Array.isArray(res.data)) {
        const mappedUsers = res.data.map(mapBackendUserToFrontend);
        users.value = mappedUsers;
        StorageService.set("system_users", users.value);
        return mappedUsers;
      }
    } catch (err) {
      console.warn("載入登入用後端帳號列表失敗:", err);
    }
    users.value = [];
    StorageService.set("system_users", users.value);
    return [];
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
    const payload = {
      username: userDto.username || (userDto.email || "").split("@")[0],
      password: userDto.password || "Test1234!",
      name: userDto.name,
      email: userDto.email,
      roleId: Number(userDto.roleId) || 1,
      avatar: userDto.avatar || "",
    };

    const res = await httpClient.post("/api/users/register", payload);
    await fetchUsersFromApi();
    recordAuditLog(
      "開立帳號",
      "permissions",
      `成功建立使用者「${userDto.name}」(${userDto.email})。`,
    );
    return res.data;
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
        avatar: userDto.avatar || "",
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
  function normalizeUserStatus(status) {
    const value = String(status || "active").toLowerCase();
    if (
      [
        "pending",
        "approved",
        "rejected",
        "active",
        "inactive",
        "locked",
      ].includes(value)
    ) {
      return value;
    }
    return "active";
  }

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
      avatar: user.avatar || DEFAULT_AVATAR,
      phone: user.phone || "+886 900-000-000",
      status: normalizeUserStatus(user.status || "pending"),
      reason: user.reason || "",
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

  function updateUserStatus(id, status) {
    const idx = users.value.findIndex((u) => u.id === id);
    if (idx === -1) return;

    const nextStatus = normalizeUserStatus(status);
    const currentName = users.value[idx].name || "";

    users.value[idx].status = nextStatus;
    if (nextStatus === "approved") {
      users.value[idx].name = currentName.replace(/\s*\(待核准\)$/, "");
    }
    StorageService.set("system_users", users.value);

    if (nextStatus === "rejected") {
      recordAuditLog(
        "帳號申請駁回",
        "permissions",
        `已拒絕使用者「${users.value[idx].name}」的帳號申請。`,
        "danger",
      );
    } else if (nextStatus === "approved") {
      recordAuditLog(
        "帳號申請核准",
        "permissions",
        `已核准使用者「${users.value[idx].name}」的帳號申請。`,
        "success",
      );
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

  function appendClockRecord(
    action,
    note = "",
    timestamp = new Date().toISOString(),
  ) {
    const record = {
      id: `clock-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      userId: currentUser.value?.id || "system",
      userName: currentUser.value?.name || "系統",
      action,
      note,
      timestamp,
      status: action === "上班打卡" ? "success" : "warning",
    };

    clockTimeline.value = [record, ...clockTimeline.value].slice(0, 20);
    clockRecords.value = [record, ...clockRecords.value].slice(0, 50);
    StorageService.set("clock_timeline", clockTimeline.value);
    StorageService.set("clock_records", clockRecords.value);
  }

  async function fetchClockRecords(userId = currentUser.value?.id) {
    try {
      const params = userId ? { userId } : {};
      const response = await httpClient.get("/api/clock/history", { params });
      const records = Array.isArray(response?.data?.records)
        ? response.data.records.map((item) => ({
            id: item.id,
            userId: item.userId,
            userName: item.userName || currentUser.value?.name || "系統",
            action:
              item.label ||
              (item.clockType === "CLOCK_IN" ? "上班打卡" : "簽退記錄"),
            note:
              item.label ||
              (item.clockType === "CLOCK_IN" ? "上班打卡" : "簽退記錄"),
            timestamp: item.clockTime,
            status: item.clockType === "CLOCK_IN" ? "success" : "warning",
          }))
        : [];

      clockRecords.value = records;
      StorageService.set("clock_records", records);
      return records;
    } catch (error) {
      const fallback =
        clockTimeline.value.length > 0 ? clockTimeline.value : [];
      clockRecords.value = fallback;
      StorageService.set("clock_records", fallback);
      return fallback;
    }
  }

  async function toggleClock() {
    if (!currentUser.value?.id) {
      console.warn("沒有登入使用者，無法打卡。");
      return;
    }

    const currentStatus = isClockedIn.value ? "IN" : "OUT";

    try {
      const res = await httpClient.post("/api/clock/toggle", {
        userId: currentUser.value.id,
        currentStatus,
      });

      const payload = res.data || {};
      const nextState = Boolean(payload.isClockedIn);
      const serverClockTime = payload.clockTime || new Date().toISOString();
      const formattedTime = new Date(serverClockTime).toLocaleTimeString(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        },
      );

      isClockedIn.value = nextState;
      clockTime.value = formattedTime;
      StorageService.set("is_clocked_in", isClockedIn.value);
      StorageService.set("clock_time", clockTime.value);

      const action = nextState ? "上班打卡" : "簽退記錄";
      const note = nextState
        ? `已於 ${formattedTime} 打卡上班（後端同步）`
        : `已於 ${formattedTime} 簽退（後端同步）`;

      appendClockRecord(action, note, serverClockTime);
      recordAuditLog(
        action,
        "attendance",
        note,
        nextState ? "success" : "warning",
      );
      const notifStore = useNotificationStore();
      const userName = currentUser.value?.name || "同仁";
      const shortTime = new Date(serverClockTime).toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (nextState) {
        // nextState 為 true 代表切換到了上班狀態
        notifStore.triggerCheckInAlert(userName, shortTime);
      } else {
        // nextState 為 false 代表切換到了下班狀態
        notifStore.triggerCheckOutAlert(userName, shortTime);
      }

      return {
        success: true,
        message:
          payload.message || (nextState ? "打卡上班成功！" : "簽退成功！"),
        isClockedIn: nextState,
        clockTime: serverClockTime,
      };
    } catch (error) {
      const message = error?.response?.data || "打卡失敗，請稍後再試。";
      recordAuditLog(
        "打卡失敗",
        "attendance",
        `使用者 ${currentUser.value?.name || "未知使用者"} 觸發打卡失敗：${message}`,
        "danger",
      );
      return {
        success: false,
        message,
      };
    }
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
    clockTimeline,
    clockRecords,
    currentRole,
    normalizedRole,
    isAdmin,
    isManager,
    isEmployee,
    isGuest,
    userPermissions,
    loginQuickly,
    hasPermission,
    canAccessModule,
    recordAuditLog,
    login,
    loginWithCredentials,
    restoreSessionFromBackend,
    isValidBackendUserId,
    clearFrontendSession,
    logout,
    switchUser,
    switchRole,
    toggleRolePermission,
    resetPermissionsToDefault,
    fetchUsersFromApi,
    fetchPublicUsersForLogin,
    fetchRolesFromApi,
    fetchClockRecords,
    createUserApi,
    updateUserApi,
    toggleUserStatusApi,
    deleteUserApi,
    addUser,
    updateUser,
    updateUserStatus,
    toggleUserStatus,
    deleteUser,
    toggleClock,
  };
});
