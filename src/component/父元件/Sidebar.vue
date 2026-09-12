<template>
  <aside
    id="app-sidebar"
    class="w-64 h-screen fixed left-0 top-0 z-30 flex flex-col justify-between p-4 glass-panel border-r border-white/80 transition-all"
  >
    <div class="space-y-6">
      <!-- Logo -->
      <div class="flex items-center space-x-3 px-2 pt-2">
        <div
          class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0070ea] to-[#00D2FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/20"
        >
          <CupSoda class="w-6 h-6" />
        </div>

        <div>
          <h1
            class="font-black text-base tracking-tight text-[#181c23] leading-none"
          >
            深淵之流
          </h1>

          <p
            class="text-[10px] font-semibold text-[#0059bb] tracking-widest mt-1"
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
                ? 'bg-[#0070ea] text-white shadow-md shadow-blue-500/25'
                : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
            "
          >
            <div class="flex items-center space-x-3">
              <component :is="item.icon" class="w-4 h-4" />

              <span>
                {{ item.label }}
              </span>
            </div>

            <div class="flex items-center space-x-1">
              <span
                v-if="item.badge"
                class="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                :class="
                  isMainItemActive(item)
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-[#0059bb]'
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
            class="mt-1 ml-5 pl-3 border-l border-blue-100 space-y-1"
          >
            <button
              type="button"
              @click="router.push('/inventory')"
              class="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              :class="
                route.path === '/inventory'
                  ? 'bg-blue-50 text-[#0070ea]'
                  : 'text-gray-500 hover:bg-white/80 hover:text-gray-800'
              "
            >
              庫存總覽
            </button>

            <button
              type="button"
              @click="router.push('/inventory/logs')"
              class="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              :class="
                route.path === '/inventory/logs'
                  ? 'bg-blue-50 text-[#0070ea]'
                  : 'text-gray-500 hover:bg-white/80 hover:text-gray-800'
              "
            >
              庫存異動紀錄
            </button>
          </div>
        </div>
      </nav>

      <!-- 快捷功能 -->
      <div class="px-2 pt-2 space-y-2">
        <button
          type="button"
          @click="emit('openPos')"
          class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0070ea] to-[#00a6ff] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-blue-500/20"
        >
          <CupSoda class="w-4 h-4" />
          <span>門市點餐開單 (POS)</span>
        </button>

        <button
          type="button"
          @click="emit('openReport')"
          class="w-full py-2 px-3 rounded-xl bg-white/70 hover:bg-white border border-gray-200/80 text-gray-700 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
        >
          <FileSpreadsheet class="w-3.5 h-3.5 text-[#0059bb]" />

          <span> 門市營運結報中心 </span>
        </button>
      </div>
    </div>

    <!-- 使用者 -->
    <div
      @click="emit('openProfile')"
      class="p-3 rounded-2xl bg-white/70 hover:bg-white border border-gray-200/60 transition-all cursor-pointer flex items-center space-x-3 group"
    >
      <div
        class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0070ea] to-[#00D2FF] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0"
      >
        陳
      </div>

      <div class="min-w-0 flex-1">
        <p
          class="text-xs font-bold text-gray-800 truncate group-hover:text-[#0070ea] transition-colors"
        >
          陳思妤 (店長)
        </p>

        <p class="text-[10px] text-gray-400 truncate">信義旗艦店 • 執勤中</p>
      </div>

      <ChevronRight
        class="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors shrink-0"
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
 id: "testings",
    label: "測試用欄位",
    icon: Sliders,
    path: "/material",



},
{
 id: "testings15313",
    label: "展示用",
    icon: Sliders,
    path: "/ComponentShowcase",



}
  
];
</script>
