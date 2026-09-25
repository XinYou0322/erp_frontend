<template>
  <div class="supplier-page">
    <PurchaseOrderDetail
      v-if="showPurchaseOrderDetail && selectedPurchaseOrder"
      :key="`${selectedPurchaseOrder.id}-${detailRefreshKey}`"
      :purchase-order-id="selectedPurchaseOrder.id"
      :purchase-order="selectedPurchaseOrder"
      :login-user-id="loginUserId"
      :cancelling="isCancelling"
      :submitting="isSubmitting"
      :editing="showUpdatePurchaseOrder"
      :saving="isUpdating"
      @submit="submitPurchaseOrder"
      @back="closeDetail"
      @edit="showUpdate"
      @cancel-edit="closeUpdate"
      @update="submitUpdate"
      @cancel="cancelPurchaseOrder"
    />

    <template v-else>
      <!-- 【修改】頁籤按鈕由 HeadNavbar 管理；此處只傳入標題、開關及事件。 -->
      <HeadNavbar
        title="總覽"
        :total="overviewTotal"
        :show-mine="true"
        mine-title="我的採購單"
        :show-add="true"
        add-title="新增採購單"
        :active-tab="activeTab"
        @change-tab="changeTab"
        :show-search="true"
        search-placeholder="搜尋單號、金額、建立人、供應商名稱..."
        v-model:search-value="searchText"
        :show-page-size="true"
        :page-size="pageSize"
        @update:page-size="changePageSize"
        :show-filter-toggle="true"
        :filter-expanded="filterExpanded"
        @toggle-filter="toggleFilter"
        :show-refresh="true"
        @refresh="refreshData"
      />

      <!-- 【修改】總覽與自己共用篩選列及分頁列表。 -->
      <Filter
        v-if="activeTab !== 'add' && filterExpanded"
        class="purchase-order-filter"
        id-prefix="purchase-order"

        :show-status="true"
        status-label="狀態"
        status-default-text="全部狀態"
        :status-options="purchaseOrderStatusOptions"
        v-model:status-value="selectedStatus"

        :show-supplier="true"
        supplier-label="供應商"
        supplier-default-text="全部供應商"
        :supplier-options="supplierOptions"
        v-model:supplier-value="selectedSupplierId"

        :show-amount-range="true"
        amount-label="金額"
        v-model:min-amount="minAmount"
        v-model:max-amount="maxAmount"

        :show-date-range="true"
        date-label="採購日期"
        v-model:start-date="startDate"
        v-model:end-date="endDate"

        :show-search="false"
        :show-page-size="false"
        :show-refresh="false"

        :show-reset="false"
      />
      <section v-if="activeTab !== 'add'" class="supplier-overview bento-card">
        <div class="supplier-table-wrap">
          <table class="supplier-table">
            <thead>
              <tr>
                <th>採購單號</th>
                <th>供應商名稱</th>
                <th>建立人</th>
                <th>建立日期</th>
                <th>預計到貨日</th>
                <th>總金額</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <OnePurchaseOrder
                v-for="onePurchaseOrder in purchaseOrderList"
                :key="onePurchaseOrder.id"

                :id="onePurchaseOrder.id"
                :order-number="onePurchaseOrder.orderNumber"
                :supplier-id="onePurchaseOrder.supplierId"
                :supplier-name="onePurchaseOrder.supplierName"
                :status="onePurchaseOrder.status"
                :created-by-user-id="onePurchaseOrder.createdByUserId"
                :created-by-name="onePurchaseOrder.createdByName"
                :approved-by-user-id="onePurchaseOrder.approvedByUserId"
                :approved-by-name="onePurchaseOrder.approvedByName"
                :total="onePurchaseOrder.total"
                :created-at="onePurchaseOrder.createdAt"
                :updated-at="onePurchaseOrder.updatedAt"
                :expected-delivery-date="onePurchaseOrder.expectedDeliveryDate"
                :received-at="onePurchaseOrder.receivedAt"
                :received-by-user-id="onePurchaseOrder.receivedByUserId"
                :received-by-name="onePurchaseOrder.receivedByName"
                :receipt-url="onePurchaseOrder.receiptUrl"
                :decision-remark="onePurchaseOrder.decisionRemark"

                @show-detail="showDetail(onePurchaseOrder)"
              />
            </tbody>
          </table>
        </div>

        <!-- currentPage 是後端從 0 開始的頁碼，所以顯示時要加 1 -->
        <Pagination
          :current-page="currentPage + 1"
          :total-pages="totalPages"
          @change-page="changePage"
        />
      </section>

      <AddPurchaseOrder
        v-else-if="activeTab === 'add'"
        :login-user-id="loginUserId"
        @saved="handlePurchaseOrdersSaved"
      />
    </template>

    <ConfirmSuccessfulModal
      :is-open="showUpdateSuccess"
      item-name="採購單"
      @confirm="closeUpdateSuccess"
      @cancel="closeUpdateSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue'
// 【新增】登入資料供既有新增元件使用；自己頁籤的身分由後端 Session 判定。
import { useAuthStore } from '@/stores/auth.store'
import httpClient from '@/service/httpClient'
import Filter from '@/component/子元件/Filter.vue'
import HeadNavbar from '@/component/子元件/HeadNavbar.vue'
import OnePurchaseOrder from '@/component/子元件/OnePurchaseOrder.vue'
import Pagination from '@/component/子元件/Pagination.vue'
import PurchaseOrderDetail from '@/view/PurchaseOrderDetail.vue'
import AddPurchaseOrder from '@/component/子元件/AddPurchaseOrder.vue'
import ConfirmSuccessfulModal from '@/component/子元件/ConfirmSuccessfulModal.vue'

onMounted(() => {
  fetchSupplierOptions()
  fetchData()
})

// 【修改】移除固定使用者 1，取得目前登入者。
const authStore = useAuthStore()
const loginUserId = computed(() => authStore.currentUser?.id ?? null)
// 【新增】總覽筆數獨立保存；請求序號防止舊回應覆蓋新頁籤。
const overviewTotal = ref(0)
let fetchSequence = 0

// ---------- Filter ----------
const searchText = ref('')
const selectedStatus = ref('')
const selectedSupplierId = ref('')
const minAmount = ref('')
const maxAmount = ref('')
const startDate = ref('')
const endDate = ref('')
const filterExpanded = ref(false)
const activeTab = ref('overview')
const isResettingFilters = ref(false)

//供應商下拉選單資料 後端查詢後放入
const supplierOptions = ref([])
//採購單狀態
// 【修改】自己保留所有狀態，顯示名稱統一為已簽核、已到貨。
const allStatusOptions = [
  {
    label: '草稿',
    value: 'DRAFT'
  },
  {
    label: '待簽核',
    value: 'PENDING_APPROVAL'
  },
  {
    label: '已簽核',
    value: 'APPROVED'
  },
  {
    label: '已退回',
    value: 'REJECTED'
  },
  {
    label: '已到貨',
    value: 'RECEIVED'
  },
  {
    label: '已取消',
    value: 'CANCELLED'
  }
]

// 【新增】總覽僅提供指定三種狀態；後端亦會限制相同範圍。
const overviewStatuses = ['PENDING_APPROVAL', 'APPROVED', 'RECEIVED']
const purchaseOrderStatusOptions = computed(() => activeTab.value === 'mine'
  ? allStatusOptions : allStatusOptions.filter(option => overviewStatuses.includes(option.value)))

// ---------- 分頁 ----------
const pageSize = ref(10)
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

// ---------- 採購單列表與彈出視窗 ----------
const purchaseOrderList = ref([])
const showPurchaseOrderDetail = ref(false)
const showUpdatePurchaseOrder = ref(false)
const selectedPurchaseOrder = ref(null)
const detailRefreshKey = ref(0)
const isCancelling = ref(false)
const isUpdating = ref(false)
const showUpdateSuccess = ref(false)
// 【新增】控制草稿送簽的忙碌狀態。
const isSubmitting = ref(false)

function changePageSize(size) {
  pageSize.value = size
  currentPage.value = 0
  fetchData()
}
function toggleFilter() {
  filterExpanded.value = !filterExpanded.value
}
// 【修改】切換頁籤後清空篩選並回到第一頁。
async function changeTab(tab) {
  if (!['overview', 'mine', 'add'].includes(tab)) return
  activeTab.value = tab
  await refreshData()
}
// 接收 Pagination.vue 傳回的畫面頁碼。
function changePage(page) {
  currentPage.value = page - 1
  fetchData()
}
//---------- 供應商取得 ----------
async function fetchSupplierOptions() {
  try {
    const response = await httpClient({
      method: 'get',
      url: '/api/Supplier/page',
      params: {
        keyword: '',
        page: 0,
        size: 50
      }
    })

    const responseList = Array.isArray(response.data.content)
      ? response.data.content
      : []

    //如果供應商超過 50 筆，繼續取得後面的頁面，避免下拉選單缺資料。
    const supplierTotalPages = Number(response.data.totalPages) || 0
    
        for (let page = 1; page < supplierTotalPages; page++) {
      const nextResponse = await httpClient({
        method: 'get',
        url: '/api/Supplier/page',
        params: {
          keyword: '',
          page: page,
          size: 50
        }
      })

      const nextSupplierList = Array.isArray(nextResponse.data.content)
        ? nextResponse.data.content
        : []

      for (const supplier of nextSupplierList) {
        responseList.push(supplier)
      }
    }

    const options = []

    for (const supplier of responseList) {
      options.push({
        key: supplier.id,
        label: supplier.name,
        value: supplier.id
      })
    }

    supplierOptions.value = options
  } catch (error) {
    console.error('查詢供應商選項失敗：', error)
  }
}
// 集中在 params 傳入所有查詢條件。
async function fetchData() {
  // 【新增】只傳查詢範圍，不傳登入者 ID；登入者由後端 Session 取得。
  const sequence = ++fetchSequence
  const scope = activeTab.value === 'mine' ? 'mine' : 'overview'
  purchaseOrderList.value = []
  try {
    const response = await httpClient({
      method: 'get',
      url: '/api/purchaseOrder/page',

      params: {
        scope,
        keyword: searchText.value || undefined,
        status: selectedStatus.value || undefined,
        supplierId: selectedSupplierId.value || undefined,
        minAmount: minAmount.value || undefined,
        maxAmount: maxAmount.value || undefined,
        startDate: startDate.value || undefined,
        endDate: endDate.value || undefined,
        page: currentPage.value,
        size: pageSize.value
      }
    })

    // 【新增】僅最新請求可以更新畫面；自己的筆數不覆蓋總覽筆數。
    if (sequence !== fetchSequence) return
    if (scope === 'overview') overviewTotal.value = Number(response.data.totalElements) || 0
    // Spring Page 的採購單陣列放在 content。
    const responseList = Array.isArray(response.data.content)
      ? response.data.content
      : []

    const normalizedList = []

    for (const purchaseOrder of responseList) {
      normalizedList.push(
        normalizePurchaseOrder(purchaseOrder)
      )
    }

    purchaseOrderList.value = normalizedList
    totalPages.value = Number(response.data.totalPages) || 0
    totalElements.value = Number(response.data.totalElements) || 0
    currentPage.value = Number(response.data.number) || 0
  } catch (error) {
    if (sequence !== fetchSequence) return
    console.error('查詢採購單失敗：', error)
    purchaseOrderList.value = []
    totalPages.value = 0
    totalElements.value = 0
  }
}
// 【新增】登入者改變時重新取得列表。
watch(loginUserId, () => { currentPage.value = 0; fetchData() })
// 搜尋監聽
watch(searchText, function () {
  if (isResettingFilters.value) return
  currentPage.value = 0
  fetchData()
})
//狀態監聽
watch(selectedStatus, function () {
  if (isResettingFilters.value) return
  currentPage.value = 0
  fetchData()
})
//供應商改變時重新查詢。
watch(selectedSupplierId, function () {
  if (isResettingFilters.value) return
  currentPage.value = 0
  fetchData()
})
//金額起訖改變時重新查詢。
watch([minAmount, maxAmount], function () {
  if (isResettingFilters.value) return
  currentPage.value = 0
  fetchData()
})
//開始日期或結束日期改變時重新查詢。
watch([startDate, endDate], function () {
  if (isResettingFilters.value) return
  currentPage.value = 0
  fetchData()
})
//更新按鈕會重新取得供應商選項與採購單資料。
async function refreshData() {
  isResettingFilters.value = true
  searchText.value = ''
  selectedStatus.value = ''
  selectedSupplierId.value = ''
  minAmount.value = ''
  maxAmount.value = ''
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 0
  // 【新增】讓欄位 watcher 在重設旗標開啟時完成，避免重複查詢。
  await nextTick()
  try {
    await Promise.all([fetchSupplierOptions(), fetchData()])
  } finally {
    isResettingFilters.value = false
  }
}

// 【修改】新增後切到自己，草稿也能看見。
async function handlePurchaseOrdersSaved() {
  await changeTab('mine')
}


async function submitUpdate(updateData) {
  if (isUpdating.value) return
  const purchaseOrderId = updateData.id

  //id 放在 URL，不重複放進 RequestBody。
  const requestData = {
    ...updateData
  }
  delete requestData.id

  isUpdating.value = true
  try {
    const response = await httpClient({
      method: 'put',
      url: `/api/purchaseOrder/${purchaseOrderId}`,
      params: {
        loginUserId: loginUserId.value
      },
      data: requestData
    })

    console.log('採購單修改成功：', response.data)

    // 【我新增】保留目前選取的採購單，關閉修改視窗後仍停留在詳細頁。
    const responseData = response.data?.data ?? response.data
    const updatedPurchaseOrder =
      responseData && typeof responseData === 'object'
        ? { ...updateData, ...responseData }
        : updateData

    selectedPurchaseOrder.value = normalizePurchaseOrder(updatedPurchaseOrder)
    closeUpdate()
    detailRefreshKey.value += 1
    await fetchData()
    showUpdateSuccess.value = true
  } catch (error) {
    console.error('修改採購單失敗：', error)

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      '採購單修改失敗'

    alert(errorMessage)
  } finally {
    isUpdating.value = false
  }
}

function showDetail(onePurchaseOrder) {
  selectedPurchaseOrder.value = onePurchaseOrder
  showPurchaseOrderDetail.value = true
}

function closeDetail() {
  showUpdatePurchaseOrder.value = false
  showPurchaseOrderDetail.value = false
  selectedPurchaseOrder.value = null
}

function showUpdate(onePurchaseOrder) {
  selectedPurchaseOrder.value = onePurchaseOrder
  showUpdatePurchaseOrder.value = true
}

function closeUpdate() {
  // 【修改】關閉修改視窗時保留明細選取資料，避免儲存後跳離詳細頁。
  showUpdatePurchaseOrder.value = false
}

function closeUpdateSuccess() {
  showUpdateSuccess.value = false
}

// 【新增】送簽使用後端 Session；成功後更新狀態、列表與簽核流程。
async function submitPurchaseOrder(order) {
  if (!order?.id || order.status !== 'DRAFT' || isSubmitting.value || isCancelling.value) return
  isSubmitting.value = true
  try {
    const response = await httpClient.post('/api/purchaseOrder/' + order.id + '/submit')
    const data = response.data?.data ?? response.data
    selectedPurchaseOrder.value = normalizePurchaseOrder({ ...order, ...data })
    detailRefreshKey.value += 1
    await fetchData()
  } catch (error) {
    alert(error.response?.data?.message || error.response?.data?.detail || '送出簽核失敗，請確認資料及登入狀態')
  } finally {
    isSubmitting.value = false
  }
}

async function cancelPurchaseOrder(onePurchaseOrder) {
  if (!onePurchaseOrder?.id || isCancelling.value) {
    return
  }

  isCancelling.value = true

  try {
    await httpClient({
      method: 'put',
      url: `/api/purchaseOrder/${onePurchaseOrder.id}/cancel`,
      params: {
        loginUserId: loginUserId.value
      }
    })

    selectedPurchaseOrder.value = normalizePurchaseOrder({
      ...onePurchaseOrder,
      status: 'CANCELLED'
    })
    alert('採購單已取消')
    detailRefreshKey.value += 1
    await fetchData()
  } catch (error) {
    console.error('取消採購單失敗：', error)

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      '採購單取消失敗'

    alert(errorMessage)
  } finally {
    isCancelling.value = false
  }
}

// 補上 DTO 可能為 null 的預設值，避免子元件畫面出現 undefined。
function normalizePurchaseOrder(purchaseOrder) {
  return {
    ...purchaseOrder,
    orderNumber: purchaseOrder.orderNumber ?? '',
    supplierId: purchaseOrder.supplierId ?? null,
    supplierName: purchaseOrder.supplierName ?? '',
    status: purchaseOrder.status ?? '',
    createdByUserId: purchaseOrder.createdByUserId ?? null,
    createdByName: purchaseOrder.createdByName ?? '',
    approvedByUserId: purchaseOrder.approvedByUserId ?? null,
    approvedByName: purchaseOrder.approvedByName ?? '',
    total: purchaseOrder.total ?? 0,
    createdAt: purchaseOrder.createdAt ?? '',
    updatedAt: purchaseOrder.updatedAt ?? '',
    expectedDeliveryDate: purchaseOrder.expectedDeliveryDate ?? '',
    receivedAt: purchaseOrder.receivedAt ?? '',
    receivedByUserId: purchaseOrder.receivedByUserId ?? null,
    receivedByName: purchaseOrder.receivedByName ?? '',
    receiptUrl: purchaseOrder.receiptUrl ?? '',
    decisionRemark: purchaseOrder.decisionRemark ?? '',
    approvalProgress: purchaseOrder.approvalProgress ?? '',

    items: purchaseOrder.items ?? purchaseOrder.purchaseOrderItems ?? [],
    workflowId:
      purchaseOrder.workflowId
      ?? purchaseOrder.approvalWorkflowId
      ?? purchaseOrder.workflow?.id
      ?? null
  }
}








</script>


<style>
</style>
