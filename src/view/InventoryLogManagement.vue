<template>
  <div class="space-y-6 pb-12">

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      <MetricCard
        title="異動紀錄總筆數"
        :value="`${logs.length} 筆`"
        growth="即時資料"
        subtitle="目前系統中的庫存異動紀錄"
        :icon="History"
      />

      <MetricCard
        title="進貨紀錄"
        :value="`${stockInCount} 筆`"
        growth="進貨"
        subtitle="原物料入庫異動"
        :icon="PackagePlus"
      />

      <MetricCard
        title="扣庫紀錄"
        :value="`${deductCount} 筆`"
        growth="銷售 / 耗損 / 調整"
        variant="amber"
        subtitle="所有負數庫存異動"
        :icon="PackageMinus"
      />

      <MetricCard
        title="涉及原物料"
        :value="`${materialCount} 種`"
        growth="異動品項"
        variant="emerald"
        subtitle="曾產生庫存異動的原物料"
        :icon="Boxes"
      />

    </div>


    <!-- Toolbar -->
    <div
      class="glass-panel p-4 rounded-2xl flex flex-col gap-4"
    >

      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-3"
      >
        <div>
          <div class="font-bold text-sm text-gray-800">
            庫存異動紀錄
          </div>

          <div class="text-xs text-gray-400 mt-1">
            查詢原物料進貨、銷售扣減、耗損與盤點調整歷程
          </div>
        </div>


        <div class="flex items-center space-x-2">

          <button
            type="button"
            @click="loadLogs"
            class="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1.5"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            <span>重新整理</span>
          </button>
<button
  type="button"
  @click="inventoryAdjustmentModalOpen = true"
  class="btn-primary text-xs px-3.5 py-1.5 flex items-center space-x-1.5"
>
  <span>庫存調整</span>
</button>
        </div>
      </div>


      <!-- Filter -->
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-3"
      >

        <div>
          <label class="block text-[11px] font-bold text-gray-500 mb-1">
            搜尋原物料
          </label>

          <input
            v-model="searchQuery"
            type="text"
            placeholder="輸入原物料名稱或料號"
            class="input-field"
          />
        </div>


        <div>
          <label class="block text-[11px] font-bold text-gray-500 mb-1">
            原物料
          </label>

          <select
            v-model="selectedMaterialId"
            class="input-field"
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
          <label class="block text-[11px] font-bold text-gray-500 mb-1">
            異動類型
          </label>

          <select
            v-model="selectedAction"
            class="input-field"
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
      class="glass-panel rounded-2xl p-8 text-center text-sm text-gray-500"
    >
      正在讀取庫存異動紀錄...
    </div>


    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
    >
      {{ errorMessage }}
    </div>


    <!-- Log Table -->
    <div
      v-else
      class="glass-panel rounded-2xl border border-white/80 overflow-hidden shadow-sm"
    >

      <div class="overflow-x-auto">

        <table class="w-full text-left border-collapse">

          <thead>
            <tr
              class="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider"
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


          <tbody class="divide-y divide-gray-100/80 text-xs">

            <tr
              v-for="log in filteredLogs"
              :key="log.id"
              class="zebra-row hover:bg-blue-50/40 transition-colors"
            >

              <!-- Time -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <div class="font-mono text-gray-700">
                  {{ formatDateTime(log.createdAt) }}
                </div>

                <div class="text-[10px] text-gray-400 mt-1">
                  Log ID：{{ log.id }}
                </div>
              </td>


              <!-- Material -->
              <td class="py-3.5 px-4">

                <div class="font-bold text-sm text-[#181c23]">
                  {{ log.materialName }}
                </div>

                <div class="text-[11px] text-gray-400 font-mono mt-0.5">
                  {{ log.materialCode }}
                </div>

              </td>


              <!-- Action -->
              <td class="py-3.5 px-4">

                <span
                  class="px-2.5 py-1 rounded-full font-bold"
                  :class="getActionClass(log.action)"
                >
                  {{ getActionLabel(log.action) }}
                </span>

              </td>


              <!-- Quantity -->
              <td class="py-3.5 px-4">

                <span
                  class="font-mono font-bold text-sm"
                  :class="
                    Number(log.quantity) >= 0
                      ? 'text-emerald-600'
                      : 'text-red-600'
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
                  class="font-mono text-gray-700"
                >
                  #{{ log.refId }}
                </span>

                <span
                  v-else
                  class="text-gray-400"
                >
                  -
                </span>

              </td>


              <!-- Note -->
              <td class="py-3.5 px-4">

                <span
                  v-if="log.note"
                  class="text-gray-700"
                >
                  {{ log.note }}
                </span>

                <span
                  v-else
                  class="text-gray-400"
                >
                  無備註
                </span>

              </td>

            </tr>


            <!-- Empty -->
            <tr v-if="filteredLogs.length === 0">

              <td
                colspan="6"
                class="py-12 text-center text-sm text-gray-400"
              >
                目前沒有符合條件的庫存異動紀錄
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
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

import MetricCard from '@/component/子元件/MetricCard.vue'
import httpClient from '@/service/httpClient'
import InventoryAdjustmentModal from '@/component/父元件/InventoryAdjustmentModal.vue'

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

const getActionClass = (action) => {

  if (action === 'STOCK_IN') {

    return 'bg-emerald-50 text-emerald-700'

  }


  if (
    action === 'SALE_DEDUCT'
    ||
    action === 'WASTE'
    ||
    action === 'EXPIRED'
  ) {

    return 'bg-red-50 text-red-700'

  }


  if (
    action === 'ADJUSTMENT'
    ||
    action === 'MANUAL_USE'
  ) {

    return 'bg-amber-50 text-amber-700'

  }


  return 'bg-gray-100 text-gray-600'

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
