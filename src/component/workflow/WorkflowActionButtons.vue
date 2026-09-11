<script setup>
import { ref } from 'vue'

// status: 'pending' | 'approved' | 'rejected'
// pending 時顯示可操作的核准/駁回按鈕，其餘狀態顯示已結案提示
const props = defineProps({
  status: { type: String, default: 'pending' },
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['approve', 'reject'])

const remark = ref('')
</script>

<template>
  <div class="actions" v-if="status === 'pending'">
    <label class="actions__label" for="wf-remark">簽核意見（選填）</label>
    <textarea
      id="wf-remark"
      v-model="remark"
      class="actions__remark"
      rows="3"
      placeholder="輸入給申請人的說明或備註"
      :disabled="submitting"
    ></textarea>
    <div class="actions__buttons">
      <button type="button" class="btn btn--reject" :disabled="submitting" @click="emit('reject', remark)">
        駁回
      </button>
      <button type="button" class="btn btn--approve" :disabled="submitting" @click="emit('approve', remark)">
        {{ submitting ? '處理中…' : '核准' }}
      </button>
    </div>
  </div>

  <div class="actions__done" v-else>
    <span class="actions__done-text">
      此單據已{{ status === 'approved' ? '核准' : '駁回' }}，無法再變更
    </span>
  </div>
</template>

<style scoped>
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
