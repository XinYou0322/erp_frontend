<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getOrderValueAnalysis } from "@/service/dashboardService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Doughnut } from "vue-chartjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const showDetails = ref(false); // 控制詳細資料顯示/隱藏
const analysisData = ref({
  orderValueDistribution: [],
  paymentMethodStats: []
});

const startDate = route.query.startDate;
const endDate = route.query.endDate;

const paymentMethodMap = {
  "MOBILE_PAYMENT": "行動支付",
  "CREDIT_CARD": "信用卡",
  "CASH": "現金"
};

const paymentIconMap = {
  "行動支付": "smartphone",   // 手機 icon
  "信用卡": "credit_card",    // 信用卡 icon
  "現金": "payments"          // 錢/現金 icon
};

const barChartData = ref({
  labels: [],
  datasets: [
    {
      label: "訂單數",
      backgroundColor: ["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"],
      borderRadius: 6,
      data: []
    }
  ]
});

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: {
      display: true,
      text: "客單價分佈",
      color: "#e2e8f0",
      font: { size: 16, weight: "bold" }
    }
  },
  scales: {
    x: {
      ticks: { color: "#94a3b8", font: { size: 12 } },
      grid: { color: "#334155" }
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "#94a3b8",
        stepSize: 1,
        font: { size: 12 }
      },
      grid: { color: "#334155" },
      title: { display: false }
    }
  }
};

const pieChartData = ref({
  labels: [],
  datasets: [
    {
      backgroundColor: ["#60a5fa", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"],
      borderColor: "#1e293b",
      borderWidth: 2,
      data: []
    }
  ]
});

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: "#94a3b8", padding: 12, font: { size: 12 } }
    },
    title: {
      display: true,
      text: "支付方式訂單佔比",
      color: "#e2e8f0",
      font: { size: 16, weight: "bold" }
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || "";
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value} 單 (${percentage}%)`;
        }
      }
    }
  }
};

onMounted(async () => {
  try {
    const res = await getOrderValueAnalysis({
      startDate: startDate || null,
      endDate: endDate || null
    });
    analysisData.value = res;

    barChartData.value.labels = res.orderValueDistribution.map((item) => item.range);
    barChartData.value.datasets[0].data = res.orderValueDistribution.map((item) => item.count);

    pieChartData.value.labels = res.paymentMethodStats.map(
      (item) => paymentMethodMap[item.method] || item.method
    );
    pieChartData.value.datasets[0].data = res.paymentMethodStats.map(
      (item) => item.orderCount
    );
  } catch (err) {
    console.error("載入客單價分析失敗", err);
  } finally {
    loading.value = false;
  }
});

function goBack() {
  router.back();
}
</script>

<template>
  <div class="order-value-analysis">
    <header class="page-header">
      <button @click="goBack" class="back-btn">← 返回 Dashboard</button>
      <h1>客單價詳細分析</h1>
    </header>

    <div v-if="loading" class="loading">讀取分析資料中...</div>

    <div v-else class="content">
      <!-- 左右兩欄佈局 -->
      <div class="two-column-layout">
        
        <!-- 左欄：客單價分佈 -->
        <div class="column left-column">
          <div class="chart-wrapper">
            <Bar :data="barChartData" :options="barChartOptions" />
          </div>
        </div>

        <!-- 右欄：支付方式分析 (修正：刪除重複的區塊) -->
        <div class="column right-column">
          
          <!-- 圓餅圖區域 (動態調整大小) -->
          <div class="chart-wrapper pie-wrapper" :class="{ 'is-small': showDetails }">
            <Doughnut :data="pieChartData" :options="pieChartOptions" />
          </div>

          <!-- 切換按鈕 -->
          <button @click="showDetails = !showDetails" class="toggle-details-btn">
            <span class="material-symbols-outlined icon">
              {{ showDetails ? 'expand_less' : 'expand_more' }}
            </span>
            {{ showDetails ? '收起詳細資料' : '查看詳細資料' }}
          </button>

          <!-- 詳細列表 (動態顯示/隱藏) -->
          <div v-show="showDetails" class="payment-stats">
            <h3>各支付方式平均客單價</h3>
            <div
              v-for="item in analysisData.paymentMethodStats"
              :key="item.method"
              class="payment-item"
            >
              <div class="payment-method">
                <span class="material-symbols-outlined icon" style="font-size: 20px; color: #60a5fa;">
                {{ paymentIconMap[paymentMethodMap[item.method] || item.method] }}
                </span>
                <span>{{ paymentMethodMap[item.method] || item.method }}</span>
              </div>
              <div class="payment-info">
                <span class="avg-amount">均價: ${{ item.avgAmount }}</span>
                <span class="order-count">({{ item.orderCount }} 單)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-value-analysis {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.back-btn {
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 8px;
}

.back-btn:hover {
  text-decoration: underline;
}

h1 {
  font-size: 24px;
  color: #fff;
  margin: 0;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 100%;
}

.column {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 找到 .left-column 並確保它是 flex 容器 */
.left-column {
  display: flex;
  flex-direction: column;
}

/* 讓左邊的圖表容器撐滿剩餘空間 */
.left-column .chart-wrapper {
  flex: 1;       /* 佔滿剩餘高度 */
  min-height: 0; /* 重要：防止 flex 子元素溢出 */
  width: 100%;
  height: 100%;
}

.right-column {
  display: flex;
  flex-direction: column;
  height: 100%; 
}

.chart-wrapper {
  position: relative;
  width: 100%;
  transition: all 0.3s ease;
}

.pie-wrapper {
  flex: 1; 
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-wrapper.is-small {
  flex: 0 0 40%;
  min-height: 150px;
}

.toggle-details-btn {
  background: #0f172a;
  border: 1px solid #334155;
  color: #60a5fa;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 12px 0;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle-details-btn:hover {
  background: #1e293b;
  border-color: #60a5fa;
}

.toggle-details-btn .icon {
  font-size: 18px;
}

.payment-stats {
  background: #0f172a;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.payment-stats h3 {
  color: #e2e8f0;
  margin: 0 0 12px 0;
  font-size: 14px;
  flex-shrink: 0;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #1e293b;
  border-radius: 6px;
  margin-bottom: 8px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
  font-weight: 500;
  font-size: 14px;
}

.payment-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.avg-amount {
  color: #60a5fa;
  font-weight: 600;
  font-size: 14px;
}

.order-count {
  color: #94a3b8;
  font-size: 12px;
}

.loading {
  text-align: center;
  color: #94a3b8;
  padding: 40px;
}
</style>