<template>
  <div class="nav">
    <RouterLink to="/material">原物料管理</RouterLink>
    <RouterLink to="/product">商品管理</RouterLink>
    <RouterLink to="/bom">BOM管理</RouterLink>
    <RouterLink to="/workflows">簽核中心</RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 14px 24px;
  background: var(--wf-ink);
  font-family: var(--wf-font);
}

.nav a {
  color: var(--wf-paper);
  opacity: 0.75;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
  transition: opacity 0.15s ease, border-color 0.15s ease;
}

.nav a:hover {
  opacity: 1;
}

/* 當前頁面：用印章紅色底線標示，呼應核准印章的強調色 */
.nav a.router-link-active {
  opacity: 1;
  border-bottom-color: var(--wf-seal);
}
</style>
