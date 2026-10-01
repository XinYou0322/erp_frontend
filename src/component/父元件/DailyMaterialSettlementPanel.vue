<template>
  <section class="space-y-5">
    <div class="grid gap-4 md:grid-cols-3">
      <div class="settlement-metric">
        <span>今日領料品項</span>
        <strong>{{ settlement.items.length }}</strong>
        <small>僅計算手動領料原料</small>
      </div>
      <div class="settlement-metric">
        <span>尚未分配品項</span>
        <strong :class="unallocatedItemCount ? 'text-[var(--error)]' : 'text-[var(--primary)]'">
          {{ unallocatedItemCount }}
        </strong>
        <small>差距需完整說明後才能結算</small>
      </div>
      <div class="settlement-metric">
        <span>結算狀態</span>
        <strong :class="isCompleted ? 'text-[var(--primary)]' : 'text-[var(--tertiary)]'">
          {{ isCompleted ? '已完成' : settlement.settlementId ? '草稿' : '尚未建立' }}
        </strong>
        <small>{{ settlement.createdByName || '尚無結算人員' }}</small>
      </div>
    </div>

    <div class="rounded-2xl border border-[var(--outline)] bg-[var(--surface-container)] p-5 shadow-level-1">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-[length:var(--font-headline)] font-bold text-[var(--on-surface)]">
            今日領料結算
          </h2>
          <p class="mt-1 text-[length:var(--font-body)] text-[var(--on-surface-variant)]">
            將領料與理論耗用的差距，分配為現場實際耗用、留在工作區或退回倉庫。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn-secondary px-3.5 py-2 text-[length:var(--font-body)]"
            :disabled="loading"
            @click="loadPreview"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
            重新計算
          </button>
          <button
            v-if="!isCompleted"
            type="button"
            class="btn-secondary px-3.5 py-2 text-[length:var(--font-body)]"
            :disabled="loading || settlement.items.length === 0"
            @click="allocateAllToWorkspace"
          >
            全部留在工作區
          </button>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="mt-4 rounded-xl border border-[var(--error)]/40 bg-[var(--error)]/10 px-4 py-3 text-[var(--error)]"
      >
        {{ errorMessage }}
      </div>

      <div v-if="loading && settlement.items.length === 0" class="py-16 text-center text-[var(--on-surface-variant)]">
        正在計算今日領料差距...
      </div>

      <div v-else-if="settlement.items.length === 0" class="py-16 text-center text-[var(--on-surface-variant)]">
        今日沒有可結算的手動領料資料
      </div>

      <div v-else class="mt-5 overflow-x-auto rounded-xl border border-[var(--outline)]">
        <table class="min-w-[1380px] w-full text-left text-[length:var(--font-body)]">
          <thead class="bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]">
            <tr>
              <th class="settlement-th">原物料</th>
              <th class="settlement-th">現場備料</th>
              <th class="settlement-th">理論／報廢</th>
              <th class="settlement-th">待處理差距</th>
              <th class="settlement-th">未記錄耗用</th>
              <th class="settlement-th">留在工作區</th>
              <th class="settlement-th">退回倉庫</th>
              <th class="settlement-th">處理狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in settlement.items"
              :key="item.materialId"
              class="border-t border-[var(--outline-variant)] align-top"
            >
              <td class="settlement-td min-w-44">
                <div class="font-bold text-[var(--on-surface)]">{{ item.materialName }}</div>
                <div class="mt-1 font-data-mono text-[var(--on-surface-variant)]">{{ item.materialCode }}</div>
              </td>
              <td class="settlement-td min-w-52">
                <div>前次留存 {{ formatQuantity(item.previousCarryoverQuantity) }} {{ item.unit }}</div>
                <div class="mt-1 text-[var(--on-surface-variant)]">
                  今日領料 {{ formatQuantity(item.manualIssueQuantity) }}
                </div>
                <div class="mt-1 font-bold text-[var(--primary)]">
                  現場可用 {{ formatQuantity(item.workspaceAvailableQuantity) }}
                </div>
              </td>
              <td class="settlement-td min-w-44">
                <div class="text-[var(--on-surface-variant)]">理論 {{ formatQuantity(item.theoreticalUsageQuantity) }} {{ item.unit }}</div>
                <div class="mt-1 text-[var(--error)]">報廢 {{ formatQuantity(item.wasteQuantity) }}</div>
              </td>
              <td class="settlement-td min-w-36">
                <strong class="font-data-mono text-[var(--tertiary)]">
                  {{ formatQuantity(item.differenceQuantity) }} {{ item.unit }}
                </strong>
              </td>
              <td class="settlement-td min-w-64">
                <input
                  v-model.number="item.unrecordedUsageQuantity"
                  :disabled="isCompleted"
                  type="number"
                  min="0"
                  step="0.0001"
                  class="settlement-input"
                  @input="recalculate(item)"
                />
                <select
                  v-model="item.unrecordedReason"
                  :disabled="isCompleted || numberOf(item.unrecordedUsageQuantity) <= 0"
                  class="settlement-input mt-2"
                  @change="recalculate(item)"
                >
                  <option :value="null">選擇實際耗用原因</option>
                  <option v-for="option in reasonOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <input
                  v-if="item.unrecordedReason === 'OTHER'"
                  v-model.trim="item.unrecordedNote"
                  :disabled="isCompleted"
                  class="settlement-input mt-2"
                  placeholder="請輸入其他原因"
                  @input="recalculate(item)"
                />
              </td>
              <td class="settlement-td min-w-40">
                <input
                  v-model.number="item.workspaceCarryoverQuantity"
                  :disabled="isCompleted"
                  type="number"
                  min="0"
                  step="0.0001"
                  class="settlement-input"
                  @input="recalculate(item)"
                />
              </td>
              <td class="settlement-td min-w-52">
                <input
                  v-model.number="item.returnedQuantity"
                  :disabled="isCompleted"
                  type="number"
                  min="0"
                  step="0.0001"
                  class="settlement-input"
                  @input="recalculate(item)"
                />
                <input
                  v-if="item.returnExpiryRequired && numberOf(item.returnedQuantity) > 0"
                  v-model="item.returnedExpiryDate"
                  :disabled="isCompleted"
                  :min="settlement.settlementDate"
                  type="date"
                  class="settlement-input mt-2"
                  @input="recalculate(item)"
                />
              </td>
              <td class="settlement-td min-w-44">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="isItemValid(item)
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                    : 'bg-[var(--error)]/15 text-[var(--error)]'"
                >
                  {{ isItemValid(item) ? '已分配' : `尚差 ${formatQuantity(item.unallocatedQuantity)}` }}
                </span>
                <p v-if="item.localValidationMessage" class="mt-2 text-xs text-[var(--error)]">
                  {{ item.localValidationMessage }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="settlement.items.length" class="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <label class="block">
          <span class="mb-2 block font-bold text-[var(--on-surface)]">結算備註</span>
          <textarea
            v-model.trim="settlement.note"
            :disabled="isCompleted"
            rows="2"
            class="settlement-input resize-none"
            placeholder="可填寫今日特殊狀況"
          />
        </label>
        <div class="flex flex-wrap justify-end gap-3">
          <button
            v-if="!isCompleted"
            type="button"
            class="btn-secondary px-5 py-2.5"
            :disabled="saving"
            @click="saveDraft"
          >
            {{ saving ? '儲存中...' : '儲存草稿' }}
          </button>
          <button
            v-if="!isCompleted"
            type="button"
            class="btn-primary px-5 py-2.5"
            :disabled="saving || !settlement.canComplete"
            @click="completeSettlement"
          >
            完成今日結算
          </button>
          <div v-else class="rounded-xl bg-[var(--primary)]/10 px-4 py-2.5 font-bold text-[var(--primary)]">
            今日結算已完成
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import httpClient from '@/service/httpClient'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const settlement = reactive({
  settlementId: null,
  settlementDate: '',
  status: 'DRAFT',
  note: '',
  createdByName: null,
  canComplete: false,
  items: []
})

const reasonOptions = [
  { value: 'EXTRA_ADDITION', label: '現場額外加料' },
  { value: 'TASTING', label: '試喝或品管' },
  { value: 'STAFF_USE', label: '員工使用' },
  { value: 'PRODUCTION_ERROR', label: '製作失誤' },
  { value: 'MISSED_SALE', label: '銷售漏登' },
  { value: 'BOM_INACCURATE', label: 'BOM 用量不準確' },
  { value: 'OTHER', label: '其他' }
]

const isCompleted = computed(() => settlement.status === 'COMPLETED')
const unallocatedItemCount = computed(() =>
  settlement.items.filter(item => !isItemValid(item)).length
)

function localDateText() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function numberOf(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatQuantity(value) {
  return numberOf(value).toLocaleString('zh-TW', { maximumFractionDigits: 4 })
}

function normalizeItem(item) {
  return {
    ...item,
    unrecordedUsageQuantity: numberOf(item.unrecordedUsageQuantity),
    workspaceCarryoverQuantity: numberOf(item.workspaceCarryoverQuantity),
    returnedQuantity: numberOf(item.returnedQuantity),
    localValidationMessage: item.validationMessage || ''
  }
}

function applyResponse(data) {
  Object.assign(settlement, data, {
    note: data.note || '',
    items: (data.items || []).map(normalizeItem)
  })
  settlement.items.forEach(recalculate)
  updateCanComplete()
}

function recalculate(item) {
  const allocated = numberOf(item.unrecordedUsageQuantity)
    + numberOf(item.workspaceCarryoverQuantity)
    + numberOf(item.returnedQuantity)
  item.unallocatedQuantity = numberOf(item.differenceQuantity) - allocated
  item.localValidationMessage = ''

  if ([item.unrecordedUsageQuantity, item.workspaceCarryoverQuantity, item.returnedQuantity]
    .some(value => numberOf(value) < 0)) {
    item.localValidationMessage = '數量不可小於 0'
  } else if (numberOf(item.unrecordedUsageQuantity) > 0 && !item.unrecordedReason) {
    item.localValidationMessage = '請選擇未記錄耗用原因'
  } else if (item.unrecordedReason === 'OTHER' && !item.unrecordedNote) {
    item.localValidationMessage = '請填寫其他原因'
  } else if (numberOf(item.returnedQuantity) > 0
    && item.returnExpiryRequired && !item.returnedExpiryDate) {
    item.localValidationMessage = '退回倉庫必須填寫有效日期'
  } else if (Math.abs(item.unallocatedQuantity) > 0.0001) {
    item.localValidationMessage = item.unallocatedQuantity > 0 ? '尚有差距未分配' : '分配數量超過差距'
  }
  updateCanComplete()
}

function isItemValid(item) {
  return !item.localValidationMessage && Math.abs(numberOf(item.unallocatedQuantity)) <= 0.0001
}

function updateCanComplete() {
  settlement.canComplete = Boolean(settlement.settlementId)
    && !isCompleted.value
    && settlement.items.length > 0
    && settlement.items.every(isItemValid)
}

function apiError(error, fallback) {
  return error.response?.data?.message
    || (typeof error.response?.data === 'string' ? error.response.data : '')
    || fallback
}

async function loadPreview() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await httpClient.get('/api/material-settlements/preview', {
      params: { date: localDateText() }
    })
    applyResponse(response.data)
  } catch (error) {
    console.error('取得當日領料結算失敗：', error)
    errorMessage.value = apiError(error, '取得當日領料結算失敗')
  } finally {
    loading.value = false
  }
}

function allocateAllToWorkspace() {
  settlement.items.forEach(item => {
    item.unrecordedUsageQuantity = 0
    item.unrecordedReason = null
    item.unrecordedNote = null
    item.returnedQuantity = 0
    item.returnedExpiryDate = null
    item.workspaceCarryoverQuantity = numberOf(item.differenceQuantity)
    recalculate(item)
  })
}

function requestPayload() {
  return {
    note: settlement.note || null,
    items: settlement.items.map(item => ({
      materialId: item.materialId,
      unrecordedUsageQuantity: numberOf(item.unrecordedUsageQuantity),
      unrecordedReason: item.unrecordedReason || null,
      unrecordedNote: item.unrecordedNote || null,
      workspaceCarryoverQuantity: numberOf(item.workspaceCarryoverQuantity),
      returnedQuantity: numberOf(item.returnedQuantity),
      returnedExpiryDate: item.returnedExpiryDate || null
    }))
  }
}

async function saveDraft() {
  settlement.items.forEach(recalculate)
  if (!settlement.items.every(isItemValid)) {
    errorMessage.value = '仍有原物料差距尚未正確分配'
    return null
  }
  saving.value = true
  errorMessage.value = ''
  try {
    const response = await httpClient.put(
      `/api/material-settlements/${settlement.settlementDate}`,
      requestPayload()
    )
    applyResponse(response.data)
    return response.data
  } catch (error) {
    console.error('儲存領料結算草稿失敗：', error)
    errorMessage.value = apiError(error, '儲存領料結算草稿失敗')
    return null
  } finally {
    saving.value = false
  }
}

async function completeSettlement() {
  // 完成前一律再儲存一次，避免使用者修改畫面後直接完成到舊草稿資料。
  const saved = await saveDraft()
  const id = saved?.settlementId
  if (!id || !settlement.canComplete) return
  if (!window.confirm('完成後將鎖定今日結算，退回數量也會加入庫存。確定繼續嗎？')) return

  saving.value = true
  errorMessage.value = ''
  try {
    const response = await httpClient.post(`/api/material-settlements/${id}/complete`)
    applyResponse(response.data)
  } catch (error) {
    console.error('完成領料結算失敗：', error)
    errorMessage.value = apiError(error, '完成領料結算失敗')
  } finally {
    saving.value = false
  }
}

defineExpose({ refresh: loadPreview })
onMounted(loadPreview)
</script>

<style scoped>
.settlement-metric {
  display: flex;
  min-height: 118px;
  flex-direction: column;
  justify-content: center;
  border: 1px solid var(--outline);
  border-radius: 1rem;
  background: var(--surface-container);
  padding: 1rem 1.25rem;
}
.settlement-metric span,
.settlement-metric small { color: var(--on-surface-variant); }
.settlement-metric strong {
  margin: .25rem 0;
  font-family: var(--font-data-mono);
  font-size: 1.6rem;
}
.settlement-th { padding: .9rem 1rem; font-weight: 700; white-space: nowrap; }
.settlement-td { padding: 1rem; color: var(--on-surface); }
.settlement-input {
  width: 100%;
  border: 1px solid var(--outline);
  border-radius: .65rem;
  background: var(--surface);
  padding: .55rem .7rem;
  color: var(--on-surface);
  outline: none;
}
.settlement-input:focus { border-color: var(--primary); }
.settlement-input:disabled { cursor: not-allowed; opacity: .65; }
</style>
