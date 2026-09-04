import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { INITIAL_USERS } from '../data/initialData';
import { DEFAULT_ROLE_PERMISSIONS, INITIAL_SECURITY_AUDIT_LOGS, } from '../data/permissionData';
import { StorageService } from '../services/storage.service';
export const useAuthStore = defineStore('auth', () => {
    // Users list with persistence
    const users = ref(StorageService.get('system_users', INITIAL_USERS));
    const currentUser = ref(StorageService.get('current_user', users.value[0] || INITIAL_USERS[0]));
    const isAuthenticated = ref(StorageService.get('is_authenticated', true));
    // Dynamic Role Permissions Matrix
    const rolePermissions = ref(StorageService.get('role_permissions_matrix', DEFAULT_ROLE_PERMISSIONS));
    // Security Audit Logs
    const auditLogs = ref(StorageService.get('security_audit_logs', INITIAL_SECURITY_AUDIT_LOGS));
    // Punch clock state
    const isClockedIn = ref(StorageService.get('is_clocked_in', true));
    const clockTime = ref('08:55 AM');
    // Computed Roles
    const currentRole = computed(() => currentUser.value.role);
    const isAdmin = computed(() => currentUser.value.role === 'admin');
    const isManager = computed(() => currentUser.value.role === 'manager' || currentUser.value.role === 'admin');
    const isEmployee = computed(() => currentUser.value.role === 'employee');
    const isGuest = computed(() => currentUser.value.role === 'guest');
    // Computed Current User Permissions
    const userPermissions = computed(() => {
        return rolePermissions.value[currentUser.value.role] || [];
    });
    // Permission Check Helper
    function hasPermission(key) {
        if (currentUser.value.role === 'admin')
            return true;
        return userPermissions.value.includes(key);
    }
    function canAccessModule(moduleName) {
        if (currentUser.value.role === 'admin')
            return true;
        const prefix = `${moduleName}.`;
        return userPermissions.value.some((p) => p.startsWith(prefix));
    }
    // Audit Log Helper
    function recordAuditLog(action, module, details, status = 'success') {
        const newLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            userId: currentUser.value.id,
            userName: currentUser.value.name,
            action,
            module,
            details,
            ipAddress: '192.168.1.10',
            status,
        };
        auditLogs.value.unshift(newLog);
        if (auditLogs.value.length > 50)
            auditLogs.value.pop();
        StorageService.set('security_audit_logs', auditLogs.value);
    }
    // Actions
    function login(user) {
        currentUser.value = user;
        isAuthenticated.value = true;
        // Update lastLogin
        const idx = users.value.findIndex((u) => u.id === user.id);
        if (idx !== -1) {
            users.value[idx].lastLogin = new Date().toISOString().replace('T', ' ').slice(0, 16);
            StorageService.set('system_users', users.value);
        }
        StorageService.set('current_user', currentUser.value);
        StorageService.set('is_authenticated', true);
        recordAuditLog('系統登入', 'auth', `使用者「${user.name}」登入系統成功 (${user.roleName})。`, 'success');
    }
    function loginWithCredentials(email, password) {
        const cleanEmail = email.trim().toLowerCase();
        const matched = users.value.find((u) => u.email.toLowerCase() === cleanEmail);
        if (!matched) {
            return { success: false, message: '查無此電子郵件帳號，請確認輸入是否正確。' };
        }
        if (matched.status === 'inactive') {
            return { success: false, message: '該帳號已被系統管理員停用，無法登入。' };
        }
        if (password && matched.password && matched.password !== password) {
            return { success: false, message: '密碼不正確，請重新輸入。' };
        }
        login(matched);
        return { success: true, message: `歡迎回來，${matched.name}！`, user: matched };
    }
    function logout() {
        recordAuditLog('系統登出', 'auth', `使用者「${currentUser.value.name}」主動登出。`, 'warning');
        isAuthenticated.value = false;
        StorageService.set('is_authenticated', false);
    }
    function switchUser(user) {
        currentUser.value = user;
        StorageService.set('current_user', user);
        recordAuditLog('切換身分', 'auth', `身分快速切換至「${user.name}」(${user.roleName})。`, 'success');
    }
    function switchRole(role) {
        const matched = users.value.find((u) => u.role === role);
        if (matched) {
            switchUser(matched);
        }
    }
    // Permission Matrix Operations
    function toggleRolePermission(role, key) {
        const currentList = rolePermissions.value[role] || [];
        const exists = currentList.includes(key);
        if (exists) {
            rolePermissions.value[role] = currentList.filter((k) => k !== key);
        }
        else {
            rolePermissions.value[role] = [...currentList, key];
        }
        StorageService.set('role_permissions_matrix', rolePermissions.value);
        recordAuditLog('權限矩陣異動', 'permissions', `修改了角色【${role}】的權限「${key}」為：${!exists ? '開啟' : '關閉'}。`, 'warning');
    }
    function resetPermissionsToDefault() {
        rolePermissions.value = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
        StorageService.set('role_permissions_matrix', rolePermissions.value);
        recordAuditLog('重設權限矩陣', 'permissions', '已將所有角色的權限矩陣復原至系統出廠預設值。', 'warning');
    }
    // User Accounts CRUD
    function addUser(user) {
        const roleNames = {
            admin: '系統管理員',
            manager: '營運經理',
            employee: '現場員工',
            guest: '訪客審計',
        };
        const newUser = {
            id: `usr-${Date.now()}`,
            name: user.name,
            email: user.email,
            password: user.password || '123456',
            role: user.role,
            roleName: roleNames[user.role] || '使用者',
            department: user.department,
            avatar: user.avatar ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDOS_omgOzqObIL2YMC5ZVlxsuevTRI_ZUuOMJH0op7wlqS9g_dzF72SeX3rjhw2v_PrCy6ZPFOM6rfy5aqri8Uf9cqjTdDXZjnqp8JXH-y_llaolNjgGBlm-1eT4JULt7wQ4ofMO_L3-7cduHivskEaSNEdAGXH1haef803_syVgDoXn5ZlCHzdVEDTGwA0VuRc3loQ4jRCI1TSvUQ7xPGutW7vAf_NiW-UYu_ufgfh3fivP9cmA',
            phone: user.phone || '+886 900-000-000',
            status: 'active',
            createdAt: new Date().toISOString().slice(0, 10),
            lastLogin: '尚未登入',
        };
        users.value.push(newUser);
        StorageService.set('system_users', users.value);
        recordAuditLog('開立帳號', 'permissions', `新增使用者「${newUser.name}」(${newUser.email})，指派為 ${newUser.roleName}。`, 'success');
        return newUser;
    }
    function updateUser(id, updates) {
        const idx = users.value.findIndex((u) => u.id === id);
        if (idx !== -1) {
            users.value[idx] = { ...users.value[idx], ...updates };
            if (currentUser.value.id === id) {
                currentUser.value = { ...currentUser.value, ...updates };
                StorageService.set('current_user', currentUser.value);
            }
            StorageService.set('system_users', users.value);
            recordAuditLog('修改使用者', 'permissions', `更新了使用者「${users.value[idx].name}」的個人與權限資料。`, 'success');
        }
    }
    function toggleUserStatus(id) {
        const idx = users.value.findIndex((u) => u.id === id);
        if (idx !== -1) {
            const user = users.value[idx];
            const newStatus = user.status === 'inactive' ? 'active' : 'inactive';
            user.status = newStatus;
            StorageService.set('system_users', users.value);
            recordAuditLog('變更帳號狀態', 'permissions', `將使用者「${user.name}」狀態設定為：${newStatus === 'active' ? '啟用中' : '已停用'}。`, newStatus === 'active' ? 'success' : 'danger');
        }
    }
    function deleteUser(id) {
        const target = users.value.find((u) => u.id === id);
        if (!target)
            return;
        if (target.id === currentUser.value.id) {
            throw new Error('無法刪除當前登入的使用者帳號！');
        }
        users.value = users.value.filter((u) => u.id !== id);
        StorageService.set('system_users', users.value);
        recordAuditLog('刪除使用者', 'permissions', `刪除了使用者帳號「${target.name}」(${target.email})。`, 'danger');
    }
    function toggleClock() {
        isClockedIn.value = !isClockedIn.value;
        StorageService.set('is_clocked_in', isClockedIn.value);
    }
    function updateClockTime(timeStr) {
        clockTime.value = timeStr;
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
        toggleClock,
        updateClockTime,
    };
});
