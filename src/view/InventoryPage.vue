<template>
  <div class="space-y-6 pb-12">

    <!-- 頁面標題 -->
    <div>
      <h1
        class="
          text-[length:var(--font-heading)]
          font-bold
          text-[var(--on-surface)]
        "
      >
        原物料進銷存
      </h1>

      <p
        class="
          mt-1
          text-[length:var(--font-body)]
          text-[var(--on-surface-variant)]
        "
      >
        原物料庫存、異動紀錄與相關作業管理
      </p>
    </div>


    <!-- 切換按鈕 -->
    <PageTabs
      :tabs="inventoryTabs"
      :model-value="activeTab"
      @change="activeTab = $event"
    />


    <!-- ======================== -->
    <!-- 庫存總覽 -->
    <!-- ======================== -->

    <InventoryManagement
      v-if="activeTab === 'inventory'"
    />


    <!-- ======================== -->
    <!-- 庫存異動紀錄 -->
    <!-- ======================== -->

    <InventoryLogManagement
      v-else-if="activeTab === 'logs'"
    />

<MaterialIssueManagement
v-else-if="activeTab === 'MaterialIssue'"
/>






  </div>
</template>


<script setup>
import { ref } from "vue";

import {
  Boxes,
  History,
} from "lucide-vue-next";

import PageTabs from "@/component/子元件/PageTabs.vue";

import InventoryManagement from "@/view/InventoryManagement.vue";

import InventoryLogManagement from "@/view/InventoryLogManagement.vue";
import MaterialIssueManagement from "./MaterialIssueManagement.vue";


const activeTab = ref("inventory");


const inventoryTabs = [
  {
    value: "inventory",
    label: "庫存總覽",
    icon: Boxes,
  },

  {
    value: "logs",
    label: "庫存異動紀錄",
    icon: History,
  },

  {
    value: "MaterialIssue",
    label: "當日領料",
    icon: History,
  },

];
</script>