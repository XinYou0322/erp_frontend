<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth.store";

import { getDashboard } from "@/service/dashboardService";
import { getPendingWorkflows } from "@/service/workflowService";

import DashboardStats from "@/component/父元件/DashboardStats.vue";
import RevenueChart from "@/component/父元件/RevenueChart.vue";
import TopProductsCard from "@/component/父元件/TopProductsCard.vue";
import WorkflowTable from "@/component/父元件/WorkflowTable.vue";
import DashboardCustomize from "@/component/子元件/DashboardCustomize.vue";
import HourPeakChart from "@/component/父元件/HourPeakChart.vue";

const authStore = useAuthStore();

const dashboard = ref(null);
const workflows = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const widgets = ref({
  stats: true,
  revenueChart: true,
  topProducts: true,
  hourPeak: true,
});

const userName = computed(() => authStore.currentUser?.name ?? "使用者");

function loadWidgetSettings() {
  const saved = localStorage.getItem("dashboardWidgets");
  if (saved) {
    widgets.value = JSON.parse(saved);
  }
}

async function loadDashboard() {
  loading.value = true;
  errorMessage.value = "";

  try {
    dashboard.value = await getDashboard();

    const approverId = authStore.currentUser?.id;

    if (approverId) {
      workflows.value = await getPendingWorkflows(approverId);
    }
  } catch (err) {
    errorMessage.value = "Dashboard 載入失敗";
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWidgetSettings();
  loadDashboard();
});
</script>

<template>
  <div class="dashboard">

    <header class="dashboard__header">
      <div>
        <h1>歡迎回來，{{ userName }}</h1>
        <p>飲料店 ERP Dashboard</p>
      </div>

      <DashboardCustomize v-model="widgets" />
    </header>

    <p v-if="loading" class="status">讀取中...</p>
    <p v-else-if="errorMessage" class="status error">{{ errorMessage }}</p>

    <template v-else-if="dashboard">

      <DashboardStats
        v-if="widgets.stats"
        :data="dashboard"
      />

      <div class="dashboard-grid">


        <div
          v-if="widgets.topProducts"
          class="card"
        >
          <TopProductsCard
            :all-products="dashboard.topProducts"
            :recent-products="dashboard.recentTopProducts"
            :all-revenue="dashboard.topRevenueProducts"
            :recent-revenue="dashboard.recentTopRevenueProducts"
            />
        </div>

        <div v-if="widgets.hourPeak" class="card">
            <HourPeakChart :data="dashboard.hourlySales" />
        </div>

        <div
          v-if="widgets.revenueChart"
          class="card span-2"
        >
          <RevenueChart :data="dashboard.weeklyRevenue"/>
        </div>

        <!--
        <div
          v-if="widgets.approvals"
          class="card span-2"
        >
          <div class="section-title">
            <row gap=1 align=center>
                <icon name=approval color=info />
                <h3>待簽核清單</h3>
            </row>
          </div>

          <WorkflowTable
            v-if="workflows.length"
            :items="workflows"
          />

          <div
            v-else
            class="empty"
          >
            目前沒有待簽核單據
          </div>
        
        </div>
        -->
      </div>

    </template>

  </div>
</template>

<style scoped>

.dashboard{
  min-height:100vh;
  background:var(--surface);
  color:var(--on-surface);
  padding:28px;
}

.dashboard__header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  margin-bottom:24px;
}

.dashboard__header h1{
  margin:0;
  font-size:28px;
}

.dashboard__header p{
  color:var(--on-surface-variant);
}


.dashboard-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:18px;
}

.card{
  background:var(--surface-container);
  border:1px solid var(--outline);
  border-radius:18px;
  padding:18px;
}

.span-2{
  grid-column:span 2;
}

.section-title{
  margin-bottom:12px;
}

.status{
  text-align:center;
  padding:40px;
}

.error{
  color:var(--error);
}

.empty{
  color:var(--on-surface-variant);
  text-align:center;
  padding:30px;
}

@media(max-width:900px){

.dashboard-grid{
  grid-template-columns:1fr;
}

.span-2{
  grid-column:auto;
}

.dashboard{
  padding:18px;
}

}

</style>