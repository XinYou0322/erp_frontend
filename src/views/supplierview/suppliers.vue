<template>
  <div class="erp-page">
    <HeadNavBar />
    <section class="erp-card erp-card--flat">
      <!-- 供應商表格 -->
      <div class="erp-table-wrap">
        <table class="erp-table">
          <!-- 表頭 -->
          <thead>
            <tr>
              <th>ID</th>
              <th>供應商名稱</th>
              <th>電話</th>
              <th>地址</th>
              <th>Email</th>
              <th>操作</th>
            </tr>
          </thead>
          <!-- 資料 -->
          <tbody>
            <OneSupplier
              v-for="oneSupplier in supplierList"
              :key="oneSupplier.id"
              :id="oneSupplier.id"
              :name="oneSupplier.name"
              :phone="oneSupplier.phone"
              :address="oneSupplier.address"
              :email="oneSupplier.email"
              @showDetail="showDetail"
              @editSupplier="editSupplier"
              @deleteSupplier="deleteSupplier"
            />
          </tbody>
        </table>
      </div>
    </section>
    <div
      v-if="detailSupplier"
      class="erp-modal-layer"
    >
      <section class="erp-modal">
        <div class="erp-modal__head">
          <h2 class="erp-modal__title">
            供應商詳細資料</h2>
          <button
            class="erp-icon-btn"
            @click="closeDetail"
          >×</button>
        </div>
        <div class="erp-form-grid">
          <div class="erp-field">
            <span class="erp-field__label">ID</span>
            <span>{{ detailSupplier.id }}</span>
          </div>
          <div class="erp-field">
            <span class="erp-field__label">供應商名稱</span>
            <span>{{ detailSupplier.name }}</span>
          </div>
          <!-- 電話 -->
          <div class="erp-field">
            <span class="erp-field__label">
              電話
            </span>
            <span>
              {{ detailSupplier.phone }}
            </span>
          </div>
          <!-- 地址 -->
          <div class="erp-field">
            <span class="erp-field__label">
              地址
            </span>
            <span>
              {{ detailSupplier.address }}
            </span>
          </div>
          <!-- Email -->
          <div class="erp-field erp-field--full">
            <span class="erp-field__label">
              Email
            </span>
            <span>
              {{ detailSupplier.email }}
            </span>
          </div>
        </div>
        <!-- 底部按鈕 -->
        <div class="erp-modal__footer">
          <button
            class="erp-btn erp-btn--soft"
            @click="closeDetail"
          >
            關閉
          </button>
        </div>
      </section>
    </div>
    <!-- =========================
         修改供應商
    ========================== -->
    <div
      v-if="editData"
      class="erp-modal-layer"
    >
      <section class="erp-modal">
        <!-- Modal 標題 -->
        <div class="erp-modal__head">
          <h2 class="erp-modal__title">
            修改供應商
          </h2>
          <button
            class="erp-icon-btn"
            @click="cancelEdit"
          >
            ×
          </button>
        </div>
        <!-- 修改表單 -->
        <div class="erp-form-grid">
          <!-- 供應商名稱 -->
          <div class="erp-field">
            <label class="erp-field__label">
              供應商名稱
            </label>
            <input
              class="erp-input"
              type="text"
              v-model="editData.name"
            >
          </div>
          <!-- 電話 -->
          <div class="erp-field">
            <label class="erp-field__label">
              電話
            </label>
            <input
              class="erp-input"
              type="text"
              v-model="editData.phone"
            >
          </div>
          <!-- 地址 -->
          <div class="erp-field erp-field--full">
            <label class="erp-field__label">
              地址
            </label>
            <input
              class="erp-input"
              type="text"
              v-model="editData.address"
            >
          </div>
          <!-- Email -->
          <div class="erp-field erp-field--full">
            <label class="erp-field__label">
              Email
            </label>
            <input
              class="erp-input"
              type="email"
              v-model="editData.email"
            >
          </div>
        </div>
        <div class="erp-modal__footer">
          <button
            class="erp-btn erp-btn--soft"
            @click="cancelEdit"
          >
            取消
          </button>
          <button
            class="erp-btn erp-btn--primary"
            @click="updateSupplier"
          >
            確認修改
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import OneSupplier from '@/components/Onesupplier.vue'
import httpClient from '@/service/httpClient'
import HeadNavBar from '@/components/HeadNavBar.vue'

// 存放所有供應商
const supplierList = ref([])
// 查看詳細資料使用
const detailSupplier = ref(null)
// 修改資料使用
const editData = ref(null)
// 頁面載入
onMounted(() => {
  fetchData()
})
// 查詢全部供應商
function fetchData() {
  httpClient({
    method: 'get',
    url: '/api/supplier/all'
  })
    .then(response => {
      supplierList.value =
        response.data
    })
    .catch(error => {
      console.error(
        '取得供應商資料失敗：',
        error
      )
    })
}
// 查看單筆詳細資料
// GET /api/supplier/{id}

function showDetail(id) {
  httpClient({
    method: 'get',
    url: `/api/supplier/${id}`
  })
    .then(response => {
      detailSupplier.value =
        response.data
    })
    .catch(error => {
      console.error(
        '取得供應商詳細資料失敗：',
        error
      )
    })
}
// 關閉詳細資料
function closeDetail() {
  detailSupplier.value = null
}
// 開啟修改畫面
function editSupplier(supplier) {
  // 建立一份新的物件
  // 避免直接改到列表中的原始資料
  editData.value = {
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone,
    address: supplier.address,
    email: supplier.email
  }
}
// 確認修改
// PUT /api/update/{id}
function updateSupplier() {
  httpClient({
    method: 'put',
    url: `/api/update/${editData.value.id}`,
    data: editData.value
  })
    .then(() => {
      alert('修改成功')
      // 關閉修改畫面
      editData.value = null
      // 重新查詢列表
      fetchData()
    })
    .catch(error => {
      console.error(
        '修改供應商失敗：',
        error
      )
    })
}
// 取消修改
function cancelEdit() {
  editData.value = null
}
// 刪除供應商
// DELETE /api/supplier/{id}
function deleteSupplier(id) {
  // 使用者先確認
  const result =
    confirm('確定要刪除這筆供應商資料嗎？')
  if (!result) {
    return
  }
  httpClient({
    method: 'delete',
    url: `/api/supplier/${id}`
  })
    .then(() => {
      alert('刪除成功')
      // 刪除完成重新查詢
      fetchData()
    })
    .catch(error => {
      console.error(
        '刪除供應商失敗：',
        error
      )
    })
}

</script>
<style >


</style>