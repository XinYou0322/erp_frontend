```vue
<template>

  <div class="container">

    <h2>原物料管理測試</h2>

    <!-- ID -->
    <label>原物料 ID</label>

    <input
      v-model="material.id"
      type="number"
      placeholder="修改時輸入 ID"
    />

    <button @click="getMaterial">
      載入原物料
    </button>


    <hr />


    <div class="form">

      <label>原物料編號</label>

      <input
        v-model="material.code"
        placeholder="例如 MAT001"
      />


      <label>原物料名稱</label>

      <input
        v-model="material.name"
        placeholder="例如 珍珠"
      />


      <label>單位</label>

      <input
        v-model="material.unit"
        placeholder="例如 g"
      />


      <label>成本</label>

      <input
        v-model="material.cost"
        type="number"
        step="0.01"
        placeholder="例如 0.25"
      />


      <!-- 新增 -->

      <button @click="addMaterial">
        新增原物料
      </button>


      <!-- 修改 -->

      <button @click="updateMaterial">
        修改原物料
      </button>

    <button @click="deleteMaterial">
        刪除原物料
      </button>





    </div>


    <!-- 顯示結果 -->

    <div v-if="result" class="message">
      {{ result }}
    </div>


    <hr />


    <h3>目前資料</h3>

    <pre>{{ material }}</pre>

  </div>

</template>


<script setup>

import { ref } from 'vue'

import httpClient from '@/service/httpClient'


const result = ref('')


const material = ref({

  id: null,

  code: '',

  name: '',

  unit: '',

  cost: ''

})


// =========================
// 新增原物料
// =========================

function addMaterial() {

  httpClient({

    method: 'post',

    url: '/api/material/add',

    data: {

      code: material.value.code,

      name: material.value.name,

      unit: material.value.unit,

      cost: material.value.cost

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
// 查詢原物料
// =========================

function getMaterial() {

  httpClient({

    method: 'get',

    url: `/api/materialfind/${material.value.id}`

  })

    .then(response => {

      console.log(response.data)

      material.value = response.data

      result.value = '取得原物料成功'

    })

    .catch(error => {

      console.log(error)

      result.value = '找不到原物料'

    })

}


// =========================
// 修改原物料
// =========================

function updateMaterial() {

  httpClient({

    method: 'put',

    url: `/api/materialupdate/${material.value.id}`,

    data: {

      code: material.value.code,

      name: material.value.name,

      unit: material.value.unit,

      cost: material.value.cost

    }

  })

    .then(response => {

      console.log(response.status)

      material.value = response.data

      result.value = '修改成功'

    })

    .catch(error => {

      console.log(error)

      result.value = '修改失敗'

    })

}


// =========================
// 修改原物料
// =========================

function deleteMaterial() {

  httpClient({

    method: 'delete',

    url: `/api/materialdelete/${material.value.id}`,

    data: {

  
    }

  })

    .then(response => {

      console.log(response.status)

      material.value = response.data

      result.value = '刪除成功'

    })

    .catch(error => {

      console.log(error)

      result.value = '修改失敗'

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
```
