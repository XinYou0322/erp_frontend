<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="supplier-modal-backdrop"
      @click.self="closeModal"
    >
      <div
        class="supplier-modal bento-card shadow-level-2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-order-detail-title"
      >
        <!-- 將原本的供應商標題改為採購單標題 -->
        <div class="supplier-modal__header">
          <div>
            <p class="supplier-modal__eyebrow">PURCHASE ORDER DETAIL</p>
            <h2
              id="purchase-order-detail-title"
              class="supplier-modal__title"
            >
              {{ purchaseOrderData.orderNumber || '採購單詳細資料' }}
            </h2>
          </div>

          <button
            type="button"
            class="supplier-icon-button supplier-modal__close"
            aria-label="關閉"
            @click="closeModal"
          >×</button>
        </div>

        <div class="supplier-modal__body">
          <!-- 採購單基本資料 -->
          <section class="supplier-detail-section">
            <div class="supplier-detail-section__header">
              <span>採購單基本資料</span>
              <span
                class="supplier-status"
                :class="statusInfo.className"
              >
                {{ statusInfo.label }}
              </span>
            </div>

            <div class="supplier-detail-grid">
              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">採購單 ID</span>
                <span class="supplier-detail-item__value">{{ purchaseOrderData.id ?? '-' }}</span>
              </div>

              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">採購單號</span>
                <span class="supplier-detail-item__value">{{ purchaseOrderData.orderNumber || '-' }}</span>
              </div>

              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">供應商名稱</span>
                <span class="supplier-detail-item__value">{{ supplierName }}</span>
              </div>

              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">總金額</span>
                <span class="supplier-detail-item__value">{{ formattedTotal }}</span>
              </div>

              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">建立人</span>
                <span class="supplier-detail-item__value">
                  {{ getUserDisplay(purchaseOrderData.createdByName, purchaseOrderData.createdByUserId) }}
                </span>
              </div>

              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">簽核人</span>
                <span class="supplier-detail-item__value">
                  {{ getUserDisplay(purchaseOrderData.approvedByName, purchaseOrderData.approvedByUserId) }}
                </span>
              </div>
            </div>
          </section>

          <!-- 採購單時程、收貨與簽核資料 -->
          <section class="supplier-detail-section">
            <div class="supplier-detail-section__header">
              <span>時程與收貨資訊</span>
            </div>

            <div class="supplier-detail-grid">
              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">建立時間</span>
                <span class="supplier-detail-item__value">{{ formatDate(purchaseOrderData.createdAt) }}</span>
              </div>

              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">更新時間</span>
                <span class="supplier-detail-item__value">{{ formatDate(purchaseOrderData.updatedAt) }}</span>
              </div>

              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">預計到貨日</span>
                <span class="supplier-detail-item__value">{{ formatDate(purchaseOrderData.expectedDeliveryDate) }}</span>
              </div>

              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">實際收貨時間</span>
                <span class="supplier-detail-item__value">{{ formatDate(purchaseOrderData.receivedAt) }}</span>
              </div>

              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">收貨人</span>
                <span class="supplier-detail-item__value">
                  {{ getUserDisplay(purchaseOrderData.receivedByName, purchaseOrderData.receivedByUserId) }}
                </span>
              </div>

              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">收貨憑證</span>
                <span class="supplier-detail-item__value">
                  <a
                    v-if="purchaseOrderData.receiptUrl"
                    :href="purchaseOrderData.receiptUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >查看憑證</a>
                  <span v-else>-</span>
                </span>
              </div>

              <div class="supplier-detail-item supplier-detail-item--full">
                <span class="supplier-detail-item__label">簽核備註</span>
                <span class="supplier-detail-item__value">
                  {{ purchaseOrderData.decisionRemark || '目前沒有簽核備註' }}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div class="supplier-modal__footer">
          <button
            type="button"
            class="supplier-btn supplier-btn--primary"
            @click="closeModal"
          >關閉</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },

  // 相容 PurchaseOrder.vue 目前使用的 :PurchaseOrder 寫法。
  PurchaseOrder: {
    type: Object,
    default: null
  },

  // 同時支援 Vue 建議的 :purchase-order 寫法，之後改名也不會壞掉。
  purchaseOrder: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

// 統一取得父元件傳入的採購單物件。
const purchaseOrderData = computed(() => {
  return props.purchaseOrder ?? props.PurchaseOrder ?? {}
})

const closeModal = () => {
  emit('close')
}

// 供應商名稱同時相容列表 DTO 與關聯物件兩種格式。
const supplierName = computed(() => {
  return purchaseOrderData.value.supplierName
    ?? purchaseOrderData.value.supplier?.name
    ?? '-'
})

// 將採購單總額格式化，例如 12500 顯示為 NT$12,500。
const formattedTotal = computed(() => {
  const amount = Number(
    purchaseOrderData.value.total
      ?? purchaseOrderData.value.totalAmount
  )

  if (!Number.isFinite(amount)) {
    return '-'
  }

  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
})

// 將後端的英文狀態轉成畫面顯示用中文。
const statusInfo = computed(() => {
  const statusMap = {
    DRAFT: {
      label: '草稿',
      className: 'purchase-order-status--draft'
    },
    PENDING: {
      label: '待簽核',
      className: 'purchase-order-status--pending'
    },
    PENDING_APPROVAL: {
      label: '待簽核',
      className: 'purchase-order-status--pending'
    },
    APPROVED: {
      label: '已核准',
      className: 'purchase-order-status--approved'
    },
    REJECTED: {
      label: '已退回',
      className: 'purchase-order-status--rejected'
    },
    RECEIVED: {
      label: '已收貨',
      className: 'purchase-order-status--received'
    },
    COMPLETED: {
      label: '已完成',
      className: 'purchase-order-status--completed'
    },
    CANCELLED: {
      label: '已取消',
      className: 'purchase-order-status--cancelled'
    },
    VOID: {
      label: '已作廢',
      className: 'purchase-order-status--cancelled'
    }
  }

  const originalStatus = purchaseOrderData.value.status || ''
  const normalizedStatus = String(originalStatus).toUpperCase()

  return statusMap[normalizedStatus] ?? {
    label: originalStatus || '-',
    className: 'purchase-order-status--default'
  }
})

// 優先顯示人員姓名；只有 ID 時仍可顯示可辨識的資料。
const getUserDisplay = (name, userId) => {
  if (name) {
    return name
  }

  return userId != null ? `使用者 #${userId}` : '-'
}

// 採購單日期統一轉為台灣常用日期時間格式。
const formatDate = (date) => {
  if (!date) {
    return '-'
  }

  // 只有日期的欄位不補上不存在的時間，避免畫面出現 00:00:00。
  const dateText = String(date)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return dateText.replaceAll('-', '/')
  }

  const dateObject = new Date(date)

  if (Number.isNaN(dateObject.getTime())) {
    return date
  }

  return dateObject.toLocaleString('zh-TW')
}

// 查看視窗可使用 Esc 關閉；查看功能不需要二次確認。
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.visible) {
    closeModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
