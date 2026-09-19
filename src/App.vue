<template>
  <div
    class="min-h-screen bg-[var(--surface)] text-[var(--on-surface)]"
  >
    <!-- ============================= -->
    <!-- 已登入 -->
    <!-- ============================= -->
    <template v-if="authStore.isAuthenticated && route.path !== '/login'">

      <!-- 背景 -->
      <WaveBackground />

      <!-- 左側 Sidebar -->
      <Sidebar />

      <!-- 上方導覽列 -->
      <TopNavBar />

      <!--
        主內容區

        Sidebar:
        w-64 = 16rem = 256px

        桌面版：
        md:ml-64
        → 整個內容往右移 256px

        md:w-[calc(100%-16rem)]
        → 主內容只使用 Sidebar 右側剩餘空間

        pt-16
        → 預留 TopNavBar 高度
      -->
      <main
        class="
          relative
          z-10
          min-h-screen
          pt-16
          md:ml-64
          md:w-[calc(100%-16rem)]
        "
      >
        <RouterView />
      </main>

      <!-- 通知抽屜 -->
      <NotificationCenterDrawer />

    </template>

    <!-- ============================= -->
    <!-- 登入頁 -->
    <!-- ============================= -->
    <template v-else>
      <div
        class="
          min-h-screen
          flex
          items-center
          justify-center
          p-4
        "
      >
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
import WaveBackground from "./view/WaveBackground.vue";


const route = useRoute();

const authStore = useAuthStore();
const notifStore = useNotificationStore();


// 當使用者登入成功或重新整理頁面時
// 自動建立 WebSocket 連線並拉取通知
const initNotificationConnection = () => {

  if (
    authStore.isAuthenticated &&
    authStore.currentUser?.id
  ) {

    notifStore.connectWebSocket(
      authStore.currentUser.id
    );

    notifStore.fetchNotifications();

    notifStore.fetchUnreadCount();
  }

};


// onMounted(() => {
//   initNotificationConnection();
// });


// watch(
//   () => authStore.isAuthenticated,

//   (isAuth) => {

//     if (isAuth) {
//       initNotificationConnection();
//     }

//   }
// );
</script>