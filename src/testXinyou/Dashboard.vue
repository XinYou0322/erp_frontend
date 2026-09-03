<template>
  <div class="space-y-6 pb-12">
    <!-- Top 4 Live Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        id="metric-today-cups"
        title="今日即時出杯數"
        value="542 杯"
        growth="+14.8%"
        subtitle="目標進度 78% (預計 700 杯)"
        variant="cyan"
        :icon="CupSoda"
      />
      <MetricCard
        id="metric-today-revenue"
        title="今日累計營業額"
        value="NT$ 36,850"
        growth="+9.2%"
        subtitle="客單價均值 NT$ 68"
        variant="emerald"
        :icon="DollarSign"
      />
      <MetricCard
        id="metric-active-orders"
        title="吧台待製作訂單"
        :value="`${pendingOrdersCount} 張`"
        growth="尖峰排隊中"
        growth-type="warning"
        subtitle="平均出杯等待 4.2 分鐘"
        variant="amber"
        :icon="Clock"
      />
      <MetricCard
        id="metric-low-inventory"
        title="原料缺料警戒項目"
        :value="`${urgentInventoryCount} 項`"
        :variant="urgentInventoryCount > 0 ? 'danger' : 'default'"
        growth="需緊急叫貨"
        growth-type="down"
        subtitle="低於門市安全庫存門檻"
        :icon="AlertCircle"
      />
    </div>

    <!-- Main 2-Column Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Live Queue & Peak Chart (2 spans) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Live Order Queue -->
        <div class="glass-panel p-5 rounded-2xl border border-white/80 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <div class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
              <h3 class="font-bold text-sm text-[#181c23]">吧台出杯調飲排程監控 (Live Queue)</h3>
            </div>
            <span class="text-xs text-gray-500 font-mono">自動同步已連線</span>
          </div>

          <!-- Orders cards grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="order in orders"
              :key="order.id"
              class="p-3.5 rounded-xl bg-white/90 border border-gray-200/70 shadow-xs hover:border-[#0070ea] transition-all space-y-2.5"
            >
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-xs text-[#0059bb] bg-blue-50 px-2 py-0.5 rounded">
                  {{ order.orderNumber }}
                </span>
                <span class="text-[11px] text-gray-400">{{ order.time }}</span>
                <StatusBadge :status="order.status" />
              </div>

              <div class="space-y-1">
                <div
                  v-for="(it, i) in order.items"
                  :key="i"
                  class="flex justify-between items-center text-xs"
                >
                  <span class="font-semibold text-gray-800">{{ it.productName }}</span>
                  <span class="font-mono text-gray-500 text-[11px]">{{ it.quantity }} 杯</span>
                </div>
              </div>

              <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>{{ order.sugarIce }}</span>
                <span class="font-bold text-[#181c23] font-mono">NT$ {{ order.totalPrice }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hourly Peak Chart -->
        <div class="glass-panel p-5 rounded-2xl border border-white/80 space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-bold text-sm text-[#181c23]">全日出杯尖峰走勢分佈</h3>
              <p class="text-xs text-gray-500 mt-0.5">上午 11:00 至下午 14:00 為核心外送與上班族群峰值</p>
            </div>
            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              今日峰值: 12:30 (86杯/時)
            </span>
          </div>

          <!-- Bar Chart -->
          <div class="h-44 flex items-end justify-between space-x-2 pt-4 px-2">
            <div
              v-for="bar in hourlyData"
              :key="bar.hour"
              class="flex-1 flex flex-col items-center group relative h-full justify-end"
            >
              <!-- Tooltip on hover -->
              <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#001D3D] text-white text-[10px] py-1 px-1.5 rounded font-mono pointer-events-none whitespace-nowrap z-10">
                {{ bar.cups }} 杯
              </div>
              <div
                class="w-full rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                :class="bar.cups > 60 ? 'bg-gradient-to-t from-[#0070ea] to-[#00D2FF]' : 'bg-blue-200/80'"
                :style="{ height: `${(bar.cups / 90) * 100}%` }"
              ></div>
              <span class="text-[10px] text-gray-500 mt-2 font-mono">{{ bar.hour }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Top Ranked Drinks & Quick Navigation (1 span) -->
      <div class="space-y-6">
        <!-- Top Ranked Drinks -->
        <div class="glass-panel p-5 rounded-2xl border border-white/80 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm text-[#181c23]">暢銷飲品排行榜 (TOP 5)</h3>
            <button
              type="button"
              @click="emit('navigateToProducts')"
              class="text-xs text-[#0059bb] hover:underline font-semibold cursor-pointer"
            >
              檢視全部
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(p, idx) in topProducts"
              :key="p.id"
              class="p-3 rounded-xl bg-white/80 border border-gray-100 flex items-center justify-between hover:bg-white transition-all cursor-pointer"
              @click="emit('navigateToProducts')"
            >
              <div class="flex items-center space-x-3">
                <span
                  class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs font-mono"
                  :class="idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'"
                >
                  {{ idx + 1 }}
                </span>
                <div>
                  <h4 class="font-bold text-xs text-gray-800">{{ p.name }}</h4>
                  <p class="text-[10px] text-gray-400">{{ p.category }}</p>
                </div>
              </div>

              <div class="text-right">
                <span class="font-mono font-bold text-xs text-[#0059bb]">{{ p.weeklySales }} 杯</span>
                <span class="text-[10px] text-emerald-600 block">NT$ {{ (p.weeklySales * p.price).toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Inventory Alert Widget -->
        <div class="glass-panel p-5 rounded-2xl border border-white/80 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm text-[#181c23] flex items-center space-x-2">
              <Package class="w-4 h-4 text-amber-600" />
              <span>關鍵物料存量動態</span>
            </h3>
            <button
              type="button"
              @click="emit('navigateToInventory')"
              class="text-xs text-[#0059bb] hover:underline font-semibold cursor-pointer"
            >
              前往盤點
            </button>
          </div>

          <div class="space-y-2 text-xs">
            <div
              v-for="item in lowInventoryItems"
              :key="item.id"
              class="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between"
            >
              <div>
                <span class="font-bold text-amber-900 block">{{ item.name }}</span>
                <span class="text-[10px] text-amber-700">安全水位: {{ item.safetyStock }} {{ item.unit }}</span>
              </div>
              <span class="font-mono font-bold text-amber-800 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                現存 {{ item.currentStock }} {{ item.unit }}
              </span>
            </div>
          </div>

          <button
            type="button"
            @click="emit('openReport')"
            class="w-full mt-2 py-2 rounded-xl bg-blue-50 text-[#0059bb] hover:bg-blue-100 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet class="w-4 h-4" />
            <span>匯出完整進銷存盤點單</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { 
  CupSoda, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  Package, 
  FileSpreadsheet 
} from 'lucide-vue-next';
import MetricCard from './styles/common/MetricCard.vue';
import StatusBadge from './styles/common/StatusBadge.vue';
import type { Product, LiveOrder, InventoryItem } from './types.js';

const props = defineProps<{
  products: Product[];
  orders: LiveOrder[];
  inventory: InventoryItem[];
}>();

const emit = defineEmits<{
  (e: 'openReport'): void;
  (e: 'navigateToProducts'): void;
  (e: 'navigateToInventory'): void;
}>();

const pendingOrdersCount = computed(() => props.orders.filter(o => o.status === 'preparing' || o.status === 'pending').length);
const urgentInventoryCount = computed(() => props.inventory.filter(i => i.status === 'urgent' || i.status === 'low').length);

const topProducts = computed(() => {
  return [...props.products]
    .sort((a, b) => b.weeklySales - a.weeklySales)
    .slice(0, 5);
});

const lowInventoryItems = computed(() => {
  return props.inventory
    .filter(i => i.status === 'urgent' || i.status === 'low')
    .slice(0, 3);
});

const hourlyData = [
  { hour: '09:00', cups: 22 },
  { hour: '10:00', cups: 38 },
  { hour: '11:00', cups: 64 },
  { hour: '12:00', cups: 86 },
  { hour: '13:00', cups: 78 },
  { hour: '14:00', cups: 52 },
  { hour: '15:00', cups: 68 },
  { hour: '16:00', cups: 45 },
  { hour: '17:00', cups: 58 },
  { hour: '18:00', cups: 72 },
];
</script>
