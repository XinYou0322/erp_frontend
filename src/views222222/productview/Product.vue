<template>

  <div class="container">

    <h2>商品管理測試</h2>

    <!-- ID -->
    <label>商品 ID</label>

    <input
      v-model="product.id"
      type="number"
      placeholder="修改時輸入 ID"
    />

    <button @click="getProduct">
      載入商品
    </button>


    <hr />


    <div class="form">

      <label>商品編號 SKU</label>

      <input
        v-model="product.sku"
        placeholder="例如 P001"
      />


      <label>商品名稱</label>

      <input
        v-model="product.name"
        placeholder="例如 珍珠奶茶"
      />


      <label>分類</label>

      <input
        v-model="product.category"
        placeholder="例如 奶茶類"
      />


      <label>售價</label>

      <input
        v-model="product.sellingPrice"
        type="number"
        step="0.01"
        placeholder="例如 60"
      />


      <label>成本價</label>

      <input
        v-model="product.costPrice"
        type="number"
        step="0.01"
        placeholder="例如 25"
      />


      <label>單位</label>

      <input
        v-model="product.unit"
        placeholder="例如 杯"
      />


      <label>狀態</label>

      <input
        v-model="product.status"
        placeholder="例如 上架 / 下架"
      />


      <!-- 新增 -->

      <button @click="addProduct">
        新增商品
      </button>


      <!-- 修改 -->

      <button @click="updateProduct">
        修改商品
      </button>

      <button @click="deleteProduct">
        刪除商品
      </button>

    </div>


    <!-- 顯示結果 -->

    <div v-if="result" class="message">
      {{ result }}
    </div>


    <hr />


    <h3>目前資料</h3>

    <pre>{{ product }}</pre>

  </div>

</template>


<script setup>

import { ref } from 'vue'

import httpClient from '@/service/httpClient'


const result = ref('')


const product = ref({

  id: null,

  sku: '',

  name: '',

  category: '',

  sellingPrice: '',

  costPrice: '',

  unit: '',

  status: ''

})


// =========================
// 新增商品
// =========================

function addProduct() {

  httpClient({

    method: 'post',

    url: '/api/product/add',

    data: {

      sku: product.value.sku,

      name: product.value.name,

      category: product.value.category,

      sellingPrice: product.value.sellingPrice,

      costPrice: product.value.costPrice,

      unit: product.value.unit,

      status: product.value.status

    }

  })

    .then(response => {

      console.log(response.status)

      result.value = '新增成功'

    })

    .catch(error => {

      console.log(error)

      result.value = '新增失敗'

    })

}


// =========================
// 查詢商品
// =========================

function getProduct() {

  httpClient({

    method: 'get',

    url: `/api/product/${product.value.id}`

  })

    .then(response => {

      console.log(response.data)

      product.value = response.data

      result.value = '取得商品成功'

    })

    .catch(error => {

      console.log(error)

      result.value = '找不到商品'

    })

}


// =========================
// 修改商品
// =========================

function updateProduct() {

  httpClient({

    method: 'put',

    url: `/api/productupdate/${product.value.id}`,

    data: {

      sku: product.value.sku,

      name: product.value.name,

      category: product.value.category,

      sellingPrice: product.value.sellingPrice,

      costPrice: product.value.costPrice,

      unit: product.value.unit,

      status: product.value.status

    }

  })

    .then(response => {

      console.log(response.status)

      product.value = response.data

      result.value = '修改成功'

    })

    .catch(error => {

      console.log(error)

      result.value = '修改失敗'

    })

}


// =========================
// 刪除商品
// =========================

function deleteProduct() {

  httpClient({

    method: 'delete',

    url: `/api/productdelete/${product.value.id}`

  })

    .then(response => {

      console.log(response.status)

      result.value = '刪除成功'

    })

    .catch(error => {

      console.log(error)

      result.value = '刪除失敗'

    })

}


</script>


<style scoped>

.container {

  width: 500px;

  margin: 50px auto;

  font-family: Arial, sans-serif;

}


.form {

  display: flex;

  flex-direction: column;

  gap: 10px;

}


input {

  padding: 8px;

  font-size: 16px;

}


button {

  margin-top: 10px;

  padding: 10px;

  font-size: 16px;

  cursor: pointer;

}


.message {

  margin-top: 20px;

  padding: 10px;

  background-color: #eee;

}


pre {

  padding: 15px;

  background-color: #f5f5f5;

}

</style>