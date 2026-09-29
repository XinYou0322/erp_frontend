<script setup>
import { computed } from "vue";
import StatusBadge from "../子元件/LeaveRequestStatusBadge.vue";

const props = defineProps({
  leave: { type: Object, required: true },
});

const formatHM = (time) => time?.substring(0, 5) || "";

const emit = defineEmits(["click"]);

const dayCount = computed(() => {
  const start = new Date(props.leave.startDate);
  const end = new Date(props.leave.endDate);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
});

const dateDisplay = computed(() => {
  if (props.leave.startDate === props.leave.endDate) {
    return props.leave.startDate;
  }
  return `${props.leave.startDate} → ${props.leave.endDate}`;
});

const leaveTypeLabel = computed(() => {
  const map = {
    ANNUAL: "特休",
    SICK: "病假",
    PERSONAL: "事假",
    MARRIAGE: "婚假",
  };
  return map[props.leave.leaveType] ?? props.leave.leaveType;
});

const durationLabel = computed(() => {
  if (props.leave.leaveDurationType === "PARTIAL_DAY") {
    return `${formatHM(props.leave.startTime)}–${formatHM(props.leave.endTime)}`;
  }

  return `${dayCount.value} 天`;
});
</script>

<template>
  <button class="bento-card leave-card" @click="emit('click', leave.id)">
    <div class="leave-card__header">
      <span class="leave-card__type">{{ leaveTypeLabel }}</span>
      <StatusBadge :status="leave.status" />
    </div>

    <div class="leave-card__dates font-data-mono">
      {{ dateDisplay }}
    </div>

    <p v-if="leave.reason" class="leave-card__reason">{{ leave.reason }}</p>

    <div class="leave-card__footer">
      <span class="material-symbols-outlined">
        {{ leave.leaveDurationType === "PARTIAL_DAY" ? "schedule" : "calendar_month" }}
      </span>
      <span>{{ durationLabel }}</span>
    </div>
  </button>
</template>

<style scoped>
.leave-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.1rem 1.2rem;
  text-align: left;
  cursor: pointer;
  width: 100%;
  color: inherit;
  font: inherit;
}

.leave-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.leave-card__type {
  font-weight: 600;
  font-size: 1rem;
  color: var(--on-surface);
}

.leave-card__dates {
  font-size: 0.85rem;
  color: var(--secondary);
}

.leave-card__reason {
  font-size: 0.85rem;
  color: var(--on-surface-variant);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin: 0;
}

.leave-card__footer {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--on-surface-variant);
  font-size: 0.8rem;
  margin-top: 0.2rem;
}

.leave-card__footer .material-symbols-outlined {
  font-size: 16px;
}
</style>
