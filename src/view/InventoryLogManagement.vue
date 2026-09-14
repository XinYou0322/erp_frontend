<template>
  <div class="space-y-6 pb-12">

    <!-- KPI Cards -->



    <!-- Toolbar -->
    <div
      class="
        p-4
        rounded-2xl
        flex
        flex-col
        gap-4
        bg-[var(--surface-container)]
        border
        border-[var(--outline)]
      "
    >

      <div
        class="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          justify-between
          gap-3
        "
      >
        <div>

          <div
            class="
              font-bold
              text-[length:var(--font-heading)]
              text-[var(--on-surface)]
            "
          >
            庫存異動紀錄
          </div>

          <div
            class="
              text-[length:var(--font-body)]
              text-[var(--on-surface-variant)]
              mt-1
            "
          >
            查詢原物料進貨、銷售扣減、耗損與盤點調整歷程
          </div>

        </div>


        <div class="flex items-center space-x-2">

          <button
            type="button"
            @click="loadLogs"
            class="
              btn-secondary
              text-[length:var(--font-body)]
              px-3
              py-1.5
              flex
              items-center
              space-x-1.5
            "
          >
            <RefreshCw class="w-3.5 h-3.5" />
            <span>重新整理</span>
          </button>

          <button
            type="button"
            @click="inventoryAdjustmentModalOpen = true"
            class="
              btn-primary
              text-[length:var(--font-body)]
              px-3.5
              py-1.5
              flex
              items-center
              space-x-1.5
            "
          >
            <span>庫存調整</span>
          </button>

        </div>
      </div>


      <!-- Filter -->
      <div
        class="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-3
        "
      >

        <div>

          <label
            class="
              block
              text-[length:var(--font-body)]
              font-bold
              text-[var(--on-surface-variant)]
              mb-1
            "
          >
            搜尋原物料
          </label>

          <input
            v-model="searchQuery"
            type="text"
            placeholder="輸入原物料名稱或料號"
            class="
              input-field
              text-[length:var(--font-body)]
            "
          />

        </div>


        <div>

          <label
            class="
              block
              text-[length:var(--font-body)]
              font-bold
              text-[var(--on-surface-variant)]
              mb-1
            "
          >
            原物料
          </label>

          <select
            v-model="selectedMaterialId"
            class="
              input-field
              text-[length:var(--font-body)]
            "
          >
            <option value="">
              全部原物料
            </option>

            <option
              v-for="material in materialOptions"
              :key="material.id"
              :value="String(material.id)"
            >
              {{ material.name }}（{{ material.code }}）
            </option>
          </select>

        </div>


        <div>

          <label
            class="
              block
              text-[length:var(--font-body)]
              font-bold
              text-[var(--on-surface-variant)]
              mb-1
            "
          >
            異動類型
          </label>

          <select
            v-model="selectedAction"
            class="
              input-field
              text-[length:var(--font-body)]
            "
          >
            <option value="">
              全部異動類型
            </option>

            <option
              v-for="action in actionOptions"
              :key="action"
              :value="action"
            >
              {{ getActionLabel(action) }}
            </option>
          </select>

        </div>

      </div>

    </div>


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
      class="
        rounded-2xl
        overflow-hidden
        bg-[var(--surface-container)]
        border
        border-[var(--outline)]
        shadow-sm
      "
    >

      <div class="overflow-x-auto">

        <table class="w-full text-left border-collapse">

          <thead>
            <tr
              class="
                bg-[var(--surface-container-high)]
                border-b
                border-[var(--outline)]
                text-[length:var(--font-body)]
                font-bold
                text-[var(--on-surface-variant)]
                uppercase
                tracking-wider
              "
            >
              <th class="py-3 px-4">
                異動時間
              </th>

              <th class="py-3 px-4">
                原物料名稱 / 料號
              </th>

              <th class="py-3 px-4">
                異動類型
              </th>

              <th class="py-3 px-4">
                異動數量
              </th>

              <th class="py-3 px-4">
                關聯單據
              </th>

              <th class="py-3 px-4">
                備註
              </th>
            </tr>
          </thead>


          <tbody
            class="
              divide-y
              divide-[var(--outline-variant)]
              text-[length:var(--font-body)]
            "
          >

            <tr
            v-for="log in paginatedLogs"
  :key="log.id"
              class="
                hover:bg-[var(--surface-container-high)]
                transition-colors
              "
            >

              <!-- Time -->
              <td class="py-3.5 px-4 whitespace-nowrap">

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
              <td class="py-3.5 px-4">

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
              <td class="py-3.5 px-4">

         <StatusBadge
  :status="getActionStatus(log.action)"
  :label="getActionLabel(log.action)"
/>

              </td>


              <!-- Quantity -->
              <td class="py-3.5 px-4">

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
              <td class="py-3.5 px-4">

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
              <td class="py-3.5 px-4">

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
                class="
                  py-12
                  text-center
                  text-[length:var(--font-title)]
                  text-[var(--on-surface-variant)]
                "
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
  onMounted
} from 'vue'

import {
  History,
  PackagePlus,
  PackageMinus,
  Boxes,
  RefreshCw,
  Import
} from 'lucide-vue-next'
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

const selectedAction = ref('')


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


    return (
      matchesKeyword
      &&
      matchesMaterial
      &&
      matchesAction
    )

  })

})
// ==============================
// 分頁
// ==============================

const currentPage = ref(1)

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
// 異動類型樣式
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
