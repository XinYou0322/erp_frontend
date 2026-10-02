<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  createLeaveRequest,
  updateLeaveRequest,
  submitLeaveRequest,
  getLeaveRequestById,
  deleteLeaveRequest,
} from "../service/leaveRequestApi";
import { useAuthStore } from "@/stores/auth.store";
import httpClient from "@/service/httpClient";

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const applicantId = computed(() => authStore.currentUser?.id);

// 有 id 代表編輯既有草稿，沒有則是新建
const leaveId = computed(() =>
  route.params.id ? Number(route.params.id) : null,
);
const isEdit = computed(() => leaveId.value !== null);

const form = reactive({
  leaveType: "ANNUAL",
  leaveDurationType: "FULL_DAY", // FULL_DAY | PARTIAL_DAY
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  reason: "",
});

const roleNameMap = {
  1: "系統管理員",
  2: "店長",
  3: "一般員工",
  4: "訪客",
};

const approverId = ref("");
const approvers = ref([]);
const saving = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const leaveTypes = [
  { value: "ANNUAL", label: "特休" },
  { value: "SICK", label: "病假" },
  { value: "PERSONAL", label: "事假" },
  { value: "MARRIAGE", label: "婚假" },
];

// 只能選擇權限比申請人高的簽核人
const availableApprovers = computed(() => {
  const currentRoleLevel = Number(
    authStore.currentUser?.roleLevel
  );

  if (!currentRoleLevel) return [];

  return approvers.value.filter((user) => {
    const userRoleLevel = Number(user.roleLevel);

    // 最高權限者：可以選自己或其他最高權限者
    if (currentRoleLevel === 1) {
      return userRoleLevel === 1;
    }

    // 其他角色：只能選比自己權限高的人
    return userRoleLevel < currentRoleLevel;
  });
});

// --- 表單連動 ---
// 切換請假方式：部分時段 → 結束日期跟著開始日期；全天 → 清掉時間
watch(
  () => form.leaveDurationType,
  (type) => {
    if (type === "PARTIAL_DAY") {
      form.endDate = form.startDate;
    } else {
      form.startTime = "";
      form.endTime = "";
    }
  },
);

// 部分時段模式下，改開始日期時結束日期同步
watch(
  () => form.startDate,
  (val) => {
    if (form.leaveDurationType === "PARTIAL_DAY") {
      form.endDate = val;
    }
  },
);

// --- 計時器管理（元件卸載時清掉） ---
let successTimer = null;
let redirectTimer = null;
onBeforeUnmount(() => {
  clearTimeout(successTimer);
  clearTimeout(redirectTimer);
});

// --- 資料載入 ---
async function loadExisting() {
  if (!isEdit.value) return;
  try {
    const leave = await getLeaveRequestById(leaveId.value);
    form.leaveType = leave.leaveType;
    form.leaveDurationType = leave.leaveDurationType ?? "FULL_DAY";
    form.startDate = leave.startDate;
    form.endDate = leave.endDate;
    // 後端回傳可能是 "09:00:00"，<input type="time"> 只吃 HH:mm
    form.startTime = leave.startTime ? leave.startTime.substring(0, 5) : "";
    form.endTime = leave.endTime ? leave.endTime.substring(0, 5) : "";
    form.reason = leave.reason ?? "";
  } catch (e) {
    errorMessage.value = "無法載入請假單內容";
  }
}

async function loadApprovers() {
  try {
    const res = await httpClient.get("/api/users/all");

    //console.log("簽核人資料：", res.data);

    approvers.value = res.data;
  } catch (e) {
    console.error("載入簽核人失敗", e);
    errorMessage.value = "載入簽核人清單失敗，請重新整理頁面";
  }
}

// --- 驗證（純檢查，不修改資料） ---
function validate() {
  if (!form.startDate) {
    errorMessage.value = "請選擇日期";
    return false;
  }

  if (form.leaveDurationType === "FULL_DAY") {
    if (!form.endDate) {
      errorMessage.value = "請選擇結束日期";
      return false;
    }
    // YYYY-MM-DD 字串比較即可
    if (form.endDate < form.startDate) {
      errorMessage.value = "結束日期不能早於開始日期";
      return false;
    }
  } else {
    if (!form.startTime || !form.endTime) {
      errorMessage.value = "請填寫請假時間";
      return false;
    }
    // HH:mm 字串比較即可
    if (form.endTime <= form.startTime) {
      errorMessage.value = "結束時間必須晚於開始時間";
      return false;
    }
  }

  errorMessage.value = "";
  return true;
}

// 統一組 payload：新建與更新共用
function buildPayload() {
  const isPartial = form.leaveDurationType === "PARTIAL_DAY";
  const payload = {
    leaveType: form.leaveType,
    leaveDurationType: form.leaveDurationType,
    startDate: form.startDate,
    endDate: isPartial ? form.startDate : form.endDate,
    reason: form.reason,
  };
  if (isPartial) {
    payload.startTime = form.startTime;
    payload.endTime = form.endTime;
  }
  return payload;
}

// --- 操作 ---
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: "leave-list" });
  }
}

// 儲存草稿（新建或更新既有草稿）
async function saveDraft() {
  if (!validate()) return;

  if (!applicantId.value) {
    errorMessage.value = "登入狀態異常，請重新整理頁面";
    return;
  }

  saving.value = true;
  successMessage.value = "";

  try {
    if (isEdit.value) {
      await updateLeaveRequest(leaveId.value, buildPayload());
    } else {
      const created = await createLeaveRequest({
        ...buildPayload(),
        applicantId: applicantId.value,
      });

      router.replace({
        name: "leave-edit",
        params: { id: created.id },
      });
    }

    successMessage.value = "草稿儲存成功！";
    clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } catch (e) {
    errorMessage.value = e.response?.data?.message || e.message || "儲存失敗";
  } finally {
    saving.value = false;
  }
}

// 送出簽核：先確保草稿已存檔，再呼叫 submit
async function submitForApproval() {
  if (!validate()) return;

  const approverNum = Number(approverId.value);
  if (!approverId.value || isNaN(approverNum) || approverNum <= 0) {
    errorMessage.value = "請選擇簽核人";
    return;
  }

  if (!applicantId.value) {
    errorMessage.value = "登入狀態異常，請重新整理頁面";
    return;
  }

  submitting.value = true;

  try {
    let id = leaveId.value;

    if (isEdit.value) {
      await updateLeaveRequest(id, buildPayload());
    } else {
      const created = await createLeaveRequest({
        ...buildPayload(),
        applicantId: applicantId.value,
      });
      id = created.id;

      // 建立成功就轉到編輯路由：之後即使 submit 失敗，
      // 重試會走 update，不會產生第二張草稿
      await router.replace({ name: "leave-edit", params: { id } });
    }

    await submitLeaveRequest(id, approverNum);

    router.push({
      name: "leave-detail",
      params: { id },
    });
  } catch (e) {
    errorMessage.value = e.response?.data?.message || e.message || "送出失敗";
  } finally {
    submitting.value = false;
  }
}

// 刪除草稿
async function deleteDraft() {
  if (!isEdit.value) return;

  const isConfirmed = window.confirm(
    "確定要刪除此請假草稿嗎？此動作無法復原。",
  );
  if (!isConfirmed) return;

  deleting.value = true;
  try {
    await deleteLeaveRequest(leaveId.value);
    successMessage.value = "草稿已成功刪除！即將返回列表...";

    // 延遲 1 秒讓使用者看到成功訊息，再跳轉回列表
    redirectTimer = setTimeout(() => {
      router.push({ name: "leave-list" });
    }, 1000);
  } catch (e) {
    errorMessage.value = e.response?.data?.message || e.message || "刪除失敗";
  } finally {
    deleting.value = false;
  }
}

onMounted(async () => {
  // Codex 修改：從出勤行事曆新增時預填日期，仍透過既有請假 API 儲存與送審。
  if (!isEdit.value && typeof route.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(route.query.date)) {
    form.startDate = route.query.date;
    form.endDate = route.query.date;
  }
  await loadExisting();
  await loadApprovers();
});
</script>

<template>
  <div class="leave-form">
    <!-- Codex 修改：提供行事曆入口的返回連結，返回後重新讀取最新假單狀態。 -->
    <RouterLink v-if="route.query.from === 'attendance'" :to="{ name: 'attendance' }" class="text-emerald-400">返回出勤行事曆</RouterLink>
    <header class="leave-form__header">
      <button class="btn-back" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span>
        返回
      </button>

      <h1>{{ isEdit ? "編輯請假單" : "新增請假單" }}</h1>
      <p class="subtitle">填寫完成後可先儲存草稿，或直接送出簽核</p>
    </header>

    <div class="bento-card form-card">
      <div class="field">
        <label>假別</label>
        <select v-model="form.leaveType" class="input-glow">
          <option v-for="t in leaveTypes" :key="t.value" :value="t.value">
            {{ t.label }}
          </option>
        </select>
      </div>

      <div class="field">
        <label>請假方式</label>
        <div class="leave-mode">
          <label class="radio-item">
            <input
              type="radio"
              v-model="form.leaveDurationType"
              value="FULL_DAY"
            />
            全天
          </label>

          <label class="radio-item">
            <input
              type="radio"
              v-model="form.leaveDurationType"
              value="PARTIAL_DAY"
            />
            部分時段
          </label>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>開始日期</label>
          <input
            v-model="form.startDate"
            type="date"
            class="input-glow font-data-mono"
          />
        </div>

        <div class="field">
          <label>結束日期</label>
          <input
            v-model="form.endDate"
            type="date"
            class="input-glow font-data-mono"
            :disabled="form.leaveDurationType === 'PARTIAL_DAY'"
          />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>開始時間</label>
          <input
            v-model="form.startTime"
            type="time"
            class="input-glow font-data-mono"
            :disabled="form.leaveDurationType === 'FULL_DAY'"
          />
        </div>

        <div class="field">
          <label>結束時間</label>
          <input
            v-model="form.endTime"
            type="time"
            class="input-glow font-data-mono"
            :disabled="form.leaveDurationType === 'FULL_DAY'"
          />
        </div>
      </div>

      <div class="field">
        <label>請假原因</label>
        <textarea
          v-model="form.reason"
          rows="4"
          class="input-glow"
          placeholder="簡述請假原因"
        ></textarea>
      </div>

      <div class="field">
        <label>簽核人（送出簽核時必填）</label>

        <select v-model="approverId" class="input-glow">
          <option value="">請選擇簽核人</option>

          <option
            v-for="user in availableApprovers"
            :key="user.id"
            :value="user.id"
          >
            {{ user.name }}（{{ roleNameMap[user.roleLevel] }}）
          </option>
        </select>
      </div>

      <p v-if="successMessage" class="success-text">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div class="actions">
        <button
          v-if="isEdit"
          class="btn-danger-outline"
          style="margin-right: auto"
          :disabled="deleting || saving || submitting"
          @click="deleteDraft"
        >
          <span class="material-symbols-outlined">delete</span>
          {{ deleting ? "刪除中..." : "刪除草稿" }}
        </button>
        <button
          class="btn-outline"
          :disabled="saving || submitting || deleting"
          @click="saveDraft"
        >
          <span class="material-symbols-outlined">save</span>
          {{ saving ? "儲存中..." : "儲存草稿" }}
        </button>
        <button
          class="btn-primary"
          :disabled="saving || submitting || deleting"
          @click="submitForApproval"
        >
          <span class="material-symbols-outlined">send</span>
          {{ submitting ? "送出中..." : "送出簽核" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leave-form {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.leave-form__header h1 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
}

.subtitle {
  color: var(--on-surface-variant);
  font-size: 0.9rem;
  margin: 0.25rem 0 1.5rem;
}

.form-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.field-row {
  display: flex;
  gap: 1rem;
}

label {
  font-size: 0.85rem;
  color: var(--on-surface-variant);
}

input,
select,
textarea {
  background-color: var(--surface-container-low);
  border: 1px solid var(--outline);
  border-radius: 0.6rem;
  padding: 0.6rem 0.75rem;
  color: var(--on-surface);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s ease-in-out;
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--primary);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-glow[type="date"]::-webkit-calendar-picker-indicator,
.input-glow[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 1;
  cursor: pointer;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

.error-text {
  color: var(--error);
  font-size: 0.85rem;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-primary,
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 0.75rem;
  padding: 0.65rem 1.1rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: var(--primary);
  color: var(--on-primary);
}

.btn-primary:hover {
  background-color: var(--primary-container);
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

.btn-primary:disabled,
.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-back {
  background: none;
  border: none;
  color: var(--on-surface-variant);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  padding: 0.25rem 0;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  transition: color 0.2s;
}

.btn-back:hover {
  color: var(--primary);
}

.success-text {
  color: #2e7d32;
  background-color: #e8f5e9;
  border: 1px solid #a5d6a7;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0;
  padding: 0.6rem 0.75rem;
  border-radius: 0.6rem;
  text-align: center;
}

.material-symbols-outlined {
  font-size: 18px;
}

.btn-danger-outline {
  background-color: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger-outline:hover:not(:disabled) {
  background-color: #fef2f2;
}

.btn-danger-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.leave-mode {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.25rem;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--on-surface);
  cursor: pointer;
}

.radio-item input {
  accent-color: var(--primary);
}
</style>
