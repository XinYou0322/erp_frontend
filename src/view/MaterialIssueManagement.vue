<template>
  <div class="space-y-6 pb-12">

    <!-- KPI Cards -->



    <!-- 與庫存異動紀錄共用的查詢工具列 -->
    <Filter
      class="purchase-order-filter material-issue-filter"
      id-prefix="material-issue"
      :show-supplier="true"
      supplier-label="原物料"
      supplier-default-text="全部原物料"
      :supplier-options="materialFilterOptions"
      v-model:supplier-value="selectedMaterialId"
      :show-search="true"
      search-label="搜尋原物料"
      search-placeholder="輸入原物料名稱或料號"
      v-model:search-value="searchQuery"
      :show-refresh="false"
      :show-reset="false"
    >
      <template #actions>
        <button
          type="button"
          class="btn-secondary text-[length:var(--font-body)] px-3 py-1.5 inline-flex items-center space-x-1.5"
          title="重新整理當日領料紀錄"
          @click="loadLogs"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>重新整理</span>
        </button>

        <button
          type="button"
          class="btn-primary ml-2 px-3.5 py-2"
          @click="inventoryAdjustmentModalOpen = true"
        >
          新增領料
        </button>
      </template>
    </Filter>


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
      正在讀取當日領料紀錄...
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
            <col class="w-[18%]" />
            <col class="w-[25%]" />
            <col class="w-[15%]" />
            <col class="w-[15%]" />
            <col class="w-[27%]" />
          </colgroup>

          <thead>
            <tr class="data-table__head-row">
              <th class="data-table__header">
                領料時間
              </th>

              <th class="data-table__header">
                原物料名稱 / 料號
              </th>

              <th class="data-table__header">
                領料類型
              </th>

              <th class="data-table__header">
                領料數量
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
                    text-[var(--on-surface)]
                  "
                >
                  {{ formatQuantity(Math.abs(Number(log.quantity))) }}
                  {{ log.unit }}
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
                colspan="5"
                class="data-table__empty"
              >
                今日尚無領料紀錄
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
  fixed-action="MANUAL_USE"
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

import { RefreshCw } from 'lucide-vue-next'
import Filter from '@/component/子元件/Filter.vue'
import Pagination from '@/component/子元件/Pagination.vue'
import httpClient from '@/service/httpClient'
import InventoryAdjustmentModal from '@/component/父元件/InventoryAdjustmentModal.vue'
import StatusBadge from '@/component/子元件/StatusBadge.vue'
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



// ==============================
// 取得全部當日領料紀錄
// ==============================

const loadLogs = () => {

  loading.value = true

  errorMessage.value = ''


  httpClient
    .get('/api/inventory-logs')

    .then((response) => {

      logs.value = response.data

      console.log(
        '當日領料紀錄：',
        logs.value
      )

    })

    .catch((error) => {

      console.error(
        '取得當日領料紀錄失敗：',
        error
      )

      errorMessage.value =
        '取得當日領料紀錄失敗'

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
// 領料類型選項
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


// ==============================
// 前端篩選
// ==============================

const filteredLogs = computed(() => {

  const keyword =
    searchQuery.value
      .trim()
      .toLowerCase()

  const today = new Date()

  return logs.value.filter((log) => {

    const isManualUse =
      log.action === 'MANUAL_USE'

    const logDate = new Date(log.createdAt)

    const isToday =
      logDate.getFullYear() === today.getFullYear()
      &&
      logDate.getMonth() === today.getMonth()
      &&
      logDate.getDate() === today.getDate()

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

    return (
      isManualUse
      &&
      isToday
      &&
      matchesKeyword
      &&
      matchesMaterial
    )

  })

})
// ==============================
// 分頁
// ==============================

const currentPage = ref(1)

watch(
  [searchQuery, selectedMaterialId],
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
// 領料類型中文
// ==============================

const getActionLabel = (action) => {

  const labels = {

    STOCK_IN:
      '進貨',

    SALE_DEDUCT:
      '銷售扣減',

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
// 領料類型樣式
// ==============================
const getActionStatus = (action) => {

  switch (action) {

    // 庫存增加 → 綠色
    case 'STOCK_IN':
    case 'ADJUSTMENT_IN':
      return 'normal'


    // 正常扣庫 / 人工扣庫 → 黃色
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


// ==============================
// 進入頁面時自動讀取
// ==============================

onMounted(() => {

  loadLogs()

})

</script>
