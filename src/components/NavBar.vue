<template>

  <div class="nav container-fluid">

    <RouterLink to="/material">原物料管理</RouterLink>

    <RouterLink to="/product">商品管理</RouterLink>
    <RouterLink to="/bom">BOM管理</RouterLink>
    <RouterLink to="/supplier">供應商管理</RouterLink>
      <RouterLink to="/addsupplier">新增供應商</RouterLink>
    
  </div>

</template>


<script setup>

import { RouterLink } from 'vue-router'

</script>


<style scoped>

.nav {

  display: flex;

  gap: 20px;

  padding: 15px;

  background-color: #333;

}

.nav a {

  color: white;

  text-decoration: none;

  font-size: 16px;

}

.nav a.router-link-active {

  font-weight: bold;

  text-decoration: underline;

}

</style>