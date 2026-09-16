<template>
  <ModalWrapper
    :is-open="isOpen"
    title="進貨批次作業"
    subtitle="一次登錄多筆原物料進貨數量與有效期限"
    max-width="6xl"
    :icon="PackagePlus"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <!-- =========================
           說明區
           ========================= -->
      <div
        class="p-4 rounded-xl bg-[var(--surface-container-high)] border border-[var(--outline)] flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <div class="font-bold text-sm text-[var(--on-surface)]">
            原物料入庫作業
          </div>

          <p class="text-xs text-[var(--on-surface-variant)] mt-1">
            可一次加入多筆原物料，填寫本次進貨數量與有效期限。
          </p>
        </div>

        <span
          class="px-2.5 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 font-bold text-xs"
        >
          進貨 = 增加庫存
        </span>
      </div>

      <!-- =========================
           明細標題
           ========================= -->
      <div class="flex items-center justify-between">
        <h4
          class="font-bold text-xs text-[var(--on-surface)] flex items-center space-x-1.5"
        >
          <Boxes class="w-4 h-4 text-[var(--primary)]" />

          <span> 進貨明細 </span>
        </h4>

        <!-- 新增一列 -->
        <button
          type="button"
          @click="addIntakeRow"
          class="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />

          <span> 加入進貨項目 </span>
        </button>
      </div>

      <!-- =========================
           Table
           ========================= -->
      <div
        class="border border-[var(--outline)] rounded-xl overflow-hidden bg-[var(--surface-container)]"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px] text-left text-xs border-collapse">
            <!-- 表頭 -->
            <thead>
              <tr
                class="bg-[var(--surface-container-high)] border-b border-[var(--outline)] text-[11px] font-bold text-[var(--on-surface-variant)] uppercase"
              >
                <th class="py-2.5 px-3 min-w-[220px]">原物料</th>

                <th class="py-2.5 px-3 w-40">進貨數量</th>

                <th class="py-2.5 px-3 w-24">單位</th>
                <th   class="py-2.5 px-3 w-24">換算後單位</th>
                <th class="py-2.5 px-3 min-w-[180px]">有效期限</th>

                <th class="py-2.5 px-2 w-12 text-center">操作</th>
              </tr>
            </thead>

            <!-- =========================
                 明細
                 ========================= -->
            <tbody class="divide-y divide-[var(--outline-variant)]">
              <tr
                v-for="(item, idx) in intakeItems"
                :key="idx"
                class="hover:bg-[var(--surface-container-high)] transition-colors"
              >
                <!-- 原物料 -->
                <td class="py-2.5 px-3">
                  <select
                    v-model="item.materialId"
                    @change="onMaterialChange(item)"
                    class="input-field py-1 text-xs"
                  >
                    <option value="" disabled>請選擇原物料...</option>

                    <option
                      v-for="material in materials"
                      :key="material.id"
                      :value="material.id"
                    >
                      {{ material.name }}
                      （{{ material.code }}）
                    </option>
                  </select>
                </td>

                <!-- 進貨數量 -->
                <td class="py-2.5 px-3">
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="0.0001"
                    step="any"
                    class="input-field no-number-spinner py-1 text-xs font-data-mono"
                  />
                </td>

                <!-- 單位 -->
                <td class="py-2.5 px-3">
                  <span
                    class="px-2 py-1 bg-[var(--surface-container-highest)] rounded text-[var(--on-surface-variant)] font-data-mono"
                  >
                    {{
                      item.costMode === "CONVERSION"
                        ? item.purchaseUnit 
                        : item.unit
                        
                    }} 
                  </span>
                 <div
    v-if="item.costMode === 'CONVERSION'"
    class="mt-1 text-[10px] text-[var(--on-surface-variant)]"
  >
    1 {{ item.purchaseUnit }}
    =
    {{ item.conversionQuantity }} {{ item.unit }}
  </div>



  
                </td>

<td class="py-2.5 px-3">

  <!-- CONVERSION -->
  <span v-if="item.costMode === 'CONVERSION'">
    {{
      Number(item.quantity || 0) *
      Number(item.conversionQuantity || 0)
    }}
    {{ item.unit }}
  </span>

  <!-- DIRECT -->
  <span v-else>
    {{ item.quantity || 0 }}
    {{ item.unit }}
  </span>

</td>


                <!-- 有效期限 -->
                <td class="py-2.5 px-3">
                  <input
                    v-model="item.expiryDate"
                    type="date"
                    class="input-field py-1 text-xs font-data-mono"
                  />
                </td>

                <!-- 刪除 -->
                <td class="py-2.5 px-2 text-center">
                  <button
                    type="button"
                    @click="removeIntakeRow(idx)"
                    class="p-1 text-[var(--on-surface-variant)] hover:text-[var(--error)] transition-colors cursor-pointer"
                    title="刪除此筆"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>

              <!-- 沒有資料 -->
              <tr v-if="intakeItems.length === 0">
                <td
                  colspan="5"
                  class="py-8 text-center text-[var(--on-surface-variant)] text-xs"
                >
                  尚未加入進貨項目，請點擊右上角「加入進貨項目」。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- =========================
           錯誤訊息
           ========================= -->
      <div
        v-if="errorMessage"
        class="rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/10 p-3 text-xs text-[var(--error)]"
      >
        {{ errorMessage }}
      </div>

      <!-- 說明 -->
      <div
        class="p-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline)] text-xs text-[var(--on-surface-variant)] flex items-center justify-between gap-3"
      >
        <span> 每一列代表一筆新的原物料進貨批次。 </span>

        <span class="font-bold text-[var(--primary)] whitespace-nowrap">
          多筆入庫模式
        </span>
      </div>
    </div>

    <!-- =========================
         Footer
         ========================= -->
    <template #footer="{ close }">
      <button type="button" @click="close" class="btn-secondary text-xs">
        取消
      </button>

      <button
        type="button"
        :disabled="saving"
        @click="handleSubmit"
        class="btn-primary text-xs flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save class="w-4 h-4" />

        <span>
          {{ saving ? "入庫中..." : "確認全部入庫" }}
        </span>
      </button>
    </template>
  </ModalWrapper>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

import { PackagePlus, Boxes, Plus, Trash2, Save } from "lucide-vue-next";

import ModalWrapper from "../子元件/ModalWrapper.vue";

import httpClient from "@/service/httpClient";

// ==============================
// Props / Emits
// ==============================

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close", "success"]);

// ==============================
// 資料
// ==============================

const materials = ref([]);

const intakeItems = ref([]);

const saving = ref(false);

const errorMessage = ref("");

// ==============================
// 取得原物料
// ==============================

const loadMaterials = () => {
  httpClient
    .get("/api/material")

    .then((response) => {
      materials.value = response.data;
    })

    .catch((error) => {
      console.error("取得原物料失敗：", error);

      errorMessage.value = "取得原物料資料失敗";
    });
};

// ==============================
// 新增一列
// ==============================

const addIntakeRow = () => {
  intakeItems.value.push({
    materialId: "",

    quantity: 1,

    unit: "",

    expiryDate: "",
  });
};

// ==============================
// 刪除一列
// ==============================

const removeIntakeRow = (idx) => {
  intakeItems.value.splice(idx, 1);
};

// ==============================
// 原物料改變
// ==============================

const onMaterialChange = (item) => {
  const material = materials.value.find(
    (material) => material.id === item.materialId,
  );

  if (!material) {
    item.unit = "";

    return;
  }

  item.unit = material.unit;
  item.costMode = material.costMode;
  item.purchaseUnit = material.purchaseUnit;
  item.conversionQuantity = material.conversionQuantity;
};











// ==============================
// 每次開啟 Modal
// ==============================






watch(
  () => props.isOpen,

  (isOpen) => {
    if (!isOpen) {
      return;
    }

    intakeItems.value = [];

    errorMessage.value = "";

    addIntakeRow();
  },
);

// ==============================
// 儲存
// ==============================

const handleSubmit = () => {

  errorMessage.value = "";

  // ==========================
  // 1. 至少要有一筆
  // ==========================

  if (intakeItems.value.length === 0) {

    errorMessage.value =
      "請至少加入一筆進貨項目";

    return;
  }


  // ==========================
  // 2. 檢查資料
  // ==========================

  const invalidItem =
    intakeItems.value.find(
      (item) =>
        !item.materialId ||
        Number(item.quantity) <= 0
    );

  if (invalidItem) {

    errorMessage.value =
      "請確認每一筆都有選擇原物料，且進貨數量必須大於 0";

    return;
  }


  // ==========================
  // 3. 整理成後端 DTO 要的格式
  // ==========================

  const items =
    intakeItems.value.map((item) => {

      return {

        materialId:
          Number(item.materialId),

        quantity:
          Number(item.quantity),

        expiryDate:
          item.expiryDate || null

      };

    });


  // ==========================
  // 4. 包成 InventoryBatchRequestDTO
  // ==========================

  const data = {
    items: items
  };


  console.log(
    "準備送出的批次進貨資料：",
    data
  );


  // ==========================
  // 5. 呼叫批次 API
  // ==========================

  saving.value = true;

  httpClient
    .post(
      "/api/inventory/batch",
      data
    )

    .then((response) => {

      console.log(
        "批次進貨成功：",
        response.data
      );

      emit("success");

      emit("close");

    })

    .catch((error) => {

      console.error(
        "批次進貨失敗：",
        error
      );

      errorMessage.value =
        error.response?.data?.message ||
        "批次進貨資料儲存失敗";

    })

    .finally(() => {

      saving.value = false;

    });
};

// ==============================
// 元件載入
// ==============================

onMounted(() => {
  loadMaterials();
});
</script>
