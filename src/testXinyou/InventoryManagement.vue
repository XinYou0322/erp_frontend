<template>
  <div class="space-y-6 pb-12">
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        id="inv-metric-total"
        title="原物料建檔品項"
        :value="`${inventory.length} 種`"
        growth="全品項納管"
        subtitle="包含茶葉、奶品、手工配料與包材"
        :icon="Package"
      />
      <MetricCard
        id="inv-metric-urgent"
        title="緊急缺料叫貨項目"
        :value="`${urgentItemsCount} 項`"
        :variant="urgentItemsCount > 0 ? 'danger' : 'default'"
        growth="低於安全庫存"
        growth-type="down"
        subtitle="請儘速向配合供應商下單"
        :icon="AlertTriangle"
      />
      <MetricCard
        id="inv-metric-low"
        title="偏低水位觀察品項"
        :value="`${lowItemsCount} 項`"
        variant="amber"
        growth="本週預計補貨"
        growth-type="warning"
        subtitle="預估 48 小時內需補進"
        :icon="Clock"
      />
      <MetricCard
        id="inv-metric-cost"
        title="在庫物料資產估值"
        :value="`NT$ ${totalStockValue.toLocaleString()}`"
        variant="emerald"
        growth="+3.4%"
        subtitle="以進貨合約成本價核算"
        :icon="DollarSign"
      />
    </div>

    <!-- Filter & Category Tabs -->
    <div class="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          @click="selectedCategory = cat"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
          :class="selectedCategory === cat ? 'bg-[#0070ea] text-white shadow-sm' : 'bg-white/80 text-gray-600 hover:bg-white border border-gray-200/50'"
        >
          {{ cat }}
          <span
            class="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px]"
            :class="selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'"
          >
            {{ getCategoryCount(cat) }}
          </span>
        </button>
      </div>

      <div class="flex items-center space-x-2 shrink-0">
        <button
          type="button"
          @click="emit('openReport')"
          class="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1.5 shrink-0"
        >
          <FileSpreadsheet class="w-3.5 h-3.5 text-gray-500" />
          <span class="hidden md:inline">盤點報表</span>
        </button>
        <button
          type="button"
          @click="emit('openAddMaterial')"
          class="btn-primary text-xs px-3.5 py-1.5 flex items-center space-x-1.5 shrink-0 shadow-sm"
        >
          <Plus class="w-4 h-4" />
          <span>新增原物料</span>
        </button>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="glass-panel rounded-2xl border border-white/80 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th class="py-3 px-4">原物料名稱 / 料號</th>
              <th class="py-3 px-4">物料分類</th>
              <th class="py-3 px-4">現有存量 / 安全基準</th>
              <th class="py-3 px-4">庫存狀態</th>
              <th class="py-3 px-4">進料成本單價</th>
              <th class="py-3 px-4">主要配合供應商</th>
              <th class="py-3 px-4 text-right pr-6">門市快速進貨補料</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100/80 text-xs">
            <tr
              v-for="item in filteredInventory"
              :key="item.id"
              class="zebra-row hover:bg-blue-50/40 transition-colors"
            >
              <!-- Name & Code -->
              <td class="py-3.5 px-4">
                <div class="font-bold text-sm text-[#181c23]">{{ item.name }}</div>
                <div class="text-[11px] text-gray-400 font-mono mt-0.5">{{ item.code }}</div>
              </td>

              <!-- Category -->
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">
                  {{ item.category }}
                </span>
              </td>

              <!-- Stock & Bar -->
              <td class="py-3.5 px-4 min-w-[150px]">
                <div class="flex justify-between text-xs mb-1">
                  <span
                    class="font-mono font-bold"
                    :class="item.currentStock <= item.safetyStock ? 'text-red-600' : 'text-gray-800'"
                  >
                    {{ item.currentStock }} {{ item.unit }}
                  </span>
                  <span class="text-[10px] text-gray-400">門檻 {{ item.safetyStock }} {{ item.unit }}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="item.status === 'urgent' ? 'bg-red-500' : item.status === 'low' ? 'bg-amber-500' : 'bg-[#0070ea]'"
                    :style="{ width: `${Math.min(100, (item.currentStock / (item.safetyStock * 2.5)) * 100)}%` }"
                  ></div>
                </div>
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <StatusBadge :status="item.status" />
              </td>

              <!-- Cost -->
              <td class="py-3.5 px-4 font-mono font-bold text-gray-800">
                NT$ {{ item.unitCost }} / {{ item.unit }}
              </td>

              <!-- Supplier -->
              <td class="py-3.5 px-4 text-gray-600">
                {{ item.supplier }}
              </td>

              <!-- Quick Restock Actions -->
              <td class="py-3.5 px-4 text-right pr-6">
                <div class="flex items-center justify-end space-x-1">
                  <button
                    v-for="amt in [10, 50, 100]"
                    :key="amt"
                    type="button"
                    @click="emit('restockItem', item.id, amt)"
                    class="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0059bb] font-bold text-[11px] transition-colors cursor-pointer"
                    :title="`快速入庫 +${amt} ${item.unit}`"
                  >
                    +{{ amt }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Package, AlertTriangle, Clock, DollarSign, FileSpreadsheet, Plus } from 'lucide-vue-next';
import MetricCard from './styles/common/MetricCard.vue';
import StatusBadge from './styles/common/StatusBadge.vue';
import type { InventoryItem } from './types';

const props = defineProps<{
  inventory: InventoryItem[];
}>();

const emit = defineEmits<{
  (e: 'restockItem', id: string, amount: number): void;
  (e: 'openReport'): void;
  (e: 'openAddMaterial'): void;
}>();

const categories = ['全部', '茶葉原料', '乳品配料', '現煮配料', '風味糖漿', '包裝耗材'];
const selectedCategory = ref('全部');

const urgentItemsCount = computed(() => props.inventory.filter(i => i.status === 'urgent').length);
const lowItemsCount = computed(() => props.inventory.filter(i => i.status === 'low').length);
const totalStockValue = computed(() => props.inventory.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0));

const getCategoryCount = (cat: string) => {
  if (cat === '全部') return props.inventory.length;
  return props.inventory.filter(i => i.category === cat).length;
};

const filteredInventory = computed(() => {
  if (selectedCategory.value === '全部') return props.inventory;
  return props.inventory.filter(i => i.category === selectedCategory.value);
});
</script>
