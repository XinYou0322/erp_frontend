<script setup>
// 對應 workflow_logs 的資料，逐筆呈現操作歷程
const props = defineProps({
  logs: {
    type: Array,
    default: () => [
      {
        action: "SUBMIT",
        operator: "強恩",
        remark: "家裡有事情",
        createdAt: "2026/9/4 下午2:01:54",
      },
    ],
  },
  // 若單據仍在等待下一關簽核，帶入下一位審核人名稱顯示空心節點
  pendingNext: {
    type: String,
    default: "",
  },
});

const actionLabel = { SUBMIT: "送出申請", APPROVE: "核准", REJECT: "駁回" };
</script>

<template>
  <ol class="timeline">
    <li
      v-for="(log, i) in logs"
      :key="i"
      class="timeline__item"
      :class="`timeline__item--${log.action.toLowerCase()}`"
    >
      <span class="timeline__dot"></span>
      <div class="timeline__body">
        <div class="timeline__head">
          <span class="timeline__action">{{
            actionLabel[log.action] || log.action
          }}</span>
          <span class="timeline__time">{{ log.createdAt }}</span>
        </div>
        <p class="timeline__remark">{{ log.remark }}</p>
        <span class="timeline__operator">{{ log.operator }}</span>
      </div>
    </li>

    <li v-if="pendingNext" class="timeline__item timeline__item--waiting">
      <span class="timeline__dot timeline__dot--hollow"></span>
      <div class="timeline__body">
        <div class="timeline__head">
          <span class="timeline__action timeline__action--waiting"
            >等待審核</span
          >
        </div>
        <span class="timeline__operator">{{ pendingNext }}</span>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: var(--wf-font);
}

.timeline__item {
  position: relative;
  padding-left: 24px;
  padding-bottom: 22px;
}

.timeline__item:last-child {
  padding-bottom: 0;
}

.timeline__item::before {
  content: "";
  position: absolute;
  left: 4px;
  top: 14px;
  bottom: -8px;
  width: 1px;
  background: var(--wf-line-strong);
}

.timeline__item:last-child::before {
  display: none;
}

.timeline__dot {
  position: absolute;
  left: 0;
  top: 4px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--wf-ink);
}

.timeline__item--approve .timeline__dot {
  background: var(--wf-seal);
}

.timeline__item--reject .timeline__dot {
  background: var(--wf-rejected);
}

.timeline__dot--hollow {
  background: transparent;
  border: 1.5px solid var(--wf-line-strong);
}

.timeline__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.timeline__action {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--wf-ink);
}

.timeline__item--approve .timeline__action {
  color: var(--wf-seal);
}

.timeline__item--reject .timeline__action {
  color: var(--wf-rejected);
}

.timeline__action--waiting {
  color: var(--wf-ink-faint);
  font-weight: 500;
}

.timeline__time {
  font-size: 11.5px;
  font-family: var(--wf-font-mono);
  color: var(--wf-ink-faint);
  white-space: nowrap;
}

.timeline__remark {
  font-size: 13px;
  color: var(--wf-ink-soft);
  margin: 4px 0 6px;
  line-height: 1.5;
}

.timeline__operator {
  font-size: 12px;
  color: var(--wf-ink-faint);
}
</style>
