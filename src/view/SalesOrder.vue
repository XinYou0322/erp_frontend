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
              :created-at="oneSalesOrder.createdAt"

              @show-detail="showDetail"
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
import { ref, watch, onMounted } from 'vue'
import httpClient from '@/service/httpClient'
import Filter from '@/component/子元件/Filter.vue'
import OneSalesOrders from '@/component/子元件/OneSalesOrder.vue'
import Pagination from '@/component/子元件/Pagination.vue'

onMounted(() => {
  fetchData()
})

const loginUserId = ref(1)

const pageSize = ref(10)
const currentPage = ref(0)
const totalPages = ref(0)

//------- filter -------
// ---status
const selectedStatus = ref('')

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
//狀態監聽
watch(selectedStatus, function () {
  currentPage.value = 0
  fetchData()
})

// ---日期篩選
const startDate = ref('')
const endDate = ref('')
//開始日期或結束日期改變時重新查詢。
watch([startDate, endDate], function () {
  currentPage.value = 0
  fetchData()
})

// ---搜尋
const searchText = ref('')
// 監聽
watch(searchText, function () {
  currentPage.value = 0
  fetchData()
})
// ---更新

// //更新按鈕會重新取得銷售單資料。
// async function refreshData() {
//   currentPage.value = 0
//   await fetchData()
// }

//--------銷售單資料--------
const salesOrderList = ref([])
const isLoading = ref(false)

//切換每頁筆數
function changePageSize(size) {
  pageSize.value = size
  currentPage.value = 0
  fetchData()
}
function changePage(page) {
  currentPage.value = page - 1
  fetchData()
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

    // Spring Page 的銷售單陣列放在 content。
    const responseList = Array.isArray(response.data.content)
      ? response.data.content
      : []

    const normalizedList = []

    // 使用傳統 for...of，逐筆補上 DTO 可能缺少的預設值。
    for (const salesOrder of responseList) {
      normalizedList.push(
        normalizeSalesOrder(salesOrder)
      )
    }

    salesOrderList.value = normalizedList
    totalPages.value = Number(response.data.totalPages) || 0
    currentPage.value = Number(response.data.number) || 0
  } catch (error) {
    console.error('查詢銷售單失敗：', error)
    salesOrderList.value = []
    totalPages.value = 0

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      '查詢銷售單失敗'

    alert(errorMessage)
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
    createdAt: salesOrder.createdAt ?? ''
  }
}
watch(searchText, function () {
  currentPage.value = 0
  fetchData()
})

watch(selectedStatus, function () {
  currentPage.value = 0
  fetchData()
})

watch([startDate, endDate], function () {
  currentPage.value = 0
  fetchData()
})

async function refreshData() {
  currentPage.value = 0
  await fetchData()
}

async function showDetail(salesOrderId) {
  try {
    const response = await httpClient({
      method: 'get',
      url: `/api/SalesOrder/find/${salesOrderId}`
    })

    const salesOrder = response.data
    const itemTextList = []

    for (const item of salesOrder.items ?? []) {
      itemTextList.push(
        `${item.productName} × ${item.quantity}：NT$${Number(item.subtotal).toLocaleString('zh-TW')}`
      )
    }

    const itemText = itemTextList.length > 0
      ? itemTextList.join('\n')
      : '沒有商品明細'

    alert(
      `銷售單號：${salesOrder.orderNumber}\n` +
      `建立人：${salesOrder.createdByName}\n` +
      `總金額：NT$${Number(salesOrder.totalAmount).toLocaleString('zh-TW')}\n\n` +
      `商品明細：\n${itemText}`
    )
  } catch (error) {
    console.error('查詢銷售單明細失敗：', error)

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      '查詢銷售單明細失敗'

    alert(errorMessage)
  }
}

async function voidSalesOrder(salesOrderId) {
  const inputReason = window.prompt('請輸入作廢原因')

  // 按下「取消」時 prompt 會回傳 null，此時不呼叫 API。
  if (inputReason === null) {
    return
  }

  const voidReason = inputReason.trim()

  // 後端 SalesOrderVoidDTO 使用 @NotBlank，因此前端先阻擋空白內容。
  if (!voidReason) {
    alert('作廢原因不可為空')
    return
  }

  const confirmed = window.confirm('確定要作廢這筆銷售單嗎？')

  if (!confirmed) {
    return
  }

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
  } catch (error) {
    console.error('作廢銷售單失敗：', error)

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      '銷售單作廢失敗'

    alert(errorMessage)
  }
}




</script>
<style >
</style>