<template>

  <div class="container">

    <h2>BOM 配方管理測試</h2>

    <!-- 選擇商品 -->
    <label>商品 ID</label>

    <input
      v-model="productId"
      type="number"
      placeholder="輸入商品 ID"
    />

    <button @click="loadBomList">
      載入該商品的配方
    </button>


    <hr />


    <h3>目前配方列表</h3>

    <table v-if="bomList.length > 0">

      <thead>
        <tr>
          <th>BOM ID</th>
          <th>原物料 ID</th>
          <th>用量</th>
          <th>操作</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in bomList" :key="item.id">

          <td>{{ item.id }}</td>

          <td>{{ item.material.id }}</td>

          <td>
            <input
              v-model="item.quantity"
              type="number"
              step="0.01"
            />
          </td>

          <td>
            <button @click="updateBom(item)">修改</button>
            <button @click="deleteBom(item.id)">刪除</button>
          </td>

        </tr>
      </tbody>

    </table>

    <p v-else>目前沒有配方資料</p>


    <hr />


    <h3>新增配方</h3>

    <div class="form">

      <label>原物料 ID</label>

      <input
        v-model="newBom.materialId"
        type="number"
        placeholder="例如 1"
      />

      <label>用量</label>

      <input
        v-model="newBom.quantity"
        type="number"
        step="0.01"
        placeholder="例如 50"
      />

      <button @click="addBom">
        新增配方
      </button>

    </div>


    <!-- 顯示結果 -->

    <div v-if="result" class="message">
      {{ result }}
    </div>

  </div>

</template>


<script setup>

import { ref } from 'vue'

import httpClient from '@/service/httpClient'


const result = ref('')

const productId = ref(null)

const bomList = ref([])

const newBom = ref({

  materialId: '',

  quantity: ''

})


// =========================
// 查詢某商品底下所有配方
// =========================

function loadBomList() {

  httpClient({

    method: 'get',

    url: `/api/bom/product/${productId.value}`

  })

    .then(response => {

      console.log(response.data)

      bomList.value = response.data

      result.value = '載入成功'

    })

    .catch(error => {

      console.log(error)

      result.value = '載入失敗'

    })

}


// =========================
// 新增配方
// =========================

function addBom() {

  httpClient({

    method: 'post',

    url: '/api/bom/add',

    data: {

      product: {
        id: productId.value
      },

      material: {
        id: newBom.value.materialId
      },

      quantity: newBom.value.quantity

    }

  })

    .then(response => {

      console.log(response.status)

      result.value = '新增成功'

      loadBomList()

    })

    .catch(error => {

      console.log(error)

      result.value = '新增失敗'

    })

}


// =========================
// 修改配方
// =========================

function updateBom(item) {

  httpClient({

    method: 'put',

    url: `/api/bomupdate/${item.id}`,

    data: {

      quantity: item.quantity

    }

  })

    .then(response => {

      console.log(response.status)

      result.value = '修改成功'

    })

    .catch(error => {

      console.log(error)

      result.value = '修改失敗'

    })

}


// =========================
// 刪除配方
// =========================

function deleteBom(id) {

  httpClient({

    method: 'delete',

    url: `/api/bomdelete/${id}`

  })

    .then(response => {

      console.log(response.status)

      result.value = '刪除成功'

      loadBomList()

    })

    .catch(error => {

      console.log(error)

      result.value = '刪除失敗'

    })

}


</script>


<style scoped>

.container {

  width: 600px;

  margin: 50px auto;

  font-family: Arial, sans-serif;

}


.form {

  display: flex;

  flex-direction: column;

  gap: 10px;

  margin-bottom: 20px;

}


input {

  padding: 8px;

  font-size: 16px;

}


button {

  margin-top: 10px;

  padding: 8px 12px;

  font-size: 14px;

  cursor: pointer;

}


table {

  width: 100%;

  border-collapse: collapse;

  margin-bottom: 20px;

}


th, td {

  border: 1px solid #ccc;

  padding: 8px;

  text-align: center;

}


.message {

  margin-top: 20px;

  padding: 10px;

  background-color: #eee;

}

</style>