<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import { useInventoryStore } from "../stores/inventory.store";
import { useNotificationStore } from "../stores/notification.store";
import { useUIStore } from "../stores/ui.store";
import { UserProfile } from "../types";

const router = useRouter();
const authStore = useAuthStore();
const inventoryStore = useInventoryStore();
const notifStore = useNotificationStore();
const uiStore = useUIStore();

const isUserMenuOpen = ref(false);

const handleUserSelect = (u: UserProfile) => {
  authStore.switchUser(u);
  isUserMenuOpen.value = false;
  uiStore.showToast(`已切換身分為：${u.name} (${u.roleName})`);
};

const handleLogout = () => {
  authStore.logout();
  isUserMenuOpen.value = false;
  router.push("/login");
};
</script>

<template>
  <header
    class="fixed top-0 right-0 left-0 md:left-60 h-16 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 z-30 px-4 sm:px-6 flex items-center justify-between gap-4"
  >
    <!-- Left: Mobile Menu Toggle & Search Bar -->
    <div class="flex items-center gap-3 flex-1 max-w-md">
      <!-- Mobile hamburger -->
      <button
        @click="uiStore.toggleMobileNav"
        class="md:hidden text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 cursor-pointer"
      >
        <span class="material-symbols-outlined text-[20px]">menu</span>
      </button>

      <!-- Global Search -->
      <div class="relative w-full">
        <span
          class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]"
        >
          search
        </span>
        <input
          type="text"
          v-model="uiStore.globalSearchTerm"
          placeholder="搜尋 SKU、原物料、供應商或單號..."
          class="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all font-sans"
        />
        <span
          v-if="uiStore.globalSearchTerm"
          @click="uiStore.setGlobalSearch('')"
          class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[16px] cursor-pointer"
        >
          close
        </span>
      </div>
    </div>

    <!-- Right: Quick actions, notifications & User role profile -->
    <div class="flex items-center gap-2 sm:gap-3">
      <!-- Low Stock Warning Icon -->
      <div
        v-if="
          inventoryStore.lowStockMaterials.length > 0 && uiStore.lowStockNotice
        "
        class="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-bold font-data-mono cursor-pointer transition-colors"
        @click="
          notifStore.activeCategory = 'inventory';
          uiStore.isNotificationCenterOpen = true;
        "
        title="查看庫存告急通知"
      >
        <span class="material-symbols-outlined text-[16px] animate-pulse"
          >warning</span
        >
        <span>{{ inventoryStore.lowStockMaterials.length }} 項庫存告急</span>
      </div>

      <!-- Calendar Shortcut Button -->
      <button
        @click="router.push('/calendar')"
        title="行事曆與排程"
        class="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
        :class="
          router.currentRoute.value.path === '/calendar'
            ? 'text-emerald-400 border-emerald-500/40 bg-slate-800'
            : ''
        "
      >
        <span class="material-symbols-outlined text-[20px]"
          >calendar_month</span
        >
      </button>

      <!-- System Logs & Sales History Drawer Toggle -->
      <button
        @click="uiStore.isHistoryDrawerOpen = true"
        title="系統日誌與交易紀錄"
        class="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
      >
        <span class="material-symbols-outlined text-[20px]">history</span>
      </button>

      <!-- Notification Center Drawer Toggle -->
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

      <!-- User Role Dropdown Switcher -->
      <div class="relative">
        <button
          @click="isUserMenuOpen = !isUserMenuOpen"
          class="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer"
        >
          <div class="text-right hidden sm:block">
            <span class="text-xs font-bold text-white block">{{
              authStore.currentUser.name
            }}</span>
            <span
              class="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block"
            >
              {{ authStore.currentUser.roleName }}
            </span>
          </div>
          <img
            :src="authStore.currentUser.avatar"
            :alt="authStore.currentUser.name"
            class="w-8 h-8 rounded-xl object-cover border border-emerald-500/40"
          />
          <span class="material-symbols-outlined text-slate-400 text-[18px]">
            expand_more
          </span>
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="isUserMenuOpen"
          class="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-level-2 p-2 z-50 animate-in fade-in zoom-in-95"
        >
          <div class="px-3 py-2 border-b border-slate-800 mb-1">
            <p class="text-[11px] text-slate-400">當前登入身分</p>
            <p class="text-xs font-bold text-white">
              {{ authStore.currentUser.email }}
            </p>
          </div>

          <div class="space-y-0.5">
            <p
              class="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-3 py-1"
            >
              切換測試角色
            </p>
            <button
              v-for="u in authStore.users"
              :key="u.id"
              @click="handleUserSelect(u)"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer"
              :class="
                authStore.currentUser.id === u.id
                  ? 'bg-slate-800 text-emerald-400 font-bold'
                  : 'text-slate-300 hover:bg-slate-800/60'
              "
            >
              <img :src="u.avatar" class="w-5 h-5 rounded-md object-cover" />
              <div class="truncate">
                <span class="block">{{ u.name }}</span>
                <span class="text-[10px] text-slate-400">{{ u.roleName }}</span>
              </div>
            </button>
          </div>

          <div class="pt-1 mt-1 border-t border-slate-800 space-y-0.5">
            <button
              v-if="authStore.hasPermission('permissions.view')"
              @click="
                router.push('/permissions');
                isUserMenuOpen = false;
              "
              class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left"
            >
              <span class="material-symbols-outlined text-[16px]"
                >admin_panel_settings</span
              >
              <span>權限與使用者管理</span>
            </button>
            <button
              @click="handleLogout"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
            >
              <span class="material-symbols-outlined text-[16px]">logout</span>
              <span>登出系統</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
