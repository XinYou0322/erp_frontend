<template>
  <div class="nav">
    <RouterLink to="/material">原物料管理</RouterLink>

    <RouterLink to="/product">商品管理</RouterLink>
    <RouterLink to="/bom">BOM管理</RouterLink>
    <RouterLink to="/LoginPage">登入</RouterLink>
    <RouterLink to="/PermissionPage">權限管理</RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
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
