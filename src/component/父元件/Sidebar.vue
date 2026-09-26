<template>
  <aside
    id="app-sidebar"
    class="w-64 h-screen fixed left-0 top-0 z-30 flex flex-col justify-between p-4 bg-[var(--surface-container-low)] border-r border-[var(--outline)] transition-all"
  >
    <div class="space-y-6">
      <!-- ============================== -->
      <!-- Logo -->
      <!-- ============================== -->
      <div class="flex items-center space-x-3 px-2 pt-2">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
        >
          <img
            v-if="resolvedSiteLogoUrl && !logoLoadFailed"
            :src="resolvedSiteLogoUrl"
            alt="網站圖示"
            class="h-full w-full object-contain"
            @error="logoLoadFailed = true"
          />
          <CupSoda v-else class="h-6 w-6 text-[var(--primary)]" />
        </div>

        <div>
          <h1
            class="font-black text-base tracking-tight text-[var(--on-surface)] leading-none"
          >
            {{ siteName }}
          </h1>

          <p
            class="text-[10px] font-semibold text-[var(--primary)] tracking-widest mt-1"
          >
            BEVERAGE CONTROL
          </p>
        </div>
      </div>

      <!-- 主選單 -->
      <!-- ============================== -->
      <nav class="space-y-1.5" aria-label="系統主要功能選單">
        <button
          v-for="item in visibleNavItems"
          :key="item.id"
          type="button"
          @click="handleNavClick(item)"
          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="
            isMainItemActive(item)
              ? `
                  bg-gradient-to-r
                  from-[var(--primary)]
                  to-[var(--secondary)]
                  text-[var(--on-primary)]
                  shadow-md shadow-black/20
                `
              : `
                  text-[var(--on-surface-variant)]
                  hover:bg-[var(--surface-container-high)]
                  hover:text-[var(--on-surface)]
                `
          "
        >
          <!-- 左邊：Icon + 名稱 -->
          <div class="flex items-center space-x-3">
            <component :is="item.icon" class="w-4 h-4" />

            <span>
              {{ item.label }}
            </span>
          </div>

    
        </button>
      </nav>

      <!-- ============================== -->
      <!-- 快捷功能 -->
      <!-- ============================== -->
      <div class="px-2 pt-2 space-y-2">
        <!-- POS -->
        <button
          type="button"
          @click="router.push('/pos')"
          class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-95 text-[var(--on-primary)] text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-black/20"
        >
          <CupSoda class="w-4 h-4" />

          <span> 門市點餐開單 (POS) </span>
        </button>
      </div>
    </div>
    <!-- Bottom Widget: Punch Clock & Settings -->
    <div class="space-y-3 pt-4 border-t border-slate-800/80">
      <!-- Punch Clock Badge Widget -->
      <div
        class="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs"
      >
        <div class="flex items-center justify-between mb-1.5">
          <span
            class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase"
          >
            出勤打卡鐘
          </span>
          <span
            class="size-2 rounded-full"
            :class="
              authStore.isClockedIn
                ? 'bg-emerald-400 animate-ping'
                : 'bg-slate-600'
            "
          />
        </div>
        <div class="font-data-mono text-white text-sm font-bold mb-2">
          {{ authStore.clockTime }}
        </div>
        <button
          @click="authStore.toggleClock"
          class="w-full py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer"
          :class="
            authStore.isClockedIn
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          "
        >
          <span class="material-symbols-outlined text-[14px]">
            {{ authStore.isClockedIn ? "logout" : "login" }}
          </span>
          <span>{{
            authStore.isClockedIn ? "簽退 (Clock Out)" : "打卡上班 (Clock In)"
          }}</span>
        </button>

        <button
          type="button"
          @click="router.push('/attendance')"
          class="mt-2 w-full py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-200 font-semibold text-[10px] transition-all hover:bg-slate-800 cursor-pointer"
        >
          查看打卡紀錄列表
        </button>

        <div class="mt-2 pt-2 border-t border-slate-800/80">
          <div class="flex items-center justify-between mb-1.5">
            <span
              class="text-[10px] font-semibold uppercase tracking-wider text-slate-400"
            >
              打卡紀錄
            </span>
            <span class="text-[10px] text-slate-500">
              {{ authStore.clockTimeline.length }} 筆
            </span>
          </div>

          <ul class="space-y-1.5">
            <li
              v-for="record in latestClockRecords"
              :key="record.id"
              class="flex items-start gap-2 text-[10px] text-slate-300"
            >
              <span
                class="mt-0.5 h-1.5 w-1.5 rounded-full"
                :class="
                  record.action === '上班打卡'
                    ? 'bg-emerald-400'
                    : 'bg-rose-400'
                "
              />
              <div class="min-w-0">
                <div class="font-semibold text-white">{{ record.action }}</div>
                <div class="text-[9px] text-slate-500">
                  {{
                    new Date(record.timestamp).toLocaleString("zh-TW", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  }}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import {
  resolveBackendAssetUrl,
  useSystemSettingStore,
} from "@/stores/systemSetting.store";

import {
  CupSoda,
  LayoutDashboard,
  Layers,
  Package,
  PackageOpen,
  Sliders,
  FileSpreadsheet,
  ChevronRight,
  FlaskConical,
  Receipt,
  ShieldUser,
  Settings,
  ReceiptText,
  CalendarCheck,
} from "lucide-vue-next";

// ==============================
// Router
// ==============================

const route = useRoute();

const router = useRouter();

const authStore = useAuthStore();
const systemSettingStore = useSystemSettingStore();
const { retailModeEnabled, siteName, siteLogoUrl } = storeToRefs(systemSettingStore);
const logoLoadFailed = ref(false);
const resolvedSiteLogoUrl = computed(() => resolveBackendAssetUrl(siteLogoUrl.value));

watch(siteLogoUrl, () => {
  logoLoadFailed.value = false;
});

const latestClockRecords = computed(() => {
  return [...(authStore.clockTimeline ?? [])]
    .sort(
      (first, second) =>
        new Date(second.timestamp).getTime() -
        new Date(first.timestamp).getTime(),
    )
    .slice(0, 2);
});
// ==============================
// Emit
// ==============================

const emit = defineEmits<{
  (e: "openReport"): void;

  (e: "openProfile"): void;
  //(e: "openPos"): void;
}>();

// ==============================
// 點擊 Sidebar
// ==============================

const handleNavClick = (item: any) => {
  if (item.path) {
    router.push(item.path);
  }
};

// ==============================
// 判斷目前 Sidebar 哪個項目 Active
// ==============================

const isMainItemActive = (item: any) => {
  // 庫存底下未來可能有很多功能
  // 例如：
  // /inventory
  // /inventory/xxx
  //
  // 所以只要是 /inventory 開頭
  // 都讓「原物料進銷存」保持亮起來

  if (item.id === "inventory") {
    return route.path.startsWith("/inventory");
  }

  return route.path === item.path;
};

// ==============================
// Sidebar 選單
// ==============================

const navItems = [
  {
    id: "dashboard",
    label: "門市營運儀表板",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
    {
    id: "inventory",
    label: "原物料進銷存",
    icon: Package,
 
    path: "/inventory",
  },
  {
    id: "bom",
    label: "商品BOM 管理",
    icon: FlaskConical,
  
    path: "/product",
  },


 

  {
    id: "supplier",
    label: "供應商管理",
    icon: Sliders,
    path: "/Supplier",
  },
  {
    id: "PurchaseOrder",
    label: "採購單管理",
    icon: Sliders,
    path: "/PurchaseOrder",
  },
   {
    id: "salesOrder",
    label: "銷售單管理",
    icon: Receipt,

    path: "/SalesOrder",
  },
   {
    id: "leave",
    label: "請假系統",
    icon: CalendarCheck,
    path: "/leave-requests",
  },
  {
    id: "workflow",
    label: "簽核系統",
    icon: ReceiptText,
    path: "/workflows",
     adminOnly: true,
  },
  {
    id: "SystemSettings",
    label: "SystemSettings",
    icon: ReceiptText,
    path: "/system-settings",
     adminOnly: true,
  },

];

const visibleNavItems = computed(() =>
  navItems
    .filter((item) => !item.adminOnly || authStore.isAdmin)
    .map((item) =>
      item.id === "inventory"
        ? {
            ...item,
            label: retailModeEnabled.value ? "庫存管理" : "原物料進銷存",
          }
        : item,
    ),
);

onMounted(() => {
  systemSettingStore.loadRetailModeSetting().catch((error) => {
    console.error("讀取零售模式失敗：", error);
  });
  systemSettingStore.loadBrandingSettings().catch((error) => {
    console.error("讀取網站外觀設定失敗：", error);
  });
});
</script>
