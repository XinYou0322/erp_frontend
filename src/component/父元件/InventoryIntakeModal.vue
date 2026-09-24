<template>
  <ModalWrapper
    :is-open="isOpen"
    :title="purchaseOrderMode ? '採購單收貨' : '進貨批次作業'"
    :subtitle="purchaseOrderMode ? '選擇可收貨採購單，確認明細後整單入庫' : '一次登錄多筆原物料進貨數量與有效期限'"
    max-width="6xl"
    :icon="PackagePlus"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--outline)] bg-[var(--surface-container-high)] p-4">
        <div>
          <div class="text-sm font-bold text-[var(--on-surface)]">
            {{ purchaseOrderMode ? "依採購單入庫" : "原物料入庫作業" }}
          </div>
          <p class="mt-1 text-xs text-[var(--on-surface-variant)]">
            {{ purchaseOrderMode ? "採購數量由核准後的採購單帶入，送出後整張採購單會標記為已收貨。" : "可一次加入多筆原物料，填寫本次進貨數量與有效期限。" }}
          </p>
        </div>
        <span class="rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/15 px-2.5 py-1 text-xs font-bold text-[var(--primary)]">
          {{ purchaseOrderMode ? "採購單模式" : "一般進貨模式" }}
        </span>
      </div>

      <div v-if="purchaseOrderMode" class="space-y-4">
        <div>
          <label class="mb-1.5 block text-xs font-bold text-[var(--on-surface)]">採購單號＋原物料名稱＋預計到貨日期</label>
          <select
            v-model="selectedPurchaseOrderId"
            :disabled="loadingReceivableOrders"
            class="input-field py-2 text-xs"
            @change="selectPurchaseOrder"
          >
            <option value="" disabled>
              {{ loadingReceivableOrders ? "讀取可收貨採購單中..." : "請選擇可收貨採購單..." }}
            </option>
            <option v-for="order in receivableOrders" :key="order.id" :value="order.id">
              {{ formatPurchaseOrderOption(order) }}
            </option>
          </select>
          <p v-if="!loadingReceivableOrders && receivableOrders.length === 0" class="mt-2 text-xs text-[var(--on-surface-variant)]">
            目前沒有狀態為已核准或已下單的可收貨採購單。
          </p>
        </div>

        <div v-if="selectedPurchaseOrder" class="grid gap-3 rounded-xl border border-[var(--outline)] bg-[var(--surface-container-low)] p-3 text-xs sm:grid-cols-3">
          <div><span class="text-[var(--on-surface-variant)]">採購單號</span><div class="mt-1 font-bold">{{ selectedPurchaseOrder.orderNumber }}</div></div>
          <div><span class="text-[var(--on-surface-variant)]">供應商</span><div class="mt-1 font-bold">{{ selectedPurchaseOrder.supplierName }}</div></div>
          <div><span class="text-[var(--on-surface-variant)]">預計到貨日</span><div class="mt-1 font-bold">{{ selectedPurchaseOrder.expectedDeliveryDate }}</div></div>
        </div>

        <div v-if="selectedPurchaseOrder" class="overflow-hidden rounded-xl border border-[var(--outline)] bg-[var(--surface-container)]">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead>
                <tr class="border-b border-[var(--outline)] bg-[var(--surface-container-high)] text-[11px] font-bold text-[var(--on-surface-variant)]">
                  <th class="min-w-[220px] px-3 py-2.5">採購單號＋原物料</th>
                  <th class="w-36 px-3 py-2.5">採購數量</th>
                  <th class="w-36 px-3 py-2.5">入庫數量</th>
                  <th class="min-w-[180px] px-3 py-2.5">有效期限</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--outline-variant)]">
                <tr v-for="item in purchaseReceiptItems" :key="item.purchaseOrderItemId">
                  <td class="px-3 py-2.5">
                    <div class="font-bold">{{ selectedPurchaseOrder.orderNumber }}｜{{ item.materialName }}</div>
                    <div class="mt-0.5 font-data-mono text-[10px] text-[var(--on-surface-variant)]">{{ item.materialCode }}</div>
                  </td>
                  <td class="px-3 py-2.5 font-data-mono font-bold">{{ item.quantity }} {{ item.purchaseUnit || item.stockUnit }}</td>
                  <td class="px-3 py-2.5 font-data-mono">{{ getStockQuantity(item) }} {{ item.stockUnit }}</td>
                  <td class="px-3 py-2.5"><input v-model="item.expiryDate" type="date" class="input-field py-1 text-xs font-data-mono" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <template v-else>
        <div class="flex items-center justify-between">
          <h4 class="flex items-center space-x-1.5 text-xs font-bold"><Boxes class="h-4 w-4 text-[var(--primary)]" /><span>進貨明細</span></h4>
          <button type="button" class="flex cursor-pointer items-center space-x-1 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)]/20" @click="addIntakeRow">
            <Plus class="h-3.5 w-3.5" /><span>加入進貨項目</span>
          </button>
        </div>

        <div class="overflow-hidden rounded-xl border border-[var(--outline)] bg-[var(--surface-container)]">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[800px] border-collapse text-left text-xs">
              <thead>
                <tr class="border-b border-[var(--outline)] bg-[var(--surface-container-high)] text-[11px] font-bold text-[var(--on-surface-variant)]">
                  <th class="min-w-[220px] px-3 py-2.5">原物料</th><th class="w-40 px-3 py-2.5">進貨數量</th><th class="w-32 px-3 py-2.5">單位</th><th class="w-32 px-3 py-2.5">換算後數量</th><th class="min-w-[180px] px-3 py-2.5">有效期限</th><th class="w-12 px-2 py-2.5 text-center">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--outline-variant)]">
                <tr v-for="(item, index) in intakeItems" :key="index">
                  <td class="px-3 py-2.5">
                    <select v-model="item.materialId" class="input-field py-1 text-xs" @change="onMaterialChange(item)">
                      <option value="" disabled>請選擇原物料...</option>
                      <option v-for="material in materials" :key="material.id" :value="material.id">{{ material.name }}（{{ material.code }}）</option>
                    </select>
                  </td>
                  <td class="px-3 py-2.5"><input v-model.number="item.quantity" type="number" min="0.0001" step="any" class="input-field no-number-spinner py-1 text-xs font-data-mono" /></td>
                  <td class="px-3 py-2.5 font-data-mono">
                    {{ item.costMode === "CONVERSION" ? item.purchaseUnit : item.unit }}
                    <div v-if="item.costMode === 'CONVERSION'" class="mt-1 text-[10px] text-[var(--on-surface-variant)]">1 {{ item.purchaseUnit }} = {{ item.conversionQuantity }} {{ item.unit }}</div>
                  </td>
                  <td class="px-3 py-2.5 font-data-mono">{{ getStockQuantity(item) }} {{ item.unit }}</td>
                  <td class="px-3 py-2.5"><input v-model="item.expiryDate" type="date" class="input-field py-1 text-xs font-data-mono" /></td>
                  <td class="px-2 py-2.5 text-center"><button type="button" class="cursor-pointer p-1 text-[var(--on-surface-variant)] hover:text-[var(--error)]" title="刪除此筆" @click="removeIntakeRow(index)"><Trash2 class="h-3.5 w-3.5" /></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <div v-if="errorMessage" class="rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/10 p-3 text-xs text-[var(--error)]">{{ errorMessage }}</div>
      <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--outline)] bg-[var(--surface-container-low)] p-3 text-xs text-[var(--on-surface-variant)]">
        <span>{{ purchaseOrderMode ? "本次會將選取採購單的所有明細一次入庫。" : "每一列代表一筆新的原物料進貨批次。" }}</span>
        <span class="whitespace-nowrap font-bold text-[var(--primary)]">{{ purchaseOrderMode ? "整單收貨" : "多筆入庫" }}</span>
      </div>
    </div>

    <template #footer="{ close }">
      <button type="button" class="btn-secondary text-xs" @click="close">取消</button>
      <button type="button" :disabled="submitDisabled" class="btn-primary flex items-center space-x-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50" @click="handleSubmit">
        <Save class="h-4 w-4" /><span>{{ submitLabel }}</span>
      </button>
    </template>
  </ModalWrapper>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { Boxes, PackagePlus, Plus, Save, Trash2 } from "lucide-vue-next";
import ModalWrapper from "../子元件/ModalWrapper.vue";
import httpClient from "@/service/httpClient";
import { getReceivablePurchaseOrders, receivePurchaseOrder } from "@/service/purchaseOrderReceivingService";

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  purchaseOrderMode: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "success"]);
const materials = ref([]);
const intakeItems = ref([]);
const receivableOrders = ref([]);
const selectedPurchaseOrderId = ref("");
const purchaseReceiptItems = ref([]);
const saving = ref(false);
const loadingReceivableOrders = ref(false);
const errorMessage = ref("");

const selectedPurchaseOrder = computed(() => receivableOrders.value.find((order) => Number(order.id) === Number(selectedPurchaseOrderId.value)) || null);
const submitDisabled = computed(() => saving.value || (props.purchaseOrderMode && (loadingReceivableOrders.value || !selectedPurchaseOrder.value)));
const submitLabel = computed(() => saving.value ? (props.purchaseOrderMode ? "收貨入庫中..." : "入庫中...") : (props.purchaseOrderMode ? "確認採購單收貨" : "確認全部入庫"));

async function loadMaterials() {
  try {
    const response = await httpClient.get("/api/material/active");
    materials.value = Array.isArray(response.data) ? response.data.filter((material) => material.status === "ACTIVE") : [];
  } catch (error) {
    console.error("取得啟用原物料失敗：", error);
    materials.value = [];
    errorMessage.value = getApiError(error, "取得原物料資料失敗");
  }
}

async function loadReceivableOrders() {
  loadingReceivableOrders.value = true;
  try {
    receivableOrders.value = await getReceivablePurchaseOrders();
  } catch (error) {
    console.error("取得可收貨採購單失敗：", error);
    receivableOrders.value = [];
    errorMessage.value = getApiError(error, "取得可收貨採購單失敗");
  } finally {
    loadingReceivableOrders.value = false;
  }
}

function addIntakeRow() {
  intakeItems.value.push({ materialId: "", quantity: 1, unit: "", costMode: "", purchaseUnit: "", conversionQuantity: null, expiryDate: "" });
}
function removeIntakeRow(index) { intakeItems.value.splice(index, 1); }
function onMaterialChange(item) {
  const material = materials.value.find((candidate) => Number(candidate.id) === Number(item.materialId));
  if (!material) { item.unit = ""; return; }
  item.unit = material.unit;
  item.costMode = material.costMode;
  item.purchaseUnit = material.purchaseUnit;
  item.conversionQuantity = material.conversionQuantity;
}
function formatPurchaseOrderOption(order) {
  const names = (order.items || []).map((item) => item.materialName).join("、");
  const deliveryDate = order.expectedDeliveryDate || "未設定";
  return `${order.orderNumber}｜${names || "無原物料明細"}｜預計到貨：${deliveryDate}`;
}
function selectPurchaseOrder() {
  purchaseReceiptItems.value = (selectedPurchaseOrder.value?.items || []).map((item) => ({ ...item, expiryDate: "" }));
}
function getStockQuantity(item) {
  const quantity = Number(item.quantity || 0);
  return item.costMode === "CONVERSION" ? quantity * Number(item.conversionQuantity || 0) : quantity;
}

async function resetModal() {
  errorMessage.value = "";
  intakeItems.value = [];
  receivableOrders.value = [];
  selectedPurchaseOrderId.value = "";
  purchaseReceiptItems.value = [];
  if (props.purchaseOrderMode) await loadReceivableOrders();
  else addIntakeRow();
}

async function handleSubmit() {
  errorMessage.value = "";
  if (props.purchaseOrderMode) await submitPurchaseOrderReceipt();
  else await submitManualIntake();
}

async function submitManualIntake() {
  if (intakeItems.value.length === 0) { errorMessage.value = "請至少加入一筆進貨項目"; return; }
  if (intakeItems.value.some((item) => !item.materialId || Number(item.quantity) <= 0)) {
    errorMessage.value = "請確認每一筆都有選擇原物料，且進貨數量必須大於 0";
    return;
  }
  const items = intakeItems.value.map((item) => ({ materialId: Number(item.materialId), quantity: Number(item.quantity), expiryDate: item.expiryDate || null }));
  saving.value = true;
  try {
    await httpClient.post("/api/inventory/batch", { items });
    emit("success"); emit("close");
  } catch (error) {
    console.error("批次進貨失敗：", error);
    errorMessage.value = getApiError(error, "批次進貨資料儲存失敗");
  } finally { saving.value = false; }
}

async function submitPurchaseOrderReceipt() {
  if (!selectedPurchaseOrder.value) { errorMessage.value = "請先選擇要收貨的採購單"; return; }
  const items = purchaseReceiptItems.value.map((item) => ({ purchaseOrderItemId: Number(item.purchaseOrderItemId), expiryDate: item.expiryDate || null }));
  saving.value = true;
  try {
    await receivePurchaseOrder(selectedPurchaseOrder.value.id, items);
    emit("success"); emit("close");
  } catch (error) {
    console.error("採購單收貨失敗：", error);
    errorMessage.value = getApiError(error, "採購單收貨失敗");
    await loadReceivableOrders();
    selectedPurchaseOrderId.value = "";
    purchaseReceiptItems.value = [];
  } finally { saving.value = false; }
}

function getApiError(error, fallback) {
  return error.response?.data?.message || error.response?.data?.detail || (typeof error.response?.data === "string" ? error.response.data : "") || fallback;
}

watch([() => props.isOpen, () => props.purchaseOrderMode], ([isOpen]) => { if (isOpen) resetModal(); });
onMounted(loadMaterials);
</script>
