<script setup>
import { ref, computed, onMounted } from "vue";
import httpClient from "@/service/httpClient";

const props = defineProps({
  purchaseOrderId: {
    type: [String, Number],
    required: true,
  },
});

const expanded = ref(false);

const visibleItems = computed(() => {
  if (expanded.value) return items.value;
  return items.value.slice(0, 5);
});

const loading = ref(false);
const error = ref("");
const purchase = ref(null);

async function loadPurchaseDetail() {
  loading.value = true;
  error.value = "";

  try {
    const res = await httpClient.get(`/api/purchaseOrder/find/${props.purchaseOrderId}`);
    purchase.value = res.data?.data ?? res.data;
  } catch (err) {
    console.error(err);
    error.value = "無法取得採購資訊";
  } finally {
    loading.value = false;
  }
}

const items = computed(() => {
  if (!purchase.value) return [];
  return purchase.value.items
    ?? purchase.value.purchaseOrderItems
    ?? purchase.value.itemList
    ?? [];
});

const formattedTotal = computed(() => {
  const amount = Number(purchase.value?.total ?? purchase.value?.totalAmount ?? 0);

  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(amount);
});

function formatDate(date) {
  if (!date) return "-";
  return String(date).slice(0, 10).replaceAll("-", "/");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatQuantity(value) {
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function materialName(item) {
  return item.materialName ?? item.material?.name ?? item.name ?? "-";
}

function materialCode(item) {
  return item.materialCode ?? item.material?.code ?? item.code ?? "-";
}

function itemPrice(item) {
  return item.price ?? item.unitPrice ?? 0;
}

function itemQty(item) {
  return item.quantity ?? 0;
}

function itemSubtotal(item) {
  return item.subtotal ?? item.subTotal ?? itemQty(item) * itemPrice(item);
}

onMounted(loadPurchaseDetail);
</script>
<template>
  <div class="purchase-card">
    <div class="card-title">
      <span class="material-symbols-outlined">inventory_2</span>
      採購資訊
    </div>

    <p v-if="loading" class="state-text">讀取中...</p>

    <p v-else-if="error" class="state-text state-text--error">
      {{ error }}
    </p>

    <template v-else-if="purchase">
      <div class="info-row">
        <span class="label">供應商</span>
        <span class="value">{{ purchase.supplierName }}</span>
      </div>

      <div class="info-row">
        <span class="label">總金額</span>
        <span class="value money">{{ formattedTotal }}</span>
      </div>

      <div class="info-row">
        <span class="label">預計到貨</span>
        <span class="value">{{ formatDate(purchase.expectedDeliveryDate) }}</span>
      </div>

      <div class="detail-table">
        <div class="detail-table__head">
          <span>採購明細</span>
          <span>{{ items.length }} 項</span>
        </div>

        <table v-if="items.length">
          <thead>
            <tr>
              <th>原料</th>
              <th>數量</th>
              <th>單價</th>
              <th>小計</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in visibleItems" :key="item.id">
              <td>
                <div class="material-cell">
                  <strong>{{ materialName(item) }}</strong>
                  <small>{{ materialCode(item) }}</small>
                </div>
              </td>

              <td>{{ formatQuantity(itemQty(item)) }}</td>
              <td>{{ formatCurrency(itemPrice(item)) }}</td>
              <td>{{ formatCurrency(itemSubtotal(item)) }}</td>
            </tr>
            <button
                v-if="items.length > 5"
                class="expand-btn"
                @click="expanded = !expanded"
                >
                {{ expanded ? `收合 (${items.length} 項)` : `查看全部 ${items.length} 項` }}
            </button>
          </tbody>
        </table>

        <p v-else class="empty-text">目前沒有採購明細</p>
      </div>
    </template>
  </div>
</template>
<style scoped>
.purchase-card {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 24px;
  padding: 28px;
  background: rgba(14,27,53,.65);
}



.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  font-size: 15px;
  font-weight: 700;
  color: white;
}


.info-row {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.label {
  color: #94a3b8;
}

.value {
  font-weight: 600;
}

.money {
  color: #22d3ee;
}

.detail-table {
  margin-top: 28px;
}

.detail-table__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
}

.detail-table table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th,
.detail-table td {
  padding: 12px 8px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.detail-table th {
  text-align: left;
  color: #94a3b8;
  font-size: .9rem;
}

.material-cell {
  display: flex;
  flex-direction: column;
}

.material-cell small {
  color: #64748b;
}

.empty-text {
  color: #64748b;
  text-align: center;
  padding: 20px;
}
</style>