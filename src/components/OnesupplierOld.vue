<template>
  <div class="supplier card">

    <p>ID：{{ id }}</p>

    <p>供應商名稱：{{ name }}</p>

    <p>電話：{{ phone }}</p>

    <p>地址：{{ address }}</p>

    <p>Email：{{ email }}</p>

  </div>
</template>

<script setup>

// 接收父元件傳過來的資料
defineProps({

  id: Number,

  name: String,

  phone: Number,

  address: String,

  email: String

})

</script>

<style>
</style>