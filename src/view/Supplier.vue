<template>
  <div class="supplier-page">
    <HeadNavBar
       title="總覽"
      :total="totalElements"
      add-title="新增供應商"
      :active-tab="activeTab"
      @change-tab="changeTab"
      :show-search="true"
      search-placeholder="搜尋供應商名稱、電話、Email..."
      v-model:search-value="searchText"
      :show-status="true"
      status-default-text="全部狀態"
      :status-options="supplierStatusOptions"
      v-model:status-value="selectedStatus"
      :show-page-size="true"
      :page-size="pageSize"
      @update:page-size="changePageSize"
      :show-refresh="true"
      @refresh="fetchData"
    />
    <section
      v-if="activeTab === 'overview'"
      class="supplier-overview bento-card"
    >
      <div class="supplier-table-wrap">
        <table class="supplier-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>供應商名稱</th>
              <th>電話</th>
              <th>地址</th>
              <th>Email</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <OneSupplier
              v-for="(oneSupplier, index) in supplierList"
              :key="oneSupplier.id"
              :serial-number="currentPage * pageSize + index + 1"

              :id="oneSupplier.id"
              :name="oneSupplier.name"
              :phone-calling-code="oneSupplier.callingCode"
              :phone="oneSupplier.phone"
              :phone-extension="oneSupplier.extension"
              :address="oneSupplier.address"
              :email="oneSupplier.email"
              :status="oneSupplier.status"
            
              @show-detail="showDetail(oneSupplier)"
              @update-supplier="showUpdate(oneSupplier)"
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

    <AddSupplier
      v-else-if="activeTab === 'add'"
      :login-user-id="loginUserId"
      @saved="handleSupplierSaved"
    />

    <CheckSupplier
      v-if="showCheckSupplier"
      :visible="showCheckSupplier"
      :supplier="selectedSupplier"
      @close="closeDetail"
    />
    
    <UpdateSupplier
      v-if="showUpdateSupplier"
      :visible="showUpdateSupplier"
      :supplier="selectedSupplier"
      @close="closeUpdate"
      @update="submitUpdate"
    />
  </div>
</template>

<script setup>
import { ref, watch,onMounted } from 'vue'
import httpClient from '@/service/httpClient'
import HeadNavBar from '@/component/子元件/HeadNavBar.vue'
import OneSupplier from '@/component/子元件/OneSupplier.vue'
import CheckSupplier from '@/component/子元件/CheckSupplier.vue'
import UpdateSupplier from '@/component/子元件/UpdateSupplier.vue'
import AddSupplier from '@/component/子元件/AddSupplier.vue'
import Pagination from '@/component/子元件/Pagination.vue'


onMounted(() => {
  fetchData()
})
//登入者
const loginUserId = ref(1)
//HeadNavBar
const supplierList = ref([])    
const activeTab = ref('overview')
const searchText = ref('')
const selectedStatus = ref('')

const supplierStatusOptions = [
  {
    label: '待審核',
    value: 'PENDING'
  },
  {
    label: '合作中',
    value: 'ACTIVE'
  },
  {
    label: '暫停合作',
    value: 'INACTIVE'
  },
  {
    label: '暫停交易',
    value: 'SUSPENDED'
  },
  {
    label: '黑名單',
    value: 'BLACKLISTED'
  }
]
const pageSize = ref(10)
const currentPage = ref(0)
// 總筆數
const totalElements = ref(0)
// 總頁數
const totalPages = ref(0)


const showCheckSupplier = ref(false)
const showUpdateSupplier = ref(false)
const selectedSupplier = ref(null)
const addedCount = ref(0)


function changeTab(tab) {
  activeTab.value = tab
}

function changePageSize(size) {

  // 改成使用者選擇的每頁筆數
  pageSize.value = size

  // 每頁筆數改變時，回到第一頁
  currentPage.value = 0

  // 重新查詢分頁 API
  fetchData()

}
//接收 Pagination.vue 傳回的畫面頁碼
function changePage(page) {

  // Pagination.vue 的頁碼從 1 開始，後端 Spring Page 從 0 開始
  currentPage.value = page - 1

  // 使用新頁碼重新查詢後端分頁 API
  fetchData()
}
async function fetchData() {

  try {

    const response = await httpClient({
      method: 'get',
      url: '/api/Supplier/page',

      params: {
        keyword: searchText.value,
        page: currentPage.value,
        size: pageSize.value
      }
    })
    // Spring Page 的資料不是直接放在 response.data
    // 真正的供應商陣列在 content
    const responseList = Array.isArray(response.data.content)
      ? response.data.content
      : []
    const normalizedList = []

    for (const supplier of responseList) {

      normalizedList.push(
        normalizeSupplier(supplier)
      )

    }
    // 當頁供應商資料
    supplierList.value = normalizedList

    // 後端 Page 額外提供的分頁資訊
    totalElements.value = response.data.totalElements
    totalPages.value = response.data.totalPages
    currentPage.value = response.data.number
  } catch (error) {
    console.error('查詢供應商失敗：', error)
  }

}
watch(searchText, function () {

  // 每次重新搜尋時回到第一頁
  currentPage.value = 0

  // 重新向後端查詢
  fetchData()

})

function submitUpdate(updateData) {

  const supplierId = updateData.id

  const requestData = {
    name: updateData.name,
    callingCode: updateData.callingCode,
    phone: updateData.phone,
    extension: updateData.extension,
    address: updateData.address,
    email: updateData.email,
    status: updateData.status
  }

  httpClient({
    method: 'patch',
    url: `/api/Supplier/update/${supplierId}`,
    data: requestData
  })
    .then(response => {
      console.log('修改成功：', response.data)

      alert('供應商修改成功')

      // 關閉修改視窗
      closeUpdate()

      // 重新查詢，讓總覽顯示最新資料
      fetchData()
    })
    .catch(error => {
      console.error('修改供應商失敗：', error)

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        '供應商修改失敗'

      alert(errorMessage)
    })
}

function showDetail(oneSupplier) {
  selectedSupplier.value = oneSupplier
  showCheckSupplier.value = true
}

function closeDetail() {
  showCheckSupplier.value = false
  selectedSupplier.value = null
}


function showUpdate(oneSupplier) {
  selectedSupplier.value = oneSupplier
  showUpdateSupplier.value = true
}
function closeUpdate() {
  showUpdateSupplier.value = false
  selectedSupplier.value = null
}



function normalizeSupplier(supplier) {
  return {
    ...supplier,
    name: supplier.name ?? '',
    callingCode: supplier.callingCode ?? '',
    phone: supplier.phone ?? '',
    extension: supplier.extension ?? '',
    address: supplier.address ?? '',
    email: supplier.email ?? '',
    status: supplier.status ?? ''
  }
}

function handleSupplierSaved(savedSuppliers) {
  const savedSupplierList = Array.isArray(savedSuppliers)
    ? savedSuppliers
    : [savedSuppliers]

  for (const savedSupplier of savedSupplierList) {
    if (!savedSupplier) {
      continue
    }

    const normalizedSupplier = normalizeSupplier(savedSupplier)
    const existingIndex = supplierList.value.findIndex(function (supplier) {
      return supplier.id === normalizedSupplier.id
    })
    if (existingIndex >= 0) {
      supplierList.value.splice(existingIndex, 1, normalizedSupplier)
    } else {
      supplierList.value.push(normalizedSupplier)
    }
  }

  addedCount.value += savedSupplierList.filter(Boolean).length
  // 不修改 activeTab，因此新增成功後會繼續停留在 AddSupplier.vue。
}
</script>

<style>
</style>
