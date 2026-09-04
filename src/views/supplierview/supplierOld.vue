<template>
  <h1>供應商總覽</h1>

  <OneSupplier
    v-for="oneSupplier in supplierList"
    :key="oneSupplier.id"
    :id="oneSupplier.id"
    :name="oneSupplier.name"
    :phone="oneSupplier.phone"
    :address="oneSupplier.address"
    :email="oneSupplier.email"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import OneSupplier from '@/components/Onesupplier.vue'
import httpClient from '@/service/httpClient'

// 存放所有供應商
const supplierList = ref([])


// 頁面載入後執行
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

      // Controller 回傳 List<Suppliers>
      // 所以 response.data 就是供應商陣列
      supplierList.value = response.data

      console.log('全部供應商：', supplierList.value)
    })
    .catch(error => {
      console.error('取得供應商失敗：', error)
    })
}
</script>

<style>
</style>