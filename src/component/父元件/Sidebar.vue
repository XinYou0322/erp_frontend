<template>
  <aside
    id="app-sidebar"
    class="w-64 h-screen fixed left-0 top-0 z-30 flex flex-col justify-between p-4 bg-[var(--surface-container-low)] border-r border-[var(--outline)] transition-all"
  >
    <div class="space-y-6">
      <!-- Logo -->
      <div class="flex items-center space-x-3 px-2 pt-2">
        <div
          class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-[var(--surface)] shadow-lg shadow-black/20"
        >
          <CupSoda class="w-6 h-6" />
        </div>

        <div>
          <h1
            class="font-black text-base tracking-tight text-[var(--on-surface)] leading-none"
          >
            深淵之流
          </h1>

          <p
            class="text-[10px] font-semibold text-[var(--primary)] tracking-widest mt-1"
          >
            BEVERAGE CONTROL
          </p>
        </div>
      </div>

      <!-- 主選單 -->
      <nav class="space-y-1.5" aria-label="系統主要功能選單">
        <div v-for="item in navItems" :key="item.id">
          <button
            type="button"
            @click="handleNavClick(item)"
            class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="
              isMainItemActive(item)
                ? 'bg-[var(--primary)] text-[var(--surface)] shadow-md shadow-black/20'
                : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]'
            "
          >
            <div class="flex items-center space-x-3">
              <component :is="item.icon" class="w-4 h-4" />

              <span>
                {{ item.label }}
              </span>
            </div>

            <div class="flex items-center space-x-1">
              <!-- Badge -->
              <span
                v-if="item.badge"
                class="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                :class="
                  isMainItemActive(item)
                    ? 'bg-[var(--surface)]/15 text-[var(--surface)]'
                    : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                "
              >
                {{ item.badge }}
              </span>

              <ChevronDown
                v-if="item.id === 'inventory'"
                class="w-3.5 h-3.5 transition-transform"
                :class="inventoryMenuOpen ? 'rotate-180' : ''"
              />
            </div>
          </button>

          <!-- 庫存子選單 -->
          <div
            v-if="item.id === 'inventory' && inventoryMenuOpen"
            class="mt-1 ml-5 pl-3 border-l border-[var(--outline)] space-y-1"
          >
            <!-- 庫存總覽 -->
            <button
              type="button"
              @click="router.push('/inventory')"
              class="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              :class="
                route.path === '/inventory'
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]'
              "
            >
              庫存總覽
            </button>

            <!-- 庫存異動紀錄 -->
            <button
              type="button"
              @click="router.push('/inventory/logs')"
              class="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              :class="
                route.path === '/inventory/logs'
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]'
              "
            >
              庫存異動紀錄
            </button>
          </div>
        </div>
      </nav>

      <!-- 快捷功能 -->
      <div class="px-2 pt-2 space-y-2">
        <!-- POS -->
        <button
          type="button"
          @click="emit('openPos')"
          class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-95 text-[var(--surface)] text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-black/20"
        >
          <CupSoda class="w-4 h-4" />

          <span> 門市點餐開單 (POS) </span>
        </button>

        <!-- 報表 -->
        <button
          type="button"
          @click="emit('openReport')"
          class="w-full py-2 px-3 rounded-xl bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] border border-[var(--outline)] text-[var(--on-surface)] text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <FileSpreadsheet class="w-3.5 h-3.5 text-[var(--primary)]" />

          <span> 門市營運結報中心 </span>
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
              v-for="record in authStore.clockTimeline.slice(0, 3)"
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

      <ChevronRight
        class="w-4 h-4 text-[var(--on-surface-variant)] group-hover:text-[var(--on-surface)] transition-colors shrink-0"
      />
    </div>
  </aside>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth.store";

import {
  CupSoda,
  LayoutDashboard,
  Layers,
  Package,
  PackageOpen,
  Sliders,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  Receipt,
  ShieldUser,
} from "lucide-vue-next";

const route = useRoute();

const router = useRouter();

const authStore = useAuthStore();

const emit = defineEmits<{
  (e: "openReport"): void;
  (e: "openProfile"): void;
  (e: "openPos"): void;
}>();

const inventoryMenuOpen = ref(route.path.startsWith("/inventory"));

const handleNavClick = (item: any) => {
  if (item.id === "inventory") {
    inventoryMenuOpen.value = !inventoryMenuOpen.value;

    return;
  }

  if (item.path) {
    router.push(item.path);
  }
};

const isMainItemActive = (item: any) => {
  if (item.id === "inventory") {
    return route.path.startsWith("/inventory");
  }

  return route.path === item.path;
};

const navItems = [
  {
    id: "dashboard",
    label: "門市營運儀表板",
    icon: LayoutDashboard,
    path: "/dashboard",
  },

  {
    id: "products",
    label: "飲品品項菜單",
    icon: Layers,
    badge: "8款",
    path: "/product2",
  },

  {
    id: "products",
    label: "原料配方 BOM 管理",
    icon: FlaskConical,
    badge: "SOP",
    path: "/product",
  },

  {
    id: "materials",
    label: "原物料主檔管理",
    icon: PackageOpen,
    badge: "主檔",
    path: "/material",
  },

  {
    id: "inventory",
    label: "原物料進銷存",
    icon: Package,
    badge: "庫存",
  },

  {
    id: "orders",
    label: "門市出杯訂單中心",
    icon: Receipt,
    badge: "出單",
    path: "/orders",
  },

  {
    id: "settings",
    label: "門市系統參數設定",
    icon: Sliders,
    path: "/settings",
  },
  {
    id: "PermissionPage",
    label: "權限與用戶管理",
    icon: ShieldUser,
    path: "/PermissionPage",
  },
  {
    id: "Supplier",
    label: "供應商管理",
    icon: Sliders,
    path: "/Supplier",
  },
  {
    id: "testings15313",
    label: "展示用",
    icon: Sliders,
    path: "/ComponentShowcase",
  },
  {
    id: "workflow",
    label: "簽核系統",
    icon: Sliders,
    path: "/workflows",
  },
];
</script>
