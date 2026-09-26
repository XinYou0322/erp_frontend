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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const chartData = computed(() => ({
  labels: props.data.map((item) => item.materialName),
  datasets: [
    {
      label: "手動領料",
      data: props.data.map((item) => Number(item.manualIssueQuantity || 0)),
      backgroundColor: "rgba(14, 165, 233, 0.75)",
      borderColor: "#38bdf8",
      borderWidth: 1,
      borderRadius: 6,
      maxBarThickness: 26,
    },
    {
      label: "銷售理論耗用",
      data: props.data.map((item) => Number(item.theoreticalUsageQuantity || 0)),
      backgroundColor: "rgba(245, 158, 11, 0.75)",
      borderColor: "#fbbf24",
      borderWidth: 1,
      borderRadius: 6,
      maxBarThickness: 26,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      labels: { color: "#cbd5e1" },
    },
    tooltip: {
      backgroundColor: "#0f172a",
      borderColor: "#334155",
      borderWidth: 1,
      titleColor: "#f8fafc",
      bodyColor: "#f8fafc",
      callbacks: {
        label(context) {
          const item = props.data[context.dataIndex];
          return `${context.dataset.label}：${Number(context.raw).toLocaleString("zh-TW")} ${item?.unit || ""}`;
        },
        afterBody(context) {
          const item = props.data[context[0]?.dataIndex];
          if (!item) return "";
          const variance = Number(item.varianceQuantity || 0);
          return `領料差異：${variance.toLocaleString("zh-TW")} ${item.unit || ""}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#94a3b8", maxRotation: 45, minRotation: 0 },
    },
    y: {
      beginAtZero: true,
      grid: { color: "rgba(51, 65, 85, .25)" },
      ticks: { color: "#94a3b8" },
    },
  },
}));
</script>

<template>
  <div class="consumption-chart">
    <div class="chart-header">
      <div>
        <h3>今日原物料領用比較</h3>
        <p>手動領料與完成銷售依 BOM 推算的理論耗用</p>
      </div>
      <span class="material-symbols-outlined">inventory</span>
    </div>

    <div v-if="data.length === 0" class="empty">
      今日尚無領料或銷售耗用資料
    </div>
    <div v-else class="chart-container">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <p class="unit-note">
      各原物料單位可能不同，請以滑鼠移入顯示的單位為準；差異＝手動領料－理論耗用。
    </p>
  </div>
</template>

<style scoped>
.consumption-chart {
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 14px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.chart-header p,
.unit-note {
  margin: 4px 0 0;
  color: var(--on-surface-variant);
  font-size: 0.78rem;
}

.chart-header .material-symbols-outlined {
  color: var(--primary);
  font-size: 30px;
}

.chart-container {
  height: 320px;
}

.empty {
  display: flex;
  height: 220px;
  align-items: center;
  justify-content: center;
  color: var(--on-surface-variant);
}
</style>
