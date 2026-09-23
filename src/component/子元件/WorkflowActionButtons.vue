<script setup>
import { ref } from 'vue'

const props = defineProps({
  status: { type: String, default: 'pending' },
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['approve', 'reject'])

// 原本的簽核意見輸入框綁定
const remark = ref('')

// 控制提示視窗的開關
const showWarningModal = ref(false)

// 點擊駁回按鈕時的處理邏輯
function handleReject() {
  // 1. 檢查是否為空
  if (!remark.value.trim()) {
    showWarningModal.value = true // 為空則顯示提示視窗
    return
  }
  
  // 2. 如果有填寫，直接送出 (或者你也可以在這裡加一個簡單的 confirm 二次確認)
  emit('reject', remark.value)
}

// 關閉提示視窗
function closeWarningModal() {
  showWarningModal.value = false
}

function handleApprove() {
  emit('approve', remark.value)
}
</script>

<template>
  <div class="actions" v-if="status === 'pending'">
    <label class="actions__label" for="wf-remark">簽核意見</label>
    <textarea
      id="wf-remark"
      v-model="remark"
      class="actions__remark"
      rows="3"
      placeholder="輸入給申請人的說明或備註"
      :disabled="submitting"
    ></textarea>
    <div class="actions__buttons">
      <!-- 駁回按鈕綁定新的處理函數 -->
      <button 
        type="button" 
        class="btn btn--reject" 
        :disabled="submitting" 
        @click="handleReject"
      >
        駁回
      </button>
      <button 
        type="button" 
        class="btn btn--approve" 
        :disabled="submitting" 
        @click="handleApprove"
      >
        {{ submitting ? '處理中…' : '核准' }}
      </button>
    </div>
  </div>

  <div class="actions__done" v-else>
    <span class="actions__done-text">
      此單據已{{ status === 'approved' ? '核准' : '駁回' }}，無法再變更
    </span>
  </div>

  <!-- 純提示用的警告小視窗 (Modal) -->
  <div v-if="showWarningModal" class="modal-overlay" @click.self="closeWarningModal">
    <div class="modal-card modal-card--warning">
      <div class="modal-icon">⚠️</div>
      <h3 class="modal-title">需要填寫駁回意見</h3>
      <p class="modal-desc">
        為了讓申請人了解原因，駁回時<strong>必須填寫</strong>簽核意見。
      </p>
      <div class="modal-actions">
        <button class="btn btn--primary" @click="closeWarningModal">知道了</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 提示視窗 (Modal) 樣式 --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 380px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.2s ease-out;
  text-align: center; /* 讓提示框內容置中，更像警告視窗 */
}

.modal-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.modal-title {
  margin: 0 0 12px;
  font-size: 1.1rem;
  color: #1f2937;
  font-weight: 600;
}

.modal-desc {
  margin: 0 0 20px;
  color: #4b5563;
  font-size: 0.9rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: center; /* 按鈕置中 */
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* --- 你原本的樣式 (保持不變) --- */
.actions {
  font-family: var(--wf-font);
}

.actions__label {
  display: block;
  font-size: 12px;
  color: var(--wf-ink-soft);
  margin-bottom: 6px;
}

.actions__remark {
  width: 100%;
  font-family: var(--wf-font);
  font-size: 13px;
  color: var(--wf-ink);
  border: 1px solid var(--wf-line-strong);
  border-radius: var(--wf-radius-sm);
  padding: 10px 12px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.actions__remark:focus {
  border-color: var(--wf-seal);
}

.actions__buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.btn {
  font-family: var(--wf-font);
  font-size: 13.5px;
  font-weight: 500;
  padding: 9px 20px;
  border-radius: var(--wf-radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn--primary {
  background: var(--wf-seal, #3b82f6);
  color: #fff;
}
.btn--primary:hover {
  background: var(--wf-seal-hover, #2563eb);
}

.btn--reject {
  background: transparent;
  border-color: var(--wf-line-strong);
  color: var(--wf-ink-soft);
}

.btn--reject:hover {
  border-color: var(--wf-ink-soft);
  color: var(--wf-ink);
}

.btn--approve {
  background: var(--wf-seal);
  color: #fff;
}

.btn--approve:hover {
  background: var(--wf-seal-hover);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actions__done {
  padding: 12px 14px;
  background: var(--wf-paper);
  border: 1px solid var(--wf-line);
  border-radius: var(--wf-radius-sm);
  font-size: 13px;
  color: var(--wf-ink-soft);
}
</style>