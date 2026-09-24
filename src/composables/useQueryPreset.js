// src/composables/useQueryPreset.js
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

function toLocalDateStr(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 把 query.date 解析成 { from, to }
function resolveDateRange(query) {
  const today = toLocalDateStr(new Date())

  if (query.date === 'today') return { from: today, to: today }

  if (query.date === 'week') {
    const d = new Date()
    const day = d.getDay() === 0 ? 7 : d.getDay() // 週日算第 7 天
    const monday = new Date(d)
    monday.setDate(d.getDate() - (day - 1))
    return { from: toLocalDateStr(monday), to: today }
  }

  if (query.date === 'month') {
    const first = toLocalDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    return { from: first, to: today }
  }

  if (query.from || query.to) return { from: query.from || '', to: query.to || '' }

  return null
}

const DATE_LABELS = { today: '今日', week: '本週', month: '本月' }

/**
 * 讀取 URL query 作為篩選預設值 (deep link 用)
 * 支援: ?date=today|week|month 或 ?from=&to= 以及 ?status=XXX
 * @param {Object} statusLabelMap 狀態值→中文標籤, 用於提示文字
 */
export function useQueryPreset(statusLabelMap = {}) {
  const route = useRoute()

  const range = resolveDateRange(route.query)
  const initialStatus = route.query.status ?? ''

  const startDate = ref(range?.from ?? '')
  const endDate = ref(range?.to ?? '')
  const status = ref(initialStatus)

  const showPresetHint = ref(Boolean(range) || Boolean(initialStatus))

  const presetLabel = computed(() => {
    const parts = []
    if (route.query.date) parts.push(DATE_LABELS[route.query.date] || '指定日期')
    else if (route.query.from || route.query.to) parts.push('指定日期')
    if (route.query.status) parts.push(statusLabelMap[route.query.status] || route.query.status)
    return parts.join('・')
  })

  // 使用者手動改篩選後, 提示自動消失
  watch([startDate, endDate, status], ([s, e, st]) => {
    if (!showPresetHint.value) return
    if (s !== (range?.from ?? '') || e !== (range?.to ?? '') || st !== initialStatus) {
      showPresetHint.value = false
    }
  })

  function clearPreset() {
    startDate.value = ''
    endDate.value = ''
    status.value = ''
    showPresetHint.value = false
  }

  return { startDate, endDate, status, showPresetHint, presetLabel, clearPreset }
}