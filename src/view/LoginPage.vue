<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import { useUIStore } from "../stores/ui.store";
import { UserProfile, UserRole } from "../types";
import BaseBadge from "../component/子元件/BaseBadge.vue";
import BaseModal from "../component/子元件/BaseModal.vue";
import { useNotificationStore } from "../stores/notification.store";
import { getDefaultAvatar } from "../data/defaultAvatars";

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();

// 統一具備強型別之展示用使用者清單，防止 TS 推論為 never[]
const displayUsers = computed<UserProfile[]>(() => (authStore.users || []) as UserProfile[]);

// Login Modes: 'credentials' | 'quick-select'
const activeLoginMode = ref<"credentials" | "quick-select">("credentials");

// Form state
// 後端 data.sql 內的預設測試帳號密碼皆為 "password"
const email = ref("store.manager01@example.com");
const password = ref("Test1234!");
const rememberMe = ref(true);
const isPasswordVisible = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");

// Modals
const isForgotPasswordModalOpen = ref(false);
const isRegisterModalOpen = ref(false);

const forgotEmail = ref("");
const forgotStep = ref<"input" | "sent">("input");
const defaultAvatar = getDefaultAvatar(); 

const registerForm = ref({
  name: "",
  email: "",
  password: "",
  department: "營運與行銷部",
  requestedRole: "manager" as UserRole,
  reason: "",
  avatar: "",
});

// Quick Credentials Auto Fill
const handleQuickFill = (targetEmail: string, targetPass: string) => {
  email.value = targetEmail;
  password.value = targetPass;
  errorMessage.value = "";
};

const resolveBackendRoleLevel = (selectedRole: UserRole): number => {
  const normalized = String(selectedRole || "").trim().toLowerCase();
  const fallbackMap: Record<string, number> = {
    admin: 1,     // 店長為 1
    manager: 2,   // 經理為 2
    employee: 3,  // 正職為 3
    guest: 4,     // 訪客為 4
  };
  return fallbackMap[normalized] || 4;
};

onMounted(async () => {
  
  await authStore.fetchPublicUsersForLogin();
});

// Handle Form Submit
const notifStore = useNotificationStore();
const handleFormLogin = async () => {
  errorMessage.value = "";
  if (!email.value) {
    errorMessage.value = "請輸入登入帳號或 Email。";
    return;
  }
  isLoading.value = true;
  try {
    const res = await authStore.loginWithCredentials(
      email.value,
      password.value,
    );
    isLoading.value = false;
    if (res.success) {
      uiStore.showToast(res.message);
      // 啟動 WebSocket 即時通知監聽
      if (res.user?.id) {
        notifStore.connectWebSocket(res.user.id);
      }
      // 跳轉至主功能頁（原物料管理）
      router.push("/material");
    } else {
      errorMessage.value = res.message;
    }
  } catch (err: any) {
    isLoading.value = false;
    errorMessage.value = "系統連線異常，請確認後端服務是否已啟動。";
  }
};

// Handle Quick Role Select
const handleSelectUser =  async(user: UserProfile) => {
   isLoading.value = true;
  
  // 💡 改呼叫 loginQuickly，確保前後端 Session 同步建立
  const res = await authStore.loginQuickly(user); 
  
  isLoading.value = false;
  uiStore.showToast(`已快速登入為：${user.name} (${user.roleName})`);
  
  // 登入成功後啟動 WebSocket 監聽
  if (user.id) {
    notifStore.connectWebSocket(user.id);
  }
  
  router.push("/overview");
};

// Forgot Password
const handleSendResetLink = () => {
  if (!forgotEmail.value) {
    uiStore.showToast("請輸入註冊時的電子郵件", "warning");
    return;
  }
  forgotStep.value = "sent";
};

// Register Request
const handleAvatarPreview = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = () => {
    registerForm.value.avatar = String(reader.result || "");
  };
  reader.readAsDataURL(file);
};

const handleRegisterSubmit = async () => {
  const {
    name,
    email: applicantEmail,
    password: applicantPassword,
    department,
    requestedRole,
    reason,
    avatar,
  } = registerForm.value;

  if (!name || !applicantEmail || !applicantPassword || !reason.trim()) {
    uiStore.showToast("請填寫姓名、公司電子郵件、密碼與申請理由", "warning");
    return;
  }

  const normalizedReason = reason.trim();
  const username = (applicantEmail.split("@")[0] || "user").trim();

  try {
    const result = await authStore.createUserApi({
      username,
      password: applicantPassword,
      name,
      email: applicantEmail,
      roleId: resolveBackendRoleLevel(requestedRole),
      avatar: avatar || "",
      department,
      reason: normalizedReason,
      status: "pending",
    });

    notifStore.addNotification(
      {
        title: "新帳號申請已送出",
        message: `${name} 已成功建立帳號，等待後台審核。`,
        type: "info",
        category: "security",
        actionLabel: "前往登入",
        actionRoute: "/login",
      },
      true,
    );

    uiStore.showToast("帳號已送出，請使用後端帳號登入。", "success");
    isRegisterModalOpen.value = false;
    email.value = applicantEmail;
    password.value = applicantPassword;
    registerForm.value = {
      name: "",
      email: "",
      password: "",
      department: "營運與行銷部",
      requestedRole: "manager" as UserRole,
      reason: "",
      avatar: "",
    };

    await authStore.fetchPublicUsersForLogin();
    return result;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "註冊失敗，請確認資料是否重複或後端服務是否正常。";
    uiStore.showToast(message, "warning");
    return null;
  }
};
</script>

<template>
  <div
    class="w-full max-w-4xl mx-auto flex flex-col md:flex-row bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
  >
    <!-- Left Hero & Branding Column -->
    <div
      class="md:w-5/12 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 relative overflow-hidden"
    >
      <!-- Ambient Glow decoration -->
      <div
        class="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
      ></div>
      <div
        class="absolute -bottom-20 -right-20 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"
      ></div>

      <div>
        <div class="flex items-center gap-3 mb-6">
          <div
            class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center p-2 border border-emerald-500/30 shadow-lg shadow-emerald-950/40"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPSzRjOVgMOfqYtdalxwMql8EMJ5XUl4edCD4WRoM0JOH6kNYGykoTj68TsWZ7S0coZa5mqtzzAvk-7KVvWxKipQaIrVt8DIHhs-ovm13kLY-T31xn95nORxIK-gfKUnb5XCGJTqc8REKUyctrzoJAn44wI9rxRT9WDSbRg65dRCBa20ep0CMwI7nFESqsh-lH0fWBuxag5aWaj2ihOCAjCsGHmFF4ED8H-2aOubZVrC-mIkdWPA"
              alt="Logo"
              class="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 class="text-lg font-bold text-white tracking-tight">
              Humanist ERP
            </h1>
            <p
              class="text-[11px] text-emerald-400 font-semibold tracking-wider"
            >
              企業智慧營運與 POS 系統
            </p>
          </div>
        </div>

        <div class="space-y-4 my-6 text-xs text-slate-300">
          <div class="flex items-start gap-2.5">
            <span
              class="material-symbols-outlined text-emerald-400 text-[18px] shrink-0"
              >inventory_2</span
            >
            <div>
              <p class="font-bold text-white">多階 BOM 與配方組裝</p>
              <p class="text-slate-400 text-[11px]">
                即時成本滾算 (Cost Roll-up) 與拖曳排程
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2.5">
            <span
              class="material-symbols-outlined text-teal-400 text-[18px] shrink-0"
              >point_of_sale</span
            >
            <div>
              <p class="font-bold text-white">POS 現場收銀與庫存扣抵</p>
              <p class="text-slate-400 text-[11px]">
                雙向自動扣減原料庫存與出勤打卡鐘
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2.5">
            <span
              class="material-symbols-outlined text-cyan-400 text-[18px] shrink-0"
              >admin_panel_settings</span
            >
            <div>
              <p class="font-bold text-white">細緻 RBAC 角色權限矩陣</p>
              <p class="text-slate-400 text-[11px]">
                嚴格安全審計日誌與多部門協同
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer system status -->
      <div
        class="pt-6 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between"
      >
        <div class="flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>系統核心服務運作中</span>
        </div>
        <span class="font-data-mono text-slate-500">v2.5 Enterprise</span>
      </div>
    </div>

    <!-- Right Login Content Column -->
    <div class="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between">
      <div>
        <!-- Mode Switcher Tabs -->
        <div
          class="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-6"
        >
          <div class="flex items-center gap-2">
            <button
              @click="activeLoginMode = 'credentials'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="
                activeLoginMode === 'credentials'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              "
            >
              帳號密碼登入
            </button>
            <button
              @click="activeLoginMode = 'quick-select'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="
                activeLoginMode === 'quick-select'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              "
            >
              快速體驗身分 ({{ displayUsers.length }})
            </button>
          </div>

          <button
            @click="isRegisterModalOpen = true"
            class="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1 font-semibold"
          >
            <span class="material-symbols-outlined text-[14px]"
              >person_add</span
            >
            <span>申請帳號</span>
          </button>
        </div>

        <!-- Mode 1: Credentials Login Form -->
        <div v-if="activeLoginMode === 'credentials'" class="space-y-4">
          <!-- Error banner -->
          <div
            v-if="errorMessage"
            class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2 animate-in fade-in"
          >
            <span class="material-symbols-outlined text-[18px]">error</span>
            <span>{{ errorMessage }}</span>
          </div>

          <form @submit.prevent="handleFormLogin" class="space-y-3.5 text-xs">
            <div>
              <label class="block text-slate-400 mb-1 font-semibold"
                >電子郵件帳號 (Email)</label
              >
              <div class="relative">
                <span
                  class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]"
                >
                  mail
                </span>
                <input
                  v-model="email"
                  type="email"
                  placeholder="admin@humanisterp.com"
                  required
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white font-data-mono placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-slate-400 font-semibold"
                  >登入密碼 (Password)</label
                >
                <button
                  type="button"
                  @click="isForgotPasswordModalOpen = true"
                  class="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                >
                  忘記密碼？
                </button>
              </div>
              <div class="relative">
                <span
                  class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]"
                >
                  lock
                </span>
                <input
                  v-model="password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  placeholder="••••••••"
                  required
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-white font-data-mono placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                />
                <button
                  type="button"
                  @click="isPasswordVisible = !isPasswordVisible"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[18px]">
                    {{ isPasswordVisible ? "visibility_off" : "visibility" }}
                  </span>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <label
                class="flex items-center gap-2 cursor-pointer text-slate-400 select-none"
              >
                <input
                  type="checkbox"
                  v-model="rememberMe"
                  class="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <span>記住登入狀態</span>
              </label>

              <span class="text-[11px] text-slate-500">預設密碼同帳號前綴</span>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-98 mt-2"
            >
              <span
                v-if="isLoading"
                class="size-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"
              ></span>
              <span v-else class="material-symbols-outlined text-[18px]"
                >login</span
              >
              <span>{{ isLoading ? "登入驗證中..." : "登入管理後台" }}</span>
            </button>
          </form>

          <!-- Real backend account list -->
          <div class="pt-4 border-t border-slate-800/80">
            <span
              class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2"
            >
              後端實際帳號列表（從資料庫讀取）：
            </span>
            <div v-if="displayUsers.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
              <button
                v-for="user in displayUsers.slice(0, 6)"
                :key="user.id"
                @click="handleQuickFill(user.email, 'password')"
                class="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition-colors cursor-pointer"
              >
                <span class="font-bold text-white text-[11px] block">{{ user.name }}</span>
                <span class="text-[9px] text-emerald-400 font-data-mono">{{ user.email }}</span>
              </button>
            </div>
            <div v-else class="text-[11px] text-slate-500">
              正在從後端載入可登入帳號列表…
            </div>
          </div>
        </div>

        <!-- Mode 2: Quick User Selection -->
        <div v-else-if="activeLoginMode === 'quick-select'" class="space-y-2.5">
          <p class="text-xs text-slate-400 mb-2">
            點擊任一卡片即可免密碼快速模擬登入：
          </p>
          <div class="space-y-2">
            <button
              v-for="u in displayUsers"
              :key="u.id"
              @click="handleSelectUser(u)"
              class="w-full p-3 bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div class="flex items-center gap-3">
                <img
                  :src="u.avatar"
                  class="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                />
                <div>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors"
                    >
                      {{ u.name }}
                    </span>
                    <BaseBadge
                      :variant="
                        u.role === 'admin'
                          ? 'success'
                          : u.role === 'manager'
                            ? 'info'
                            : u.role === 'employee'
                              ? 'warning'
                              : 'neutral'
                      "
                      size="sm"
                    >
                      {{ u.roleName }}
                    </BaseBadge>
                  </div>
                  <span class="text-[11px] text-slate-400 block mt-0.5"
                    >{{ u.email }} • {{ u.department }}</span
                  >
                </div>
              </div>

              <span
                class="material-symbols-outlined text-slate-600 group-hover:text-emerald-400 transition-colors text-[20px]"
              >
                login
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Security Notice Footer -->
      <div
        class="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500"
      >
        <span>🔒 傳輸採用 TLS 1.3 端對端加密保護</span>
        <span>Humanist ERP System</span>
      </div>
    </div>

    <!-- Modal: Forgot Password -->
    <BaseModal
      :isOpen="isForgotPasswordModalOpen"
      title="重設您的登入密碼"
      subtitle="請輸入您在系統登記的電子郵件，我們將發送重設驗證通知。"
      icon="lock_reset"
      maxWidth="md"
      @close="
        isForgotPasswordModalOpen = false;
        forgotStep = 'input';
      "
    >
      <div v-if="forgotStep === 'input'" class="space-y-4 text-xs">
        <div>
          <label class="block text-slate-400 mb-1 font-semibold"
            >電子郵件帳號</label
          >
          <input
            v-model="forgotEmail"
            type="email"
            placeholder="例如：admin@humanisterp.com"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden focus:border-emerald-500"
          />
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            @click="isForgotPasswordModalOpen = false"
            class="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSendResetLink"
            class="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold cursor-pointer transition-all"
          >
            發送重設連結
          </button>
        </div>
      </div>
      <div v-else class="space-y-4 text-center text-xs py-2">
        <div
          class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto"
        >
          <span class="material-symbols-outlined text-[24px]"
            >mark_email_read</span
          >
        </div>
        <p class="text-white font-bold">已發送臨時重設密碼指示！</p>
        <p class="text-slate-400 text-[11px]">
          請至信箱查收重設郵件，或直接使用預設密碼進行測試登入。
        </p>
        <button
          @click="
            isForgotPasswordModalOpen = false;
            forgotStep = 'input';
          "
          class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl cursor-pointer"
        >
          返回登入畫面
        </button>
      </div>
    </BaseModal>

    <!-- Modal: Register Account Request -->
    <BaseModal
      :isOpen="isRegisterModalOpen"
      title="申請企業員工帳號"
      subtitle="填寫您的職務資訊，開立測試帳號以體驗 ERP 權限功能。"
      icon="person_add"
      maxWidth="md"
      @close="isRegisterModalOpen = false"
    >
      <form @submit.prevent="handleRegisterSubmit" class="space-y-3.5 text-xs">
        <div>
          <label class="block text-slate-400 mb-1 font-semibold"
            >真實姓名</label
          >
          <input
            v-model="registerForm.name"
            type="text"
            placeholder="例如：林書緯"
            required
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div>
          <label class="block text-slate-400 mb-1 font-semibold"
            >公司電子郵件</label
          >
          <input
            v-model="registerForm.email"
            type="email"
            placeholder="user@humanisterp.com"
            required
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div>
          <label class="block text-slate-400 mb-1 font-semibold"
            >設定登入密碼</label
          >
          <input
            v-model="registerForm.password"
            type="password"
            placeholder="請輸入至少 6 碼密碼"
            required
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-data-mono focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div>
          <label class="block text-slate-400 mb-1 font-semibold"
            >申請理由 / 職務說明</label
          >
          <textarea
            v-model="registerForm.reason"
            rows="3"
            placeholder="例如：我負責門市營運與排班，需使用 POS 與人事相關權限。"
            required
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500 resize-none"
          ></textarea>
        </div>

        <div class="space-y-2">
          <label class="block text-slate-400 mb-1 font-semibold"
            >大頭照預覽</label
          >
          <div class="flex items-center gap-3">
            <img
              :src="registerForm.avatar || defaultAvatar"
              class="w-14 h-14 rounded-xl object-cover border border-slate-700"
            />
            <label
              class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 font-semibold cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAvatarPreview"
              />
              <span class="material-symbols-outlined text-[18px]"
                >upload_file</span
              >
              <span>選擇頭像</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >所屬部門</label
            >
            <select
              v-model="registerForm.department"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="營運與行銷部">營運與行銷部</option>
              <option value="生產研發部">生產研發部</option>
              <option value="門市收銀課">門市收銀課</option>
              <option value="總管理處">總管理處</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-semibold"
              >申請權限角色</label
            >
            <select
              v-model="registerForm.requestedRole"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="manager">營運經理 / 店長</option>
              <option value="employee">現場員工 / 收銀員</option>
              <option value="guest">訪客審計</option>
            </select>
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button
            type="button"
            @click="isRegisterModalOpen = false"
            class="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 cursor-pointer"
          >
            取消
          </button>
          <button
            type="submit"
            class="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition-all cursor-pointer"
          >
            送出開通申請
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
