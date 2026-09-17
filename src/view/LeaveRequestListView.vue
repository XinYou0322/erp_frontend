<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getMyLeaveRequests } from "../service/leaveRequestApi";
import LeaveRequestCard from "../component/父元件/LeaveRequestCard.vue";

const router = useRouter();

// TODO: 之後接登入機制後改從 session/token 取得，先寫死示範用
//const applicantId = 1;

const leaves = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const activeTab = ref("ALL");

const tabs = [
  { value: "ALL", label: "全部" },
  { value: "DRAFT", label: "草稿" },
  { value: "PENDING", label: "審核中" },
  { value: "APPROVED", label: "已核准" },
  { value: "REJECTED", label: "已駁回" },
  { value: "CANCELLED", label: "已取消" },
];

const filteredLeaves = computed(() => {
  if (activeTab.value === "ALL") return leaves.value;
  return leaves.value.filter((l) => l.status === activeTab.value);
});

async function loadLeaves() {
  loading.value = true;
  errorMessage.value = "";
  try {
    leaves.value = await getMyLeaveRequests();
  } catch (e) {
    errorMessage.value = "無法載入請假紀錄，請稍後再試";
  } finally {
    loading.value = false;
  }
}


function goToDetail(id) {
    // 1. 從 leaves 陣列中，找出 id 符合的那一筆請假單
  const leave = leaves.value.find((l) => l.id === id);

  // 防呆：如果找不到這筆資料，就不執行後續動作
  if (!leave) {
    console.error("找不到對應的請假單, id:", id);
    return;
  }

  // 2. 根據「該筆請假單 (leave)」的狀態來決定跳轉路由
  if (leave.status === "DRAFT") {
    // 如果是草稿，直接進編輯頁
    router.push({ name: "leave-edit", params: { id: leave.id } });
  } else {
    // 如果是已送出/審核中/已核准等狀態，進詳情頁
    router.push({ name: "leave-detail", params: { id: leave.id } });
  }
}

function goToCreate() {
  router.push({ name: "leave-create" });
}

onMounted(loadLeaves);
</script>

<template>
  <div class="leave-list">
    <header class="leave-list__header">
      <div>
        <h1>我的請假紀錄</h1>
        <p class="subtitle">檢視與管理所有請假申請</p>
      </div>
      <button class="btn-primary" @click="goToCreate">
        <span class="material-symbols-outlined">add</span>
        新增請假
      </button>
    </header>

    <nav class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ 'tab--active': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </nav>

    <p v-if="loading" class="state-text">載入中...</p>
    <p v-else-if="errorMessage" class="state-text state-text--error">
      {{ errorMessage }}
    </p>
    <p v-else-if="filteredLeaves.length === 0" class="state-text">
      目前沒有符合條件的請假單
    </p>

    <div v-else class="bento-grid">
      <LeaveRequestCard
        v-for="leave in filteredLeaves"
        :key="leave.id"
        :leave="leave"
        @click="goToDetail"
      />
    </div>
  </div>
</template>

<style scoped>
.leave-list {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.leave-list__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.leave-list__header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.subtitle {
  color: var(--on-surface-variant);
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background-color: var(--primary);
  color: var(--on-primary);
  border: none;
  border-radius: 0.75rem;
  padding: 0.65rem 1.1rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease-in-out;
}

.btn-primary:hover {
  background-color: var(--primary-container);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab {
  flex-shrink: 0;
  background: transparent;
  border: 1px solid var(--outline);
  color: var(--on-surface-variant);
  border-radius: 9999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.tab--active {
  background-color: var(--secondary-container);
  border-color: var(--secondary);
  color: var(--on-surface);
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.state-text {
  color: var(--on-surface-variant);
  text-align: center;
  padding: 3rem 0;
}

.state-text--error {
  color: var(--error);
}
</style>
