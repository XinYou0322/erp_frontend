<!--
  =====================================================================
  【系統通知中心抽屜 (Notification Center Drawer)】: src/testErp-sheng/components/NotificationCenterDrawer.vue
  =====================================================================
  職責說明：
  1. 提供側邊滑出式通知中心，集中展示所有庫存告急、簽核審批、採購物流與資安事件。
  2. 具備分類標籤切換 (全部、庫存、簽核、採購、資安)、未讀篩選、批次全讀與清空功能。
  3. 支援深層導航跳轉 (點擊直接進入對應功能頁面，並自動標記為已讀)。
  4. 整合提示音效切換與測試通知發送功能，確保使用者隨時掌握企業營運現況。
-->

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "../stores/notification.store";
import { useUIStore } from "../stores/ui.store";

const router = useRouter();
const notifStore = useNotificationStore();
const uiStore = useUIStore();

// 類別標籤設定
const categories = [
  { key: "all", label: "全部", icon: "dashboard" },
  { key: "inventory", label: "庫存預警", icon: "inventory_2" },
  { key: "workflow", label: "簽核審批", icon: "assignment" },
  { key: "supplier", label: "採購供鏈", icon: "local_shipping" },
  { key: "security", label: "資安稽核", icon: "shield" },
] as const;

// 是否展開偏好設定面板
const showSettings = ref(false);

// 處理點擊導航動作
const handleAction = (notif: any) => {
  notifStore.markAsRead(notif.id);
  uiStore.isNotificationCenterOpen = false;
  if (notif.actionRoute) {
    router.push(notif.actionRoute);
    uiStore.showToast(`已跳轉至「${notif.title}」關聯頁面`);
  }
};

// 標籤樣式輔助函式
const getTypeBadgeClass = (type: string) => {
  switch (type) {
    case "warning":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "danger":
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    case "success":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "info":
    default:
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
  }
};

const getTypeIcon = (type: string, category: string) => {
  if (category === "inventory") return "warning";
  if (category === "workflow") return "history_edu";
  if (category === "supplier") return "local_shipping";
  if (category === "security") return "security";
  switch (type) {
    case "danger":
      return "error";
    case "warning":
      return "warning";
    case "success":
      return "check_circle";
    case "info":
    default:
      return "notifications";
  }
};

const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case "inventory":
      return "庫存物料";
    case "workflow":
      return "簽核審批";
    case "supplier":
      return "採購供鏈";
    case "security":
      return "資安日誌";
    case "system":
      return "系統公告";
    default:
      return "一般通知";
  }
};
</script>

<template>
  <div v-if="uiStore.isNotificationCenterOpen">
    <!-- 半透明背景遮罩 -->
    <div
      class="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs transition-opacity"
      @click="uiStore.isNotificationCenterOpen = false"
    />

    <!-- 側邊抽屜本體 -->
    <aside
      class="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-slate-900 z-50 border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
    >
      <!-- 1. 抽屜頂部標題與工具欄 -->
      <div
        class="p-5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div
              class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"
            >
              <span class="material-symbols-outlined text-[20px]"
                >notifications_active</span
              >
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-white tracking-tight">
                  通知中心
                </h3>
                <span
                  v-if="notifStore.unreadCount > 0"
                  class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse"
                >
                  {{ notifStore.unreadCount }} 未讀
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                >
                  全部已讀
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                即時追蹤 ERP 庫存水位、簽核待辦與資安事件
              </p>
            </div>
          </div>

          <!-- 右側快捷功能按鈕 -->
          <div class="flex items-center gap-1.5">
            <button
              @click="showSettings = !showSettings"
              title="通知偏好設定"
              class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              :class="{
                'bg-slate-800 text-emerald-400 border-emerald-500/30':
                  showSettings,
              }"
            >
              <span class="material-symbols-outlined text-[18px]">tune</span>
            </button>
            <button
              @click="uiStore.isNotificationCenterOpen = false"
              title="關閉抽屜"
              class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <!-- 偏好設定展開面板 -->
        <div
          v-if="showSettings"
          class="mt-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-300 flex items-center gap-1.5">
              <span
                class="material-symbols-outlined text-[16px] text-emerald-400"
                >volume_up</span
              >
              新通知提示音效
            </span>
            <button
              @click="notifStore.soundEnabled = !notifStore.soundEnabled"
              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer"
              :class="
                notifStore.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              "
            >
              <span
                class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                :class="
                  notifStore.soundEnabled ? 'translate-x-4.5' : 'translate-x-1'
                "
              />
            </button>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-amber-400"
                >warning</span
              >
              自動偵測原物料低庫存
            </span>
            <button
              @click="
                notifStore.autoAlertLowStock = !notifStore.autoAlertLowStock
              "
              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer"
              :class="
                notifStore.autoAlertLowStock ? 'bg-emerald-500' : 'bg-slate-700'
              "
            >
              <span
                class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                :class="
                  notifStore.autoAlertLowStock
                    ? 'translate-x-4.5'
                    : 'translate-x-1'
                "
              />
            </button>
          </div>

          <div
            class="pt-2 border-t border-slate-800/80 flex items-center justify-between"
          >
            <button
              @click="notifStore.triggerSampleAlert"
              class="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span class="material-symbols-outlined text-[14px]"
                >add_alert</span
              >
              發送一則模擬測試通知
            </button>
            <button
              @click="notifStore.clearAll"
              class="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[14px]"
                >delete_forever</span
              >
              清空全部通知
            </button>
          </div>
        </div>

        <!-- 2. 分類篩選 Tab 按鈕列 -->
        <div
          class="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5 no-scrollbar"
        >
          <button
            v-for="cat in categories"
            :key="cat.key"
            @click="notifStore.activeCategory = cat.key"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
            :class="
              notifStore.activeCategory === cat.key
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-xs'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            "
          >
            <span>{{ cat.label }}</span>
            <span
              v-if="notifStore.unreadCountsByCategory[cat.key] > 0"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
              :class="
                notifStore.activeCategory === cat.key
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-700 text-slate-300'
              "
            >
              {{ notifStore.unreadCountsByCategory[cat.key] }}
            </span>
          </button>
        </div>

        <!-- 3. 二級工具列 (僅看未讀 / 標為已讀) -->
        <div
          class="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/60 text-xs"
        >
          <label
            class="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              v-model="notifStore.onlyUnread"
              class="w-3.5 h-3.5 rounded-md accent-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
            />
            <span>僅看未讀 ({{ notifStore.unreadCount }})</span>
          </label>

          <div class="flex items-center gap-2">
            <button
              v-if="notifStore.unreadCount > 0"
              @click="notifStore.markAllAsRead"
              class="text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span class="material-symbols-outlined text-[15px]"
                >done_all</span
              >
              <span>全部標為已讀</span>
            </button>
            <button
              v-if="notifStore.notifications.some((n: any) => n.isRead)"
              @click="notifStore.clearRead"
              class="text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span class="material-symbols-outlined text-[15px]"
                >clear_all</span
              >
              <span>清除已讀</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 4. 通知列表滾動區塊 -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        <!-- 無通知空狀態 -->
        <div
          v-if="notifStore.filteredNotifications.length === 0"
          class="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 my-auto"
        >
          <div
            class="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500"
          >
            <span
              class="material-symbols-outlined text-[32px] text-emerald-500/60"
              >task_alt</span
            >
          </div>
          <div>
            <h4 class="text-sm font-bold text-white">目前沒有符合的通知</h4>
            <p class="text-xs text-slate-400 max-w-xs mt-1">
              {{
                notifStore.onlyUnread
                  ? "所有未讀項目皆已處理完成！"
                  : "系統目前營運順暢，無未決之警示事項。"
              }}
            </p>
          </div>
          <button
            @click="notifStore.triggerSampleAlert"
            class="mt-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">add_alert</span>
            <span>發送測試通知驗證功能</span>
          </button>
        </div>

        <!-- 通知卡片清單 -->
        <div
          v-for="notif in notifStore.filteredNotifications"
          :key="notif.id"
          class="relative p-4 rounded-2xl border transition-all duration-150 group"
          :class="[
            notif.isRead
              ? 'bg-slate-900/50 border-slate-800/70 hover:border-slate-700 text-slate-400'
              : 'bg-slate-800/80 border-slate-700/90 hover:border-emerald-500/50 shadow-md text-slate-200',
          ]"
        >
          <!-- 未讀小綠點 -->
          <div
            v-if="!notif.isRead"
            class="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20"
            title="未讀通知"
          />

          <div class="flex items-start gap-3">
            <!-- 類型圖示徽章 -->
            <div
              class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5"
              :class="getTypeBadgeClass(notif.type)"
            >
              <span class="material-symbols-outlined text-[18px]">
                {{ getTypeIcon(notif.type, notif.category) }}
              </span>
            </div>

            <!-- 通知內容主體 -->
            <div class="flex-1 min-w-0 pr-3">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <!-- 分類 Tag -->
                <span
                  class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/60"
                >
                  {{ getCategoryLabel(notif.category) }}
                </span>
                <!-- 相對時間 -->
                <span class="text-[11px] text-slate-500">
                  {{ notifStore.formatTimeAgo(notif.timestamp) }}
                </span>
              </div>

              <!-- 標題 -->
              <h4
                class="text-xs font-bold leading-snug tracking-tight mb-1"
                :class="notif.isRead ? 'text-slate-300' : 'text-white'"
              >
                {{ notif.title }}
              </h4>

              <!-- 詳細說明內文 -->
              <p class="text-xs text-slate-400 leading-relaxed font-sans mb-3">
                {{ notif.message }}
              </p>

              <!-- 底部操作列 (快速跳轉 & 標記/刪除) -->
              <div
                class="flex items-center justify-between pt-2 border-t border-slate-800/60"
              >
                <!-- 跳轉到對應頁面的按鈕 -->
                <button
                  v-if="notif.actionRoute"
                  @click="handleAction(notif)"
                  class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                >
                  <span>{{ notif.actionLabel || "前往查看" }}</span>
                  <span class="material-symbols-outlined text-[14px]"
                    >arrow_forward</span
                  >
                </button>
                <div v-else />

                <!-- 右側標記/刪除快捷按鈕 -->
                <div
                  class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    @click="notifStore.toggleRead(notif.id)"
                    :title="notif.isRead ? '標記為未讀' : '標記為已讀'"
                    class="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-colors cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[16px]">
                      {{
                        notif.isRead ? "mark_email_unread" : "mark_email_read"
                      }}
                    </span>
                  </button>
                  <button
                    @click="notifStore.removeNotification(notif.id)"
                    title="刪除此通知"
                    class="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[16px]"
                      >delete</span
                    >
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. 抽屜底部資訊欄 (System Summary Footer) -->
      <div
        class="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400"
      >
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>系統通報引擎常駐中</span>
        </div>
        <button
          @click="notifStore.triggerSampleAlert"
          class="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
        >
          <span class="material-symbols-outlined text-[14px]">add</span>
          <span>新增測試通知</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
