<script setup>
import { ref, watch } from 'vue'

const emit = defineEmits(['filter-changed'])

const type = ref('all')
const status = ref('all')
const keyword = ref('')
const dateFrom = ref('')
const dateTo = ref('')

function emitChange() {
  emit('filter-changed', {
    type: type.value,
    status: status.value,
    keyword: keyword.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
  })
}

// select 變更立即套用；文字/日期輸入用 watch 統一處理，避免每個欄位各寫一次 @change
watch([type, status, keyword, dateFrom, dateTo], emitChange)

function handleReset() {
  type.value = 'all'
  status.value = 'all'
  keyword.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-group">
      <label class="filter-label">類型</label>
      <select v-model="type" class="filter-select">
        <option value="all">全部</option>
        <option value="LEAVE">請假</option>
        <option value="PURCHASE">採購</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label">狀態</label>
      <select v-model="status" class="filter-select">
        <option value="all">全部</option>
        <option value="pending">待簽核</option>
        <option value="approved">已核准</option>
        <option value="rejected">已駁回</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label">申請日期</label>
      <div class="filter-date-range">
        <input v-model="dateFrom" type="date" class="filter-input" />
        <span class="filter-date-sep">至</span>
        <input v-model="dateTo" type="date" class="filter-input" />
      </div>
    </div>

    <div class="filter-group filter-group--grow">
      <label class="filter-label">搜尋</label>
      <input v-model="keyword" type="text" placeholder="單號、申請人或摘要" class="filter-input filter-input--search" />
    </div>

    <button class="filter-reset" type="button" @click="handleReset">重設</button>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 18px;
  background: var(--wf-paper-raised);
  border: 1px solid var(--wf-line);
  border-radius: var(--wf-radius-md);
  font-family: var(--wf-font);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group--grow {
  flex: 1;
  min-width: 180px;
}

.filter-label {
  font-size: 12px;
  color: var(--wf-ink-soft);
}

.filter-select,
.filter-input {
  font-family: var(--wf-font);
  font-size: 13px;
  color: var(--wf-ink);
  border: 1px solid var(--wf-line-strong);
  border-radius: var(--wf-radius-sm);
  padding: 7px 10px;
  background: var(--wf-paper-raised);
  outline: none;
  box-sizing: border-box;
}

.filter-select:focus,
.filter-input:focus {
  border-color: var(--wf-seal);
}

.filter-date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-date-sep {
  font-size: 12px;
  color: var(--wf-ink-faint);
}

.filter-input--search {
  width: 100%;
}

.filter-reset {
  font-family: var(--wf-font);
  font-size: 13px;
  color: var(--wf-ink-soft);
  background: transparent;
  border: 1px solid var(--wf-line-strong);
  border-radius: var(--wf-radius-sm);
  padding: 7px 14px;
  cursor: pointer;
}

.filter-reset:hover {
  border-color: var(--wf-ink-soft);
  color: var(--wf-ink);
}
</style>
