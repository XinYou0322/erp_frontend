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
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { RouterView } from "vue-router";

import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";
import {
  resolveBackendAssetUrl,
  useSystemSettingStore,
} from "@/stores/systemSetting.store";

import Sidebar from "./component/父元件/Sidebar.vue";
import TopNavBar from "./component/子元件/TopNavBar.vue";
import NotificationCenterDrawer from "./component/父元件/NotificationCenterDrawer.vue";
import WaveBackground from "./view/WaveBackground.vue";


const route = useRoute();

const authStore = useAuthStore();
const notifStore = useNotificationStore();
const systemSettingStore = useSystemSettingStore();
const { siteName, siteLogoUrl } = storeToRefs(systemSettingStore);

const applyBrowserBranding = () => {
  document.title = siteName.value || "深淵之流";
  let favicon = document.querySelector("link[rel='icon']");
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  const logoUrl = resolveBackendAssetUrl(siteLogoUrl.value);
  favicon.href = logoUrl
    ? `${logoUrl}${logoUrl.includes("?") ? "&" : "?"}v=${Date.now()}`
    : "/favicon.ico";
};


// 當使用者登入成功或重新整理頁面時
// 自動建立 WebSocket 連線並拉取通知
const initNotificationConnection = async () => {
  const currentUserId = authStore.currentUser?.id;
  const backendValid = authStore.isAuthenticated && authStore.isValidBackendUserId(currentUserId);

  if (!backendValid) {
    return;
  }

  notifStore.connectWebSocket(currentUserId);
  await notifStore.fetchNotifications();
  await notifStore.syncLowStockAlerts();
  await notifStore.fetchUnreadCount();
};

onMounted(async () => {
  const sessionValid = await authStore.restoreSessionFromBackend();
  if (sessionValid) {
    await systemSettingStore.loadBrandingSettings().catch((error) => {
      console.error("讀取網站外觀設定失敗：", error);
    });
    initNotificationConnection();
  }
});

watch([siteName, siteLogoUrl], applyBrowserBranding, { immediate: true });

watch(
  () => authStore.isAuthenticated,
  async (isAuth) => {
    if (isAuth) {
      const backendValid = await authStore.restoreSessionFromBackend();
      if (backendValid) {
        await systemSettingStore.loadBrandingSettings(true).catch((error) => {
          console.error("讀取網站外觀設定失敗：", error);
        });
        initNotificationConnection();
      }
    } else {
      authStore.clearFrontendSession();
    }
  },
);
</script>
