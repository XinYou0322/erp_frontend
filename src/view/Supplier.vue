<template>
  <div class="erp-page">
    <HeadNavBar
      title="總覽"
      :total="supplierList.length"
      title2="新增"
      :total2="addedCount"
      :active-tab="activeTab"
      @change-tab="changeTab"
    />
    <section
      v-if="activeTab === 'overview'"
      class="erp-card erp-card--flat"
    >
      <div class="erp-table-wrap">
        <table class="erp-table">
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
              :serial-number="index + 1"


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
import { ref, onMounted } from 'vue'
import httpClient from '@/service/httpClient'
import HeadNavBar from '@/component/子元件/HeadNavBar.vue'
import OneSupplier from '@/component/子元件/OneSupplier.vue'
import CheckSupplier from '@/component/子元件/CheckSupplier.vue'
import UpdateSupplier from '@/component/子元件/UpdateSupplier.vue'
import AddSupplier from '@/component/子元件/AddSupplier.vue'

onMounted(() => {
  fetchData()
})

const supplierList = ref([])    
const activeTab = ref('overview')
const loginUserId = ref(1)

const showCheckSupplier = ref(false)
const showUpdateSupplier = ref(false)
const selectedSupplier = ref(null)
const addedCount = ref(0)

function changeTab(tab) {
  activeTab.value = tab
}

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

async function fetchData() {
  try {
    const response = await httpClient({
      method: 'get',
      url: '/api/Supplier/All'
    })

    const responseList = Array.isArray(response.data)
      ? response.data
      : []

    const normalizedList = []

    for (const supplier of responseList) {
      normalizedList.push(normalizeSupplier(supplier))
    }

    supplierList.value = normalizedList
  } catch (error) {
    console.error('查詢供應商失敗：', error)
  }
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
