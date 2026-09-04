<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import WorkflowStatusBadge from "@/component/workflow/WorkflowStatusBadge.vue";
import WorkflowTimeline from "@/component/workflow/WorkflowTimeline.vue";
import WorkflowActionButtons from "@/component/workflow/WorkflowActionButtons.vue";
import {
  getWorkflowById,
  getWorkflowLogs,
  approveWorkflow,
  rejectWorkflow,
} from "@/service/workflowService";

const props = defineProps({
  id: { type: [String, Number], required: true },
});

const router = useRouter();

const workflow = ref(null);
const logs = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const submitting = ref(false);

const typeLabel = {
  LEAVE: "請假申請",
  PURCHASE: "採購申請",
  EXPENSE: "費用申請",
};

async function loadData() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [wf, logData] = await Promise.all([
      getWorkflowById(props.id),
      getWorkflowLogs(props.id),
    ]);
    workflow.value = wf;
    // WorkflowLogResponse 的動作欄位是 status，這裡轉成 Timeline 元件要的 action 欄位
    logs.value = logData.map((l) => ({
      action: l.status,
      operator: l.operator,
      remark: l.remark,
      createdAt: l.createdAt,
    }));
  } catch (err) {
    errorMessage.value = "讀取單據內容失敗，請稍後再試";
  } finally {
    loading.value = false;
  }
}

async function handleApprove(remark) {
  submitting.value = true;
  try {
    await approveWorkflow(props.id, remark);
    await loadData();
  } catch (err) {
    errorMessage.value = "核准失敗，請稍後再試";
  } finally {
    submitting.value = false;
  }
}

async function handleReject(remark) {
  submitting.value = true;
  try {
    await rejectWorkflow(props.id, remark);
    await loadData();
  } catch (err) {
    errorMessage.value = "駁回失敗，請稍後再試";
  } finally {
    submitting.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="detail">
    <router-link to="/workflows" class="detail__back">← 返回列表</router-link>

    <p v-if="loading" class="detail__status">讀取中…</p>
    <p v-else-if="errorMessage" class="detail__status detail__status--error">
      {{ errorMessage }}
    </p>

    <div v-else-if="workflow" class="detail__layout">
      <section class="detail__main">
        <div class="detail__main-head">
          <div>
            <span class="detail__type">{{
              typeLabel[workflow.documentType] || workflow.documentType
            }}</span>
            <h1 class="detail__code">WF-{{ workflow.id }}</h1>
          </div>
          <WorkflowStatusBadge :status="workflow.status" size="lg" />
        </div>

        <dl class="detail__info">
          <div class="detail__info-row">
            <dt>申請人</dt>
            <!-- applicant/approver 目前是使用者 id，之後可接上 A 模組的使用者 API 顯示姓名 -->
            <dd>{{ workflow.applicant }}</dd>
          </div>
          <div class="detail__info-row">
            <dt>簽核人</dt>
            <dd>{{ workflow.approver }}</dd>
          </div>
          <div class="detail__info-row">
            <dt>申請日期</dt>
            <dd class="mono">{{ workflow.createdAt }}</dd>
          </div>
        </dl>

        <div class="detail__remark" v-if="workflow.documentDescription">
          <span class="detail__remark-label">備註</span>
          <p class="detail__remark-text">{{ workflow.documentDescription }}</p>
        </div>

        <WorkflowActionButtons
          :status="workflow.status"
          :submitting="submitting"
          @approve="handleApprove"
          @reject="handleReject"
        />
      </section>

      <aside class="detail__side">
        <h2 class="detail__side-title">簽核歷程</h2>
        <WorkflowTimeline
          :logs="logs"
          :pending-next="
            workflow.status === 'pending'
              ? `${workflow.approver}（等待審核）`
              : ''
          "
        />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.detail {
  font-family: var(--wf-font);
  background: var(--wf-paper);
  min-height: 100vh;
  padding: 32px 40px;
  box-sizing: border-box;
}

.detail__back {
  display: inline-block;
  font-size: 13px;
  color: var(--wf-ink-soft);
  text-decoration: none;
  margin-bottom: 20px;
}

.detail__back:hover {
  color: var(--wf-ink);
}

.detail__layout {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  align-items: start;
}

.detail__main,
.detail__side {
  background: var(--wf-paper-raised);
  border: 1px solid var(--wf-line);
  border-radius: var(--wf-radius-md);
  padding: 24px 28px;
  box-sizing: border-box;
}

.detail__main-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--wf-line);
}

.detail__type {
  font-size: 12px;
  color: var(--wf-ink-soft);
}

.detail__code {
  font-size: 19px;
  font-weight: 700;
  color: var(--wf-ink);
  margin: 4px 0 0;
  font-family: var(--wf-font-mono);
}

.detail__info {
  margin: 0 0 20px;
}

.detail__info-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px dashed var(--wf-line);
  font-size: 13.5px;
}

.detail__info-row dt {
  width: 88px;
  color: var(--wf-ink-soft);
  flex-shrink: 0;
}

.detail__info-row dd {
  margin: 0;
  color: var(--wf-ink);
  font-weight: 500;
}

.mono {
  font-family: var(--wf-font-mono);
}

.detail__remark {
  margin-bottom: 24px;
}

.detail__remark-label {
  display: block;
  font-size: 12px;
  color: var(--wf-ink-soft);
  margin-bottom: 6px;
}

.detail__remark-text {
  font-size: 13.5px;
  color: var(--wf-ink);
  line-height: 1.6;
  margin: 0;
}

.detail__side-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--wf-ink);
  margin: 0 0 18px;
}

@media (max-width: 900px) {
  .detail__layout {
    grid-template-columns: 1fr;
  }
}
</style>
