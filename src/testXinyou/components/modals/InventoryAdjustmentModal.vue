<template>
  <ModalWrapper
    :is-open="isOpen"
    title="庫存異動批次作業"
    subtitle="一次處理多筆耗損、過期報廢、手動領料與盤點調整"
    max-width="6xl"
    :icon="ClipboardList"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <div
        class="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-100 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <div class="font-bold text-sm text-[#181c23]">庫存異動作業</div>
          <p class="text-xs text-gray-500 mt-1">
            所有數量請輸入正數，系統會依異動類型自動判斷加庫或扣庫。
          </p>
        </div>

        <div class="flex items-center space-x-2 text-xs">
          <span
            class="px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold"
          >
            耗損 / 報廢 / 領料 = 扣庫
          </span>
          <span
            class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold"
          >
            盤盈 = 加庫
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <h4
          class="font-bold text-xs text-gray-700 flex items-center space-x-1.5"
        >
          <Boxes class="w-4 h-4 text-[#0070ea]" />
          <span>異動明細</span>
        </h4>

        <button
          type="button"
          @click="addAdjustmentRow"
          class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0059bb] font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>加入異動項目</span>
        </button>
      </div>

      <div
        v-if="loading"
        class="border border-gray-200/80 rounded-xl bg-white p-6 text-center text-xs text-gray-400"
      >
        正在載入原物料資料...
      </div>

      <div
        v-else
        class="border border-gray-200/80 rounded-xl overflow-hidden bg-white"
      >
        <div class="overflow-x-auto">
          <table
            class="w-full min-w-[1050px] text-left text-xs border-collapse"
          >
            <thead>
              <tr
                class="bg-gray-50 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase"
              >
                <th class="py-2.5 px-3 min-w-[190px]">原物料</th>
                <th class="py-2.5 px-3 min-w-[170px]">庫存批次</th>
                <th class="py-2.5 px-3 min-w-[145px]">異動類型</th>
                <th class="py-2.5 px-3 w-28">數量</th>
                <th class="py-2.5 px-3 w-20">單位</th>
                <th class="py-2.5 px-3 min-w-[190px]">備註 / 原因</th>
                <th class="py-2.5 px-2 w-12 text-center">操作</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(item, idx) in adjustmentItems"
                :key="idx"
                class="hover:bg-blue-50/30 transition-colors"
              >
                <td class="py-2.5 px-3">
                  <select
                    v-model="item.materialId"
                    @change="onMaterialChange(item)"
                    class="input-field py-1 text-xs"
                  >
                    <option value="" disabled>請選擇原物料...</option>
                    <option
                      v-for="material in materials"
                      :key="material.materialId"
                      :value="material.materialId"
                    >
                      {{ material.name }}（{{ material.code }}）
                    </option>
                  </select>
                </td>

                <td class="py-2.5 px-3">
                  <select
                    v-model="item.inventoryId"
                    :disabled="!item.materialId || item.batchLoading"
                    class="input-field py-1 text-xs"
                  >
                    <option value="" disabled>
                      {{
                        item.batchLoading ? "讀取批次中..." : "請選擇批次..."
                      }}
                    </option>
                    <option
                      v-for="batch in item.batches.filter(
                        (batch) => Number(batch.quantity) > 0,
                      )"
                      :key="batch.inventoryId"
                      :value="batch.inventoryId"
                    >
                      #{{ batch.inventoryId }} ｜剩餘 {{ batch.quantity }}
                      {{ item.unit }} ｜{{ batch.expiryDate || "無效期" }}
                    </option>
                  </select>
                </td>

                <td class="py-2.5 px-3">
                  <select
                    v-model="item.action"
                    class="input-field py-1 text-xs"
                  >
                    <option
                      v-for="action in actionOptions"
                      :key="action.value"
                      :value="action.value"
                    >
                      {{ action.label }}
                    </option>
                  </select>
                </td>

                <td class="py-2.5 px-3">
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="0"
                    step="any"
                    class="input-field no-number-spinner py-1 text-xs font-mono"
                  />
                </td>

                <td class="py-2.5 px-3">
                  <span
                    class="px-2 py-1 bg-gray-100 rounded text-gray-600 font-mono"
                  >
                    {{ item.unit || "-" }}
                  </span>
                </td>

                <td class="py-2.5 px-3">
                  <input
                    v-model="item.note"
                    type="text"
                    placeholder="例如：煮製失敗、到期報廢、盤點短少..."
                    class="input-field py-1 text-xs"
                  />
                </td>

                <td class="py-2.5 px-2 text-center">
                  <button
                    type="button"
                    @click="removeAdjustmentRow(idx)"
                    class="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="刪除此筆"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>

              <tr v-if="adjustmentItems.length === 0">
                <td colspan="7" class="py-8 text-center text-gray-400 text-xs">
                  尚未加入異動項目，請點擊右上角「加入異動項目」。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600"
      >
        {{ errorMessage }}
      </div>

      <div
        class="p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-xs text-gray-500 flex items-center justify-between gap-3"
      >
        <span>
          儲存時會一次送出所有異動；後端使用
          Transaction，任一筆失敗時整批不會寫入。
        </span>
        <span class="font-bold text-[#0059bb] whitespace-nowrap"
          >批次異動模式</span
        >
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        class="btn-secondary text-xs"
      >
        取消
      </button>

      <button
        type="button"
        :disabled="saving"
        @click="handleSave"
        class="btn-primary text-xs flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save class="w-4 h-4" />
        <span>{{ saving ? "儲存中..." : "儲存全部異動" }}</span>
      </button>
    </template>
  </ModalWrapper>
</template>

<script setup>
import { ref, watch } from "vue";
import { ClipboardList, Boxes, Plus, Trash2, Save } from "lucide-vue-next";

import ModalWrapper from "../common/ModalWrapper.vue";
import httpClient from "@/service/httpClient";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close", "success"]);

const materials = ref([]);
const adjustmentItems = ref([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");

const actionOptions = [
  { value: "WASTE", label: "耗損 / 報廢" },
  { value: "EXPIRED", label: "過期報廢" },
  { value: "MANUAL_USE", label: "手動領料" },
  { value: "ADJUSTMENT_IN", label: "盤點調整－盤盈" },
  { value: "ADJUSTMENT_OUT", label: "盤點調整－盤虧" },
];

const loadMaterials = () => {
  loading.value = true;
  errorMessage.value = "";

  httpClient
    .get("/api/inventory/summary")
    .then((response) => {
      materials.value = response.data;
    })
    .catch((error) => {
      console.error("取得庫存摘要失敗：", error);
      errorMessage.value = "取得原物料庫存資料失敗";
    })
    .finally(() => {
      loading.value = false;
    });
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    adjustmentItems.value = [];
    errorMessage.value = "";

    loadMaterials();
    addAdjustmentRow();
  },
);

const addAdjustmentRow = () => {
  adjustmentItems.value.push({
    materialId: "",
    inventoryId: "",
    action: "WASTE",
    quantity: 1,
    unit: "",
    note: "",
    batches: [],
    batchLoading: false,
  });
};

const removeAdjustmentRow = (idx) => {
  adjustmentItems.value.splice(idx, 1);
};

const onMaterialChange = (item) => {
  const material = materials.value.find(
    (material) => material.materialId === item.materialId,
  );

  if (!material) {
    item.unit = "";
    item.inventoryId = "";
    item.batches = [];
    return;
  }

  item.unit = material.unit;
  item.inventoryId = "";
  item.batches = [];
  item.batchLoading = true;

  httpClient
    .get(`/api/inventory/material/${item.materialId}/batches`)
    .then((response) => {
      item.batches = response.data;
    })
    .catch((error) => {
      console.error(`取得原物料 ${item.materialId} 批次失敗：`, error);
      item.batches = [];
    })
    .finally(() => {
      item.batchLoading = false;
    });
};

const handleSave = () => {
  errorMessage.value = "";
const needNoteActions = [
  'WASTE',
  'EXPIRED',
  'ADJUSTMENT_OUT'
]

const missingNoteItem =
  adjustmentItems.value.find(
    item =>
      needNoteActions.includes(item.action)
      &&
      !item.note.trim()
  )

  
if (missingNoteItem) {

  errorMessage.value =
    '耗損、過期報廢與盤點盤虧必須填寫原因'

  return
}

const seen = new Set()

const duplicateItem =
  adjustmentItems.value.find(item => {

    const key =
      `${item.inventoryId}-${item.action}`

    if (seen.has(key)) {
      return true
    }

    seen.add(key)

    return false
  })

if (duplicateItem) {

  errorMessage.value =
    '同一庫存批次不能重複加入相同異動類型'

  return
}
  if (adjustmentItems.value.length === 0) {
    errorMessage.value = "請至少加入一筆庫存異動";
    return;
  }

  const invalidItem = adjustmentItems.value.find(
    (item) => !item.inventoryId || !item.action || Number(item.quantity) <= 0,
  );

  if (invalidItem) {
    errorMessage.value = "請確認每一筆都有選擇批次、異動類型，且數量必須大於 0";
    return;
  }

  const data = {
    items: adjustmentItems.value.map((item) => ({
      inventoryId: Number(item.inventoryId),
      action: item.action,
      quantity: Number(item.quantity),
      note: item.note.trim(),
    })),
  };

  console.log("準備送出的庫存異動：", data);

  saving.value = true;

  httpClient
    .post("/api/inventory-logs/adjustments", data)
    .then(() => {
      emit("success");
      emit("close");
    })
    .catch((error) => {
      console.error("庫存異動儲存失敗：", error);

      errorMessage.value = error.response?.data?.message || "庫存異動儲存失敗";
    })
    .finally(() => {
      saving.value = false;
    });
};
</script>
