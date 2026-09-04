<template>
  <div class="min-h-screen bg-[#F0F7FF] flex">
<!--
背景波浪
-->
<WaveBackground />





<!--
  Sidebar
  current-tab  ：目前選中的選單
  select-tab   ：切換選單
  open-report  ：開啟營運報表
  open-profile ：開啟個人資料
  open-pos     ：開啟 POS 點餐
-->
<Sidebar
  :current-tab="currentTab"
  @select-tab="currentTab = $event"
  @open-report="reportModalOpen = true"
  @open-profile="profileModalOpen = true"
  @open-pos="posModalOpen = true"
/>

   <!-- 右側主要區域 -->
<div class="flex-1 ml-64 flex flex-col min-h-screen">

  <Header
    :search-query="searchQuery"
    :is-realtime-active="isRealtimeActive"
    @search-change="searchQuery = $event"
    @open-filter="filterModalOpen = true"
    @open-report="reportModalOpen = true"
    @open-profile="profileModalOpen = true"
    @open-add-product="addProductModalOpen = true"
    @open-pos="posModalOpen = true"
    @toggle-realtime="isRealtimeActive = !isRealtimeActive"
  />

  <!-- 主要內容：只留一個 main -->
  <main class="flex-1 p-6 w-full max-w-[1600px] mx-auto overflow-y-auto">

    <Dashboard
      v-if="currentTab === 'dashboard'"
      :products="products"
      :orders="orders"
      :inventory="inventory"
      @open-report="reportModalOpen = true"
      @navigate-to-products="currentTab = 'products'"
      @navigate-to-inventory="currentTab = 'inventory'"
    />

  <InventoryManagement
  v-else-if="currentTab === 'inventory'"
  @open-report="reportModalOpen = true"
  @open-add-material="addMaterialModalOpen = true"
  @open-inventory-intake="inventoryIntakeModalOpen = true"
/>


  </main>

</div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterView } from 'vue-router'

import Sidebar, { type NavTabType } from './testXinyou/Sidebar.vue'
import Header from './testXinyou/Header.vue'
import WaveBackground from './testXinyou/WaveBackground.vue'
import Dashboard from './testXinyou/Dashboard.vue'
import InventoryManagement from './testXinyou/InventoryManagement.vue'
import InventoryIntakeModal from './testXinyou/styles/components/modals/InventoryIntakeModal.vue';


// AI 假資料
import {
  mockProducts,
  mockInventory,
  mockLiveOrders
} from './testXinyou/data/mockData.js'

// 型別
import type { Product, InventorySummary, LiveOrder } from './testXinyou/types.js'
const currentTab = ref<NavTabType>('dashboard')

const searchQuery = ref('')
const isRealtimeActive = ref(true)
const inventoryIntakeModalOpen = ref(false)
const reportModalOpen = ref(false)
const profileModalOpen = ref(false)
const posModalOpen = ref(false)
const filterModalOpen = ref(false)
const addProductModalOpen = ref(false)
const addMaterialModalOpen = ref(false);


const products = ref<Product[]>([...mockProducts]);
const inventory = ref<InventorySummary[]>([]);
const orders = ref<LiveOrder[]>([...mockLiveOrders]);


// const handleRestockInventoryItem = (id: string, amount: number) => {
//   const item = inventory.value.find(i => i.id === id);
//   if (item) {
//     item.currentStock += amount;
//     item.lastRestocked = '剛剛';
//     updateInventoryStatus(item);
//   }
// };
// const updateInventoryStatus = (inv: InventoryItem) => {
//   if (inv.currentStock <= inv.safetyStock * 0.4) {
//     inv.status = 'urgent';
//   } else if (inv.currentStock <= inv.safetyStock) {
//     inv.status = 'low';
//   } else {
//     inv.status = 'normal';
//   }
// };


</script>