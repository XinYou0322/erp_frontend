<template>
  <div class="container">
    <h2>原物料新增測試</h2>

    <div class="form">
      <label>原物料編號</label>
      <input v-model="material.code" placeholder="例如 MAT001" />

      <label>原物料名稱</label>
      <input v-model="material.name" placeholder="例如 珍珠" />

      <label>單位</label>
      <input v-model="material.unit" placeholder="例如 g" />

      <label>成本</label>
      <input
        v-model="material.cost"
        type="number"
        step="0.01"
        placeholder="例如 0.25"
      />

      <button @click="addMaterial">
        新增原物料
      </button>
    </div>

    <div v-if="message" class="message">
      {{ result }}
    </div>

    <hr />

    <h3>目前輸入的資料</h3>

    <pre>{{ material }}</pre>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import httpClient from '@/service/httpClient'

const result = ref('')
const material = ref({
  code: '',
  name: '',
  unit: '',
  cost: ''
})
 
const message = ref('')

function addMaterial  () {

    httpClient({
        method: 'post',
        url: '/api/users/register',
        data: {
                code: material.value.code,
        name: material.value.name,
        unit: material.value.unit,
        cost: material.value.cost
        }
    })
        .then(response =>{
            console.log(response.status)
            result.value = '新增成功'
         
        } )
        .catch(error => {
            console.log(error)
            result.value = '註冊失敗，此帳號已經存在'
       
        });
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