<script setup>
import { useRoute } from 'vue-router'

// 頁面標題直接讀 router meta.title，各路由設定一次即可，不用每頁自己傳
const route = useRoute()
</script>

<template>
  <header class="topbar">
    <h2 class="topbar__title">{{ route.meta.title || '' }}</h2>

    <div class="topbar__search">
      <svg class="topbar__search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
        <path d="M13.5 13.5 L17.5 17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input type="text" placeholder="搜尋..." class="topbar__search-input" />
    </div>

    <div class="topbar__actions">
      <button type="button" class="topbar__icon-btn" aria-label="通知">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 8a5 5 0 0 1 10 0v4l1.5 2.5h-13L5 12V8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M8 16.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span class="topbar__badge"></span>
      </button>

      <button type="button" class="topbar__icon-btn" aria-label="說明">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 8a2 2 0 1 1 3 1.7c-.7.4-1 .8-1 1.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="10" cy="14" r="0.8" fill="currentColor"/>
        </svg>
      </button>

      <div class="topbar__user">
        <span class="topbar__avatar">使</span>
        <span class="topbar__username">使用者</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 28px;
  background: var(--wf-paper-raised);
  border-bottom: 1px solid var(--wf-line);
  font-family: var(--wf-font);
}

.topbar__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--wf-ink);
  margin: 0;
  white-space: nowrap;
}

.topbar__search {
  flex: 1;
  max-width: 360px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: 1px solid var(--wf-line-strong);
  border-radius: var(--wf-radius-sm);
  color: var(--wf-ink-faint);
}

.topbar__search-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.topbar__search-input {
  border: none;
  outline: none;
  font-family: var(--wf-font);
  font-size: 13px;
  color: var(--wf-ink);
  width: 100%;
  background: transparent;
}

.topbar__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar__icon-btn {
  position: relative;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 50%;
  color: var(--wf-ink-soft);
  cursor: pointer;
}

.topbar__icon-btn:hover {
  background: var(--wf-paper);
  color: var(--wf-ink);
}

.topbar__icon-btn svg {
  width: 18px;
  height: 18px;
}

.topbar__badge {
  position: absolute;
  top: 7px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--wf-seal);
}

.topbar__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 8px;
  margin-left: 4px;
  border-left: 1px solid var(--wf-line);
}

.topbar__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--wf-pending-tint);
  color: var(--wf-pending);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.topbar__username {
  font-size: 13px;
  color: var(--wf-ink);
  white-space: nowrap;
}
</style>
