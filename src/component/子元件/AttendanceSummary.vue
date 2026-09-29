<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true,
  },
});

const loading = ref(false);
const error = ref("");
const days = ref([]);

const today = new Date();
const yearMonth = `${today.getFullYear()}-${String(
  today.getMonth() + 1
).padStart(2, "0")}`;

const STATUS_LABEL = {
  NORMAL: "正常",
  LATE: "遲到",
  EARLY_LEAVE: "早退",
  LATE_AND_EARLY_LEAVE: "遲到/早退",
  ABSENT: "缺勤",
  INCOMPLETE: "上班中",
};

const recentAttendance = computed(() => {
  return [...days.value]
    .filter((d) => d.records?.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
});

const attendanceCount = computed(() => {
  return summary.value.NORMAL + summary.value.LATE + summary.value.EARLY_LEAVE;
});

const consecutiveAttendance = computed(() => {
  const sorted = [...days.value].sort((a, b) => b.date.localeCompare(a.date));

  const start = sorted.findIndex((d) => d.records?.length > 0);
  if (start === -1) return 0;

  let count = 0;

  for (let i = start; i < sorted.length; i++) {
    if (sorted[i].records?.length > 0) {
      count++;
    } else {
      break;
    }
  }

  return count;
});

const summary = computed(() => {
  const result = {
    NORMAL: 0,
    LATE: 0,
    EARLY_LEAVE: 0,
    LATE_AND_EARLY_LEAVE: 0,
    ABSENT: 0,
  };

    days.value.forEach((d) => {
    const hasRecord = d.records?.length > 0;

    if (hasRecord) {
      // 有打卡就算出勤
      if (d.status === "LATE") {
        result.LATE++;
      } else if (
        d.status === "EARLY_LEAVE" ||
        d.status === "LATE_AND_EARLY_LEAVE"
      ) {
        result.EARLY_LEAVE++;
      } else {
        // 就算 API 回 REST_DAY，只要有打卡也算正常出勤
        result.NORMAL++;
      }
    } else if (d.status === "ABSENT") {
      result.ABSENT++;
    }
  });

  return result;
});

const recentRecords = computed(() => {
  return [...days.value]
    .filter((d) => d.records?.length)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
});

function formatTime(time) {
  if (!time) return "--";

  return new Date(time).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadAttendance() {
  loading.value = true;
  error.value = "";

  try {
    const res = await fetch(
      `/api/attendance/calendar?userId=${props.userId}&yearMonth=${yearMonth}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error();

    const data = await res.json();
    days.value = data.days || [];
  } catch {
    error.value = "無法取得出勤資料";
  } finally {
    loading.value = false;
  }
}

onMounted(loadAttendance);
</script>

<template>
  <div class="attendance-card">
    <div class="card-title">
      <span class="material-symbols-outlined">schedule</span>
      出勤摘要（本月）
    </div>

    <p v-if="loading" class="loading">讀取中...</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <template v-else>
      <!-- 統計 -->
      <div class="summary-grid">
        <div class="summary-item">
          <span class="value">{{ attendanceCount }}</span>
          <span class="label">出勤</span>
        </div>

        <div class="summary-item warning">
          <span class="value">{{ summary.LATE }}</span>
          <span class="label">遲到</span>
        </div>

        <div class="summary-item orange">
          <span class="value">{{ summary.EARLY_LEAVE }}</span>
          <span class="label">早退</span>
        </div>

        <div class="summary-item danger">
          <span class="value">{{ summary.ABSENT }}</span>
          <span class="label">缺勤</span>
        </div>
      </div>

    <div class="attendance-insight">
        <div class="insight-item">
            <span class="material-symbols-outlined">event_available</span>
            <div>
            <small>最近出勤</small>
            <strong v-if="recentAttendance">
                {{ recentAttendance.date }} ·
                {{ recentAttendance.records?.length ? "正常出勤" : STATUS_LABEL[recentAttendance.status] }}
            </strong>
            <strong v-else>無資料</strong>
            </div>
        </div>

        <div class="insight-item">
            <span class="material-symbols-outlined">local_fire_department</span>
            <div>
            <small>連續出勤</small>
            <strong>{{ consecutiveAttendance }} 天</strong>
            </div>
        </div>
    </div>

      <!-- 最近打卡 
      <div class="recent">
        <h4>最近打卡紀錄</h4>

        <div
          v-for="day in recentRecords"
          :key="day.date"
          class="record"
        >
          <div>
            <strong>{{ day.date }}</strong>
            <p>{{ STATUS_LABEL[day.status] }}</p>
          </div>

          <div class="time">
            {{ formatTime(day.clockInTime) }}
            →
            {{ formatTime(day.clockOutTime) }}
          </div>
        </div>

        <p v-if="recentRecords.length === 0" class="empty">
          尚無打卡紀錄
        </p>
      </div>
      -->
    </template>
  </div>
</template>

<style scoped>
.attendance-card{
  margin-top:24px;
  padding:20px;
  border-radius:18px;
  background:rgba(8,20,46,.55);
  border:1px solid rgba(255,255,255,.08);
}

.card-title{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:15px;
  font-weight:700;
  color:white;
  margin-bottom:18px;
}

.summary-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:12px;
}

.summary-item{
  background:rgba(255,255,255,.03);
  border-radius:14px;
  padding:14px;
  text-align:center;
}

.summary-item .value{
  display:block;
  font-size:24px;
  font-weight:700;
  color:#22d3ee;
}

.summary-item .label{
  font-size:12px;
  color:#94a3b8;
}

.warning .value{color:#facc15;}
.orange .value{color:#fb923c;}
.danger .value{color:#f87171;}

.recent{
  margin-top:22px;
}

.recent h4{
  color:white;
  margin-bottom:12px;
}

.record{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:12px 0;
  border-bottom:1px solid rgba(255,255,255,.06);
}

.record strong{
  color:white;
}

.record p{
  color:#94a3b8;
  font-size:13px;
}

.time{
  color:#cbd5e1;
  font-family:monospace;
}

.loading,
.error,
.empty{
  color:#94a3b8;
}

.attendance-insight {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin: 20px 0;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
}

.insight-item .material-symbols-outlined {
  font-size: 28px;
  color: #22d3ee;
}

.insight-item small {
  display: block;
  color: #94a3b8;
  font-size: 12px;
}

.insight-item strong {
  display: block;
  color: white;
  font-size: 18px;
  font-weight: 700;
}
</style>