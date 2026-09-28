<script setup>
import { ref, onMounted } from "vue";
import { getLeaveRequestById } from "@/service/leaveRequestApi";

const props = defineProps({
  leaveId: {
    type: [String, Number],
    required: true,
  },
});

const loading = ref(false);
const error = ref("");
const leave = ref(null);

const leaveTypeLabel = {
  PERSONAL: "事假",
  SICK: "病假",
  ANNUAL: "特休",
  COMPENSATORY: "補休",
  MARRIAGE: "婚假",
  FUNERAL: "喪假",
  MATERNITY: "產假",
};

const durationLabel = {
  FULL_DAY: "全天",
  PARTIAL_DAY: "部分時段",
};

async function loadLeaveDetail() {
  loading.value = true;
  error.value = "";

  try {
    leave.value = await getLeaveRequestById(props.leaveId);
  } catch (err) {
    console.error(err);
    error.value = "無法取得請假資訊";
  } finally {
    loading.value = false;
  }
}

onMounted(loadLeaveDetail);
</script>

<template>
  <div class="leave-card">
    <div class="card-title">
      <span class="material-symbols-outlined">event_note</span>
      請假資訊
    </div>

    <p v-if="loading" class="state-text">讀取中...</p>
    <p v-else-if="error" class="state-text state-text--error">
      {{ error }}
    </p>

    <template v-else-if="leave">
        <div class="info-row">
            <span class="label">假別</span>
            <span class="value leave-type">
            {{ leaveTypeLabel[leave.leaveType] || leave.leaveType }}
            </span>
        </div>

        <div class="info-row">
            <span class="label">請假方式</span>
            <span class="value">
            {{ durationLabel[leave.leaveDurationType] || "全天" }}
            </span>
        </div>

        <div class="info-row">
            <span class="label">請假期間</span>
            <span class="value">
            <template v-if="leave.leaveDurationType === 'PARTIAL_DAY'">
                {{ leave.startDate }}
            </template>
            <template v-else>
                {{ leave.startDate }} ～ {{ leave.endDate }}
            </template>
            </span>
        </div>

        <div
            v-if="leave.leaveDurationType === 'PARTIAL_DAY'"
            class="info-row"
        >
            <span class="label">請假時間</span>
            <span class="value">
            {{ leave.startTime?.substring(0,5) }} ～
            {{ leave.endTime?.substring(0,5) }}
            </span>
        </div>

        <div class="info-row info-row--reason">
            <span class="label">請假原因</span>
            <span class="value">{{ leave.reason }}</span>
        </div>
    </template>
  </div>
</template>

<style scoped>
.leave-card {
  margin-top: 24px;
  padding:18px 20px;
  border-radius: 18px;
  background: rgba(8, 20, 46, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  font-size: 15px;
  font-weight: 700;
  color: white;
}

.info-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.label {
  color: #94a3b8;
}

.value {
  color: white;
  font-weight: 600;
}

.leave-type {
  color: #22d3ee;
}

.reason-box {
  margin-top: 18px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255,255,255,.03);
}

.reason-label {
  display: block;
  margin-bottom: 8px;
  color: #94a3b8;
  font-size: 13px;
}

.reason-box p {
  color: white;
  margin: 0;
  line-height: 1.6;
}

.state-text {
  color: #94a3b8;
}

.state-text--error {
  color: #f87171;
}
</style>