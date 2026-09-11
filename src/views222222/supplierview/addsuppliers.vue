<template>
    <div>
        <div>
            <h1>供應商管理</h1>
        </div>

        <div>
            <label>供應商名稱：</label>
            <input
                class="form-control"
                v-model="nameInput"/>
        </div>

        <div>
            <label>供應商電話：</label>
            <input
                class="form-control"
                type="string"
                v-model="phoneInput"
            />
        </div>

        <div>
            <label>供應商地址：</label>
            <input
                class="form-control"
                v-model="addressInput"
            />
        </div>

        <div>
            <label>供應商信箱：</label>
            <input
                class="form-control"
                type="email"
                v-model="emailInput"
            />
        </div>

        <button @click="addSupplier">
            送出
        </button>

        <div v-if="message">
            {{ message }}
        </div>
    </div>
</template>


<script setup>
import { ref } from 'vue'

import httpClient from '@/service/httpClient'


// 儲存四個輸入框的資料
const nameInput = ref('')
const phoneInput = ref(null)
const addressInput = ref('')
const emailInput = ref('')

// 顯示新增結果
const message = ref('')


//不能空新增
//電話號碼數字判斷
// 新增供應商
function addSupplier() {

    httpClient({
        method: 'post',
        url: '/api/supplier/add',

        data: {
            name: nameInput.value,
            phone: phoneInput.value,
            address: addressInput.value,
            email: emailInput.value
        }
    })
        .then(response => {

            console.log(response.data)
            message.value = '新增成功'
            // 新增成功後清空輸入框
            clearInput()
        })
        .catch(error => {
            console.log(error)
            message.value = '新增失敗'
        })
}

// 清空輸入框
function clearInput() {
    nameInput.value = ''
    phoneInput.value = ''
    addressInput.value = ''
    emailInput.value = ''
}


</script>


<style>
</style>