<template>
  <div class="space-y-6 px-6 pt-6 pb-12">

    <!-- 頁籤與進料模式整合在共用導覽列 -->
    <HeadNavBar :show-total="false" :show-add="false">
      <template #navigation>
        <PageTabs
          embedded
          :tabs="inventoryTabs"
          :model-value="activeTab"
          @change="changeInventoryTab"
        />
      </template>

      <template #actions>
        <button
          v-if="showFilterToggle"
          type="button"
          class="head-navbar__button"
          :class="{ 'is-active': filtersExpanded }"
          :aria-expanded="filtersExpanded"
          @click="filtersExpanded = !filtersExpanded"
        >
          <SlidersHorizontal class="h-4 w-4" />
          <span>篩選條件</span>
          <ChevronUp v-if="filtersExpanded" class="h-4 w-4" />
          <ChevronDown v-else class="h-4 w-4" />
        </button>

        <button
          type="button"
          class="btn-secondary px-3 py-1.5 text-[length:var(--font-body)]"
          @click="refreshActiveView"
        >
          <RefreshCw class="h-4 w-4" />
          <span>重新整理</span>
        </button>

        <button
          type="button"
          class="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[length:var(--font-body)]"
          @click="openActivePrimaryAction"
        >
          <Plus class="h-4 w-4" />
          <span>{{ activePrimaryActionLabel }}</span>
        </button>
      </template>
    </HeadNavBar>

    <p v-if="settingErrorMessage" class="text-xs text-[var(--error)]">
      {{ settingErrorMessage }}
    </p>


    <!-- ======================== -->
    <!-- 庫存總覽 -->
    <!-- ======================== -->

    <InventoryManagement
      v-if="activeTab === 'inventory'"
      ref="inventoryViewRef"
      :purchase-order-receiving-enabled="purchaseOrderReceivingEnabled"
      :filters-expanded="filtersExpanded"
    />


    <!-- ======================== -->
    <!-- 庫存異動紀錄 -->
    <!-- ======================== -->

    <InventoryLogManagement
      v-else-if="activeTab === 'logs'"
      ref="inventoryLogViewRef"
      :filters-expanded="filtersExpanded"
    />

<MaterialIssueManagement
v-else-if="activeTab === 'MaterialIssue'"
ref="materialIssueViewRef"
:filters-expanded="filtersExpanded"
/>
<MaterialManagement
v-else-if="activeTab === 'Material'"
ref="materialViewRef"
:filters-expanded="filtersExpanded"
/>






  </div>
</template>


<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import {
  Boxes,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-vue-next";

import PageTabs from "@/component/子元件/PageTabs.vue";
import HeadNavBar from "@/component/子元件/HeadNavbar.vue";

import InventoryManagement from "@/view/InventoryManagement.vue";

import InventoryLogManagement from "@/view/InventoryLogManagement.vue";
import MaterialIssueManagement from "./MaterialIssueManagement.vue";
import MaterialManagement from "./MaterialManagement.vue";
import { useSystemSettingStore } from "@/stores/systemSetting.store";

const activeTab = ref("inventory");
const filtersExpanded = ref(false);
const materialViewRef = ref(null);
const inventoryViewRef = ref(null);
const inventoryLogViewRef = ref(null);
const materialIssueViewRef = ref(null);
const showFilterToggle = computed(() =>
  ["Material", "inventory", "logs", "MaterialIssue"].includes(activeTab.value),
);

function changeInventoryTab(tab) {
  activeTab.value = tab;
  filtersExpanded.value = false;
}

const activePrimaryActionLabel = computed(() => {
  if (activeTab.value === "Material") return "新增原物料";
  if (activeTab.value === "inventory") {
    return purchaseOrderReceivingEnabled.value ? "採購單收貨" : "進貨原物料";
  }
  if (activeTab.value === "logs") return "庫存調整";
  return "新增領料";
});

function getActiveView() {
  if (activeTab.value === "Material") return materialViewRef.value;
  if (activeTab.value === "inventory") return inventoryViewRef.value;
  if (activeTab.value === "logs") return inventoryLogViewRef.value;
  return materialIssueViewRef.value;
}

function refreshActiveView() {
  getActiveView()?.refresh?.();
}

function openActivePrimaryAction() {
  getActiveView()?.openPrimaryAction?.();
}
const systemSettingStore = useSystemSettingStore();
const {
  purchaseOrderReceivingEnabled,
  retailModeEnabled,
  errorMessage: settingErrorMessage,
} = storeToRefs(systemSettingStore);

onMounted(async () => {
  const results = await Promise.allSettled([
    systemSettingStore.loadReceivingSetting(),
    systemSettingStore.loadRetailModeSetting(),
  ]);
  if (results.some((result) => result.status === "rejected")) {
    console.error("讀取庫存管理模式失敗");
  }
});


const allInventoryTabs = [
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

const inventoryTabs = computed(() =>
  retailModeEnabled.value
    ? allInventoryTabs.filter(
        (tab) => tab.value !== "Material" && tab.value !== "MaterialIssue",
      )
    : allInventoryTabs,
);

watch(retailModeEnabled, (enabled) => {
  if (
    enabled &&
    (activeTab.value === "Material" || activeTab.value === "MaterialIssue")
  ) {
    changeInventoryTab("inventory");
  }
});
</script>
