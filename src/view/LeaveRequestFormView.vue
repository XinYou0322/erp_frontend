<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  createLeaveRequest,
  updateLeaveRequest,
  submitLeaveRequest,
  getLeaveRequestById,
} from "../service/leaveRequestApi";
import { useAuthStore } from "@/stores/auth.store";

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const applicantId = computed(() => authStore.currentUser?.id);

// 有 id 代表編輯既有草稿，沒有則是新建
const leaveId = computed(() =>
  route.params.id ? Number(route.params.id) : null,
);
const isEdit = computed(() => leaveId.value !== null);

// TODO: 之後接登入機制後改從 session/token 取得
//const applicantId = 1;

const form = reactive({
  leaveType: "ANNUAL",
  startDate: "",
  endDate: "",
  reason: "",
});

const approverId = ref("");
const saving = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const leaveTypes = [
  { value: "ANNUAL", label: "特休" },
  { value: "SICK", label: "病假" },
  { value: "PERSONAL", label: "事假" },
  { value: "MARRIAGE", label: "婚假" },
];

async function loadExisting() {
  if (!isEdit.value) return;
  try {
    const leave = await getLeaveRequestById(leaveId.value);
    form.leaveType = leave.leaveType;
    form.startDate = leave.startDate;
    form.endDate = leave.endDate;
    form.reason = leave.reason ?? "";
  } catch (e) {
    errorMessage.value = "無法載入請假單內容";
  }
}

function validate() {
  if (!form.startDate || !form.endDate) {
    errorMessage.value = "請選擇起訖日期";
    return false;
  }
  if (new Date(form.endDate) < new Date(form.startDate)) {
    errorMessage.value = "結束日期不能早於開始日期";
    return false;
  }
  errorMessage.value = "";
  return true;
}

// [新增] 返回功能
function goBack() {
  // 如果瀏覽器有歷史紀錄就返回上一頁，否則預設回到請假單列表 (假設路由名稱為 leave-list)
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: "leave-list" });
  }
}

// 儲存草稿（新建或更新既有草稿）
async function saveDraft() {
  if (!validate()) return;

  // 防呆：確保登入狀態已載入
  if (!applicantId.value) {
    errorMessage.value = "登入狀態異常，請重新整理頁面";
    return;
  }

  saving.value = true;

  try {
    if (isEdit.value) {
      await updateLeaveRequest(leaveId.value, form);
    } else {
      const created = await createLeaveRequest({
        leaveType: form.leaveType,
        applicantId: applicantId.value,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });

      router.replace({
        name: "leave-edit",
        params: { id: created.id },
      });
    }
    successMessage.value = "草稿儲存成功！";
    setTimeout(() => {
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
    errorMessage.value = "請輸入有效的簽核人 ID";
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
      await updateLeaveRequest(id, form);
    } else {
      const created = await createLeaveRequest({
        leaveType: form.leaveType,
        applicantId: applicantId.value,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });

      id = created.id;

      // router.replace({
      //   name: "leave-edit",
      //   params: { id },
      // });
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

onMounted(loadExisting);
</script>

<template>
  <div class="leave-form">
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
        <input
          v-model="approverId"
          type="number"
          class="input-glow font-data-mono"
          placeholder="輸入簽核人 ID"
        />
      </div>

      <p v-if="successMessage" class="success-text">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div class="actions">
        <button class="btn-outline" :disabled="saving" @click="saveDraft">
          <span class="material-symbols-outlined">save</span>
          {{ saving ? "儲存中..." : "儲存草稿" }}
        </button>
        <button
          class="btn-primary"
          :disabled="submitting"
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
</style>
