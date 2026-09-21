<script setup>
import { computed } from "vue";
import { Bar } from "vue-chartjs";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

// 找出今日尖峰時段
const peakHours = computed(() => {
  if (!props.data.length) return [];

  const maxQuantity = Math.max(
    ...props.data.map(item => Number(item.quantity))
  );

  return props.data.filter(
    item => Number(item.quantity) === maxQuantity
  );
});

const chartData = computed(() => ({
  labels: props.data.map((d) => `${d.hour}:00`),
  datasets: [
    {
      label: "出杯數",
      data: props.data.map((d) => Number(d.quantity)),

      backgroundColor: props.data.map((d) =>
        peakHours.value.some(p => p.hour === d.hour)
            ? "#f59e0b"
            : "#3b82f6"
        ),

    borderColor: props.data.map((d) =>
        peakHours.value.some(p => p.hour === d.hour)
            ? "#fbbf24"
            : "#3b82f6"
        ),

      borderWidth: 1,
      borderRadius: 8,
      maxBarThickness: 30,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "#0f172a",
      borderColor: "#334155",
      borderWidth: 1,
      titleColor: "#f8fafc",
      bodyColor: "#f8fafc",
      callbacks: {
        label: (ctx) => {
      const isPeak = peakHours.value.some(
        p => p.hour === props.data[ctx.dataIndex].hour
      );

      return `${ctx.raw} 杯${isPeak ? " 🔥 尖峰" : ""}`;
      },
    },
    },
  },

  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#94a3b8",
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 5,
        color: "#94a3b8",
      },
      grid: {
        color: "rgba(51,65,85,.25)",
      },
    },
  },
};
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <div>
        <h3>全日出杯尖峰</h3>
        <p>今日各時段出杯數</p>
      </div>

      <span class="material-symbols-outlined">bar_chart</span>
    </div>

    <div v-if="peakHours.length" class="peak-info">
    🔥 今日尖峰：
    <strong>
        {{ peakHours.map(h => `${h.hour}:00`).join("、") }}
    </strong>
    （{{ peakHours[0].quantity }} 杯）
    </div>

    <div v-if="data.length === 0" class="empty">
      今日尚無銷售資料
    </div>

    <div v-else class="chart-container">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
}

.chart-header p {
  margin: 4px 0 0;
  color: var(--on-surface-variant);
  font-size: 13px;
}

.peak-info {
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: var(--on-surface);
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
}

.chart-container {
  height: 280px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: var(--on-surface-variant);
}
</style>