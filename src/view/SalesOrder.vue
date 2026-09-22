<template >
    <div class="supplier-page">
        <Filter
      class="purchase-order-filter"
      id-prefix="purchase-order"

      :show-status="true"
      status-label="狀態"
      status-default-text="全部狀態"
      :status-options="salesOrderStatusOptions"
      v-model:status-value="selectedStatus"

      :show-date-range="true"
      date-label="銷售日期"
      v-model:start-date="startDate"
      v-model:end-date="endDate"

      :show-search="true"
      search-label="搜尋"
      search-placeholder="搜尋銷售單號、供應商名稱..."
      v-model:search-value="searchText"

      :show-page-size="true"
      :page-size="pageSize"
      @update:page-size="changePageSize"

      :show-refresh="true"
      refresh-title="更新銷售單資料"
      @refresh="refreshData"

      :show-reset="false"
      />
    <section class="supplier-overview bento-card">
      <div class="supplier-table-wrap">
        <table class="supplier-table">
          <thead>
            <tr>
              <th>銷售單號</th>
              <th>付款方式</th>
              <th>建立人</th>
              <th>建立時間</th>
              <th>總金額</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>

          <tbody>
            <OneSalesOrders
              v-for="oneSalesOrder in salesOrderList"
              :key="oneSalesOrder.id"

              :id="oneSalesOrder.id"
              :order-number="oneSalesOrder.orderNumber"
              :status="oneSalesOrder.status"
              :payment-method="oneSalesOrder.paymentMethod"
              :total-amount="oneSalesOrder.totalAmount"
              :created-by-id="oneSalesOrder.createdById"
              :created-by-name="oneSalesOrder.createdByName"
              :voided-by-id="oneSalesOrder.voidedById"
              :voided-by-name="oneSalesOrder.voidedByName"
              :created-at="oneSalesOrder.createdAt"
              :voided-at="oneSalesOrder.voidedAt"
              :void-reason="oneSalesOrder.voidReason"
              :items="oneSalesOrder.items"

              :is-expanded="expandedSalesOrderId === oneSalesOrder.id"
              :detail="salesOrderDetailMap[oneSalesOrder.id] ?? null"
              :detail-loading="Boolean(detailLoadingMap[oneSalesOrder.id])"
              :detail-error="detailErrorMap[oneSalesOrder.id] || ''"
              :is-voiding="voidingSalesOrderId === oneSalesOrder.id"

              @toggle-detail="toggleDetail"
              @void-sales-order="voidSalesOrder"
            />
            <tr v-if="!isLoading && salesOrderList.length === 0">
              <td colspan="7">目前沒有符合條件的銷售單</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        :current-page="currentPage + 1"
        :total-pages="totalPages"
        @change-page="changePage"
      />
    </section>

    </div>
</template>
<script setup>
import { onMounted, ref, watch } from 'vue'
import httpClient from '@/service/httpClient'
import Filter from '@/component/子元件/Filter.vue'
import OneSalesOrders from '@/component/子元件/OneSalesOrder.vue'
import Pagination from '@/component/子元件/Pagination.vue'

const loginUserId = ref(1)

const pageSize = ref(10)
const currentPage = ref(0)
const totalPages = ref(0)

// ------- 篩選條件 -------
const selectedStatus = ref('')
const startDate = ref('')
const endDate = ref('')
const searchText = ref('')

const salesOrderStatusOptions = [
  {
    label: '已完成',
    value: 'COMPLETED'
  },
  {
    label: '已作廢',
    value: 'VOIDED'
  }
]

// -------- 銷售單列表資料 --------
const salesOrderList = ref([])
const isLoading = ref(false)

// 保存目前展開列與各銷售單的明細查詢狀態。
const expandedSalesOrderId = ref(null)
const salesOrderDetailMap = ref({})
const detailLoadingMap = ref({})
const detailErrorMap = ref({})
const voidingSalesOrderId = ref(null)

onMounted(() => {
  fetchData()
})

// 合併原本重複宣告的三組 watch，避免篩選一次卻重複呼叫 API。
watch(
  [selectedStatus, startDate, endDate, searchText],
  function () {
    currentPage.value = 0
    resetDetailState()
    fetchData()
  }
)

function changePageSize(size) {
  pageSize.value = size
  currentPage.value = 0
  resetDetailState()
  fetchData()
}

function changePage(page) {
  currentPage.value = page - 1
  resetDetailState()
  fetchData()
}

async function refreshData() {
  currentPage.value = 0
  resetDetailState()
  await fetchData()
}

async function fetchData() {
  isLoading.value = true

  try {
    const response = await httpClient({
      method: 'get',
      url: '/api/SalesOrder/page',
      params: {
        keyword: searchText.value || undefined,
        status: selectedStatus.value || undefined,
        startDate: startDate.value || undefined,
        endDate: endDate.value || undefined,
        page: currentPage.value,
        size: pageSize.value
      }
    })

    const responseList = Array.isArray(response.data.content)
      ? response.data.content
      : []

    const normalizedList = []

    for (const salesOrder of responseList) {
      normalizedList.push(
        normalizeSalesOrder(salesOrder)
      )
    }

    salesOrderList.value = normalizedList
    totalPages.value = Number(response.data.totalPages) || 0
    currentPage.value = Number(response.data.number) || 0

    // 若篩選或作廢後該筆資料已不在本頁，便關閉失效的展開列。
    const expandedOrderStillExists = normalizedList.some(function (salesOrder) {
      return salesOrder.id === expandedSalesOrderId.value
    })

    if (expandedSalesOrderId.value !== null && !expandedOrderStillExists) {
      expandedSalesOrderId.value = null
    }
  } catch (error) {
    console.error('查詢銷售單失敗：', error)
    salesOrderList.value = []
    totalPages.value = 0

    alert(resolveErrorMessage(error, '查詢銷售單失敗'))
  } finally {
    isLoading.value = false
  }
}

function normalizeSalesOrder(salesOrder) {
  return {
    ...salesOrder,
    id: salesOrder.id ?? null,
    orderNumber: salesOrder.orderNumber ?? '',
    status: salesOrder.status ?? '',
    paymentMethod: salesOrder.paymentMethod ?? '',
    totalAmount: salesOrder.totalAmount ?? 0,
    createdById: salesOrder.createdById ?? null,
    createdByName: salesOrder.createdByName ?? '',
    voidedById: salesOrder.voidedById ?? null,
    voidedByName: salesOrder.voidedByName ?? '',
    createdAt: salesOrder.createdAt ?? salesOrder.createTime ?? '',
    voidedAt: salesOrder.voidedAt ?? '',
    voidReason: salesOrder.voidReason ?? '',
    items: Array.isArray(salesOrder.items) ? salesOrder.items : []
  }
}

// 同一時間只展開一筆；再次點擊同一筆時收合。
async function toggleDetail(salesOrderId) {
  if (expandedSalesOrderId.value === salesOrderId) {
    expandedSalesOrderId.value = null
    return
  }

  expandedSalesOrderId.value = salesOrderId

  if (salesOrderDetailMap.value[salesOrderId]) {
    return
  }

  await fetchSalesOrderDetail(salesOrderId)
}

// 原本用 alert 顯示明細，現在改為保存資料後交給 OneSalesOrder 列內呈現。
async function fetchSalesOrderDetail(salesOrderId, forceRefresh = false) {
  if (!forceRefresh && salesOrderDetailMap.value[salesOrderId]) {
    return salesOrderDetailMap.value[salesOrderId]
  }

  detailLoadingMap.value = {
    ...detailLoadingMap.value,
    [salesOrderId]: true
  }
  detailErrorMap.value = {
    ...detailErrorMap.value,
    [salesOrderId]: ''
  }

  try {
    const response = await httpClient({
      method: 'get',
      url: `/api/SalesOrder/find/${salesOrderId}`
    })

    const normalizedDetail = normalizeSalesOrderDetail(response.data)

    salesOrderDetailMap.value = {
      ...salesOrderDetailMap.value,
      [salesOrderId]: normalizedDetail
    }

    return normalizedDetail
  } catch (error) {
    console.error('查詢銷售單明細失敗：', error)

    detailErrorMap.value = {
      ...detailErrorMap.value,
      [salesOrderId]: resolveErrorMessage(error, '查詢銷售單明細失敗')
    }

    return null
  } finally {
    detailLoadingMap.value = {
      ...detailLoadingMap.value,
      [salesOrderId]: false
    }
  }
}

// 統一補上明細 DTO 可能缺少的欄位，讓子元件不用判斷每一種回傳格式。
function normalizeSalesOrderDetail(salesOrder) {
  const source = salesOrder ?? {}
  const normalizedItems = []
  const responseItems = Array.isArray(source.items) ? source.items : []

  for (const item of responseItems) {
    normalizedItems.push({
      ...item,
      id: item.id ?? null,
      productId: item.productId ?? null,
      productSku: item.productSku ?? item.sku ?? '',
      productName: item.productName ?? item.name ?? '',
      quantity: item.quantity ?? 0,
      unitPrice: item.unitPrice ?? item.price ?? item.sellingPrice ?? 0,
      subtotal: item.subtotal ?? null
    })
  }

  return {
    ...source,
    id: source.id ?? null,
    orderNumber: source.orderNumber ?? '',
    status: source.status ?? '',
    paymentMethod: source.paymentMethod ?? '',
    totalAmount: source.totalAmount ?? 0,
    createdById: source.createdById ?? null,
    createdByName: source.createdByName ?? '',
    voidedById: source.voidedById ?? null,
    voidedByName: source.voidedByName ?? '',
    createdAt: source.createdAt ?? source.createTime ?? '',
    voidedAt: source.voidedAt ?? '',
    voidReason: source.voidReason ?? '',
    items: normalizedItems
  }
}

// 作廢成功後重新取得列表與目前明細，展開區會立即更新為「已作廢」。
async function voidSalesOrder(salesOrderId) {
  const inputReason = window.prompt('請輸入作廢原因')

  if (inputReason === null) {
    return
  }

  const voidReason = inputReason.trim()

  if (!voidReason) {
    alert('作廢原因不可為空')
    return
  }

  const confirmed = window.confirm('確定要作廢這筆銷售單嗎？')

  if (!confirmed) {
    return
  }

  voidingSalesOrderId.value = salesOrderId

  try {
    await httpClient({
      method: 'put',
      url: `/api/SalesOrder/${salesOrderId}/void`,
      params: {
        loginUserId: loginUserId.value
      },
      data: {
        voidReason: voidReason
      }
    })

    alert('銷售單作廢成功')
    await fetchData()

    if (expandedSalesOrderId.value === salesOrderId) {
      await fetchSalesOrderDetail(salesOrderId, true)
    }
  } catch (error) {
    console.error('作廢銷售單失敗：', error)
    alert(resolveErrorMessage(error, '銷售單作廢失敗'))
  } finally {
    voidingSalesOrderId.value = null
  }
}

// 切換頁碼、篩選或刷新時，同步清除舊的展開與快取資料。
function resetDetailState() {
  expandedSalesOrderId.value = null
  salesOrderDetailMap.value = {}
  detailLoadingMap.value = {}
  detailErrorMap.value = {}
}

function resolveErrorMessage(error, fallbackMessage) {
  return error.response?.data?.message ||
    error.response?.data ||
    fallbackMessage
}
</script>
<style >
</style>