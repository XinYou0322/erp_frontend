<template>
  <h1>You did it!</h1>
  <!-- 1. 你的原本導覽列組件 -->
  <NavBar />

  <!-- 2. 主要路由內容切換區 -->
  <RouterView />

  <!-- 3. ✅ 補上通知中心側邊抽屜（點擊 NavBar 裡的鈴鐺時會自動滑出） -->
  <NotificationCenterDrawer />

  <p>
    Visit
    <a href="https://vuejs.org/" target="_blank" rel="noopener"> vuejs.org </a>
  </p>
</template>

<script setup>
import { RouterView } from "vue-router";
import NavBar from "@/component/NavBar.vue";

// 💡 補上通知抽屜組件的正確引入路徑
import NotificationCenterDrawer from "@/testErp-sheng/components/NotificationCenterDrawer.vue";
</script>
