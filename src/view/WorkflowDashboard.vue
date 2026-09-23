<script setup>
import { ref, computed, onMounted } from "vue";
//import WorkflowFilter from "@/component/子元件/WorkflowFilter.vue";
import WorkflowTable from "@/component/父元件/WorkflowTable.vue";
import WorkflowEmpty from "@/component/子元件/WorkflowEmpty.vue";
import { getWorkflows } from "@/service/workflowService";
import { useAuthStore } from "@/stores/auth.store";
import Filter from '@/component/子元件/Filter.vue'

// TODO: 之後接上登入機制後，改成從登入狀態取得目前使用者 id
//const CURRENT_APPROVER_ID = 2;

const authStore = useAuthStore();
const currentApproverId = computed(() => authStore.currentUser?.id);

console.log("currentUser =", authStore.currentUser);

const rawWorkflows = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const filters = ref({
  type: "all",
  status: "",
  keyword: "",
  dateFrom: "",
  dateTo: "",
});

const workflowStatusOptions = [
  { label: "待審核", value: "pending" },
  { label: "已核准", value: "approved" },
  { label: "已駁回", value: "rejected" },
];

const filterFields = [
  {
    key: "type",
    type: "select",
    label: "類型",
    options: [
      { label: "全部", value: "all" },
      { label: "採購", value: "ORDER" },
      { label: "請假", value: "LEAVE" },
      { label: "其他", value: "other" },
    ],
  },
];

async function loadWorkflows() {
  if (!currentApproverId.value) {
    errorMessage.value = "尚未登入";
    return;
  }

  console.log("currentApproverId.value 回傳：", currentApproverId.value);

  loading.value = true;
  errorMessage.value = "";
  try {
    const data = await getWorkflows(currentApproverId.value);
    console.log("Workflow API 回傳：", data);
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
    if (w.status === "cancelled") return false;

    // 優化 type 判斷 (防禦性寫法)
    if (filters.value.type && filters.value.type !== "all" && w.documentType !== filters.value.type) {
      return false;
    }
    
    // 優化 status 判斷：只要 filters.status 有值(不是空字串) 才過濾
    if (filters.value.status && w.status !== filters.value.status) {
      return false;
    }
    if (filters.value.keyword) {
      const kw = filters.value.keyword.toLowerCase();
      const hit = [w.code, w.applicant, w.summary].some((v) =>
        (v || "").toLowerCase().includes(kw),
      );
      if (!hit) return false;
    }
    const dateOnly = (w.createdAt || "").slice(0, 10);
    if (filters.value.dateFrom && dateOnly < filters.value.dateFrom)
      return false;
    if (filters.value.dateTo && dateOnly > filters.value.dateTo) return false;
    return true;
  });
});

const currentMonthWorkflows = computed(() => {
  const now = new Date();
  // 取得當前年月，例如 "2026-09"
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return visibleWorkflows.value.filter((w) => {
    if (!w.createdAt) return false;
    // 直接截取 createdAt 字串的前 7 碼來比對 (假設後端格式為 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm:ss)
    const itemYearMonth = w.createdAt.slice(0, 7); 
    return itemYearMonth === currentYearMonth;
  });
});

// 安全地取得本月的第一天與最後一天 (YYYY-MM-DD)
function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份是 0-11，要 +1 並補零
  
  const firstDay = `${year}-${month}-01`;
  
  // 計算該月最後一天 (利用 Date 物件的特性：下個月的第 0 天就是這個月的最後一天)
  const lastDate = new Date(year, now.getMonth() + 1, 0).getDate();
  const lastDay = `${year}-${month}-${String(lastDate).padStart(2, '0')}`;

  return { firstDay, lastDay };
}

const averageProcessingDays = computed(() => {
  const completed = currentMonthWorkflows.value.filter(
    (w) => w.status === "approved" || w.status === "rejected"
  );

  if (completed.length === 0) return "0.0";

  const totalDays = completed.reduce((sum, w) => {
    const created = new Date(w.createdAt);
    const updated = new Date(w.updatedAt || w.createdAt); // 沒 updatedAt 時先用 createdAt
    return sum + (updated - created) / (1000 * 60 * 60 * 24);
  }, 0);

  return (totalDays / completed.length).toFixed(1);
});

const visibleWorkflows = computed(() =>
  rawWorkflows.value.filter((w) => w.status !== "cancelled")
);

const stats = computed(() => ({
  pending: visibleWorkflows.value.filter((w) => w.status === "pending").length,
  approved: currentMonthWorkflows.value.filter((w) => w.status === "approved").length,
  rejected: currentMonthWorkflows.value.filter((w) => w.status === "rejected").length,
  total: visibleWorkflows.value.length,
}));

// 判斷目前的日期篩選器是否為「本月」
function isCurrentMonthFilter() {
  const { firstDay, lastDay } = getCurrentMonthRange();
  return filters.value.dateFrom === firstDay && filters.value.dateTo === lastDay;
}

// 判斷某個統計卡片是否處於「選中 (Active)」狀態
function isStatActive(type) {
  if (type === 'pending') {
    return filters.value.status === 'pending' && !filters.value.dateFrom;
  }
  if (type === 'approved' || type === 'rejected') {
    return filters.value.status === type && isCurrentMonthFilter();
  }
  return false;
}

// 處理統計卡片的點擊事件
function handleStatClick(type) {
  // 如果已經選中了這個狀態，再次點擊就「取消篩選」(回到全部)
  if (isStatActive(type)) {
    filters.value.status = "";
    filters.value.dateFrom = "";
    filters.value.dateTo = "";
    return;
  }

  // 否則，設定對應的狀態
  filters.value.status = type;

  // 如果是「已核准」或「已駁回」，自動幫使用者填入「本月」的日期範圍
  if (type === 'approved' || type === 'rejected') {
    const { firstDay, lastDay } = getCurrentMonthRange();
    filters.value.dateFrom = firstDay;
    filters.value.dateTo = lastDay;
  } else {
    // 如果是「待簽核」，通常不限月份，所以清空日期篩選
    filters.value.dateFrom = "";
    filters.value.dateTo = "";
  }
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
      <div class="stat"
        :class="{ 'stat--active': isStatActive('pending') }"
        @click="handleStatClick('pending')"
      >
        <span class="stat__label">待簽核</span>
        <span class="stat__value">{{ stats.pending }}</span>
      </div>

      <div class="stat"
        :class="{ 'stat--active': isStatActive('approved') }"
        @click="handleStatClick('approved')"
      >
        <span class="stat__label">本月已核准</span>
        <span class="stat__value">{{ stats.approved }}</span>
      </div>
      <div class="stat"
        :class="{ 'stat--active': isStatActive('rejected') }"
        @click="handleStatClick('rejected')"
      >
        <span class="stat__label">本月已駁回</span>
        <span class="stat__value">{{ stats.rejected }}</span>
      </div>
      <div class="stat stat--readonly">
        <span class="stat__label">平均處理時間</span>
        <span class="stat__value"> {{ averageProcessingDays }}<small>天</small></span>
      </div>
    </section>

    <Filter
      class="dashboard__filter"
      id-prefix="workflow"

      v-model="filters"
      :fields="filterFields"

      :show-status="true"
      status-label="狀態"
      status-default-text="全部狀態"
      :status-options="workflowStatusOptions"
      v-model:status-value="filters.status"

      :show-date-range="true"
      date-label="申請日期"
      v-model:start-date="filters.dateFrom"
      v-model:end-date="filters.dateTo"

      :show-search="true"
      search-label="搜尋"
      search-placeholder="搜尋單號、申請人或摘要..."
      v-model:search-value="filters.keyword"

      :show-supplier="false"
      :show-page-size="false"
      :show-refresh="false"
      :show-reset="true"

      :reset-values="{
        type: 'all',
        status: '',
        keyword: '',
        dateFrom: '',
        dateTo: ''
      }"
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


/* .stat {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: var(--wf-radius-md);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);

  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s ease;
} */

.stat {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: var(--wf-radius-md);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);

  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s ease;

  /* [新增] 可點擊提示 */
  cursor: pointer;
  user-select: none; /* 避免連點時選取到文字 */
}

.stat:hover {
  border-color: rgba(16, 185, 129, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 14px 34px -12px rgba(0, 0, 0, 0.6);
}

.stat:active {
  transform: translateY(0) scale(0.99);
}

.stat--active {
  border-color: rgba(16, 185, 129, 0.8);
  background: rgba(16, 185, 129, 0.12);
  box-shadow:
    0 10px 30px -10px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(16, 185, 129, 0.35),
    0 0 20px -6px rgba(16, 185, 129, 0.45);
}

.stat--active .stat__label {
  color: rgba(110, 231, 183, 0.9);
}

/* [新增] 只讀卡片（平均處理時間）：不可點擊、無 hover 效果 */
.stat--readonly {
  cursor: default;
  user-select: auto;
}

/* 注意：這段必須寫在 .stat:hover 之後才能覆蓋它 */
.stat--readonly:hover {
  transform: none;
  border-color: rgba(51, 65, 85, 0.6);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

/* [新增] 鍵盤導覽時的焦點框（無障礙支援） */
.stat:focus-visible {
  outline: 2px solid rgba(16, 185, 129, 0.7);
  outline-offset: 2px;
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
