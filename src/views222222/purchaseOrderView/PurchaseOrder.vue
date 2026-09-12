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
              <th>狀態</th>
              <th>建立人</th>
              <th>建立時間</th>
              <th>預計到貨日</th>
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

</script>
<style >


</style>