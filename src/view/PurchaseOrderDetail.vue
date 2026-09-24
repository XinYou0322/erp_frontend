
<template>
  <section class="purchase-order-detail">
    <!-- 不依賴 router，直接通知 PurchaseOrder.vue 返回原本列表。 -->
    <button
      type="button"
      class="purchase-order-detail__back"
      @click="emit('back')"
    >← 返回採購單列表</button>

    <div
      v-if="loading"
      class="purchase-order-detail__state bento-card"
    >採購單資料讀取中…</div>

    <div
      v-else-if="errorMessage"
      class="purchase-order-detail__state purchase-order-detail__state--error bento-card"
    >{{ errorMessage }}</div>

    <template v-else>
      <!-- 單筆 API 暫時失敗時，仍可先顯示列表已帶入的資料。 -->
      <p
        v-if="warningMessage"
        class="purchase-order-detail__warning"
      >{{ warningMessage }}</p>

      <div class="purchase-order-detail__layout">
        <!-- 圖一左側：採購單基本資料、明細與操作按鈕。 -->
        <article class="purchase-order-detail__main bento-card">
          <header class="purchase-order-detail__header">
            <div>
              <p class="purchase-order-detail__eyebrow">PURCHASE ORDER DETAIL</p>
              <h1 class="purchase-order-detail__title">
                {{ purchaseOrderData.orderNumber || `PO-${purchaseOrderData.id}` }}
              </h1>
            </div>

            <span
              class="purchase-order-status"
              :class="statusInfo.className"
            >
              <span class="purchase-order-status__dot" aria-hidden="true"></span>
              {{ statusInfo.label }}
            </span>
          </header>

          <section class="purchase-order-detail__section">
            <h2 class="purchase-order-detail__section-title">採購單資料</h2>

            <dl class="purchase-order-detail__info-grid">
              <div class="purchase-order-detail__info-row">
                <dt>供應商</dt>
                <dd>{{ purchaseOrderData.supplierName || '-' }}</dd>
              </div>

              <div class="purchase-order-detail__info-row">
                <dt>總金額</dt>
                <dd class="purchase-order-detail__money">{{ formattedTotal }}</dd>
              </div>

              <div class="purchase-order-detail__info-row">
                <dt>建立人</dt>
                <dd>{{ getUserDisplay(purchaseOrderData.createdByName, purchaseOrderData.createdByUserId) }}</dd>
              </div>

              <div class="purchase-order-detail__info-row">
                <dt>簽核人</dt>
                <dd>{{ getUserDisplay(purchaseOrderData.approvedByName, purchaseOrderData.approvedByUserId) }}</dd>
              </div>

              <div class="purchase-order-detail__info-row">
                <dt>建立時間</dt>
                <dd>{{ formatDate(purchaseOrderData.createdAt) }}</dd>
              </div>

              <div class="purchase-order-detail__info-row">
                <dt>更新時間</dt>
                <dd>{{ formatDate(purchaseOrderData.updatedAt) }}</dd>
              </div>

              <div class="purchase-order-detail__info-row">
                <dt>預計到貨日</dt>
                <dd>{{ formatDate(purchaseOrderData.expectedDeliveryDate, true) }}</dd>
              </div>

              <div class="purchase-order-detail__info-row">
                <dt>實際收貨時間</dt>
                <dd>{{ formatDate(purchaseOrderData.receivedAt) }}</dd>
              </div>

              <div class="purchase-order-detail__info-row">
                <dt>收貨人</dt>
                <dd>{{ getUserDisplay(purchaseOrderData.receivedByName, purchaseOrderData.receivedByUserId) }}</dd>
              </div>

              <div class="purchase-order-detail__info-row">
                <dt>收貨憑證</dt>
                <dd>
                  <a
                    v-if="purchaseOrderData.receiptUrl"
                    class="purchase-order-detail__link"
                    :href="purchaseOrderData.receiptUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >查看憑證</a>
                  <span v-else>-</span>
                </dd>
              </div>
            </dl>
          </section>

          <!-- 顯示採購原物料、數量、單價及小計。 -->
          <section class="purchase-order-detail__section">
            <div class="purchase-order-detail__section-heading">
              <h2 class="purchase-order-detail__section-title">採購明細</h2>
              <span class="purchase-order-detail__count">{{ purchaseOrderItems.length }} 項</span>
            </div>

            <div
              v-if="purchaseOrderItems.length"
              class="purchase-order-detail__table-wrap"
            >
              <table class="purchase-order-detail__table">
                <thead>
                  <tr>
                    <th>原物料編號</th>
                    <th>原物料名稱</th>
                    <th>數量</th>
                    <th>單價</th>
                    <th>小計</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in purchaseOrderItems"
                    :key="item.id ?? `${getMaterialCode(item)}-${index}`"
                  >
                    <td>{{ getMaterialCode(item) }}</td>
                    <td>{{ getMaterialName(item) }}</td>
                    <td>{{ formatQuantity(getItemQuantity(item)) }}</td>
                    <td>{{ formatCurrency(getItemPrice(item)) }}</td>
                    <td>{{ formatCurrency(getItemSubtotal(item)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p
              v-else
              class="purchase-order-detail__empty"
            >目前沒有採購明細資料</p>
          </section>

          <section class="purchase-order-detail__section purchase-order-detail__section--remark">
            <h2 class="purchase-order-detail__section-title">簽核備註</h2>
            <p class="purchase-order-detail__remark">
              {{ purchaseOrderData.decisionRemark || '目前沒有簽核備註' }}
            </p>
          </section>

          <!-- 「取消／修改」。 -->
          <footer class="purchase-order-detail__actions">
            <button
              type="button"
              class="purchase-order-detail__button purchase-order-detail__button--cancel"
              :disabled="!canCancel || cancelling"
              :title="canCancel ? '取消這張採購單' : '此狀態不可取消'"
              @click="requestCancel"
            >{{ cancelling ? '取消中…' : '取消' }}</button>

            <button
              type="button"
              class="purchase-order-detail__button purchase-order-detail__button--edit"
              :disabled="!canEdit || cancelling"
              :title="canEdit ? '修改這張採購單' : '此狀態不可修改'"
              @click="emit('edit', purchaseOrderData)"
            >修改</button>
          </footer>
        </article>

        <!-- 圖一右側：優先顯示 Workflow 紀錄，無 workflowId 時顯示採購狀態備援流程。 -->
        <aside class="purchase-order-detail__workflow bento-card">
          <div class="purchase-order-detail__workflow-header">
            <div>
              <h2 class="purchase-order-detail__workflow-title">簽核流程</h2>
              <p class="purchase-order-detail__workflow-subtitle">
                {{ workflowCode }}
              </p>
            </div>
            <span class="purchase-order-detail__workflow-status">
              {{ workflowStatusLabel }}
            </span>
          </div>

          <ol class="purchase-order-timeline">
            <li
              v-for="timelineItem in timelineItems"
              :key="timelineItem.id"
              class="purchase-order-timeline__item"
              :class="`purchase-order-timeline__item--${timelineItem.tone}`"
            >
              <span class="purchase-order-timeline__dot" aria-hidden="true"></span>

              <div class="purchase-order-timeline__content">
                <div class="purchase-order-timeline__head">
                  <strong>{{ timelineItem.title }}</strong>
                  <time v-if="timelineItem.createdAt">
                    {{ formatDate(timelineItem.createdAt) }}
                  </time>
                </div>

                <p v-if="timelineItem.description">{{ timelineItem.description }}</p>
                <span v-if="timelineItem.operator">{{ timelineItem.operator }}</span>
              </div>
            </li>
          </ol>
        </aside>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import httpClient from '@/service/httpClient'
import {
  getWorkflowById,
  getWorkflowLogs
} from '@/service/workflowService'

// purchaseOrder 是列表資料備援；purchaseOrderId 用來查詢完整單筆資料。
const props = defineProps({
  purchaseOrderId: {
    type: [String, Number],
    required: true
  },
  purchaseOrder: {
    type: Object,
    default: null
  },
  cancelling: {
    type: Boolean,
    default: false
  }
})

// back 返回列表；edit 開啟修改視窗；cancel 交由 PurchaseOrder.vue 呼叫取消 API。
const emit = defineEmits(['back', 'edit', 'cancel'])

const loading = ref(true)
const errorMessage = ref('')
const warningMessage = ref('')
const workflow = ref(null)
const workflowLogs = ref([])
const purchaseOrderData = ref(normalizePurchaseOrder(props.purchaseOrder ?? {}))

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

const normalizedStatus = computed(() => {
  return String(purchaseOrderData.value.status || '').toUpperCase()
})

const statusInfo = computed(() => {
  return statusMap[normalizedStatus.value] ?? {
    label: purchaseOrderData.value.status || '-',
    className: 'purchase-order-status--default'
  }
})

const purchaseOrderItems = computed(() => {
  return Array.isArray(purchaseOrderData.value.items)
    ? purchaseOrderData.value.items
    : []
})

const formattedTotal = computed(() => {
  return formatCurrency(
    purchaseOrderData.value.total ?? purchaseOrderData.value.totalAmount
  )
})

const canCancel = computed(() => {
  return !['CANCELLED', 'VOID', 'COMPLETED'].includes(normalizedStatus.value)
})

const canEdit = computed(() => {
  return !['APPROVED', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'VOID'].includes(
    normalizedStatus.value
  )
})

const workflowCode = computed(() => {
  const id = workflow.value?.id ?? purchaseOrderData.value.workflowId
  return id != null ? `WF-${id}` : '依採購單狀態顯示'
})

const workflowStatusLabel = computed(() => {
  const currentWorkflowStatus = String(
    workflow.value?.status || purchaseOrderData.value.status || ''
  ).toUpperCase()

  return statusMap[currentWorkflowStatus]?.label
    ?? statusInfo.value.label
})

// Workflow 有紀錄時顯示真實歷程；尚未取得關聯時以採購單狀態組成備援時間軸。
const timelineItems = computed(() => {
  if (workflowLogs.value.length > 0) {
    return workflowLogs.value.map((log, index) => {
      const action = String(log.action || log.status || '').toUpperCase()

      return {
        id: log.id ?? `workflow-log-${index}`,
        title: getWorkflowActionLabel(action),
        description: log.remark || getWorkflowActionDescription(action),
        operator: getWorkflowOperator(log),
        createdAt: log.createdAt,
        tone: getTimelineTone(action)
      }
    })
  }

  return buildFallbackTimeline()
})

// 取得單筆採購單；即使 API 失敗，仍可使用列表傳入資料顯示基本內容。
async function loadData() {
  loading.value = true
  errorMessage.value = ''
  warningMessage.value = ''
  workflow.value = null
  workflowLogs.value = []

  const fallbackData = normalizePurchaseOrder(props.purchaseOrder ?? {})
  purchaseOrderData.value = fallbackData

  try {
    const response = await httpClient({
      method: 'get',
      url: `/api/purchaseOrder/find/${props.purchaseOrderId}`
    })

    const responseData = response.data?.data ?? response.data
    purchaseOrderData.value = normalizePurchaseOrder({
      ...fallbackData,
      ...responseData
    })
  } catch (error) {
    console.error('查詢採購單單筆資料失敗：', error)

    if (!fallbackData.id) {
      errorMessage.value =
        error.response?.data?.message ||
        error.response?.data ||
        '採購單資料讀取失敗，請稍後再試'
      loading.value = false
      return
    }

    warningMessage.value = '完整明細暫時無法讀取，目前先顯示列表中的採購單資料。'
  }

  await loadWorkflowData()
  loading.value = false
}

// 採購單 DTO 有 workflowId 時，接上既有 workflowService 取得右側簽核流程。
async function loadWorkflowData() {
  const workflowId =
    purchaseOrderData.value.workflowId
    ?? purchaseOrderData.value.approvalWorkflowId
    ?? purchaseOrderData.value.workflow?.id

  if (workflowId == null) {
    return
  }

  try {
    const [workflowResult, logResult] = await Promise.all([
      getWorkflowById(workflowId),
      getWorkflowLogs(workflowId)
    ])

    workflow.value = unwrapServiceData(workflowResult)

    const logData = unwrapServiceData(logResult)
    const logList = Array.isArray(logData)
      ? logData
      : Array.isArray(logData?.content)
        ? logData.content
        : []

    workflowLogs.value = logList
  } catch (error) {
    console.error('查詢採購單簽核流程失敗：', error)
    warningMessage.value = warningMessage.value
      || '簽核紀錄暫時無法讀取，目前依採購單狀態顯示流程。'
  }
}

function normalizePurchaseOrder(purchaseOrder) {
  const items =
    purchaseOrder.items
    ?? purchaseOrder.purchaseOrderItems
    ?? purchaseOrder.itemList
    ?? []

  return {
    ...purchaseOrder,
    id: purchaseOrder.id ?? props.purchaseOrderId ?? null,
    orderNumber: purchaseOrder.orderNumber ?? '',
    supplierId: purchaseOrder.supplierId ?? purchaseOrder.supplier?.id ?? null,
    supplierName: purchaseOrder.supplierName ?? purchaseOrder.supplier?.name ?? '',
    status: purchaseOrder.status ?? '',
    createdByUserId: purchaseOrder.createdByUserId ?? purchaseOrder.createdBy?.id ?? null,
    createdByName: purchaseOrder.createdByName ?? purchaseOrder.createdBy?.name ?? '',
    approvedByUserId: purchaseOrder.approvedByUserId ?? purchaseOrder.approvedBy?.id ?? null,
    approvedByName: purchaseOrder.approvedByName ?? purchaseOrder.approvedBy?.name ?? '',
    receivedByUserId: purchaseOrder.receivedByUserId ?? purchaseOrder.receivedBy?.id ?? null,
    receivedByName: purchaseOrder.receivedByName ?? purchaseOrder.receivedBy?.name ?? '',
    total: purchaseOrder.total ?? purchaseOrder.totalAmount ?? 0,
    createdAt: purchaseOrder.createdAt ?? purchaseOrder.createTime ?? '',
    updatedAt: purchaseOrder.updatedAt ?? purchaseOrder.updateTime ?? '',
    expectedDeliveryDate: purchaseOrder.expectedDeliveryDate ?? '',
    receivedAt: purchaseOrder.receivedAt ?? '',
    receiptUrl: purchaseOrder.receiptUrl ?? '',
    decisionRemark: purchaseOrder.decisionRemark ?? purchaseOrder.remark ?? '',
    workflowId:
      purchaseOrder.workflowId
      ?? purchaseOrder.approvalWorkflowId
      ?? purchaseOrder.workflow?.id
      ?? null,
    items: Array.isArray(items) ? items : []
  }
}

function unwrapServiceData(result) {
  return result?.data?.data ?? result?.data ?? result
}

function requestCancel() {
  if (!canCancel.value || props.cancelling) {
    return
  }

  const orderNumber = purchaseOrderData.value.orderNumber || purchaseOrderData.value.id
  const confirmed = window.confirm(`確定要取消採購單 ${orderNumber} 嗎？`)

  if (confirmed) {
    emit('cancel', purchaseOrderData.value)
  }
}

function getUserDisplay(name, userId) {
  if (name) {
    return name
  }

  return userId != null ? `使用者 #${userId}` : '-'
}

function getMaterialCode(item) {
  return item.materialCode ?? item.material?.code ?? item.code ?? '-'
}

function getMaterialName(item) {
  return item.materialName ?? item.material?.name ?? item.name ?? '-'
}

function getItemQuantity(item) {
  return item.quantity ?? 0
}

function getItemPrice(item) {
  return item.price ?? item.unitPrice ?? 0
}

function getItemSubtotal(item) {
  const subtotalValue = item.subtotal ?? item.subTotal
  const backendSubtotal = Number(subtotalValue)

  if (subtotalValue != null && Number.isFinite(backendSubtotal)) {
    return backendSubtotal
  }

  return Number(getItemQuantity(item)) * Number(getItemPrice(item))
}

function formatCurrency(value) {
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

function formatDate(value, dateOnly = false) {
  if (!value) {
    return '-'
  }

  const dateText = String(value)

  if (dateOnly || /^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return dateText.slice(0, 10).replaceAll('-', '/')
  }

  const dateObject = new Date(value)

  if (Number.isNaN(dateObject.getTime())) {
    return dateText
  }

  return dateObject.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getWorkflowOperator(log) {
  return log.operatorName
    ?? log.operator?.name
    ?? log.operator
    ?? log.approverName
    ?? ''
}

function getWorkflowActionLabel(action) {
  const actionLabelMap = {
    CREATED: '建立申請',
    SUBMITTED: '送出申請',
    PENDING: '等待簽核',
    PENDING_APPROVAL: '等待簽核',
    APPROVED: '簽核通過',
    REJECTED: '簽核退回',
    CANCELLED: '取消採購單',
    RECEIVED: '完成收貨',
    COMPLETED: '完成採購流程'
  }

  return (actionLabelMap[action] ?? action) || '流程紀錄'
}

function getWorkflowActionDescription(action) {
  const descriptionMap = {
    CREATED: '採購單已建立',
    SUBMITTED: '採購單已送出簽核',
    PENDING: '等待指定簽核人處理',
    PENDING_APPROVAL: '等待指定簽核人處理',
    APPROVED: '採購申請已核准',
    REJECTED: '採購申請已退回',
    CANCELLED: '採購單已取消',
    RECEIVED: '採購品項已完成收貨',
    COMPLETED: '採購單流程已關閉'
  }

  return descriptionMap[action] ?? ''
}

function getTimelineTone(action) {
  if (['REJECTED', 'CANCELLED', 'VOID'].includes(action)) {
    return 'danger'
  }

  if (['PENDING', 'PENDING_APPROVAL'].includes(action)) {
    return 'pending'
  }

  return 'complete'
}

function buildFallbackTimeline() {
  const status = normalizedStatus.value
  const items = []
  const createdBy = getUserDisplay(
    purchaseOrderData.value.createdByName,
    purchaseOrderData.value.createdByUserId
  )
  const approvedBy = getUserDisplay(
    purchaseOrderData.value.approvedByName,
    purchaseOrderData.value.approvedByUserId
  )

  items.push({
    id: 'created',
    title: status === 'DRAFT' ? '建立草稿' : '送出採購申請',
    description: status === 'DRAFT' ? '採購單尚未送出簽核' : '採購單已送出簽核',
    operator: createdBy,
    createdAt: purchaseOrderData.value.createdAt,
    tone: 'complete'
  })

  if (['PENDING', 'PENDING_APPROVAL'].includes(status)) {
    items.push({
      id: 'pending',
      title: '等待簽核',
      description: '等待指定簽核人處理',
      operator: approvedBy,
      createdAt: '',
      tone: 'pending'
    })
  }

  if (status === 'REJECTED') {
    items.push({
      id: 'rejected',
      title: '簽核退回',
      description: purchaseOrderData.value.decisionRemark || '採購申請未通過',
      operator: approvedBy,
      createdAt: purchaseOrderData.value.updatedAt,
      tone: 'danger'
    })
  }

  if (['APPROVED', 'RECEIVED', 'COMPLETED'].includes(status)) {
    items.push({
      id: 'approved',
      title: '簽核通過',
      description: purchaseOrderData.value.decisionRemark || '採購申請已核准',
      operator: approvedBy,
      createdAt: purchaseOrderData.value.updatedAt,
      tone: 'complete'
    })
  }

  if (['RECEIVED', 'COMPLETED'].includes(status)) {
    items.push({
      id: 'received',
      title: '完成收貨',
      description: '採購品項已完成收貨',
      operator: getUserDisplay(
        purchaseOrderData.value.receivedByName,
        purchaseOrderData.value.receivedByUserId
      ),
      createdAt: purchaseOrderData.value.receivedAt,
      tone: 'complete'
    })
  }

  if (status === 'COMPLETED') {
    items.push({
      id: 'completed',
      title: '完成採購流程',
      description: '採購單已完成並關閉',
      operator: '',
      createdAt: purchaseOrderData.value.updatedAt,
      tone: 'complete'
    })
  }

  if (['CANCELLED', 'VOID'].includes(status)) {
    items.push({
      id: 'cancelled',
      title: status === 'VOID' ? '採購單已作廢' : '採購單已取消',
      description: '此採購單已停止後續流程',
      operator: '',
      createdAt: purchaseOrderData.value.updatedAt,
      tone: 'danger'
    })
  }

  return items
}

//切換不同採購單 id 時自動重新查詢。
watch(
  () => props.purchaseOrderId,
  loadData,
  { immediate: true }
)
</script>
