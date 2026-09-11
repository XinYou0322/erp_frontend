<template>
  <div class="nav">
    <RouterLink to="/material">原物料管理</RouterLink>

    <RouterLink to="/product">商品管理</RouterLink>
    <RouterLink to="/bom">BOM管理</RouterLink>
    <RouterLink to="/LoginPage">登入</RouterLink>
    <RouterLink to="/PermissionPage">權限管理</RouterLink>
    <button
      @click="uiStore.isNotificationCenterOpen = true"
      title="通知中心"
      class="relative p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
    >
      <span class="material-symbols-outlined text-[20px]">notifications</span>
      <!-- 未讀計數氣泡 -->
      <span
        v-if="notifStore.unreadCount > 0"
        class="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm shadow-rose-950/50 animate-pulse"
      >
        {{ notifStore.unreadCount > 99 ? "99+" : notifStore.unreadCount }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";

import { useNotificationStore } from "../testErp-sheng/stores/notification.store";
import { useUIStore } from "../testErp-sheng/stores/ui.store";

const notifStore = useNotificationStore();
const uiStore = useUIStore();
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
