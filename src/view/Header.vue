<template>
  <header
    id="app-header"
    class="h-16 sticky top-0 z-20 px-6 glass-panel border-b border-white/80 flex items-center justify-between"
  >
    <!-- Left: Store badge & Global Search -->
    <div class="flex items-center space-x-4 flex-1 max-w-xl">
      <div class="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/60 text-xs shrink-0">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-bold text-[#0059bb]">台北信義旗艦門市</span>
      </div>

      <div class="relative flex-1">
        <Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          :value="searchQuery"
          @input="emit('searchChange', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="搜尋飲品品名、料號、SOP 茶湯配方或原料代碼..."
          class="input-field pl-9 pr-8"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="emit('searchChange', '')"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        type="button"
        @click="emit('openFilter')"
        class="btn-secondary text-xs px-2.5 py-1.5 shrink-0 hidden md:flex items-center space-x-1.5"
        title="進階篩選"
      >
        <SlidersHorizontal class="w-3.5 h-3.5 text-gray-500" />
        <span>進階篩選</span>
      </button>
    </div>

    <!-- Right: POS Ordering Focus, Notifications, Profile -->
    <div class="flex items-center space-x-3 shrink-0 ml-4">
      <!-- Realtime Sync Indicator -->
      <button
        type="button"
        @click="emit('toggleRealtime')"
        class="hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all items-center space-x-1.5 cursor-pointer"
        :class="isRealtimeActive ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'"
        :title="isRealtimeActive ? '點擊暫停即時出杯模擬' : '點擊啟動即時出杯模擬'"
      >
        <span
          class="w-2 h-2 rounded-full"
          :class="isRealtimeActive ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'"
        ></span>
        <span class="text-[11px]">{{ isRealtimeActive ? 'POS連線中' : '連線暫停' }}</span>
      </button>

      <!-- Primary Action: Top-Right Dedicated POS Ordering Button -->
      <button
        type="button"
        @click="emit('openPos')"
        class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0070ea] to-[#00a6ff] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
        title="開啟門市快速點餐與出杯收銀介面"
      >
        <CupSoda class="w-4 h-4 text-white" />
        <span class="tracking-wide">門市點餐收銀 (POS)</span>
        <span class="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">F1</span>
      </button>

      <!-- Notification Bell -->
      <div class="relative">
        <button
          type="button"
          @click="showNotifications = !showNotifications"
          class="w-9 h-9 rounded-xl bg-white hover:bg-gray-50 border border-gray-200/80 flex items-center justify-center text-gray-600 transition-colors cursor-pointer relative"
          title="庫存與門市通知"
        >
          <Bell class="w-4 h-4" />
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <!-- Notification dropdown -->
        <div
          v-if="showNotifications"
          class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div class="flex justify-between items-center px-1 pb-1 border-b border-gray-100">
            <span class="font-bold text-xs text-gray-800">門市即時告警 (3)</span>
            <span class="text-[10px] text-[#0059bb] font-semibold">全部已讀</span>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="p-2 rounded-xl bg-red-50 border border-red-100 text-red-800">
              <span class="font-bold block text-[11px]">低溫鮮乳存量告急</span>
              <span class="text-[10px] text-red-600">目前僅剩 12 瓶，預估 1.5 小時後售罄。</span>
            </div>
            <div class="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">
              <span class="font-bold block text-[11px]">特級波霸珍珠即將用罄</span>
              <span class="text-[10px] text-amber-600">吧台珍珠已備料至第三鍋，請啟動第四鍋悶煮。</span>
            </div>
            <div class="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-800">
              <span class="font-bold block text-[11px]">外送平台大單進單</span>
              <span class="text-[10px] text-blue-600">UberEats #8892 訂單 24 杯已自動排入出杯清單。</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Profile Button -->
      <button
        type="button"
        @click="emit('openProfile')"
        class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0070ea] to-[#00D2FF] text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer"
        title="店長設定"
      >
        陳
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  Plus, 
  Bell, 
  Activity,
  CupSoda
} from 'lucide-vue-next';

defineProps<{
  searchQuery: string;
  isRealtimeActive: boolean;
}>();

const emit = defineEmits<{
  (e: 'searchChange', query: string): void;
  (e: 'openFilter'): void;
  (e: 'openReport'): void;
  (e: 'openProfile'): void;
  (e: 'openAddProduct'): void;
  (e: 'openPos'): void;
  (e: 'toggleRealtime'): void;
}>();

const showNotifications = ref(false);
</script>
