<script setup>
// status: 'pending' | 'approved' | 'rejected' | 'draft'
// size:   'sm'（表格用） | 'lg'（明細頁用）
const props = defineProps({
  status: { type: String, default: 'pending' },
  size: { type: String, default: 'sm' },
})

const labels = {
  pending: '待簽核',
  rejected: '已駁回',
  draft: '草稿',
}
</script>

<template>
  <span class="badge" :class="[`badge--${status}`, `badge--${size}`]">
    <!-- 已核准：印章造型，其餘狀態用簡單圓點 pill -->
    <span v-if="status === 'approved'" class="badge__stamp" :class="`badge__stamp--${size}`">
      <span class="badge__stamp-text">核准</span>
    </span>
    <template v-else>
      <span class="badge__dot"></span>
      <span class="badge__text">{{ labels[status] || status }}</span>
    </template>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--wf-font);
  font-weight: 500;
  line-height: 1;
}

.badge--sm {
  font-size: 12.5px;
}

.badge--lg {
  font-size: 14px;
}

.badge--pending,
.badge--rejected,
.badge--draft {
  padding: 5px 10px;
  border-radius: 999px;
}

.badge--lg.badge--pending,
.badge--lg.badge--rejected,
.badge--lg.badge--draft {
  padding: 7px 14px;
}

.badge--pending {
  background: var(--wf-pending-tint);
  color: var(--wf-pending);
}

.badge--rejected {
  background: var(--wf-rejected-tint);
  color: var(--wf-rejected);
}

.badge--draft {
  background: var(--wf-line);
  color: var(--wf-ink-soft);
}

.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

/* 核准 = 印章造型：雙圈紅色外框 + 微旋轉，呼應公文用印意象 */
.badge__stamp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--wf-seal);
  border-radius: 50%;
  transform: rotate(-8deg);
  position: relative;
  flex-shrink: 0;
}

.badge__stamp--sm {
  width: 42px;
  height: 42px;
}

.badge__stamp--lg {
  width: 72px;
  height: 72px;
}

.badge__stamp::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid var(--wf-seal);
  border-radius: 50%;
}

.badge__stamp-text {
  color: var(--wf-seal);
  font-weight: 700;
  letter-spacing: 1px;
}

.badge--sm .badge__stamp-text {
  font-size: 10.5px;
}

.badge--lg .badge__stamp-text {
  font-size: 13px;
}
</style>
