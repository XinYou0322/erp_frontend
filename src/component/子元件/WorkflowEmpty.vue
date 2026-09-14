<script setup>
defineProps({
  message: { type: String, default: '目前沒有待簽核的單據' },
  subMessage: { type: String, default: '所有申請都已處理完成，之後有新申請會顯示在這裡' },
})
</script>

<template>
  <div class="empty">
    <svg class="empty__icon" width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="12" y="6" width="32" height="44" rx="2" stroke="#C7C3B8" stroke-width="1.5"/>
      <line x1="18" y1="18" x2="38" y2="18" stroke="#C7C3B8" stroke-width="1.5"/>
      <line x1="18" y1="26" x2="38" y2="26" stroke="#C7C3B8" stroke-width="1.5"/>
      <line x1="18" y1="34" x2="30" y2="34" stroke="#C7C3B8" stroke-width="1.5"/>
    </svg>
    <p class="empty__title">{{ message }}</p>
    <p class="empty__sub">{{ subMessage }}</p>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 20px;
  font-family: var(--wf-font);
}

.empty__icon {
  margin-bottom: 16px;
}

.empty__title {
  font-size: 15px;
  font-weight: 500;
  color: var(--wf-ink);
  margin: 0 0 6px;
}

.empty__sub {
  font-size: 13px;
  color: var(--wf-ink-faint);
  margin: 0;
}
</style>
