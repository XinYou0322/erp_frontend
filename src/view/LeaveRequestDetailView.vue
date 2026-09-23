<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getLeaveRequestById,
  cancelLeaveRequest,
} from "../service/leaveRequestApi";
import { getWorkflowLogs, getWorkflowByDocument } from "../service/workflowService";
import StatusBadge from "../component/子元件/LeaveRequestStatusBadge.vue";

const route = useRoute();
const router = useRouter();

const leave = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const cancelling = ref(false);
const workflowLogs = ref([]);

const rejectionInfo = computed(() => {
  // 從後往前找，找到第一筆 REJECT 就停止
  const rejectLog = [...workflowLogs.value]
    .reverse()
    .find(log => log.action === 'REJECT');
  
  return rejectLog ? {
    reason: rejectLog.remark,
    operator: rejectLog.operator,
    time: rejectLog.createdAt
  } : null;
});


const leaveTypeLabel = computed(() => {
  const map = {
    ANNUAL: "特休",
    SICK: "病假",
    PERSONAL: "事假",
    MARRIAGE: "婚假",
  };
  return leave.value
    ? (map[leave.value.leaveType] ?? leave.value.leaveType)
    : "";
});

const canEdit = computed(() => leave.value?.status === "DRAFT");
const canCancel = computed(() => leave.value?.status === "PENDING");

// async function load() {
//   loading.value = true;
//   try {
//     leave.value = await getLeaveRequestById(route.params.id);

//     // 如果有 workflowId，就獲取 logs
//     if (leave.value.workflowId) {
//       workflowLogs.value = await getWorkflowLogs(leave.value.workflowId);
//     }
//   } catch (e) {
//     errorMessage.value = "找不到這筆請假單";
//   } finally {
//     loading.value = false;
//   }
// }

function goToEdit() {
  router.push({ name: "leave-edit", params: { id: leave.value.id } });
}

async function handleCancel() {
  cancelling.value = true;
  try {
    leave.value = await cancelLeaveRequest(leave.value.id);
  } catch (e) {
    errorMessage.value = "取消失敗，請稍後再試";
  } finally {
    cancelling.value = false;
  }
}

// 格式化時間
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function load() {
  loading.value = true;
  try {
    // 第一步：取得請假單基本資料
    leave.value = await getLeaveRequestById(route.params.id);
    
    // 第二步：拿著請假單的 id，去問 Workflow 服務對應的 Workflow 是誰
    // 注意：後端 Spring 會自動把字串 'LEAVE' 轉換成 DocumentType.LEAVE Enum
    const workflow = await getWorkflowByDocument('LEAVE', leave.value.id);
    
    // 第三步：拿到 Workflow 的 id 後，再去索取簽核紀錄 (Logs)
    workflowLogs.value = await getWorkflowLogs(workflow.id);
    
  } catch (e) {
    console.error("載入失敗:", e);
    errorMessage.value = "找不到這筆請假單或簽核紀錄";
  } finally {
    loading.value = false;
  }
}


onMounted(load);
</script>

<template>
  <div class="leave-detail">
    <button class="back-link" @click="router.push({ name: 'leave-list' })">
      <span class="material-symbols-outlined">arrow_back</span>
      返回列表
    </button>

    <p v-if="loading" class="state-text">載入中...</p>
    <p v-else-if="errorMessage" class="state-text state-text--error">
      {{ errorMessage }}
    </p>

    <template v-else-if="leave">
      <div class="bento-card detail-card">
        <div class="detail-card__header">
          <div>
            <h1>{{ leaveTypeLabel }}申請</h1>
            <p class="detail-id font-data-mono">單號 #{{ leave.id }}</p>
          </div>
          <StatusBadge :status="leave.status" />
        </div>

        <dl class="detail-grid">
          <div>
            <dt>開始日期</dt>
            <dd class="font-data-mono">{{ leave.startDate }}</dd>
          </div>
          <div>
            <dt>結束日期</dt>
            <dd class="font-data-mono">{{ leave.endDate }}</dd>
          </div>
        </dl>

        <div class="detail-reason">
          <dt>請假原因</dt>
          <p>{{ leave.reason || "未填寫" }}</p>
        </div>

        <div v-if="leave.status === 'REJECTED' && rejectionInfo" class="detail-rejection">
          <div class="rejection-header">
            <span class="material-symbols-outlined rejection-icon">cancel</span>
            <div>
              <h3 class="rejection-title">駁回原因</h3>
              <p class="rejection-meta">
                由 {{ rejectionInfo.operator }} 於 {{ formatDateTime(rejectionInfo.time) }} 駁回
              </p>
            </div>
          </div>
          <div class="rejection-content">
            <p>{{ rejectionInfo.reason || "無具體說明" }}</p>
          </div>
          <p class="rejection-hint">請修改後重新提交申請</p>
        </div>

        <div v-if="canEdit || canCancel" class="actions">
          <button v-if="canEdit" class="btn-outline" @click="goToEdit">
            <span class="material-symbols-outlined">edit</span>
            編輯草稿
          </button>
          <button
            v-if="canCancel"
            class="btn-danger"
            :disabled="cancelling"
            @click="handleCancel"
          >
            <span class="material-symbols-outlined">block</span>
            {{ cancelling ? "取消中..." : "取消申請" }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>

.detail-rejection {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.03) 100%);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
}

.rejection-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.rejection-icon {
  color: #ef4444;
  font-size: 24px;
  flex-shrink: 0;
}

.rejection-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #ef4444;
}

.rejection-meta {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

.rejection-content {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
  border-left: 3px solid #ef4444;
  margin-bottom: 12px;
}

.rejection-content p {
  margin: 0;
  color: #f9fafb;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.rejection-hint {
  margin: 0;
  color: #9ca3af;
  font-size: 12px;
  text-align: right;
}
.leave-detail {
  max-width: 560px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: none;
  color: var(--on-surface-variant);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.25rem;
}

.back-link:hover {
  color: var(--secondary);
}

.back-link .material-symbols-outlined {
  font-size: 18px;
}

.detail-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detail-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.detail-card__header h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.detail-id {
  color: var(--on-surface-variant);
  font-size: 0.8rem;
  margin: 0.2rem 0 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 0;
}

.detail-grid dt,
.detail-reason dt {
  font-size: 0.8rem;
  color: var(--on-surface-variant);
  margin-bottom: 0.25rem;
}

.detail-grid dd {
  margin: 0;
  color: var(--on-surface);
  font-size: 0.95rem;
}

.detail-reason p {
  margin: 0;
  color: var(--on-surface);
  font-size: 0.9rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--outline-variant);
}

.btn-outline,
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 0.75rem;
  padding: 0.6rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--outline);
  color: var(--on-surface);
}

.btn-outline:hover {
  border-color: var(--secondary);
  color: var(--secondary);
}

.btn-danger {
  background: transparent;
  border: 1px solid var(--error);
  color: var(--error);
}

.btn-danger:hover {
  background-color: var(--error-container);
  color: var(--on-error);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.material-symbols-outlined {
  font-size: 18px;
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
