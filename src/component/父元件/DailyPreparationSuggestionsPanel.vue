<template>
  <section class="space-y-5">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in summaryCards" :key="card.status" class="preparation-metric">
        <div class="flex items-center justify-between gap-3">
          <span>{{ card.label }}</span>
          <component :is="card.icon" class="h-5 w-5" :class="card.color" />
        </div>
        <strong :class="card.color">{{ statusCounts[card.status] || 0 }}</strong>
        <small>{{ card.description }}</small>
      </div>
    </div>

    <div class="rounded-2xl border border-[var(--outline)] bg-[var(--surface-container)] p-5 shadow-level-1">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-[length:var(--font-headline)] font-bold text-[var(--on-surface)]">今日備料建議</h2>
          <p class="mt-1 text-[length:var(--font-body)] text-[var(--on-surface-variant)]">
            依 7 日與 30 日平均耗用、10% 緩衝及前次工作區留存，估算今日建議領料量。
          </p>
        </div>
        <button type="button" class="btn-secondary px-3.5 py-2" :disabled="loading" @click="loadSuggestions">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          重新計算
        </button>
      </div>

      <Transition name="inventory-filter">
      <div v-show="filtersExpanded" class="mt-5 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_auto]">
        <label class="block">
          <span class="mb-1.5 block text-sm font-bold text-[var(--on-surface-variant)]">搜尋原物料</span>
          <div class="relative">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--on-surface-variant)]" />
            <input v-model.trim="searchQuery" class="preparation-input pl-9" placeholder="輸入名稱或料號" />
          </div>
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-bold text-[var(--on-surface-variant)]">建議狀態</span>
          <select v-model="selectedStatus" class="preparation-input">
            <option value="">全部狀態</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="flex items-end gap-2 pb-2 text-sm font-bold text-[var(--on-surface)]">
          <input v-model="onlyActionable" type="checkbox" class="h-4 w-4 accent-[var(--primary)]" />
          只看需要處理
        </label>
      </div>
      </Transition>

      <div v-if="errorMessage" class="mt-4 rounded-xl border border-[var(--error)]/40 bg-[var(--error)]/10 px-4 py-3 text-[var(--error)]">
        {{ errorMessage }}
      </div>
      <div v-if="loading && suggestions.length === 0" class="py-16 text-center text-[var(--on-surface-variant)]">
        正在計算今日備料建議...
      </div>
      <div v-else-if="filteredSuggestions.length === 0" class="py-16 text-center text-[var(--on-surface-variant)]">
        沒有符合條件的備料建議
      </div>

      <div v-else class="mt-5 overflow-x-auto rounded-xl border border-[var(--outline)]">
        <table class="min-w-[1180px] w-full text-left text-[length:var(--font-body)]">
          <thead class="bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]">
            <tr>
              <th class="preparation-th">原物料</th>
              <th class="preparation-th">歷史平均耗用</th>
              <th class="preparation-th">今日需求</th>
              <th class="preparation-th">前次留存</th>
              <th class="preparation-th">建議領料</th>
              <th class="preparation-th">倉庫可用</th>
              <th class="preparation-th">狀態</th>
              <th class="preparation-th text-right">詳細資訊</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="item in filteredSuggestions" :key="item.materialId">
              <tr class="border-t border-[var(--outline-variant)] align-middle">
                <td class="preparation-td">
                  <div class="font-bold text-[var(--on-surface)]">{{ item.materialName }}</div>
                  <div class="mt-1 font-data-mono text-[var(--on-surface-variant)]">{{ item.materialCode }}</div>
                </td>
                <td class="preparation-td">
                  <div>7 日：{{ quantity(item.averageUsage7Days) }} {{ item.unit }}</div>
                  <div class="mt-1 text-[var(--on-surface-variant)]">30 日：{{ quantity(item.averageUsage30Days) }} {{ item.unit }}</div>
                </td>
                <td class="preparation-td">
                  <div class="font-bold">{{ quantity(item.estimatedTodayUsage) }} {{ item.unit }}</div>
                  <div class="mt-1 text-[var(--on-surface-variant)]">緩衝 {{ quantity(item.bufferQuantity) }}</div>
                </td>
                <td class="preparation-td">
                  <span v-if="numberOf(item.previousCarryoverQuantity) > 0" class="font-bold text-purple-400">
                    {{ quantity(item.previousCarryoverQuantity) }} {{ item.unit }}
                  </span>
                  <span v-else class="text-[var(--on-surface-variant)]">無留存</span>
                </td>
                <td class="preparation-td">
                  <div class="font-data-mono text-lg font-bold text-[var(--primary)]">
                    {{ quantity(item.suggestedIssueQuantity) }} {{ item.unit }}
                  </div>
                  <div class="mt-1 text-xs text-[var(--on-surface-variant)]">
                    原始 {{ quantity(item.rawSuggestedIssueQuantity) }}，每 {{ quantity(item.issueStep) }} 取整
                  </div>
                </td>
                <td class="preparation-td">
                  <div>{{ quantity(item.availableInventoryQuantity) }} {{ item.unit }}</div>
                  <div v-if="numberOf(item.shortageQuantity) > 0" class="mt-1 font-bold text-[var(--error)]">
                    缺 {{ quantity(item.shortageQuantity) }}
                  </div>
                </td>
                <td class="preparation-td">
                  <span class="preparation-status" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
                </td>
                <td class="preparation-td text-right">
                  <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-[var(--outline)] px-3 py-1.5 font-bold text-[var(--primary)] hover:bg-[var(--primary)]/10" @click="toggleDetails(item.materialId)">
                    {{ expandedMaterialId === item.materialId ? '收起' : '查看計算' }}
                    <ChevronUp v-if="expandedMaterialId === item.materialId" class="h-4 w-4" />
                    <ChevronDown v-else class="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="expandedMaterialId === item.materialId" class="border-t border-[var(--outline-variant)] bg-[var(--surface)]/50">
                <td colspan="8" class="p-4">
                  <div class="grid gap-4 lg:grid-cols-3">
                    <div class="formula-card">
                      <strong>① 今日預估用量</strong>
                      <p>7 日平均 × 70% ＋ 30 日平均 × 30%</p>
                      <code>{{ quantity(item.averageUsage7Days) }} × 70% ＋ {{ quantity(item.averageUsage30Days) }} × 30% ＝ {{ quantity(item.estimatedTodayUsage) }} {{ item.unit }}</code>
                    </div>
                    <div class="formula-card">
                      <strong>② 原始建議</strong>
                      <p>今日預估 ＋ 10% 緩衝 − 前次留存</p>
                      <code>{{ quantity(item.estimatedTodayUsage) }} ＋ {{ quantity(item.bufferQuantity) }} − {{ quantity(item.previousCarryoverQuantity) }} ＝ {{ quantity(item.rawSuggestedIssueQuantity) }} {{ item.unit }}</code>
                    </div>
                    <div class="formula-card">
                      <strong>③ 現場可執行</strong>
                      <p>依領料級距向上取整，再與可用庫存比較</p>
                      <code>建議 {{ quantity(item.suggestedIssueQuantity) }}；最多可領 {{ quantity(item.executableIssueQuantity) }} {{ item.unit }}</code>
                    </div>
                  </div>
                  <p class="mt-4 rounded-xl bg-[var(--primary)]/8 px-4 py-3 text-[var(--on-surface)]">
                    {{ item.recommendation }}
                  </p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, CircleOff, HelpCircle, RefreshCw, Search } from 'lucide-vue-next'
import httpClient from '@/service/httpClient'

defineProps({
  filtersExpanded: {
    type: Boolean,
    default: false
  }
})

const suggestions = ref([])
const loading = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const selectedStatus = ref('')
const onlyActionable = ref(false)
const expandedMaterialId = ref(null)

const statusOptions = [
  { value: 'INSUFFICIENT_STOCK', label: '庫存不足' },
  { value: 'READY', label: '建議領料' },
  { value: 'NO_ACTION', label: '暫不需領料' },
  { value: 'NO_USAGE_DATA', label: '無耗用資料' }
]

const summaryCards = [
  { status: 'READY', label: '建議領料', description: '庫存足夠，可依建議備料', icon: CheckCircle2, color: 'text-[var(--primary)]' },
  { status: 'INSUFFICIENT_STOCK', label: '庫存不足', description: '建議量高於目前可用庫存', icon: AlertTriangle, color: 'text-[var(--error)]' },
  { status: 'NO_ACTION', label: '暫不需領料', description: '前次留存已足夠使用', icon: CircleOff, color: 'text-[var(--on-surface-variant)]' },
  { status: 'NO_USAGE_DATA', label: '無耗用資料', description: '最近 30 日無法估算', icon: HelpCircle, color: 'text-[var(--tertiary)]' }
]

const statusCounts = computed(() => suggestions.value.reduce((result, item) => {
  result[item.status] = (result[item.status] || 0) + 1
  return result
}, {}))

const filteredSuggestions = computed(() => {
  const keyword = searchQuery.value.toLowerCase()
  return suggestions.value.filter(item => {
    const matchesKeyword = !keyword
      || String(item.materialName || '').toLowerCase().includes(keyword)
      || String(item.materialCode || '').toLowerCase().includes(keyword)
    const matchesStatus = !selectedStatus.value || item.status === selectedStatus.value
    const matchesActionable = !onlyActionable.value
      || ['READY', 'INSUFFICIENT_STOCK'].includes(item.status)
    return matchesKeyword && matchesStatus && matchesActionable
  })
})

function localDateText() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function numberOf(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function quantity(value) {
  return numberOf(value).toLocaleString('zh-TW', { maximumFractionDigits: 2 })
}

function statusLabel(status) {
  return statusOptions.find(option => option.value === status)?.label || status
}

function statusClass(status) {
  return {
    INSUFFICIENT_STOCK: 'is-danger',
    READY: 'is-ready',
    NO_ACTION: 'is-muted',
    NO_USAGE_DATA: 'is-warning'
  }[status] || 'is-muted'
}

function toggleDetails(materialId) {
  expandedMaterialId.value = expandedMaterialId.value === materialId ? null : materialId
}

async function loadSuggestions() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await httpClient.get('/api/analytics/daily-preparation-suggestions', {
      params: { date: localDateText() }
    })
    suggestions.value = response.data || []
  } catch (error) {
    console.error('取得今日備料建議失敗：', error)
    errorMessage.value = error.response?.data?.message || '取得今日備料建議失敗'
  } finally {
    loading.value = false
  }
}

defineExpose({ refresh: loadSuggestions })
onMounted(loadSuggestions)
</script>

<style scoped>
.preparation-metric { display:flex; min-height:118px; flex-direction:column; justify-content:center; border:1px solid var(--outline); border-radius:1rem; background:var(--surface-container); padding:1rem 1.25rem; }
.preparation-metric span,.preparation-metric small { color:var(--on-surface-variant); }
.preparation-metric strong { margin:.25rem 0; font-family:var(--font-data-mono); font-size:1.6rem; }
.preparation-input { width:100%; border:1px solid var(--outline); border-radius:.7rem; background:var(--surface); padding:.65rem .8rem; color:var(--on-surface); outline:none; }
.preparation-input:focus { border-color:var(--primary); }
.preparation-th { padding:.9rem 1rem; font-weight:700; white-space:nowrap; }
.preparation-td { padding:1rem; color:var(--on-surface); }
.preparation-status { display:inline-flex; border-radius:999px; padding:.3rem .65rem; font-size:.75rem; font-weight:700; white-space:nowrap; }
.preparation-status.is-danger { background:color-mix(in srgb,var(--error) 15%,transparent); color:var(--error); }
.preparation-status.is-ready { background:color-mix(in srgb,var(--primary) 15%,transparent); color:var(--primary); }
.preparation-status.is-warning { background:color-mix(in srgb,var(--tertiary) 15%,transparent); color:var(--tertiary); }
.preparation-status.is-muted { background:var(--surface-container-high); color:var(--on-surface-variant); }
.formula-card { border:1px solid var(--outline); border-radius:.85rem; background:var(--surface-container); padding:1rem; }
.formula-card strong { color:var(--on-surface); }
.formula-card p { margin:.35rem 0; color:var(--on-surface-variant); font-size:.8rem; }
.formula-card code { color:var(--primary); white-space:normal; }
</style>
