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


    <!-- 頁籤與進料模式 -->
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <PageTabs
        :tabs="inventoryTabs"
        :model-value="activeTab"
        @change="activeTab = $event"
      />

      <div class="flex flex-col items-start gap-1 lg:items-end">
        <div class="flex items-center gap-3 rounded-xl border border-[var(--outline)] bg-[var(--surface-container)] px-3 py-2">
          <div>
            <div class="text-xs font-bold text-[var(--on-surface)]">進料模式</div>
            <div class="text-[10px] text-[var(--on-surface-variant)]">
              {{ purchaseOrderReceivingEnabled ? "需依採購單收貨" : "可直接選擇原物料" }}
            </div>
          </div>

          <button
            type="button"
            role="switch"
            :aria-checked="purchaseOrderReceivingEnabled"
            :disabled="settingLoading || settingSaving"
            class="relative h-7 w-14 rounded-full border transition-colors disabled:cursor-wait disabled:opacity-60"
            :class="purchaseOrderReceivingEnabled
              ? 'border-[var(--primary)] bg-[var(--primary)]'
              : 'border-[var(--outline)] bg-[var(--surface-container-highest)]'"
            title="切換一般進貨與採購單進貨"
            @click="toggleReceivingMode"
          >
            <span
              class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
              :class="purchaseOrderReceivingEnabled ? 'left-7' : 'left-1'"
            />
          </button>

          <span class="min-w-16 text-xs font-bold text-[var(--primary)]">
            {{ settingLoading ? "讀取中" : purchaseOrderReceivingEnabled ? "採購單" : "一般" }}
          </span>
        </div>

        <p v-if="settingErrorMessage" class="text-xs text-[var(--error)]">
          {{ settingErrorMessage }}
        </p>
      </div>
    </div>


    <!-- ======================== -->
    <!-- 庫存總覽 -->
    <!-- ======================== -->

    <InventoryManagement
      v-if="activeTab === 'inventory'"
      :purchase-order-receiving-enabled="purchaseOrderReceivingEnabled"
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
<MaterialManagement
v-else-if="activeTab === 'Material'"
/>






  </div>
</template>


<script setup>
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";

import {
  Boxes,
  History,
} from "lucide-vue-next";

import PageTabs from "@/component/子元件/PageTabs.vue";

import InventoryManagement from "@/view/InventoryManagement.vue";

import InventoryLogManagement from "@/view/InventoryLogManagement.vue";
import MaterialIssueManagement from "./MaterialIssueManagement.vue";
import MaterialManagement from "./MaterialManagement.vue";
import { useSystemSettingStore } from "@/stores/systemSetting.store";

const activeTab = ref("inventory");
const systemSettingStore = useSystemSettingStore();
const {
  purchaseOrderReceivingEnabled,
  loading: settingLoading,
  saving: settingSaving,
  errorMessage: settingErrorMessage,
} = storeToRefs(systemSettingStore);

async function toggleReceivingMode() {
  try {
    await systemSettingStore.updatePurchaseOrderReceivingEnabled(
      !purchaseOrderReceivingEnabled.value,
    );
  } catch (error) {
    console.error("切換進料模式失敗：", error);
  }
}

onMounted(async () => {
  try {
    await systemSettingStore.loadReceivingSetting();
  } catch (error) {
    console.error("讀取進料模式失敗：", error);
  }
});


const inventoryTabs = [
  {
    value: "Material",
    label: "原物料主檔",
    icon: Boxes,
  },
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
