<template>
  <div class="erp-shell min-h-screen bg-slate-950 text-slate-100">
    <!-- 僅在登入後且非登入頁面時顯示頂部工具列、側邊欄與通知抽屜 -->
    <template v-if="authStore.isAuthenticated && route.path !== '/login'">
      <Sidebar />
      <TopNavBar />
      <main class="erp-main md:pl-64 pt-16 min-h-screen">
        <RouterView />
      </main>
      <NotificationCenterDrawer />
    </template>

    <!-- 登入頁獨立乾淨畫布 -->
    <template v-else>
      <div class="min-h-screen flex items-center justify-center p-4">
        <RouterView />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { RouterView } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";
import Sidebar from "./component/父元件/Sidebar.vue";
import TopNavBar from "./component/子元件/TopNavBar.vue";
import NotificationCenterDrawer from "./component/父元件/NotificationCenterDrawer.vue";

const route = useRoute();
const authStore = useAuthStore();
const notifStore = useNotificationStore();

// 當使用者登入成功或重整頁面時，自動建立 WebSocket 連線並拉取通知
const initNotificationConnection = () => {
  if (authStore.isAuthenticated && authStore.currentUser?.id) {
    notifStore.connectWebSocket(authStore.currentUser.id);
    notifStore.fetchNotifications();
    notifStore.fetchUnreadCount();
  }
};

onMounted(() => {
  initNotificationConnection();
});

watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      initNotificationConnection();
    }
  }
);


import WaveBackground from './view/WaveBackground.vue';

</script>