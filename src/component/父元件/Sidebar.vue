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

    <!-- 使用者 -->
    <div
      @click="emit('openProfile')"
      class="p-3 rounded-2xl bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] border border-[var(--outline)] transition-all cursor-pointer flex items-center space-x-3 group"
    >
      <!-- Avatar -->
      <div
        class="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-[var(--surface)] flex items-center justify-center font-bold text-sm shadow-sm shrink-0"
      >
        陳
      </div>

      <!-- User Info -->
      <div class="min-w-0 flex-1">
        <p
          class="text-xs font-bold text-[var(--on-surface)] truncate group-hover:text-[var(--primary)] transition-colors"
        >
          陳思妤 (店長)
        </p>

        <p class="text-[10px] text-[var(--on-surface-variant)] truncate">
          信義旗艦店 • 執勤中
        </p>
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
  {
    id: "leave",
    label: "請假系統",
    icon: Sliders,
    path: "/leave-requests",
  },
];
</script>
