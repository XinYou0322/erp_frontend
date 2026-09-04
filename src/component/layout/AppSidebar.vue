<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

// 收合目前僅視覺切換（隱藏文字、縮窄寬度），之後要記住使用者偏好可以再接 localStorage
const collapsed = ref(false)
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <div class="sidebar__brand">
      <span class="sidebar__brand-mark">R</span>
      <span class="sidebar__brand-text">ERP 管理系統</span>
    </div>

    <nav class="sidebar__nav">
      <p class="sidebar__group-label">主功能</p>

      <RouterLink to="/material" class="sidebar__item">
        <svg class="sidebar__icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span class="sidebar__text">原物料管理</span>
      </RouterLink>

      <RouterLink to="/product" class="sidebar__item">
        <svg class="sidebar__icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2 L17 6 V14 L10 18 L3 14 V6 Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M3 6 L10 10 L17 6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M10 10 V18" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span class="sidebar__text">商品管理</span>
      </RouterLink>

      <RouterLink to="/bom" class="sidebar__item">
        <svg class="sidebar__icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4 H16 M4 4 V16 M4 16 H16 M16 4 V16 M4 10 H10 M10 4 V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span class="sidebar__text">BOM 管理</span>
      </RouterLink>

      <p class="sidebar__group-label">簽核流程</p>

      <RouterLink to="/workflows" class="sidebar__item">
        <svg class="sidebar__icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M7.5 10 L9.5 12 L13 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="sidebar__text">簽核中心</span>
      </RouterLink>

      <p class="sidebar__group-label">報表</p>

      <span class="sidebar__item sidebar__item--disabled">
        <svg class="sidebar__icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 16 V9 M9 16 V5 M14 16 V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span class="sidebar__text">銷售統計報表</span>
        <span class="sidebar__soon">即將推出</span>
      </span>

      <span class="sidebar__item sidebar__item--disabled">
        <svg class="sidebar__icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 6 V10 L13 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span class="sidebar__text">庫存耗損報表</span>
        <span class="sidebar__soon">即將推出</span>
      </span>
    </nav>

    <button type="button" class="sidebar__collapse" @click="collapsed = !collapsed">
      <span v-if="!collapsed">← 收合</span>
      <span v-else>→</span>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 224px;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  background: var(--wf-ink);
  display: flex;
  flex-direction: column;
  font-family: var(--wf-font);
  transition: width 0.15s ease;
}

.sidebar--collapsed {
  width: 68px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px;
  color: var(--wf-paper);
  overflow: hidden;
}

.sidebar__brand-mark {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: 1.5px solid var(--wf-seal);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wf-seal);
  font-weight: 700;
  font-size: 13px;
}

.sidebar__brand-text {
  font-size: 14.5px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.sidebar__group-label {
  font-size: 11px;
  color: var(--wf-ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 18px 10px 8px;
}

.sidebar__group-label:first-child {
  margin-top: 6px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: var(--wf-radius-sm);
  color: var(--wf-paper);
  opacity: 0.75;
  text-decoration: none;
  font-size: 13.5px;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar__item:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.06);
}

.sidebar__item.router-link-active {
  opacity: 1;
  background: rgba(166, 50, 31, 0.18);
  color: var(--wf-paper);
  box-shadow: inset 3px 0 0 var(--wf-seal);
}

.sidebar__item--disabled {
  cursor: default;
  opacity: 0.4;
}

.sidebar__item--disabled:hover {
  background: transparent;
  opacity: 0.4;
}

.sidebar__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.sidebar__soon {
  margin-left: auto;
  font-size: 10px;
  color: var(--wf-ink-faint);
  flex-shrink: 0;
}

.sidebar--collapsed .sidebar__text,
.sidebar--collapsed .sidebar__soon,
.sidebar--collapsed .sidebar__brand-text,
.sidebar--collapsed .sidebar__group-label {
  display: none;
}

.sidebar__collapse {
  margin: 10px 12px 16px;
  padding: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--wf-radius-sm);
  color: var(--wf-ink-faint);
  font-family: var(--wf-font);
  font-size: 12px;
  cursor: pointer;
}

.sidebar__collapse:hover {
  color: var(--wf-paper);
  border-color: rgba(255, 255, 255, 0.3);
}
</style>
