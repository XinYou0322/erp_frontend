<template>
  <div class="space-y-6 pb-12">

    <!-- KPI Cards -->



    <!-- 由原物料進銷存上方 Bar 控制展開的查詢工具列 -->
    <Transition name="inventory-filter">
      <Filter
        v-show="filtersExpanded"
        class="purchase-order-filter inventory-log-filter"
        id-prefix="inventory-log"
        :show-status="true"
        status-label="異動類型"
        status-default-text="全部異動類型"
        :status-options="actionFilterOptions"
        v-model:status-value="selectedAction"
        :show-supplier="true"
        supplier-label="原物料"
        supplier-default-text="全部原物料"
        :supplier-options="materialFilterOptions"
        v-model:supplier-value="selectedMaterialId"
        :show-date-range="true"
        date-label="異動日期"
        v-model:start-date="startDate"
        v-model:end-date="endDate"
        :show-search="true"
        search-label="搜尋原物料"
        search-placeholder="輸入原物料名稱或料號"
        v-model:search-value="searchQuery"
        :show-refresh="false"
        :show-reset="false"
      >
      </Filter>
    </Transition>


    <!-- Loading -->
    <div
      v-if="loading"
      class="
        rounded-2xl
        p-8
        text-center
        text-[length:var(--font-title)]
        bg-[var(--surface-container)]
        border
        border-[var(--outline)]
        text-[var(--on-surface-variant)]
      "
    >
      正在讀取庫存異動紀錄...
    </div>


    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="
        rounded-2xl
        border
        border-[var(--error)]/30
        bg-[var(--error)]/10
        p-4
        text-[length:var(--font-title)]
        text-[var(--error)]
      "
    >
      {{ errorMessage }}
    </div>


    <!-- Log Table -->
    <div
      v-else
      class="data-table-card"
    >

      <div class="data-table-scroll">

        <table class="data-table data-table--fixed">
          <colgroup>
            <col class="w-[17%]" />
            <col class="w-[22%]" />
            <col class="w-[13%]" />
            <col class="w-[13%]" />
            <col class="w-[12%]" />
            <col class="w-[23%]" />
          </colgroup>

          <thead>
            <tr class="data-table__head-row">
              <th class="data-table__header">
                異動時間
              </th>

              <th class="data-table__header">
                原物料名稱 / 料號
              </th>

              <th class="data-table__header">
                異動類型
              </th>

              <th class="data-table__header">
                異動數量
              </th>

              <th class="data-table__header">
                關聯單據
              </th>

              <th class="data-table__header">
                備註
              </th>
            </tr>
          </thead>


          <tbody class="data-table__body">

            <tr
            v-for="log in paginatedLogs"
  :key="log.id"
              class="data-table__row"
            >

              <!-- Time -->
              <td class="data-table__cell data-table__cell--nowrap">

                <div
                  class="
                    font-data-mono
                    text-[length:var(--font-body)]
                    text-[var(--on-surface)]
                  "
                >
                  {{ formatDateTime(log.createdAt) }}
                </div>

                <div
                  class="
                    text-[length:var(--font-small)]
                    text-[var(--on-surface-variant)]
                    mt-1
                  "
                >
                  Log ID：{{ log.id }}
                </div>

              </td>


              <!-- Material -->
              <td class="data-table__cell">

                <div
                  class="
                    font-bold
                    text-[length:var(--font-title)]
                    text-[var(--on-surface)]
                  "
                >
                  {{ log.materialName }}
                </div>

                <div
                  class="
                    text-[length:var(--font-body)]
                    text-[var(--on-surface-variant)]
                    font-data-mono
                    mt-0.5
                  "
                >
                  {{ log.materialCode }}
                </div>

              </td>


              <!-- Action -->
              <td class="data-table__cell">

         <StatusBadge
  :status="getActionStatus(log.action)"
  :label="getActionLabel(log.action)"
/>

              </td>


              <!-- Quantity -->
              <td class="data-table__cell">

                <span
                  class="
                    font-data-mono
                    font-bold
                    text-[length:var(--font-title)]
                  "
                  :class="
                    Number(log.quantity) >= 0
                      ? 'text-[var(--primary)]'
                      : 'text-[var(--error)]'
                  "
                >
                  {{
                    Number(log.quantity) > 0
                      ? '+'
                      : ''
                  }}
                  {{ formatQuantity(log.quantity) }}
                  {{ log.unit }}
                </span>

              </td>


              <!-- Ref ID -->
              <td class="data-table__cell">

                <span
                  v-if="log.refId !== null && log.refId !== undefined"
                  class="
                    font-data-mono
                    text-[length:var(--font-body)]
                    text-[var(--on-surface)]
                  "
                >
                  #{{ log.refId }}
                </span>

                <span
                  v-else
                  class="
                    text-[length:var(--font-body)]
                    text-[var(--on-surface-variant)]
                  "
                >
                  -
                </span>

              </td>


              <!-- Note -->
              <td class="data-table__cell">

                <span
                  v-if="log.note"
                  class="
                    text-[length:var(--font-body)]
                    text-[var(--on-surface)]
                  "
                >
                  {{ log.note }}
                </span>

                <span
                  v-else
                  class="
                    text-[length:var(--font-body)]
                    text-[var(--on-surface-variant)]
                  "
                >
                  無備註
                </span>

              </td>

            </tr>


            <!-- Empty -->
            <tr v-if="filteredLogs.length === 0">

              <td
                colspan="6"
                class="data-table__empty"
              >
                目前沒有符合條件的庫存異動紀錄
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
<Pagination
  :current-page="currentPage"
  :total-pages="totalPages"
  @change-page="goToPage"
/>

    <InventoryAdjustmentModal
      :is-open="inventoryAdjustmentModalOpen"
      @close="inventoryAdjustmentModalOpen = false"
      @success="handleAdjustmentSuccess"
    />

  </div>
</template>
<script setup>

import {
  ref,
  computed,
  onMounted,
  watch
} from 'vue'

import Filter from '@/component/子元件/Filter.vue'
import Pagination from '@/component/子元件/Pagination.vue'
import httpClient from '@/service/httpClient'
import InventoryAdjustmentModal from '@/component/父元件/InventoryAdjustmentModal.vue'
import StatusBadge from '@/component/子元件/StatusBadge.vue'
defineProps({
  filtersExpanded: {
    type: Boolean,
    default: false
  }
})
const inventoryAdjustmentModalOpen = ref(false)
// ==============================
// 異動紀錄
// ==============================
const handleAdjustmentSuccess = async () => {

  await loadLogs()

}
const logs = ref([])

// ==============================
// 頁面狀態
// ==============================

const loading = ref(false)

const errorMessage = ref('')


// ==============================
// 篩選條件
// ==============================

const searchQuery = ref('')

const selectedMaterialId = ref('')

const selectedAction = ref('')

const startDate = ref('')

const endDate = ref('')


// ==============================
// 取得全部庫存異動紀錄
// ==============================

const loadLogs = () => {

  loading.value = true

  errorMessage.value = ''


  httpClient
    .get('/api/inventory-logs')

    .then((response) => {

      logs.value = response.data

      console.log(
        '庫存異動紀錄：',
        logs.value
      )

    })

    .catch((error) => {

      console.error(
        '取得庫存異動紀錄失敗：',
        error
      )

      errorMessage.value =
        '取得庫存異動紀錄失敗'

    })

    .finally(() => {

      loading.value = false

    })

}


// ==============================
// 原物料篩選選項
// 從異動紀錄本身整理出不重複品項
// ==============================

const materialOptions = computed(() => {

  const map = new Map()

  logs.value.forEach((log) => {

    if (!map.has(log.materialId)) {

      map.set(
        log.materialId,
        {
          id: log.materialId,
          name: log.materialName,
          code: log.materialCode
        }
      )

    }

  })

  return Array.from(map.values())

})

const materialFilterOptions = computed(() =>
  materialOptions.value.map((material) => ({
    label: `${material.name}（${material.code}）`,
    value: String(material.id)
  }))
)


// ==============================
// 異動類型選項
// ==============================

const actionOptions = computed(() => {

  return [
    ...new Set(
      logs.value
        .map(log => log.action)
        .filter(action => action)
    )
  ]

})

const actionFilterOptions = computed(() =>
  actionOptions.value.map((action) => ({
    label: getActionLabel(action),
    value: action
  }))
)


// ==============================
// 前端篩選
// ==============================

const filteredLogs = computed(() => {

  const keyword =
    searchQuery.value
      .trim()
      .toLowerCase()


  return logs.value.filter((log) => {

    const matchesKeyword =
      !keyword
      ||
      String(log.materialName || '')
        .toLowerCase()
        .includes(keyword)
      ||
      String(log.materialCode || '')
        .toLowerCase()
        .includes(keyword)


    const matchesMaterial =
      !selectedMaterialId.value
      ||
      String(log.materialId)
        === selectedMaterialId.value


    const matchesAction =
      !selectedAction.value
      ||
      log.action === selectedAction.value

    const logDate = new Date(log.createdAt)

    const startBoundary = startDate.value
      ? new Date(`${startDate.value}T00:00:00`)
      : null

    const endBoundary = endDate.value
      ? new Date(`${endDate.value}T23:59:59.999`)
      : null

    const hasDateFilter = Boolean(startBoundary || endBoundary)

    const matchesDate =
      !hasDateFilter
      ||
      (
        !Number.isNaN(logDate.getTime())
        &&
        (!startBoundary || logDate >= startBoundary)
        &&
        (!endBoundary || logDate <= endBoundary)
      )


    return (
      matchesKeyword
      &&
      matchesMaterial
      &&
      matchesAction
      &&
      matchesDate
    )

  })

})
// ==============================
// 分頁
// ==============================

const currentPage = ref(1)

watch(
  [searchQuery, selectedMaterialId, selectedAction, startDate, endDate],
  () => {
    currentPage.value = 1
  }
)

const pageSize = 10

const totalPages = computed(() => {
  return Math.ceil(filteredLogs.value.length / pageSize)
})

const paginatedLogs = computed(() => {

  const start =
    (currentPage.value - 1) * pageSize

  const end =
    start + pageSize

  return filteredLogs.value.slice(
    start,
    end
  )
})

const goToPage = (page) => {

  if (
    page < 1 ||
    page > totalPages.value
  ) {
    return
  }

  currentPage.value = page
}
// ==============================
// KPI
// ==============================

const stockInCount = computed(() => {

  return logs.value.filter(
    log =>
      log.action === 'STOCK_IN'
  ).length

})


const deductCount = computed(() => {

  return logs.value.filter(
    log =>
      Number(log.quantity) < 0
  ).length

})


const materialCount = computed(() => {

  return new Set(
    logs.value.map(
      log => log.materialId
    )
  ).size

})


// ==============================
// 異動類型中文
// ==============================

const getActionLabel = (action) => {

  const labels = {

    STOCK_IN:
      '進貨',

    // 【本次新增：銷售與庫存同步】顯示銷售完成後自動扣除庫存的異動紀錄。
    SALE_DEDUCT:
      '銷售扣減',

    // 【本次新增：銷售與庫存同步】顯示銷售單報廢後自動回補庫存的異動紀錄。
    SALE_RESTORE:
      '銷售報廢回補',

    WASTE:
      '耗損',

    ADJUSTMENT_IN: 
    '盤點盤盈',

    ADJUSTMENT_OUT: 
    '盤點盤虧',


    MANUAL_USE:
      '手動領料',

    EXPIRED:
      '過期報廢'

  }

  return labels[action] || action || '-'

}


// ==============================
// 異動類型樣式
// ==============================
const getActionStatus = (action) => {

  switch (action) {

    // 庫存增加 → 綠色
    case 'STOCK_IN':
    case 'ADJUSTMENT_IN':
    // 【本次新增：銷售與庫存同步】銷售報廢回補屬於庫存增加，使用正常／綠色狀態。
    case 'SALE_RESTORE':
      return 'normal'


    // 正常扣庫 / 人工扣庫 → 黃色
    // 【本次新增：銷售與庫存同步】銷售扣減屬於正常出庫，使用低庫存／黃色狀態。
    case 'SALE_DEDUCT':
    case 'MANUAL_USE':
    case 'ADJUSTMENT_OUT':
      return 'low'


    // 異常耗損 / 報廢 → 紅色
    case 'WASTE':
    case 'EXPIRED':
      return 'urgent'


    // 未知類型 → 灰色
    default:
      return 'pending'
  }

}



// ==============================
// 數量格式
// ==============================

const formatQuantity = (quantity) => {

  const number =
    Number(quantity || 0)

  return number.toLocaleString(
    'zh-TW',
    {
      maximumFractionDigits: 4
    }
  )

}


// ==============================
// 日期格式
// ==============================

const formatDateTime = (dateTime) => {

  if (!dateTime) {

    return '無資料'

  }


  const date =
    new Date(dateTime)


  return date.toLocaleString(
    'zh-TW',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }
  )

}

defineExpose({
  refresh: loadLogs,
  openPrimaryAction: () => {
    inventoryAdjustmentModalOpen.value = true
  }
})


// ==============================
// 進入頁面時自動讀取
// ==============================

onMounted(() => {

  loadLogs()

})

</script>
