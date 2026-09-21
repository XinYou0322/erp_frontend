<script setup>
import { computed } from "vue";
import { Line } from "vue-chartjs";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

// 今天日期 (YYYY-MM-DD)
const today = new Date().toISOString().slice(0, 10);

// 去掉今天
const filteredData = computed(() =>
  props.data.filter(item => item.date !== today)
);

const chartData = computed(() => ({
  labels: filteredData.value.map(d => d.date.slice(5).replace("-", "/")),
  datasets: [
    {
      label: "營收",
      data: filteredData.value.map((d) => Number(d.revenue)),
      borderColor: "#10b981",
      backgroundColor: "rgba(16,185,129,0.12)",
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: "#10b981",
      pointBorderWidth: 2,
      pointBorderColor: "#0f172a",
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
        label: (ctx) => ` NT$ ${ctx.raw.toLocaleString()}`,
      },
    },
  },

  scales: {
    x: {
      grid: {
        color: "rgba(51,65,85,.35)",
      },
      ticks: {
        color: "#94a3b8",
      },
    },

    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(51,65,85,.35)",
      },
      ticks: {
        color: "#94a3b8",
        callback(value) {
          return `$${Number(value).toLocaleString()}`;
        },
      },
    },
  },
};
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <div>
        <h3>七天營收趨勢</h3>
        <p>最近 7 天營收變化</p>
      </div>

      <span class="material-symbols-outlined">
        monitoring
      </span>
    </div>

    <div v-if="filteredData.length === 0" class="empty">
      尚無營收資料
    </div>

    <div v-else class="chart-container">
      <Line
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  background: var(--surface-container);
  border: 1px solid var(--outline);
  border-radius: 20px;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.chart-header p {
  margin: 4px 0 0;
  color: var(--on-surface-variant);
  font-size: .82rem;
}

.chart-header .material-symbols-outlined {
  font-size: 30px;
  color: var(--primary);
}

.chart-container {
  height: 200px;
}

.empty {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--on-surface-variant);
}
</style>