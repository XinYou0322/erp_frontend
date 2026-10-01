<script setup>
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const chartData = computed(() => ({
  labels: ["可用庫存", "到貨前預估用量", "建議補貨量"],
  datasets: [
    {
      label: props.item.materialName || "原物料",
      data: [
        Math.round(Number(props.item.availableQuantity || 0)),
        Math.round(Number(props.item.leadTimeDemandQuantity || 0)),
        Math.round(Number(props.item.suggestedPurchaseQuantity || 0)),
      ],
      backgroundColor: [
        "rgba(14, 165, 233, 0.72)",
        "rgba(245, 158, 11, 0.72)",
        "rgba(16, 185, 129, 0.72)",
      ],
      borderColor: ["#38bdf8", "#fbbf24", "#34d399"],
      borderWidth: 1,
      borderRadius: 8,
      maxBarThickness: 72,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      borderColor: "#334155",
      borderWidth: 1,
      titleColor: "#f8fafc",
      bodyColor: "#f8fafc",
      callbacks: {
        label(context) {
          return `${Number(context.raw).toLocaleString("zh-TW")} ${props.item.unit || ""}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#94a3b8" },
    },
    y: {
      beginAtZero: true,
      grid: { color: "rgba(51, 65, 85, .25)" },
      ticks: { color: "#94a3b8", precision: 0 },
    },
  },
}));
</script>

<template>
  <section class="rounded-xl border border-[var(--outline)] bg-[var(--surface-container)] p-4">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h4 class="font-bold text-[var(--on-surface)]">{{ item.materialName }}補貨分析</h4>
        <p class="mt-1 text-xs text-[var(--on-surface-variant)]">
          庫存、到貨前預估用量與系統建議補貨量比較
        </p>
      </div>
      <span class="rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-bold text-[var(--primary)]">
        {{ item.unit }}
      </span>
    </div>

    <div class="mt-3 h-64">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>
