<template>
  
  <tr :class="{ 'sales-order-list-row--expanded': isExpanded }">
    <td>{{ orderNumber || '-' }}</td>
    <td>{{ paymentMethodInfo.label }}</td>
    <td>{{ createdByName || '-' }}</td>
    <td>{{ formatDateTime(createdAt) }}</td>
    <td>{{ formattedTotalAmount }}</td>
    <td>{{ statusInfo.label }}</td>
    <td>
      <div class="sales-order-list__actions">
        <button
          type="button"
          class="sales-order-list__view-button"
          :aria-expanded="isExpanded"
          @click="toggleDetail"
        >
          {{ isExpanded ? '收合' : '查看' }}
        </button>
      </div>
    </td>
  </tr>

  <!-- 查看後直接在目前銷售單的下一列展開，不再使用 alert 視窗。 -->
  <tr v-if="isExpanded" class="sales-order-inline-row">
    <td colspan="7" class="sales-order-inline-cell">
      <section class="sales-order-inline-detail">
        <header class="sales-order-inline-detail__header">
          <div>
            <p class="sales-order-inline-detail__eyebrow">SALES ORDER DETAIL</p>
            <h3 class="sales-order-inline-detail__title">
              {{ detailOrderNumber }}－銷售明細
            </h3>
          </div>

          <span
            class="sales-order-inline-detail__status"
            :class="detailStatusInfo.className"
          >
            {{ detailStatusInfo.label }}
          </span>
        </header>

        <!-- 查詢明細期間與失敗時，直接在展開區顯示狀態。 -->
        <p v-if="detailLoading" class="sales-order-inline-detail__state">
          銷售單明細載入中...
        </p>

        <p
          v-else-if="detailError"
          class="sales-order-inline-detail__state sales-order-inline-detail__state--error"
        >
          {{ detailError }}
        </p>

        <template v-else>
          <!-- 銷售單基本資料摘要。 -->
          <dl class="sales-order-inline-detail__meta">
            <div class="sales-order-inline-detail__meta-item">
              <dt>付款方式</dt>
              <dd>{{ detailPaymentMethodInfo.label }}</dd>
            </div>
            <div class="sales-order-inline-detail__meta-item">
              <dt>建立人</dt>
              <dd>{{ detailCreatedByName }}</dd>
            </div>
            <div class="sales-order-inline-detail__meta-item">
              <dt>建立時間</dt>
              <dd>{{ formatDateTime(detailCreatedAt) }}</dd>
            </div>
            <div class="sales-order-inline-detail__meta-item">
              <dt>銷售總額</dt>
              <dd class="sales-order-inline-detail__money">
                {{ formatMoney(detailTotalAmount) }}
              </dd>
            </div>
          </dl>

          <!-- 以表格直接呈現商品明細，版型對應圖二的列內展開效果。 -->
          <div class="sales-order-inline-detail__table-wrap">
            <table class="sales-order-inline-detail__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>商品編號</th>
                  <th>商品名稱</th>
                  <th>單價</th>
                  <th>數量</th>
                  <th>小計</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in detailItems"
                  :key="item.id ?? item.productId ?? `${id}-${index}`"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.productSku || item.sku || '-' }}</td>
                  <td>{{ item.productName || item.name || '-' }}</td>
                  <td>{{ formatMoney(resolveUnitPrice(item)) }}</td>
                  <td>{{ formatQuantity(item.quantity) }}</td>
                  <td>{{ formatMoney(resolveSubtotal(item)) }}</td>
                </tr>

                <tr v-if="detailItems.length === 0">
                  <td colspan="6" class="sales-order-inline-detail__empty">
                    此銷售單目前沒有商品明細
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 已作廢時補充顯示作廢資料。 -->
          <dl v-if="isVoided" class="sales-order-inline-detail__void-info">
            <div>
              <dt>作廢人</dt>
              <dd>{{ detailVoidedByName }}</dd>
            </div>
            <div>
              <dt>作廢時間</dt>
              <dd>{{ formatDateTime(detailVoidedAt) }}</dd>
            </div>
            <div class="sales-order-inline-detail__void-reason">
              <dt>作廢原因</dt>
              <dd>{{ detailVoidReason }}</dd>
            </div>
          </dl>

          <!-- 作廢按鈕移到展開內容右下角；已作廢時保留禁用狀態。 -->
          <footer class="sales-order-inline-detail__footer">
            <button
              type="button"
              class="sales-order-inline-detail__void-button"
              :disabled="!canVoid || isVoiding"
              :title="canVoid ? '作廢這筆銷售單' : '這筆銷售單已作廢'"
              @click="voidSalesOrder"
            >
              {{ isVoiding ? '作廢中...' : (canVoid ? '作廢銷售單' : '已作廢') }}
            </button>
          </footer>
        </template>
      </section>
    </td>
  </tr>
</template>
<script setup>
import { computed } from 'vue'

// 接收父元件資料
const props = defineProps({
  id: {
    type: Number,
    required: true
  },
  orderNumber: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: ''
  },
  totalAmount: {
    type: [Number, String],
    default: 0
  },
  createdById: Number,
  createdByName: {
    type: String,
    default: ''
  },
  voidedById: Number,
  voidedByName: {
    type: String,
    default: ''
  },
  createdAt: {
    type: String,
    default: ''
  },
  voidedAt: {
    type: String,
    default: ''
  },
  note: {
    type: String,
    default: ''
  },
  voidReason: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  },

  // 由父元件控制哪一列展開，以及傳入查詢完成的完整銷售單明細。
  isExpanded: {
    type: Boolean,
    default: false
  },
  detail: {
    type: Object,
    default: null
  },
  detailLoading: {
    type: Boolean,
    default: false
  },
  detailError: {
    type: String,
    default: ''
  },
  isVoiding: {
    type: Boolean,
    default: false
  }
})

// 查看事件改成切換列內展開；作廢事件仍交由父元件呼叫 API。
const emit = defineEmits([
  'toggle-detail',
  'void-sales-order'
])

const formattedTotalAmount = computed(() => {
  return formatMoney(props.totalAmount)
})

const statusInfo = computed(() => {
  return resolveStatusInfo(props.status)
})

const paymentMethodInfo = computed(() => {
  return resolvePaymentMethodInfo(props.paymentMethod)
})

// 以下 computed 會優先使用明細 API 回傳值，缺少時再退回列表資料。
const detailOrderNumber = computed(() => {
  return props.detail?.orderNumber || props.orderNumber || '-'
})

const detailStatus = computed(() => {
  return props.detail?.status || props.status || ''
})

const detailStatusInfo = computed(() => {
  return resolveStatusInfo(detailStatus.value)
})

const detailPaymentMethodInfo = computed(() => {
  return resolvePaymentMethodInfo(
    props.detail?.paymentMethod || props.paymentMethod
  )
})

const detailCreatedByName = computed(() => {
  return props.detail?.createdByName || props.createdByName || '-'
})

const detailCreatedAt = computed(() => {
  return props.detail?.createdAt || props.detail?.createTime || props.createdAt || ''
})

const detailTotalAmount = computed(() => {
  return props.detail?.totalAmount ?? props.totalAmount
})

const detailItems = computed(() => {
  if (Array.isArray(props.detail?.items)) {
    return props.detail.items
  }

  return props.items
})

const detailVoidedByName = computed(() => {
  return props.detail?.voidedByName || props.voidedByName || '-'
})

const detailVoidedAt = computed(() => {
  return props.detail?.voidedAt || props.voidedAt || ''
})

const detailVoidReason = computed(() => {
  return props.detail?.voidReason || props.voidReason || '-'
})

const isVoided = computed(() => {
  return detailStatus.value.toUpperCase() === 'VOIDED'
})

const canVoid = computed(() => {
  return detailStatus.value.toUpperCase() === 'COMPLETED'
})

function resolveStatusInfo(status) {
  const statusMap = {
    // 【本次新增：ECPay 測試金流】待付款訂單顯示中文狀態，且 canVoid 仍限制只有已完成才能作廢。
    PENDING_PAYMENT: {
      label: '待付款',
      className: 'sales-order-inline-detail__status--default'
    },
    COMPLETED: {
      label: '已完成',
      className: 'sales-order-inline-detail__status--completed'
    },
    VOIDED: {
      label: '已作廢',
      className: 'sales-order-inline-detail__status--voided'
    }
  }

  const normalizedStatus = status?.toUpperCase()

  return statusMap[normalizedStatus] ?? {
    label: status || '-',
    className: 'sales-order-inline-detail__status--default'
  }
}

function resolvePaymentMethodInfo(paymentMethod) {
  const paymentMethodMap = {
    CASH: {
      label: '現金'
    },
    CREDIT_CARD: {
      label: '信用卡'
    },
    MOBILE_PAYMENT: {
      label: '行動支付'
    }
  }

  const normalizedPaymentMethod = paymentMethod?.toUpperCase()

  return paymentMethodMap[normalizedPaymentMethod] ?? {
    label: paymentMethod || '-'
  }
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const normalizedValue = String(value).replace(' ', 'T')
  const [datePart, timePart = ''] = normalizedValue.split('T')
  const formattedDate = datePart.replaceAll('-', '/')
  const formattedTime = timePart.slice(0, 5)

  return formattedTime
    ? `${formattedDate} ${formattedTime}`
    : formattedDate
}

// 集中處理金額與數量顯示，避免 API 回傳 null 時畫面出現 NaN。
function formatMoney(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '-'
  }

  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

function formatQuantity(value) {
  const quantity = Number(value)

  if (!Number.isFinite(quantity)) {
    return '-'
  }

  return new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: 4
  }).format(quantity)
}

function resolveUnitPrice(item) {
  return item.unitPrice ?? item.price ?? item.sellingPrice ?? 0
}

function resolveSubtotal(item) {
  if (item.subtotal !== undefined && item.subtotal !== null) {
    return item.subtotal
  }

  return Number(resolveUnitPrice(item)) * Number(item.quantity ?? 0)
}

// 按下查看時通知父元件展開或收合目前列。
function toggleDetail() {
  emit('toggle-detail', props.id)
}

// 此方法只會由展開區右下角的作廢按鈕觸發。
function voidSalesOrder() {
  if (!canVoid.value || props.isVoiding) {
    return
  }

  emit('void-sales-order', props.id)
}
</script>

