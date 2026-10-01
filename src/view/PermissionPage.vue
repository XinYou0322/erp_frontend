<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
// Codex 修改：薪資確認沿用專案既有深色確認視窗。
import ConfirmCloseModal from "../component/子元件/ConfirmCloseModal.vue";
import { useAuthStore } from "../stores/auth.store";
import { useUIStore } from "../stores/ui.store";
import { UserProfile, UserRole, PermissionKey } from "../types";
// Codex 修改：共用十個角色的定義。
import { SYSTEM_ROLES } from "../data/roleData";
// Codex 修改：與員工帳號申請共用部門選項。
import { DEPARTMENTS, departmentOptions } from "../data/departmentData";
// Codex 修改：薪資輸入檢查及確認金額的共用格式。
import { validateSalary, formatSalary } from "../data/salarySafety";
import { PERMISSION_MODULES } from "../data/permissionData";
import { DEFAULT_AVATARS, normalizeAvatarUrl } from "../data/defaultAvatars";
import BaseCard from "../component/子元件/BaseCard.vue";
import BaseBadge from "../component/子元件/BaseBadge.vue";
import BaseModal from "../component/子元件/BaseModal.vue";
import BaseInput from "../component/子元件/BaseInput.vue";

const authStore = useAuthStore();
const uiStore = useUIStore();

// Tab state: 'matrix' | 'users' | 'approval' | 'audit-logs'
const activeTab = ref<"matrix" | "users" | "approval" | "audit-logs">("matrix");

// Role selector for matrix view
const selectedRoleForMatrix = ref<UserRole>("manager");
// Codex 修改：原有四個角色加上六個職務角色。
const availableRoles = SYSTEM_ROLES;

const currentRoleKey = computed(() => {
  return authStore.normalizedRole || authStore.currentUser?.role || "guest";
});

const canManageAllRoles = computed(() => {
  return authStore.isAdmin;
});

const canViewApprovalPage = computed(() => {
  return authStore.isAdmin;
});

const isPermissionMatrixEditable = computed(() => canManageAllRoles.value);

const visibleRolesForCurrentUser = computed(() => {
 if (canManageAllRoles.value) {
    return availableRoles;
  }
  return availableRoles.filter(
    (role) => role.key === currentRoleKey.value
  );
});

// Codex 修改：預設五張卡片，展開顯示全部；收合時同步選取可見角色。
const isRoleListExpanded = ref(false);
const displayedRoles = computed(() => isRoleListExpanded.value
  ? visibleRolesForCurrentUser.value : visibleRolesForCurrentUser.value.slice(0, 5));
const toggleRoleList = () => {
  isRoleListExpanded.value = !isRoleListExpanded.value;
  if (!displayedRoles.value.some((role) => role.key === selectedRoleForMatrix.value)) {
    selectedRoleForMatrix.value = displayedRoles.value[0]?.key || "guest";
  }
};

const visiblePermissionModules = computed(() => {
  const allowedSet = new Set(
    canManageAllRoles.value ? [] : authStore.userPermissions || [],
  );

  return PERMISSION_MODULES.map((module) => ({
    ...module,
    permissions: module.permissions.filter(
      (perm) => canManageAllRoles.value || allowedSet.has(perm.key),
    ),
  })).filter(
    (module) => canManageAllRoles.value || module.permissions.length > 0,
  );
});

watch(
  () => currentRoleKey.value,
  (role) => {
    if (
      !visibleRolesForCurrentUser.value.some(
        (r) => r.key === selectedRoleForMatrix.value,
      )
    ) {
      selectedRoleForMatrix.value = role;
    }
  },
  { immediate: true },
);

// Users filtering
const userSearchTerm = ref("");
const selectedDepartmentFilter = ref("全部");
const departments = [
  "全部",
  ...DEPARTMENTS,
];

// Codex 修改：部門選項包含既有資料，避免重新編輯時下拉選單空白。
const editableDepartments = computed(() => departmentOptions(authStore.users, userForm.value.department));

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const normalizeStatus = (status: string | undefined): string => {
  const value = String(status || "approved").toLowerCase();
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
  return "approved";
};

const filteredUsers = computed(() => {
  let list = [...authStore.users];
  if (selectedDepartmentFilter.value !== "全部") {
    list = list.filter((u) => u.department === selectedDepartmentFilter.value);
  }
  if (userSearchTerm.value) {
    const term = userSearchTerm.value.toLowerCase();
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.roleName.toLowerCase().includes(term) ||
        u.department.toLowerCase().includes(term) ||
        (u.reason || "").toLowerCase().includes(term),
    );
  }
  return list;
});

const approvalQueue = computed(() =>
  authStore.users.filter(
    (user: any) => normalizeStatus(user.status) === "pending",
  ),
);

const pendingApplications = computed(() => approvalQueue.value);

const getUserStatusMeta = (
  status: string | undefined,
): { label: string; variant: BadgeVariant } => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case "pending":
      return { label: "待審核", variant: "warning" };
    case "approved":
      return { label: "已核准", variant: "success" };
    case "rejected":
      return { label: "已駁回", variant: "danger" };
    case "inactive":
      return { label: "已停用", variant: "danger" };
    default:
      return { label: "啟用中", variant: "success" };
  }
};

const activeUsersCount = computed(() => {
  return authStore.users.filter((u: any) => u.status !== "inactive").length;
});

// Modals State
const isAddUserModalOpen = ref(false);
const isEditUserModalOpen = ref(false);
const isResetConfirmModalOpen = ref(false);

const userForm = ref<{
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  salary?: number | string;
  department: string;
  phone: string;
  avatar: string;
}>({
  name: "",
  email: "",
  password: "",
  role: "employee",
  salary: "",
  department: "門市收銀課",
  phone: "",
  avatar: "",
});

const defaultAvatars = DEFAULT_AVATARS;

// Codex 修改：薪資有變動時須再次輸入，並核對新舊金額後才送出。
const originalSalary = ref<number | null>(null);
const salaryConfirmation = ref("");
const salaryChanged = computed(() => authStore.isAdmin && userForm.value.salary !== ""
  && userForm.value.salary != null && Number(userForm.value.salary) !== originalSalary.value);
watch(() => userForm.value.salary, () => { salaryConfirmation.value = ""; });
// Codex 修改：等待自訂視窗的選擇，取消時保留編輯內容且不送出 API。
const isSalaryConfirmOpen = ref(false);
const salaryConfirmMessage = ref("");
let resolveSalaryConfirmation: ((confirmed: boolean) => void) | null = null;
const finishSalaryConfirmation = (confirmed: boolean) => {
  isSalaryConfirmOpen.value = false;
  resolveSalaryConfirmation?.(confirmed);
  resolveSalaryConfirmation = null;
};
onBeforeUnmount(() => finishSalaryConfirmation(false));
const confirmSalaryChange = async () => {
  if (resolveSalaryConfirmation) return false;
  if (!authStore.isAdmin) return true;
  const error = validateSalary(userForm.value.salary);
  if (error) { uiStore.showToast(error, "error"); return false; }
  if (!salaryChanged.value) return true;
  if (!salaryConfirmation.value || validateSalary(salaryConfirmation.value)
      || Number(salaryConfirmation.value) !== Number(userForm.value.salary)) {
    uiStore.showToast("請再次輸入相同薪資，確認沒有多打或少打數字。", "error");
    return false;
  }
  const next = Number(userForm.value.salary);
  const largeChange = originalSalary.value != null && originalSalary.value > 0
    && Math.abs(next - originalSalary.value) / originalSalary.value >= 0.3;
  const warning = next === 0 ? "\n注意：新薪資為 0 元。" : largeChange ? "\n注意：薪資變動達 30% 以上，請特別核對。" : "";
  salaryConfirmMessage.value = `請確認「${userForm.value.name}」的薪資：\n原薪資：${formatSalary(originalSalary.value)}\n新薪資：${formatSalary(next)}${warning}`;
  isSalaryConfirmOpen.value = true;
  return new Promise<boolean>((resolve) => { resolveSalaryConfirmation = resolve; });
};

const handleAvatarFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    uiStore.showToast("請選擇圖片檔案", "error");
    target.value = "";
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch(
      `${import.meta.env.VITE_AXIOS_HTTP_BASEURL || "http://localhost:8080"}/api/users/upload-avatar`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      },
    );

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(uploadData?.message || "圖片上傳失敗");
    }

    userForm.value.avatar = uploadData.avatarUrl;
    uiStore.showToast("大頭照已上傳並儲存成功", "success");
    target.value = "";
  } catch (error: any) {
    uiStore.showToast(error?.message || "圖片上傳失敗", "error");
    target.value = "";
  }
};

onMounted(() => {
  authStore.fetchUsersFromApi();
  authStore.fetchRolesFromApi();
});

const handleOpenAddUser = () => {
  // Codex 修改：每次開啟表單都重新核對薪資。
  originalSalary.value = null;
  salaryConfirmation.value = "";
  userForm.value = {
    name: "",
    email: "",
    password: "Test1234!",
    role: "employee",
    salary: "",
    department: "門市收銀課",
    phone: "+886 9",
    avatar: defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
  };
  isAddUserModalOpen.value = true;
};

const handleSaveNewUser = async () => {
  if (!userForm.value.name || !userForm.value.email) {
    uiStore.showToast("請完整填寫姓名與電子郵件", "error");
    return;
  }

  // 非最高權限防護驗證
  if (!authStore.isAdmin && userForm.value.salary) {
    uiStore.showToast("權限不足，僅系統最高權限管理者可填寫薪資！", "warning");
    return;
  }

  // 決定對應後端 roleId
  // Codex 修改：薪資驗證與人工確認通過後才新增。
  if (!(await confirmSalaryChange())) return;
  // Codex 修改：新增帳號可保存十個角色的等級。
  const targetRoleLevel = availableRoles.find((role) => role.key === userForm.value.role)?.level || 4;

  await authStore.createUserApi({
    name: userForm.value.name,
    email: userForm.value.email,
    password: userForm.value.password || "Test1234!",
    role: userForm.value.role,
    roleLevel: targetRoleLevel, // ✨ 欄位已更換為 roleLevel
    salary: authStore.isAdmin ? userForm.value.salary : null,
    department: userForm.value.department,
    phone: userForm.value.phone,
    avatar: userForm.value.avatar,
  });
  uiStore.showToast(`已成功開立新帳號「${userForm.value.name}」！`);
  isAddUserModalOpen.value = false;
};

const handleOpenEditUser = (user: any) => {
  // Codex 修改：保留原金額供薪資變動比對。
  originalSalary.value = user.salary == null ? null : Number(user.salary);
  salaryConfirmation.value = "";
  userForm.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    // Codex 修改：密碼只供重設，不讀回或顯示既有密碼。
    password: "",
    role: user.role,
    salary: authStore.isAdmin ? (user.salary ?? "") : "",
    department: user.department,
    phone: user.phone || "",
    avatar: user.avatar,
  };
  isEditUserModalOpen.value = true;
};

const handleSaveEditUser = async () => {
  if (!userForm.value.id) return;
  // Codex 修改：薪資驗證與人工確認通過後才修改。
  if (!(await confirmSalaryChange())) return;

  // Codex 修改：編輯帳號可保存十個角色的等級。
  const targetRoleLevel = availableRoles.find((role) => role.key === userForm.value.role)?.level || 4;

  // Codex 修改：失敗保留表單並提示，成功後才關閉視窗。
  try {
   await authStore.updateUserApi(userForm.value.id, {
    name: userForm.value.name,
    email: userForm.value.email,
    role: userForm.value.role,
    roleLevel: targetRoleLevel,
    password: userForm.value.password,
    ...(authStore.isAdmin ? { salary: userForm.value.salary } : {}),
    department: userForm.value.department,
    phone: userForm.value.phone,
    avatar: userForm.value.avatar,
  });
  uiStore.showToast(`已更新「${userForm.value.name}」使用者資料！`);
  isEditUserModalOpen.value = false;
  } catch (error: any) {
    uiStore.showToast(error?.response?.data?.message || error?.message || "儲存失敗，請稍後再試", "error");
  }
};

const handleApproveRequest = (user: any) => {
  if (!canViewApprovalPage.value) {
    uiStore.showToast("只有管理員可審核帳號申請。", "warning");
    return;
  }
  authStore.updateUserStatus(user.id, "approved");
  uiStore.showToast(`已核准申請：${user.name}`);
};

const handleRejectRequest = (user: any) => {
  if (!canViewApprovalPage.value) {
    uiStore.showToast("只有管理員可審核帳號申請。", "warning");
    return;
  }
  authStore.updateUserStatus(user.id, "rejected");
  uiStore.showToast(`已駁回申請：${user.name}`, "warning");
};

const handleToggleStatus = async (user: any) => {
  if (user.id === authStore.currentUser?.id) {
    uiStore.showToast("無法停用當前正在登入操作的使用者！", "error");
    return;
  }
  await authStore.toggleUserStatusApi(user.id, user.status);
  uiStore.showToast(
    `已變更 ${user.name} 狀態為 ${user.status === "active" ? "已停用" : "啟用中"}`,
  );
};

const handleDeleteUser = async (user: any) => {
  try {
    await authStore.deleteUserApi(user.id);
    uiStore.showToast(`已成功刪除使用者「${user.name}」`, "warning");
  } catch (err: any) {
    uiStore.showToast(err.message || "刪除失敗", "error");
  }
};

const handleImpersonate = (user: UserProfile) => {
  authStore.switchUser(user);
  uiStore.showToast(`已切換當前操作身分為：${user.name} (${user.roleName})`);
};

// Check if a permission is enabled for a given role
const isPermissionActive = (role: UserRole, key: PermissionKey) => {
  if (role === "admin") return true;
  const list = authStore.rolePermissions[role] || [];
  return list.includes(key);
};

const handleTogglePermission = (role: UserRole, key: PermissionKey) => {
  if (!isPermissionMatrixEditable.value) {
    uiStore.showToast(
      "目前權限為唯讀模式，非最高權限不可更動任何權限設定。",
      "warning",
    );
    return;
  }

  if (role === "admin") {
    uiStore.showToast("系統管理員擁有完整根層權限，不可單獨取消！", "warning");
    return;
  }

  authStore.toggleRolePermission(role, key);
  uiStore.showToast(`已更新【${role}】之權限設定！`);
};

const handleResetDefaultPermissions = () => {
  if (!canManageAllRoles.value) {
    uiStore.showToast("只有最高權限角色可重設全系統預設權限。", "warning");
    isResetConfirmModalOpen.value = false;
    return;
  }

  authStore.resetPermissionsToDefault();
  uiStore.showToast("已將全系統所有角色之權限矩陣復原至出廠預設值！");
  isResetConfirmModalOpen.value = false;
};
</script>

<template>
  <div class="supplier-page space-y-6">
    <!-- Header Title & Action Bar -->
     <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2
          class="text-2xl font-bold text-white tracking-tight flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-emerald-400"
            >admin_panel_settings</span
          >
          使用者帳號與角色權限管理 (RBAC)
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          配置各角色操作許可矩陣、維護企業內部帳號與檢視安全審計軌跡日誌。
        </p>
      </div>

      <div class="flex items-center gap-2.5 self-start sm:self-auto">
        <button
          @click="isResetConfirmModalOpen = true"
          class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span class="material-symbols-outlined text-[16px] text-amber-400"
            >restart_alt</span
          >
          <span>重設權限預設值</span>
        </button>

        <button
          @click="handleOpenAddUser"
          class="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95"
        >
          <span class="material-symbols-outlined text-[18px]">person_add</span>
          <span>開立新帳號</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-800 pb-3">
      <button
        @click="activeTab = 'matrix'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        :class="
          activeTab === 'matrix'
            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
        "
      >
        <span class="material-symbols-outlined text-[18px]">grid_view</span>
        <span>角色權限矩陣配置 (Role-Permission Matrix)</span>
      </button>

      <button
        v-if="canManageAllRoles"
        @click="activeTab = 'users'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        :class="
          activeTab === 'users'
            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
        "
      >
        <span class="material-symbols-outlined text-[18px]"
          >manage_accounts</span
        >
        <span>使用者帳號維護清單 ({{ authStore.users.length }})</span>
      </button>
      <button
        @click="activeTab = 'audit-logs'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        :class="
          activeTab === 'audit-logs'
            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
        "
      >
        <span class="material-symbols-outlined text-[18px]">receipt_long</span>
        <span>安全與操作審計軌跡 (Audit Trail)</span>
      </button>
    </div>

    <!-- TAB 1: Role-Permission Matrix View -->
    <div v-if="activeTab === 'matrix'" class="space-y-6">
      <!-- Role Switcher Cards -->
      <div id="rbac-role-cards" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <div
          v-for="role in displayedRoles"
          :key="role.key"
          @click="selectedRoleForMatrix = role.key"
          class="p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2"
          :class="
            selectedRoleForMatrix === role.key
              ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
              : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
          "
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span
                class="material-symbols-outlined text-[20px]"
                :class="
                  selectedRoleForMatrix === role.key
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                "
              >
                {{ role.icon }}
              </span>
              <span class="font-bold text-xs text-white">{{ role.name }}</span>
            </div>
            <BaseBadge :variant="role.badge" size="sm">
              {{
                role.key === "admin"
                  ? "全開 (ROOT)"
                  : `${(authStore.rolePermissions[role.key] || []).length} 項`
              }}
            </BaseBadge>
          </div>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            {{ role.desc }}
          </p>
        </div>
      </div>

      <!-- Codex 修改：超過五個角色才顯示展開／收合按鈕。 -->
      <div v-if="visibleRolesForCurrentUser.length > 5" class="flex justify-center">
        <button type="button" @click="toggleRoleList"
          :aria-expanded="isRoleListExpanded" aria-controls="rbac-role-cards"
          class="flex items-center gap-2 px-5 py-2 rounded-xl border border-slate-700 bg-slate-900 text-emerald-400 hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors">
          <span class="material-symbols-outlined" aria-hidden="true">{{ isRoleListExpanded ? 'expand_less' : 'expand_more' }}</span>
          {{ isRoleListExpanded ? '收合角色' : `展開其餘 ${visibleRolesForCurrentUser.length - 5} 個角色` }}
        </button>
      </div>

      <!-- Permission Matrix Table Card -->
      <BaseCard>
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3 w-full">
            <div class="flex items-center gap-2">
              <span
                class="material-symbols-outlined text-emerald-400 text-[20px]"
                >tune</span
              >
              <span class="font-bold text-sm text-white">
                【{{
                  availableRoles.find((r) => r.key === selectedRoleForMatrix)
                    ?.name
                }}】權限細項配置表
              </span>
            </div>
            <div class="text-xs text-slate-400 flex items-center gap-2">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :class="
                  isPermissionMatrixEditable
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-500'
                "
              ></span>
              <span>
                {{
                  isPermissionMatrixEditable
                    ? "即時同步儲存至本機快取"
                    : "唯讀模式：非最高權限不可更動權限"
                }}
              </span>
            </div>
          </div>
        </template>

        <div class="space-y-6 text-xs">
          <div
            v-if="!canManageAllRoles"
            class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-300"
          >
            目前僅顯示您「{{
              availableRoles.find((role) => role.key === currentRoleKey)
                ?.name || "目前角色"
            }}」可使用的權限，其他角色設定已隱藏。
          </div>

          <div
            v-for="module in visiblePermissionModules"
            :key="module.id"
            class="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3"
          >
            <!-- Module Title & Icon -->
            <div
              class="flex items-center justify-between border-b border-slate-800/80 pb-2.5"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400"
                >
                  <span class="material-symbols-outlined text-[18px]">{{
                    module.icon
                  }}</span>
                </div>
                <div>
                  <span class="font-bold text-white text-sm block">{{
                    module.name
                  }}</span>
                  <span class="text-[11px] text-slate-400">{{
                    module.description
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Permission Items Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div
                v-for="perm in module.permissions"
                :key="perm.key"
                @click="handleTogglePermission(selectedRoleForMatrix, perm.key)"
                class="p-3 rounded-xl border transition-all flex items-start justify-between gap-3 group"
                :class="
                  isPermissionMatrixEditable
                    ? 'cursor-pointer ' +
                      (isPermissionActive(selectedRoleForMatrix, perm.key)
                        ? 'bg-slate-900/90 border-emerald-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800/70 text-slate-400 hover:border-slate-700')
                    : 'cursor-not-allowed bg-slate-950/60 border-slate-800/70 text-slate-400'
                "
              >
                <div class="space-y-0.5 min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-bold text-xs block transition-colors"
                      :class="
                        isPermissionActive(selectedRoleForMatrix, perm.key)
                          ? 'text-emerald-400'
                          : 'text-slate-300 group-hover:text-white'
                      "
                    >
                      {{ perm.label }}
                    </span>
                    <span class="text-[10px] font-data-mono text-slate-500">
                      {{ perm.key }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 leading-snug">
                    {{ perm.description }}
                  </p>
                </div>

                <!-- Toggle Switch Checkbox Icon -->
                <div class="shrink-0 mt-0.5">
                  <span
                    class="material-symbols-outlined text-[22px] transition-transform group-hover:scale-110"
                    :class="
                      isPermissionActive(selectedRoleForMatrix, perm.key)
                        ? 'text-emerald-400'
                        : 'text-slate-600 group-hover:text-slate-400'
                    "
                  >
                    {{
                      isPermissionActive(selectedRoleForMatrix, perm.key)
                        ? "check_box"
                        : "check_box_outline_blank"
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- TAB 2: Account Approval Queue -->
    <div
      v-else-if="activeTab === 'approval' && canViewApprovalPage"
      class="space-y-4"
    >
      <BaseCard>
        <template #header>
          <div class="flex items-center justify-between gap-3 w-full">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-400 text-[20px]"
                >fact_check</span
              >
              <span class="font-bold text-sm text-white">企業帳號申請審核</span>
            </div>
            <BaseBadge variant="warning" size="sm"
              >{{ pendingApplications.length }} 件待審核</BaseBadge
            >
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr
                class="border-b border-slate-800 text-slate-400 font-semibold"
              >
                <th class="pb-3 px-3">申請人</th>
                <th class="pb-3 px-3">部門</th>
                <th class="pb-3 px-3">欲申請角色</th>
                <th class="pb-3 px-3">申請理由</th>
                <th class="pb-3 px-3">狀態</th>
                <th class="pb-3 px-3 text-right">審核操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              <tr
                v-for="user in approvalQueue"
                :key="user.id"
                class="hover:bg-slate-900/60 transition-colors"
              >
                <td class="py-3 px-3">
                  <div class="flex items-center gap-2.5">
                    <img
                      :src="
                        normalizeAvatarUrl(user.avatar || defaultAvatars[0])
                      "
                      :alt="user.name"
                      class="w-9 h-9 rounded-xl object-cover border border-slate-700"
                      @error="
                        ($event.target as HTMLImageElement).src =
                          defaultAvatars[0]
                      "
                    />
                    <div>
                      <div class="font-bold text-white">{{ user.name }}</div>
                      <div class="text-[10px] text-slate-400 font-data-mono">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-3 text-slate-300">
                  {{ user.department || "未填寫" }}
                </td>
                <td class="py-3 px-3">
                  <BaseBadge
                    :variant="
                      user.role === 'manager'
                        ? 'info'
                        : user.role === 'employee'
                          ? 'warning'
                          : 'neutral'
                    "
                    size="sm"
                  >
                    {{ user.roleName || user.role }}
                  </BaseBadge>
                </td>
                <td class="py-3 px-3 text-slate-300 max-w-md">
                  <div class="line-clamp-3">
                    {{ user.reason || "未提供申請理由" }}
                  </div>
                </td>
                <td class="py-3 px-3">
                  <BaseBadge
                    :variant="getUserStatusMeta(user.status).variant"
                    size="sm"
                    dot
                  >
                    {{ getUserStatusMeta(user.status).label }}
                  </BaseBadge>
                </td>
                <td class="py-3 px-3 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <button
                      @click="handleApproveRequest(user)"
                      class="px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold transition-colors cursor-pointer"
                    >
                      核准
                    </button>
                    <button
                      @click="handleRejectRequest(user)"
                      class="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold transition-colors cursor-pointer"
                    >
                      駁回
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>

    <!-- TAB 2: User Accounts Maintenance View -->
    <div
      v-else-if="canManageAllRoles && activeTab === 'users'"
      class="space-y-4"
    >
      <BaseCard>
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3 w-full">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-cyan-400 text-[20px]"
                >people</span
              >
              <span class="font-bold text-sm text-white"
                >企業內部使用者名冊</span
              >
              <BaseBadge variant="neutral" size="sm"
                >{{ filteredUsers.length }} 位使用者</BaseBadge
              >
            </div>

            <!-- Department Filter & Search -->
            <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div
                class="flex items-center gap-1 overflow-x-auto pb-1 max-w-full"
              >
                <button
                  v-for="dept in departments"
                  :key="dept"
                  @click="selectedDepartmentFilter = dept"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
                  :class="
                    selectedDepartmentFilter === dept
                      ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  "
                >
                  {{ dept }}
                </button>
              </div>

              <div class="w-full sm:w-56">
                <input
                  v-model="userSearchTerm"
                  type="text"
                  placeholder="搜尋姓名、Email、部門..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr
                class="border-b border-slate-800 text-slate-400 font-semibold"
              >
                <th class="pb-3 px-3">使用者姓名與頭像</th>
                <th class="pb-3 px-3">電子郵件 (登入帳號)</th>
                <th class="pb-3 px-3">所屬部門</th>
                <th class="pb-3 px-3">申請理由</th>
                <th class="pb-3 px-3">系統指派角色</th>
                <th class="pb-3 px-3">帳號狀態</th>
                <th class="pb-3 px-3">最後登入時間</th>
                <th class="pb-3 px-3 text-right">操作管理</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                class="hover:bg-slate-900/60 transition-colors"
                :class="
                  authStore.currentUser.id === user.id ? 'bg-slate-900/30' : ''
                "
              >
                <!-- Avatar & Name -->
                <td class="py-3 px-3">
                  <div class="flex items-center gap-2.5">
                    <img
                      :src="
                        normalizeAvatarUrl(user.avatar || defaultAvatars[0])
                      "
                      :alt="user.name"
                      class="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0"
                      @error="
                        ($event.target as HTMLImageElement).src =
                          defaultAvatars[0]
                      "
                    />
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-white block">{{
                          user.name
                        }}</span>
                        <span
                          v-if="authStore.currentUser.id === user.id"
                          class="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold"
                        >
                          您自己
                        </span>
                      </div>
                      <span class="text-[10px] text-slate-500 font-data-mono">{{
                        user.phone || "無電話"
                      }}</span>
                    </div>
                  </div>
                </td>

                <!-- Email -->
                <td class="py-3 px-3 font-data-mono text-slate-300">
                  {{ user.email }}
                </td>

                <!-- Department -->
                <td class="py-3 px-3 text-slate-300">
                  {{ user.department }}
                </td>

                <!-- Request Reason -->
                <td class="py-3 px-3 text-slate-300 max-w-[180px]">
                  <div class="line-clamp-2">{{ user.reason || "—" }}</div>
                </td>

                <!-- Role Badge -->
                <td class="py-3 px-3">
                  <BaseBadge
                    :variant="
                      user.role === 'admin'
                        ? 'success'
                        : user.role === 'manager'
                          ? 'info'
                          : user.role === 'employee'
                            ? 'warning'
                            : 'neutral'
                    "
                    size="sm"
                  >
                    {{ user.roleName }}
                  </BaseBadge>
                </td>

                <!-- Status Badge -->
                <td class="py-3 px-3">
                  <BaseBadge
                    :variant="getUserStatusMeta(user.status).variant"
                    dot
                    size="sm"
                  >
                    {{ getUserStatusMeta(user.status).label }}
                  </BaseBadge>
                </td>

                <!-- Last Login -->
                <td class="py-3 px-3 font-data-mono text-slate-400 text-[11px]">
                  {{ user.lastLogin || "尚未登入" }}
                </td>

                <!-- Actions -->
                <td class="py-3 px-3 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <!-- Quick Impersonate -->
                    <button
                      v-if="authStore.currentUser.id !== user.id"
                      @click="handleImpersonate(user)"
                      class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      title="模擬切換登入此身分"
                    >
                      <span class="material-symbols-outlined text-[14px]"
                        >swap_horiz</span
                      >
                      <span>切換</span>
                    </button>

                    <!-- Edit -->
                    <button
                      @click="handleOpenEditUser(user)"
                      class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="編輯使用者資料"
                    >
                      <span class="material-symbols-outlined text-[16px]"
                        >edit</span
                      >
                    </button>

                    <!-- Toggle Status -->
                    <button
                      v-if="authStore.currentUser.id !== user.id"
                      @click="handleToggleStatus(user)"
                      class="p-1.5 rounded-lg transition-colors cursor-pointer"
                      :class="
                        user.status === 'inactive'
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                      "
                      :title="
                        user.status === 'inactive' ? '啟用帳號' : '停用帳號'
                      "
                    >
                      <span class="material-symbols-outlined text-[16px]">
                        {{ user.status === "inactive" ? "lock_open" : "lock" }}
                      </span>
                    </button>

                    <!-- Delete -->
                    <button
                      v-if="authStore.currentUser.id !== user.id"
                      @click="handleDeleteUser(user)"
                      class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                      title="刪除帳號"
                    >
                      <span class="material-symbols-outlined text-[16px]"
                        >delete</span
                      >
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>

    <!-- TAB 3: Audit Trail Logs View -->
    <div v-else-if="activeTab === 'audit-logs'" class="space-y-4">
      <BaseCard>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-400 text-[20px]"
              >history_edu</span
            >
            <span class="font-bold text-sm text-white"
              >安全性與權限異動審計日誌 (Security Audit Trail)</span
            >
          </div>
          <BaseBadge variant="neutral" size="sm"
            >{{ authStore.auditLogs.length }} 筆事件</BaseBadge
          >
        </template>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr
                class="border-b border-slate-800 text-slate-400 font-semibold"
              >
                <th class="pb-3 px-3">事件時間戳記</th>
                <th class="pb-3 px-3">操作者</th>
                <th class="pb-3 px-3">事件動作</th>
                <th class="pb-3 px-3">影響模組</th>
                <th class="pb-3 px-3">日誌內容與詳細參數</th>
                <th class="pb-3 px-3">來源 IP</th>
                <th class="pb-3 px-3 text-right">狀態結果</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              <tr
                v-for="log in authStore.auditLogs"
                :key="log.id"
                class="hover:bg-slate-900/50 transition-colors"
              >
                <td
                  class="py-3 px-3 font-data-mono text-slate-400 whitespace-nowrap"
                >
                  {{ log.timestamp }}
                </td>
                <td class="py-3 px-3 font-bold text-white">
                  {{ log.userName }}
                </td>
                <td class="py-3 px-3 font-semibold text-emerald-400">
                  {{ log.action }}
                </td>
                <td class="py-3 px-3 font-data-mono text-slate-300">
                  {{ log.module }}
                </td>
                <td class="py-3 px-3 text-slate-300 max-w-md truncate">
                  {{ log.details }}
                </td>
                <td class="py-3 px-3 font-data-mono text-slate-400">
                  {{ log.ipAddress }}
                </td>
                <td class="py-3 px-3 text-right">
                  <BaseBadge
                    :variant="
                      log.status === 'success'
                        ? 'success'
                        : log.status === 'warning'
                          ? 'warning'
                          : 'danger'
                    "
                    size="sm"
                    dot
                  >
                    {{
                      log.status === "success"
                        ? "成功"
                        : log.status === "warning"
                          ? "異動"
                          : "阻擋"
                    }}
                  </BaseBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>

    <!-- Modal 1: Add User Modal -->
    <BaseModal
      :isOpen="isAddUserModalOpen"
      title="開立全新使用者帳號"
      subtitle="設定員工基本資料、指派所屬角色與部門。"
      icon="person_add"
      maxWidth="lg"
      @close="isAddUserModalOpen = false"
    >
      <form @submit.prevent="handleSaveNewUser" class="space-y-3.5 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >使用者姓名</label
            >
            <input
              v-model="userForm.name"
              type="text"
              placeholder="例如：王小明 (門市店長)"
              required
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >登入電子郵件 (Email)</label
            >
            <input
              v-model="userForm.email"
              type="email"
              placeholder="user@humanisterp.com"
              required
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >初始登入密碼</label
            >
            <input
              v-model="userForm.password"
              type="text"
              placeholder="預設密碼 123456"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >聯絡電話</label
            >
            <input
              v-model="userForm.phone"
              type="text"
              placeholder="+886 912-345-678"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >指派系統角色</label
            >
            <select
              v-model="userForm.role"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <!-- Codex 修改：角色選單與角色卡片保持一致。 -->
              <option v-for="role in availableRoles" :key="role.key" :value="role.key">{{ role.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >歸屬部門</label
            >
            <select
              v-model="userForm.department"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <!-- Codex 修改：顯示所有可選部門及已保存的部門。 -->
              <option v-for="department in editableDepartments" :key="department" :value="department">{{ department }}</option>
            </select>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-slate-400 font-semibold"
                >薪資 (NTD)</label
              >
              <span
                v-if="!authStore.isAdmin"
                class="text-[10px] text-rose-400 font-medium"
              >
                最高權限限制
              </span>
            </div>
            <input
              v-model.number="userForm.salary"
              type="number"
              min="0"
              max="99999999.99"
              step="0.01"
              @wheel="($event.target as HTMLInputElement).blur()"
              :placeholder="authStore.isAdmin ? '例如：36000' : '無填寫權限'"
              :disabled="!authStore.isAdmin"
              class="w-full bg-slate-950 border rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden"
              :class="
                authStore.isAdmin
                  ? 'border-slate-800 focus:border-emerald-500'
                  : 'border-slate-800/50 bg-slate-900/50 text-slate-500 cursor-not-allowed'
              "
            />
            <!-- Codex 修改：移除金額預覽與說明，僅在驗證或再次確認時顯示內容。 -->
            <div v-if="authStore.isAdmin && (salaryChanged || validateSalary(userForm.salary))" class="mt-2 space-y-2">
              <p v-if="validateSalary(userForm.salary)" class="text-rose-400" role="alert">{{ validateSalary(userForm.salary) }}</p>
              <label v-if="salaryChanged" class="block text-amber-300">
                再次輸入薪資以確認
                <input v-model="salaryConfirmation" type="text" inputmode="decimal" autocomplete="off"
                  required placeholder="請再次輸入相同金額"
                  class="mt-1 w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white" />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-slate-400 mb-1.5 font-semibold"
            >大頭照設定</label
          >
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <img
                :src="userForm.avatar || defaultAvatars[0]"
                class="w-14 h-14 rounded-xl object-cover border-2 border-slate-800"
              />
              <label
                class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 font-semibold cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleAvatarFileChange"
                />
                <span class="material-symbols-outlined text-[18px]"
                  >upload_file</span
                >
                <span>從電腦選擇</span>
              </label>
            </div>

            <div class="flex items-center gap-3">
              <img
                v-for="(av, idx) in defaultAvatars"
                :key="idx"
                :src="av"
                @click="userForm.avatar = av"
                class="w-11 h-11 rounded-xl object-cover border-2 transition-all cursor-pointer"
                :class="
                  userForm.avatar === av
                    ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-950/40'
                    : 'border-slate-800 hover:border-slate-600'
                "
              />
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-3">
          <button
            type="button"
            @click="isAddUserModalOpen = false"
            class="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="submit"
            class="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            確認開立帳號
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Modal 2: Edit User Modal -->
    <BaseModal
      :isOpen="isEditUserModalOpen"
      title="編輯使用者資料"
      subtitle="修改帳號設定、更改權限角色或重設登入密碼。"
      icon="edit"
      maxWidth="lg"
      @close="isEditUserModalOpen = false"
    >
      <form @submit.prevent="handleSaveEditUser" class="space-y-3.5 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >使用者姓名</label
            >
            <input
              v-model="userForm.name"
              type="text"
              required
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >登入電子郵件</label
            >
            <input
              v-model="userForm.email"
              type="email"
              required
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >重設登入密碼</label
            >
            <input
              v-model="userForm.password"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >聯絡電話</label
            >
            <input
              v-model="userForm.phone"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >指派系統角色</label
            >
            <select
              v-model="userForm.role"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <!-- Codex 修改：角色選單與角色卡片保持一致。 -->
              <option v-for="role in availableRoles" :key="role.key" :value="role.key">{{ role.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >歸屬部門</label
            >
            <select
              v-model="userForm.department"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <!-- Codex 修改：顯示所有可選部門及已保存的部門。 -->
              <option v-for="department in editableDepartments" :key="department" :value="department">{{ department }}</option>
            </select>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-slate-400 font-semibold"
                >薪資 (NTD)</label
              >
              <span
                v-if="!authStore.isAdmin"
                class="text-[10px] text-rose-400 font-medium"
              >
                最高權限限制
              </span>
            </div>
            <input
              v-model.number="userForm.salary"
              type="number"
              min="0"
              max="99999999.99"
              step="0.01"
              @wheel="($event.target as HTMLInputElement).blur()"
              :placeholder="authStore.isAdmin ? '例如：36000' : '無填寫權限'"
              :disabled="!authStore.isAdmin"
              class="w-full bg-slate-950 border rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden"
              :class="
                authStore.isAdmin
                  ? 'border-slate-800 focus:border-emerald-500'
                  : 'border-slate-800/50 bg-slate-900/50 text-slate-500 cursor-not-allowed'
              "
            />
            <!-- Codex 修改：移除金額預覽與說明，僅在驗證或再次確認時顯示內容。 -->
            <div v-if="authStore.isAdmin && (salaryChanged || validateSalary(userForm.salary))" class="mt-2 space-y-2">
              <p v-if="validateSalary(userForm.salary)" class="text-rose-400" role="alert">{{ validateSalary(userForm.salary) }}</p>
              <label v-if="salaryChanged" class="block text-amber-300">
                再次輸入薪資以確認
                <input v-model="salaryConfirmation" type="text" inputmode="decimal" autocomplete="off"
                  required placeholder="請再次輸入相同金額"
                  class="mt-1 w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white" />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-slate-400 mb-1.5 font-semibold"
            >大頭照設定</label
          >
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <img
                :src="userForm.avatar || defaultAvatars[0]"
                class="w-14 h-14 rounded-xl object-cover border-2 border-slate-800"
              />
              <label
                class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 font-semibold cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleAvatarFileChange"
                />
                <span class="material-symbols-outlined text-[18px]"
                  >upload_file</span
                >
                <span>從電腦選擇</span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-3">
          <button
            type="button"
            @click="isEditUserModalOpen = false"
            class="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="submit"
            class="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            儲存變更
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Codex 修改：取代瀏覽器原生薪資確認，套用既有深色視窗與藍色按鈕。 -->
    <ConfirmCloseModal
      :isOpen="isSalaryConfirmOpen"
      title="確定要儲存薪資嗎？"
      :message="salaryConfirmMessage"
      confirmLabel="確定儲存"
      @cancel="finishSalaryConfirmation(false)"
      @confirm="finishSalaryConfirmation(true)"
    />

    <!-- Modal 3: Confirm Reset Matrix Permissions -->
    <BaseModal
      :isOpen="isResetConfirmModalOpen"
      title="確認重設全系統權限矩陣？"
      subtitle="此操作將會把所有角色的存取設定復原為出廠標準配置。"
      icon="warning"
      maxWidth="md"
      @close="isResetConfirmModalOpen = false"
    >
      <div class="space-y-4 text-xs">
        <p class="text-slate-300 leading-relaxed">
          您確定要將「系統管理員」、「營運經理」、「現場員工」及「訪客審計」的角色權限矩陣還原為系統初始預設值嗎？
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            @click="isResetConfirmModalOpen = false"
            class="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleResetDefaultPermissions"
            class="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-all shadow-lg shadow-amber-950/40 cursor-pointer"
          >
            確認還原預設
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
