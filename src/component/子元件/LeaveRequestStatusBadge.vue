<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true // DRAFT | PENDING | APPROVED | REJECTED | CANCELLED
  }
})

const config = computed(() => {
  const map = {
    DRAFT: { label: '草稿', icon: 'edit_note', color: 'var(--on-surface-variant)', bg: 'rgba(148, 163, 184, 0.12)' },
    PENDING: { label: '審核中', icon: 'hourglass_top', color: 'var(--tertiary)', bg: 'rgba(245, 158, 11, 0.14)' },
    APPROVED: { label: '已核准', icon: 'check_circle', color: 'var(--primary)', bg: 'rgba(16, 185, 129, 0.14)' },
    REJECTED: { label: '已駁回', icon: 'cancel', color: 'var(--error)', bg: 'rgba(244, 63, 94, 0.14)' },
    CANCELLED: { label: '已取消', icon: 'block', color: 'var(--on-surface-variant)', bg: 'rgba(148, 163, 184, 0.08)' }
  }
  return map[props.status] ?? map.DRAFT
})
</script>

<template>
  <span class="status-badge" :style="{ color: config.color, backgroundColor: config.bg }">
    <span class="material-symbols-outlined fill">{{ config.icon }}</span>
    {{ config.label }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge .material-symbols-outlined {
  font-size: 16px;
}
</style>
