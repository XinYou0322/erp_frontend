<script setup>
import { ref, computed, onMounted } from "vue";
import WorkflowFilter from "@/component/workflow/WorkflowFilter.vue";
import WorkflowTable from "@/component/workflow/WorkflowTable.vue";
import WorkflowEmpty from "@/component/workflow/WorkflowEmpty.vue";
import { getPendingWorkflows } from "@/service/workflowService";

// TODO: 之後接上登入機制後，改成從登入狀態取得目前使用者 id
const CURRENT_APPROVER_ID = 3;

const rawWorkflows = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const filters = ref({
  type: "all",
  status: "all",
  keyword: "",
  dateFrom: "",
  dateTo: "",
});

async function loadWorkflows() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const data = await getPendingWorkflows(CURRENT_APPROVER_ID);
    rawWorkflows.value = data;
  } catch (err) {
    errorMessage.value = "讀取待簽核清單失敗，請稍後再試";
  } finally {
    loading.value = false;
  }
}

// 篩選目前先在前端做（清單量不大時足夠），資料量變大後可改成把 filters 傳給後端查詢
const filteredWorkflows = computed(() => {
  return rawWorkflows.value.filter((w) => {
    if (filters.value.type !== "all" && w.documentType !== filters.value.type)
      return false;
    if (filters.value.status !== "all" && w.status !== filters.value.status)
      return false;
    if (filters.value.keyword) {
      const kw = filters.value.keyword.toLowerCase();
      const hit = [w.code, w.applicant, w.summary].some((v) =>
        (v || "").toLowerCase().includes(kw),
      );
      if (!hit) return false;
    }
    const dateOnly = (w.date || "").slice(0, 10);
    if (filters.value.dateFrom && dateOnly < filters.value.dateFrom)
      return false;
    if (filters.value.dateTo && dateOnly > filters.value.dateTo) return false;
    return true;
  });
});

const stats = computed(() => ({
  pending: rawWorkflows.value.filter((w) => w.status === "pending").length,
}));

function handleFilterChanged(newFilters) {
  filters.value = newFilters;
}

onMounted(loadWorkflows);
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <div>
        <h1 class="dashboard__title">簽核中心</h1>
        <p class="dashboard__subtitle">管理請假與採購單據的簽核流程</p>
      </div>
      <button type="button" class="dashboard__export">匯出報表</button>
    </header>

    <section class="dashboard__stats">
      <div class="stat">
        <span class="stat__label">待簽核</span>
        <span class="stat__value">{{ stats.pending }}</span>
      </div>
      <!-- 以下三項需要另外的報表統計 API（3.2 節銷售統計/簽核統計），目前先保留假資料 -->
      <div class="stat">
        <span class="stat__label">本月已核准</span>
        <span class="stat__value">42</span>
      </div>
      <div class="stat">
        <span class="stat__label">本月已駁回</span>
        <span class="stat__value">3</span>
      </div>
      <div class="stat">
        <span class="stat__label">平均處理時間</span>
        <span class="stat__value">1.2<small>天</small></span>
      </div>
    </section>

    <WorkflowFilter
      class="dashboard__filter"
      @filter-changed="handleFilterChanged"
    />

    <p v-if="loading" class="dashboard__status">讀取中…</p>
    <p
      v-else-if="errorMessage"
      class="dashboard__status dashboard__status--error"
    >
      {{ errorMessage }}
    </p>
    <WorkflowEmpty
      v-else-if="filteredWorkflows.length === 0"
      message="目前沒有符合條件的單據"
      sub-message="試試調整篩選條件，或稍後再回來查看"
    />
    <WorkflowTable v-else class="dashboard__table" :items="filteredWorkflows" />
  </div>
</template>

<style scoped>
.dashboard {
  font-family: var(--wf-font);
  background: var(--wf-paper);
  padding: 32px 40px;
  min-height: 100vh;
  box-sizing: border-box;
}

.dashboard__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.dashboard__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--wf-ink);
  margin: 0 0 4px;
}

.dashboard__subtitle {
  font-size: 13.5px;
  color: var(--wf-ink-soft);
  margin: 0;
}

.dashboard__export {
  font-family: var(--wf-font);
  font-size: 13px;
  font-weight: 500;
  color: var(--wf-ink-soft);
  background: var(--wf-paper-raised);
  border: 1px solid var(--wf-line-strong);
  border-radius: var(--wf-radius-sm);
  padding: 9px 16px;
  cursor: pointer;
}

.dashboard__export:hover {
  border-color: var(--wf-ink-soft);
  color: var(--wf-ink);
}

.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.stat {
  background: var(--wf-paper-raised);
  border: 1px solid var(--wf-line);
  border-radius: var(--wf-radius-md);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat__label {
  font-size: 12.5px;
  color: var(--wf-ink-soft);
}

.stat__value {
  font-size: 26px;
  font-weight: 700;
  color: var(--wf-ink);
  font-family: var(--wf-font-mono);
}

.stat__value small {
  font-size: 14px;
  font-weight: 500;
  font-family: var(--wf-font);
  color: var(--wf-ink-soft);
  margin-left: 2px;
}

.dashboard__filter {
  margin-bottom: 20px;
}

.dashboard__status {
  font-size: 13.5px;
  color: var(--wf-ink-soft);
  padding: 20px 0;
  text-align: center;
}

.dashboard__status--error {
  color: var(--wf-rejected);
}

@media (max-width: 900px) {
  .dashboard {
    padding: 20px;
  }
  .dashboard__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
