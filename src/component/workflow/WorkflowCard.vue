<script setup>
import WorkflowStatusBadge from './WorkflowStatusBadge.vue'

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({
      code: 'WF-2026-0091',
      documentType: 'LEAVE',
      summary: '身體不適，請一天病假',
      applicant: 'Alice',
      approver: 'Bob',
      date: '2026-09-01',
      status: 'pending',
    }),
  },
})

const typeLabel = { LEAVE: '請假', PURCHASE: '採購', EXPENSE: '費用' }
</script>

<template>
  <article class="card">
    <div class="card__top">
      <span class="card__type">{{ typeLabel[workflow.documentType] || workflow.documentType }}</span>
      <span class="card__code">{{ workflow.code }}</span>
    </div>

    <h3 class="card__title">{{ workflow.summary }}</h3>

    <div class="card__meta">
      <span class="card__meta-item">
        <span class="card__meta-label">申請人</span>
        <span class="card__meta-value">{{ workflow.applicant }}</span>
      </span>
      <span class="card__meta-arrow">→</span>
      <span class="card__meta-item">
        <span class="card__meta-label">簽核人</span>
        <span class="card__meta-value">{{ workflow.approver }}</span>
      </span>
    </div>

    <div class="card__bottom">
      <span class="card__date">{{ workflow.date }}</span>
      <WorkflowStatusBadge :status="workflow.status" size="sm" />
    </div>
  </article>
</template>

<style scoped>
.card {
  background: var(--wf-paper-raised);
  border: 1px solid var(--wf-line);
  border-radius: var(--wf-radius-md);
  padding: 16px 18px;
  font-family: var(--wf-font);
  transition: border-color 0.15s ease;
}

.card:hover {
  border-color: var(--wf-line-strong);
}

.card__top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.card__type {
  font-size: 12px;
  font-weight: 600;
  color: var(--wf-ink-soft);
  padding: 2px 8px;
  border: 1px solid var(--wf-line-strong);
  border-radius: 4px;
}

.card__code {
  font-family: var(--wf-font-mono);
  font-size: 12px;
  color: var(--wf-ink-faint);
  letter-spacing: 0.3px;
}

.card__title {
  font-size: 15px;
  font-weight: 500;
  color: var(--wf-ink);
  margin: 0 0 12px;
  line-height: 1.5;
}

.card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.card__meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card__meta-label {
  font-size: 11px;
  color: var(--wf-ink-faint);
}

.card__meta-value {
  font-size: 13px;
  color: var(--wf-ink);
  font-weight: 500;
}

.card__meta-arrow {
  color: var(--wf-line-strong);
  font-size: 13px;
  margin-top: 12px;
}

.card__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--wf-line);
}

.card__date {
  font-size: 12px;
  color: var(--wf-ink-soft);
  font-family: var(--wf-font-mono);
}
</style>
