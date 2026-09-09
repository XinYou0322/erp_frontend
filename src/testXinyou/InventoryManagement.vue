<template>
  <div class="space-y-6 pb-12">
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="原物料建檔品項"
        :value="`${inventory.length} 種`"
        growth="即時資料"
        subtitle="目前資料庫中的原物料"
        :icon="Package"
      />

      <MetricCard
        title="效期異常批次"
        :value="`${expiredBatchTotal + expiringSoonBatchTotal} 批`"
        growth="需優先處理"
        :subtitle="`已過期 ${expiredBatchTotal} 批 / 7天內到期 ${expiringSoonBatchTotal} 批`"
        :icon="Clock"
      />

      <MetricCard
        title="總庫存數量"
        :value="totalQuantityText"
        variant="amber"
        growth="所有品項加總"
        subtitle="僅供目前測試"
        :icon="Boxes"
      />

      <MetricCard
        title="在庫物料資產估值"
        :value="`NT$ ${totalStockValue.toLocaleString()}`"
        variant="emerald"
        growth="即時計算"
        subtitle="庫存量 × 成本"
        :icon="DollarSign"
      />
    </div>

    <!-- Toolbar -->
    <div
      class="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div>
        <div class="font-bold text-sm text-gray-800">原物料庫存</div>

        <div class="text-xs text-gray-400 mt-1">
          顯示各原物料所有批次加總後的庫存
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <button
          type="button"
          @click="loadInventory"
          class="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1.5"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>重新整理</span>
        </button>

        <button
          type="button"
          @click="emit('openReport')"
          class="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1.5"
        >
          <FileSpreadsheet class="w-3.5 h-3.5" />
          <span>盤點報表</span>
        </button>

        <button
          type="button"
          @click="inventoryIntakeModalOpen = true"
          class="btn-primary text-xs px-3.5 py-1.5 flex items-center space-x-1.5"
        >
          <PackagePlus class="w-4 h-4" />
          <span>進貨原物料</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="glass-panel rounded-2xl p-8 text-center text-sm text-gray-500"
    >
      正在讀取庫存資料...
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
    >
      {{ errorMessage }}
    </div>

    <!-- Inventory Table -->
    <div
      v-else
      class="glass-panel rounded-2xl border border-white/80 overflow-hidden shadow-sm"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider"
            >
              <th class="py-3 px-4">原物料名稱 / 料號</th>

              <th class="py-3 px-4">現有總存量 / 安全庫存</th>

              <th class="py-3 px-4">庫存狀態</th>

              <th class="py-3 px-4">最近有效日期</th>

              <th class="py-3 px-4">進料成本單價</th>

              <th class="py-3 px-4">庫存估值</th>

              <th class="py-3 px-4 text-right pr-6">操作</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100/80 text-xs">
            <template v-for="item in inventory" :key="item.materialId">
              <!-- 原物料摘要 -->
              <tr class="zebra-row hover:bg-blue-50/40 transition-colors">
                <!-- 名稱 / Code -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-sm text-[#181c23]">
                    {{ item.name }}
                  </div>

                  <div class="text-[11px] text-gray-400 font-mono mt-0.5">
                    {{ item.code }}
                  </div>
                </td>

                <!-- 總庫存 / 安全庫存 -->
                <td class="py-3.5 px-4">
                  <div class="font-mono font-bold text-gray-800">
                    總庫存：
                    {{ item.totalQuantity }}
                    {{ item.unit }}
                  </div>

                  <div class="text-[11px] text-emerald-600 mt-1">
                    可用庫存：
                    {{ item.availableQuantity ?? item.totalQuantity }}
                    {{ item.unit }}
                  </div>

                  <div
                    v-if="Number(item.expiredQuantity) > 0"
                    class="text-[11px] text-red-600 mt-1"
                  >
                    過期庫存：
                    {{ item.expiredQuantity }}
                    {{ item.unit }}
                  </div>

                  <div class="text-[10px] text-gray-400 mt-1">
                    安全庫存：
                    {{ item.safetyStock ?? 0 }}
                    {{ item.unit }}
                  </div>
                </td>
                <!-- 庫存狀態 -->
                <td class="py-3.5 px-4">
                  <span
                    v-if="item.status === 'NORMAL'"
                    class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold"
                  >
                    存量充足
                  </span>

                  <span
                    v-else-if="item.status === 'LOW'"
                    class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold"
                  >
                    偏低需補
                  </span>

                  <span
                    v-else-if="item.status === 'URGENT'"
                    class="px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold"
                  >
                    緊急缺料
                  </span>
                </td>

                <!-- 最近有效日期 -->
                <td class="py-3.5 px-4">
                  <div
                    v-if="item.nearestExpiryDate"
                    class="font-mono text-gray-700"
                  >
                    {{ item.nearestExpiryDate }}
                  </div>

                  <div v-else class="text-gray-400">無有效批次</div>

                  <div
                    v-if="item.expiryStatus === 'EXPIRED'"
                    class="text-[11px] text-red-600 font-bold mt-1"
                  >
                    有 {{ item.expiredBatchCount }} 批已過期
                  </div>

                  <div
                    v-else-if="item.expiryStatus === 'EXPIRING_SOON'"
                    class="text-[11px] text-amber-600 font-bold mt-1"
                  >
                    有 {{ item.expiringSoonBatchCount }} 批 7 天內到期
                  </div>

                  <div v-else class="text-[11px] text-emerald-600 mt-1">
                    效期正常
                  </div>
                </td>

                <!-- 單位成本 -->
                <td class="py-3.5 px-4 font-mono font-bold text-gray-800">
                  NT$ {{ item.cost }}
                  /
                  {{ item.unit }}
                </td>

                <!-- 庫存估值 -->
                <td class="py-3.5 px-4 font-mono text-gray-700">
                  NT$
                  {{ (item.totalQuantity * item.cost).toLocaleString() }}
                </td>

                <!-- 查看批次 -->
                <td class="py-3.5 px-4 text-right pr-6">
                  <button
                    type="button"
                    @click="toggleBatches(item.materialId)"
                    class="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0059bb] font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    {{
                      expandedMaterialId === item.materialId
                        ? "收起批次"
                        : "查看批次"
                    }}
                  </button>
                </td>
              </tr>

              <!-- 批次明細 -->
              <tr v-if="expandedMaterialId === item.materialId">
                <td colspan="7" class="px-6 py-4 bg-blue-50/30">
                  <!-- 批次 Loading -->
                  <div v-if="batchLoading" class="text-xs text-gray-400 py-3">
                    讀取批次資料中...
                  </div>

                  <!-- 沒有批次 -->
                  <div
                    v-else-if="batches.length === 0"
                    class="text-xs text-gray-400 py-3"
                  >
                    此原物料目前沒有批次資料
                  </div>

                  <!-- 批次表格 -->
                  <div
                    v-else
                    class="rounded-xl border border-blue-100 bg-white/80 overflow-hidden"
                  >
                    <div
                      class="px-4 py-3 border-b border-gray-100 font-bold text-xs text-gray-700"
                    >
                      {{ item.name }}－批次明細
                    </div>

                    <table class="w-full text-xs">
                      <thead>
                        <tr class="bg-gray-50/60 text-gray-400">
                          <th class="text-left px-4 py-2">批次 ID</th>

                          <th class="text-left px-4 py-2">剩餘數量</th>

                          <th class="text-left px-4 py-2">有效日期</th>

                          <th class="text-left px-4 py-2">建立時間</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr
                          v-for="batch in batches"
                          :key="batch.inventoryId"
                          class="border-b border-gray-100"
                          :class="{
                            'zero-stock-row': Number(batch.quantity) === 0,
                          }"
                        >
                          <td class="px-4 py-2 font-mono text-gray-700">
                            #{{ batch.inventoryId }}
                          </td>

                          <td
                            class="px-4 py-2 font-mono font-bold text-gray-800"
                          >
                            {{ batch.quantity }}
                            {{ item.unit }}
                          </td>

                          <td class="px-4 py-2">
                            <!-- 沒有效期 -->
                            <span
                              v-if="!batch.expiryDate"
                              class="text-gray-400"
                            >
                              無效期
                            </span>

                            <!-- 已過期 -->
                            <span
                              v-else-if="
                                getExpiryStatus(batch.expiryDate) === 'expired'
                              "
                              class="font-bold"
                              :class="
                                Number(batch.quantity) === 0
                                  ? 'text-gray-400'
                                  : 'text-red-600'
                              "
                            >
                              {{ batch.expiryDate }}
                              （已過期）

                              <button
                                v-if="
                                  getExpiryStatus(batch.expiryDate) ===
                                    'expired' && Number(batch.quantity) > 0
                                "
                                type="button"
                                @click="handleExpireBatch(item, batch)"
                                class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold"
                              >
                                一鍵報廢
                              </button>
                            </span>

                            <!-- 7 天內到期 -->
                            <span
                              v-else-if="
                                getExpiryStatus(batch.expiryDate) === 'urgent'
                              "
                              class="font-bold text-amber-600"
                            >
                              {{ batch.expiryDate }}
                              （7 天內到期）
                            </span>

                            <!-- 正常 -->
                            <span v-else class="text-gray-700">
                              {{ batch.expiryDate }}
                            </span>
                          </td>

                          <td class="px-4 py-2 text-gray-500 font-mono">
                            {{ formatDateTime(batch.createdAt) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>

            <!-- 沒有資料 -->
            <tr v-if="inventory.length === 0">
              <td colspan="7" class="py-12 text-center text-sm text-gray-400">
                目前沒有庫存資料
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <InventoryIntakeModal
      :is-open="inventoryIntakeModalOpen"
      @close="inventoryIntakeModalOpen = false"
      @success="handleInventorySuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

import {
  Package,
  Clock,
  DollarSign,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Boxes,
  PackagePlus,
} from "lucide-vue-next";

import MetricCard from "./components/common/MetricCard.vue";

import httpClient from "@/service/httpClient";
import InventoryIntakeModal from "./components/modals/InventoryIntakeModal.vue";

// ==============================
// 庫存摘要資料
// ==============================

const inventory = ref([]);

// ==============================
// 批次資料
// ==============================

// 目前展開哪一個原物料
const expandedMaterialId = ref(null);

// 目前展開的批次資料
const batches = ref([]);

// 批次載入狀態
const batchLoading = ref(false);

// ==============================
// 頁面狀態
// ==============================

// 整頁資料讀取狀態
const loading = ref(false);

// API 錯誤訊息
const errorMessage = ref("");

// ==============================
// 傳事件給父元件 App.vue
// ==============================

const emit = defineEmits([
  "openReport",
  "openAddMaterial",
  "openInventoryIntake",
]);

const inventoryIntakeModalOpen = ref(false);

const handleInventorySuccess = () => {
  loadInventory();
};

// ==============================
// 取得後端庫存摘要
// ==============================

const loadInventory = () => {
  loading.value = true;
  errorMessage.value = "";

  httpClient
    .get("/api/inventory/summary")

    .then((response) => {
      inventory.value = response.data;

      console.log("後端回傳：", inventory.value);
    })

    .catch((error) => {
      console.error("取得庫存資料失敗：", error);

      errorMessage.value = "取得庫存資料失敗";
    })

    .finally(() => {
      loading.value = false;
    });
};

// ==============================
// 展開 / 收起批次
// ==============================

const toggleBatches = (materialId) => {
  // 已經展開這個原物料 → 收起
  if (expandedMaterialId.value === materialId) {
    expandedMaterialId.value = null;

    batches.value = [];

    return;
  }

  // 設定目前展開的原物料
  expandedMaterialId.value = materialId;

  batchLoading.value = true;

  batches.value = [];

  // 查詢該原物料所有批次
  httpClient
    .get(`/api/inventory/material/${materialId}/batches`)

    .then((response) => {
      batches.value = response.data;

      console.log("批次資料：", batches.value);
    })

    .catch((error) => {
      console.error("取得批次資料失敗：", error);

      batches.value = [];
    })

    .finally(() => {
      batchLoading.value = false;
    });
};
//檢視剩餘日期
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) {
    return "none";
  }

  const today = new Date();
  const expiry = new Date(expiryDate);

  // 清掉時間，只比較日期
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry - today;

  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "expired";
  }

  if (diffDays <= 7) {
    return "urgent";
  }

  return "normal";
};

//修改日期顯示
const formatDateTime = (dateTime) => {
  if (!dateTime) {
    return "無資料";
  }

  const date = new Date(dateTime);

  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
// ==============================
// 有有效期限資料的品項數量
// ==============================

const expiryTrackedCount = computed(() => {
  return inventory.value.filter((item) => item.nearestExpiryDate !== null)
    .length;
});

// ==============================
// 所有庫存數量加總
// ==============================

const totalQuantity = computed(() => {
  return inventory.value.reduce((sum, item) => sum + item.totalQuantity, 0);
});

// KPI 顯示文字
const totalQuantityText = computed(() => {
  return totalQuantity.value.toLocaleString();
});

// ==============================
// 庫存總估值
// ==============================

const totalStockValue = computed(() => {
  return inventory.value.reduce(
    (sum, item) => sum + item.totalQuantity * item.cost,

    0,
  );
});

// ==============================
// 進入頁面時自動取得資料
// ==============================
const expiredBatchTotal = computed(() => {
  return inventory.value.reduce(
    (sum, item) => sum + Number(item.expiredBatchCount || 0),

    0,
  );
});
const handleExpireBatch = (item, batch) => {
  const confirmed = window.confirm(
    `確定要報廢「${item.name}」批次 #${batch.inventoryId} 的全部 ${batch.quantity} ${item.unit} 嗎？`,
  );
  if (!confirmed) {
    return;
  }
  const data = {
    items: [
      {
        inventoryId: batch.inventoryId,
        action: "EXPIRED",
        quantity: Number(batch.quantity),
        note: "批次過期一鍵報廢",
      },
    ],
  };

  httpClient
    .post("/api/inventory-logs/adjustments", data)
    .then(() => {
      loadInventory();

      // 如果目前這個原物料批次是展開狀態，
      // 順便重新抓批次
      loadBatches(item.materialId);
    })
    .catch((error) => {
      console.error("批次報廢失敗：", error);
    });
};
const loadBatches = (materialId) => {
  batchLoading.value = true;

  httpClient
    .get(`/api/inventory/material/${materialId}/batches`)
    .then((response) => {
      batches.value = response.data;
    })
    .finally(() => {
      batchLoading.value = false;
    });
};
const expiringSoonBatchTotal = computed(() => {
  return inventory.value.reduce(
    (sum, item) => sum + Number(item.expiringSoonBatchCount || 0),

    0,
  );
});

onMounted(() => {
  loadInventory();
});
</script>
<style scoped>
.zero-stock-row {
  position: relative;
  color: #9ca3af;
  background-color: #f3f4f6;
  opacity: 0.65;
}

.zero-stock-row::after {
  content: "";
  position: absolute;

  left: 0;
  right: 0;
  top: 50%;

  height: 1px;
  background-color: #9ca3af;

  pointer-events: none;
}
</style>
