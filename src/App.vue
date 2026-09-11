<template>

   <div  class="erp-shell">

    <testbar />

    <main class="erp-main">
      <router-view />
    </main>

  </div>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterView } from "vue-router";
import AppShell from "@/component/layout/AppShell.vue";
import Navbar from '@/components/NavBar.vue';
import testbar from '@/components/testbar.vue';

// 💡 補上通知抽屜組件的正確引入路徑
import NotificationCenterDrawer from "@/testErp-sheng/components/NotificationCenterDrawer.vue";
import Sidebar, { type NavTabType } from './testXinyou/Sidebar.vue'
import Header from './testXinyou/Header.vue'
import WaveBackground from './testXinyou/WaveBackground.vue'
import Dashboard from './testXinyou/Dashboard.vue'
import InventoryManagement from './testXinyou/InventoryManagement.vue'
import MaterialManagement from './testXinyou/MaterialManagement.vue'
import ProductBomManagement from './testXinyou/ProductBomManagement.vue';
import InventoryLogManagement
  from './testXinyou/InventoryLogManagement.vue'
// AI 假資料

import {
  mockProducts,
  mockInventory,
  mockLiveOrders
} from './testXinyou/data/mockData.js'

// 型別
import type { Product, InventorySummary, LiveOrder } from './testXinyou/types.js'
import { Import } from 'lucide-vue-next';

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



