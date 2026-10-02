<template>
  <ModalWrapper
    :is-open="isOpen"
    title="新增原物料"
    subtitle="建立原物料主檔資料"
    max-width="xl"
    :icon="PackagePlus"
    @close="requestClose"
  >
    <form id="add-material-form" class="space-y-4" @submit.prevent="handleSubmit">
      <div
        v-if="errorMessage"
        class="rounded-xl border border-[var(--error)]/40 bg-[var(--error)]/10 px-4 py-3 text-sm font-semibold text-[var(--error)]"
        role="alert"
      >
        {{ errorMessage }}
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="space-y-1">
          <span class="block text-xs font-bold text-[var(--on-surface)]">
            原物料名稱 <span class="text-[var(--error)]">*</span>
          </span>
          <input v-model.trim="form.name" type="text" maxlength="100" required class="input-field" placeholder="例如：阿薩姆紅茶原葉" />
        </label>

        <label class="space-y-1">
          <span class="block text-xs font-bold text-[var(--on-surface)]">
            物料代碼 <span class="text-[var(--error)]">*</span>
          </span>
          <input v-model.trim="form.code" type="text" maxlength="50" required class="input-field font-mono" placeholder="例如：TEA-001" />
        </label>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="space-y-1">
          <span class="block text-xs font-bold text-[var(--on-surface)]">
            成本模式 <span class="text-[var(--error)]">*</span>
          </span>
          <select v-model="form.costMode" required class="input-field">
            <option value="DIRECT">直接輸入</option>
            <option value="CONVERSION">採購換算</option>
          </select>
        </label>

        <label class="space-y-1">
          <span class="block text-xs font-bold text-[var(--on-surface)]">
            BOM 單位 <span class="text-[var(--error)]">*</span>
          </span>
          <select v-model="form.unit" required class="input-field">
            <option v-for="option in unitOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
      </div>

      <section class="space-y-4 rounded-xl border border-[var(--outline)] bg-[var(--surface-container-high)] p-4">
        <div class="flex items-center gap-2 text-xs font-bold text-[var(--primary)]">
          <Layers class="h-4 w-4" />
          <span>庫存基準與成本</span>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="space-y-1">
            <span class="block text-xs font-semibold text-[var(--on-surface-variant)]">安全庫存</span>
            <div class="relative">
              <input v-model.number="form.safetyStock" type="number" step="any" min="0" required class="input-field no-number-spinner pr-14" />
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--on-surface-variant)]">{{ form.unit }}</span>
            </div>
          </label>

          <label v-if="form.costMode === 'DIRECT'" class="space-y-1">
            <span class="block text-xs font-semibold text-[var(--on-surface-variant)]">原物料成本（NT$）</span>
            <div class="relative">
              <input v-model.number="form.cost" type="number" step="any" min="0" required class="input-field no-number-spinner pr-16" />
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--on-surface-variant)]">/ {{ form.unit }}</span>
            </div>
          </label>
        </div>

        <div v-if="form.costMode === 'CONVERSION'" class="space-y-4">
          <label class="space-y-1">
            <span class="block text-xs font-semibold text-[var(--on-surface-variant)]">
              採購單位 <span class="text-[var(--error)]">*</span>
            </span>
            <select v-model="form.purchaseUnit" required class="input-field">
              <option v-for="option in unitOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="space-y-1">
              <span class="block text-xs font-bold text-[var(--on-surface)]">
                一個採購單位可換算數量 <span class="text-[var(--error)]">*</span>
              </span>
              <input v-model.number="form.conversionQuantity" type="number" step="any" min="0.0001" required class="input-field no-number-spinner font-mono" placeholder="例如：1850" />
              <span class="block text-xs text-[var(--on-surface-variant)]">例如：一瓶牛奶等於 1850 ml，就輸入 1850。</span>
            </label>

            <label class="space-y-1">
              <span class="block text-xs font-bold text-[var(--on-surface)]">
                採購價格 <span class="text-[var(--error)]">*</span>
              </span>
              <input v-model.number="form.purchaseCost" type="number" step="any" min="0" required class="input-field no-number-spinner font-mono" placeholder="例如：95" />
              <span class="block text-xs text-[var(--on-surface-variant)]">換算成本：NT$ {{ unitCostPreview }} / {{ form.unit }}</span>
            </label>
          </div>
        </div>
      </section>
    </form>

    <template #footer>
      <button type="button" class="btn-secondary text-xs" :disabled="saving" @click="requestClose">取消</button>
      <button
        type="submit"
        form="add-material-form"
        class="btn-primary flex items-center gap-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="saving"
      >
        <Check class="h-4 w-4" />
        <span>{{ saving ? "建立中..." : "確認建立原物料" }}</span>
      </button>
    </template>
  </ModalWrapper>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { Check, Layers, PackagePlus } from "lucide-vue-next";

import ModalWrapper from "../子元件/ModalWrapper.vue";
import httpClient from "@/service/httpClient";

const props = defineProps({
  isOpen: { type: Boolean, required: true },
});

const emit = defineEmits(["close", "success"]);

const unitOptions = [
  { value: "kg", label: "公斤 (kg)" },
  { value: "g", label: "公克 (g)" },
  { value: "L", label: "公升 (L)" },
  { value: "ml", label: "毫升 (ml)" },
  { value: "瓶", label: "瓶" },
  { value: "包", label: "包" },
  { value: "桶", label: "桶" },
  { value: "個", label: "個" },
  { value: "箱", label: "箱" },
  { value: "支", label: "支" },
];

const createInitialForm = () => ({
  name: "",
  code: "",
  unit: "kg",
  costMode: "DIRECT",
  safetyStock: 0,
  cost: 0,
  purchaseUnit: "kg",
  conversionQuantity: null,
  purchaseCost: null,
});

const form = reactive(createInitialForm());
const saving = ref(false);
const errorMessage = ref("");

const resetForm = () => {
  Object.assign(form, createInitialForm());
  saving.value = false;
  errorMessage.value = "";
};

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) resetForm();
});

watch(() => form.costMode, () => {
  errorMessage.value = "";
});

const unitCostPreview = computed(() => {
  const quantity = Number(form.conversionQuantity);
  const purchaseCost = Number(form.purchaseCost);
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(purchaseCost)) return "0";
  return (purchaseCost / quantity).toFixed(4).replace(/\.?0+$/, "");
});

const getApiError = (error) => {
  const data = error.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return data?.message || data?.detail || "新增原物料失敗，請確認資料後再試一次";
};

const validateForm = () => {
  if (!form.name.trim() || !form.code.trim()) return "請填寫原物料名稱與物料代碼";
  if (!Number.isFinite(Number(form.safetyStock)) || Number(form.safetyStock) < 0) return "安全庫存不可小於 0";

  if (form.costMode === "DIRECT") {
    if (!Number.isFinite(Number(form.cost)) || Number(form.cost) < 0) return "原物料成本不可小於 0";
    return "";
  }

  if (!form.purchaseUnit) return "請選擇採購單位";
  if (!Number.isFinite(Number(form.conversionQuantity)) || Number(form.conversionQuantity) <= 0) return "換算數量必須大於 0";
  if (!Number.isFinite(Number(form.purchaseCost)) || Number(form.purchaseCost) < 0) return "採購價格不可小於 0";
  return "";
};

const handleSubmit = async () => {
  if (saving.value) return;

  errorMessage.value = validateForm();
  if (errorMessage.value) return;

  const payload = {
    code: form.code.trim(),
    name: form.name.trim(),
    unit: form.unit,
    costMode: form.costMode,
    safetyStock: Number(form.safetyStock),
    ...(form.costMode === "DIRECT"
      ? { cost: Number(form.cost) }
      : {
          purchaseUnit: form.purchaseUnit,
          conversionQuantity: Number(form.conversionQuantity),
          purchaseCost: Number(form.purchaseCost),
        }),
  };

  saving.value = true;
  try {
    const response = await httpClient.post("/api/material/add", payload);
    emit("success", response.data);
    emit("close");
  } catch (error) {
    console.error("新增原物料失敗：", error);
    errorMessage.value = getApiError(error);
  } finally {
    saving.value = false;
  }
};

const requestClose = () => {
  if (!saving.value) emit("close");
};
</script>
