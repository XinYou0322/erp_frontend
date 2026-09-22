<template>
  <div class="supplier-page">
    <PurchaseOrderDetail
      v-if="showPurchaseOrderDetail && selectedPurchaseOrder"
      :key="`${selectedPurchaseOrder.id}-${detailRefreshKey}`"
      :purchase-order-id="selectedPurchaseOrder.id"
      :purchase-order="selectedPurchaseOrder"
      :cancelling="isCancelling"
      @back="closeDetail"
      @edit="showUpdate"
      @cancel="cancelPurchaseOrder"
    />

    <template v-else>
      <Filter
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

        :show-date-range="true"
        date-label="採購日期"
        v-model:start-date="startDate"
        v-model:end-date="endDate"

        :show-search="true"
        search-label="搜尋"
        search-placeholder="搜尋採購單號、供應商名稱..."
        v-model:search-value="searchText"

        :show-page-size="true"
        :page-size="pageSize"
        @update:page-size="changePageSize"

        :show-refresh="true"
        refresh-title="更新採購單資料"
        @refresh="refreshData"

        :show-reset="false"
      />
      <section class="supplier-overview bento-card">
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
    </template>
    
    <!-- 修改視窗只會從 PurchaseOrderDetail.vue 的「修改」按鈕開啟。 -->
    <UpdatePurchaseOrder
      v-if="showUpdatePurchaseOrder"
      :visible="showUpdatePurchaseOrder"
      :PurchaseOrder="selectedPurchaseOrder"
      @close="closeUpdate"
      @update="submitUpdate"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import httpClient from '@/service/httpClient'
import Filter from '@/component/子元件/Filter.vue'
import OnePurchaseOrder from '@/component/子元件/OnePurchaseOrder.vue'
import UpdatePurchaseOrder from '@/component/子元件/UpdatePurchaseOrder.vue'
import Pagination from '@/component/子元件/Pagination.vue'
import PurchaseOrderDetail from '@/view/PurchaseOrderDetail.vue'

onMounted(() => {
  fetchSupplierOptions()
  fetchData()
})

const loginUserId = ref(1)

// ---------- Filter ----------
const searchText = ref('')
const selectedStatus = ref('')
const selectedSupplierId = ref('')
const startDate = ref('')
const endDate = ref('')

//供應商下拉選單資料 後端查詢後放入
const supplierOptions = ref([])
//採購單狀態
const purchaseOrderStatusOptions = [
  {
    label: '草稿',
    value: 'DRAFT'
  },
  {
    label: '待簽核',
    value: 'PENDING'
  },
  {
    label: '已核准',
    value: 'APPROVED'
  },
  {
    label: '已退回',
    value: 'REJECTED'
  },
  {
    label: '已收貨',
    value: 'RECEIVED'
  },
  {
    label: '已完成',
    value: 'COMPLETED'
  },
  {
    label: '已取消',
    value: 'CANCELLED'
  }
]

// ---------- 分頁 ----------
const pageSize = ref(10)
const currentPage = ref(0)
const totalPages = ref(0)

// ---------- 採購單列表與彈出視窗 ----------
const purchaseOrderList = ref([])
const showPurchaseOrderDetail = ref(false)
const showUpdatePurchaseOrder = ref(false)
const selectedPurchaseOrder = ref(null)
const detailRefreshKey = ref(0)
const isCancelling = ref(false)

function changePageSize(size) {
  pageSize.value = size
  currentPage.value = 0
  fetchData()
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
  try {
    const response = await httpClient({
      method: 'get',
      url: '/api/purchaseOrder/page',

      params: {
        keyword: searchText.value || undefined,
        status: selectedStatus.value || undefined,
        supplierId: selectedSupplierId.value || undefined,
        startDate: startDate.value || undefined,
        endDate: endDate.value || undefined,
        page: currentPage.value,
        size: pageSize.value
      }
    })

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
    totalPages.value = response.data.totalPages
    currentPage.value = response.data.number
  } catch (error) {
    console.error('查詢採購單失敗：', error)
  }
}
// 搜尋監聽
watch(searchText, function () {
  currentPage.value = 0
  fetchData()
})
//狀態監聽
watch(selectedStatus, function () {
  currentPage.value = 0
  fetchData()
})
//供應商改變時重新查詢。
watch(selectedSupplierId, function () {
  currentPage.value = 0
  fetchData()
})
//開始日期或結束日期改變時重新查詢。
watch([startDate, endDate], function () {
  currentPage.value = 0
  fetchData()
})
//更新按鈕會重新取得供應商選項與採購單資料。
async function refreshData() {
  currentPage.value = 0
  await fetchSupplierOptions()
  await fetchData()
}


async function submitUpdate(updateData) {
  const purchaseOrderId = updateData.id

  //id 放在 URL，不重複放進 RequestBody。
  const requestData = {
    ...updateData
  }
  delete requestData.id

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
    alert('採購單修改成功')

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
  } catch (error) {
    console.error('修改採購單失敗：', error)

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      '採購單修改失敗'

    alert(errorMessage)
  }
}

function showDetail(onePurchaseOrder) {
  selectedPurchaseOrder.value = onePurchaseOrder
  showPurchaseOrderDetail.value = true
}

function closeDetail() {
  showCheckPurchaseOrder.value = false
  selectedPurchaseOrder.value = null
}

function showUpdate(onePurchaseOrder) {
  selectedPurchaseOrder.value = onePurchaseOrder
  showUpdatePurchaseOrder.value = true
}

function closeUpdate() {
  showUpdatePurchaseOrder.value = false
  selectedPurchaseOrder.value = null
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
