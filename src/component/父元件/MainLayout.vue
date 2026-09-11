<!--
  =====================================================================
  【系統主框架版型 (Main Layout Container)】: src/testErp-sheng/layouts/MainLayout.vue
  =====================================================================
  職責說明：
  1. 提供登入後的使用者介面骨架 (Shell)。
  2. 整合固定側邊導航 (SideNavBar) 與頂部工具列 (TopNavBar)。
  3. 主內容區 (<main>) 動態承接各功能頁面的 <router-view />。
  4. 掛載全域性浮動提示通知 (Toast Notification) 附帶平滑進出場動畫。
  5. 統一掛載全域彈跳視窗 (條碼掃描機、新增品項、歷史歷程抽屜、系統設定、說明支援)。
-->

<script setup lang="ts">
import { useUIStore } from "../../stores/ui.store";
import SideNavBar from "./components/SideNavBar.vue";
import TopNavBar from "./components/TopNavBar.vue";
import BarcodeScannerModal from "../components/composite/BarcodeScannerModal.vue";
import NewItemModal from "../components/composite/NewItemModal.vue";
import HistoryDrawer from "../components/composite/HistoryDrawer.vue";
import NotificationCenterDrawer from "../components/composite/NotificationCenterDrawer.vue";
import SettingsModal from "../components/composite/SettingsModal.vue";
import HelpSupportModal from "../components/composite/HelpSupportModal.vue";

// 取得 UI 全域狀態管理 (用於控制 Toast 與全域對話框)
const uiStore = useUIStore();
</script>

<template>
  <!-- 最外層背景畫布：Slate-950 極暗色底，翠綠翡翠色文字選取效果 -->
  <div
    class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950"
  >
    <!-- 1. 左側固定導航欄 (在螢幕 >= md 時常駐於左方) -->
    <SideNavBar />

    <!-- 2. 頂部固定導航與快捷功能列 (包含全域搜尋與操作按鈕) -->
    <TopNavBar />

    <!-- 3. 主內容承載區塊：md:pl-60 保留左側欄 240px 寬度，pt-16 保留上方工具列 64px 高度 -->
    <main class="md:pl-60 pt-16 flex-1 flex flex-col">
      <div
        class="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1 flex flex-col"
      >
        <!-- 當前路由對應的子頁面會自動渲染在此處 -->
        <router-view />
      </div>
    </main>

    <!-- 4. 全域浮動 Toast 提示訊息 (支援 Vue Transition 漸層浮現與平滑位移動畫) -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="uiStore.toastMessage"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 border border-emerald-500/40 text-white rounded-2xl shadow-2xl shadow-black/80 font-semibold text-xs"
      >
        <span class="material-symbols-outlined text-emerald-400 text-[18px]">
          check_circle
        </span>
        <span>{{ uiStore.toastMessage }}</span>
      </div>
    </transition>

    <!-- 5. 全域共用彈跳視窗群 (由 ui.store 集中控制開關，任何子頁面皆可隨時叫用) -->
    <BarcodeScannerModal />
    <!-- 條碼掃描辨識彈窗 -->
    <NewItemModal />
    <!-- 快速新增物料/品項彈窗 -->
    <HistoryDrawer />
    <!-- 側邊滑出操作稽核歷程抽屜 -->
    <NotificationCenterDrawer />
    <!-- 側邊滑出全域通知中心抽屜 -->
    <SettingsModal />
    <!-- 系統個人化與偏好設定彈窗 -->
    <HelpSupportModal />
    <!-- 系統操作手冊與技術支援彈窗 -->
  </div>
</template>
