<template>
  <div class="space-y-6 pb-12">

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="原物料建檔品項"
        :value="`${materials.length} 種`"
        growth="即時資料"
        subtitle="目前系統已建立的原物料主檔"
        :icon="Package"
      />

      <MetricCard
        title="平均原物料成本"
        :value="`NT$ ${averageCost.toFixed(1)}`"
        growth="依目前主檔計算"
        variant="cyan"
        subtitle="所有原物料成本平均值"
        :icon="DollarSign"
      />

      <MetricCard
        title="已設定安全庫存"
        :value="`${safetyStockCount} 項`"
        growth="安全庫存管理"
        variant="emerald"
        subtitle="已有設定安全庫存水位的原物料"
        :icon="ShieldCheck"
      />

      <MetricCard
        title="計量單位種類"
        :value="`${unitCount} 種`"
        growth="主檔規格"
        subtitle="目前使用中的不同計量單位"
        :icon="Scale"
      />
    </div>

    <!-- Toolbar -->
    <div
      class="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div>
        <div class="font-bold text-sm text-gray-800">
          原物料主檔管理
        </div>

        <div class="text-xs text-gray-400 mt-1">
          管理原物料名稱、料號、單位、成本與安全庫存
        </div>
      </div>

      <div class="flex items-center space-x-2 shrink-0">
        <button
          type="button"
          @click="loadMaterials"
          class="btn-secondary text-xs px-3 py-1.5"
        >
          重新整理
        </button>

        <button
          type="button"
          @click="emit('openAddMaterial')"
          class="btn-primary text-xs px-3 py-1.5 flex items-center space-x-1.5"
        >
          <Plus class="w-4 h-4" />
          <span>新增原物料</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="glass-panel rounded-2xl p-8 text-center text-sm text-gray-500"
    >
      正在讀取原物料資料...
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
    >
      {{ errorMessage }}
    </div>

    <!-- Material Cards -->
    <div
      v-else-if="materials.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      <div
        v-for="material in materials"
        :key="material.id"
        class="glass-panel p-5 rounded-2xl border border-white/80 hover:border-[#0070ea]/60 transition-all shadow-xs flex flex-col justify-between space-y-4 group"
      >
        <div>
          <!-- Card Header -->
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-[#0070ea] shrink-0"
              >
                <Package class="w-5 h-5" />
              </div>

              <div class="min-w-0">
                <h3
                  class="font-bold text-sm text-[#181c23] group-hover:text-[#0070ea] transition-colors truncate"
                >
                  {{ material.name }}
                </h3>

                <div class="text-[11px] text-gray-400 font-mono mt-0.5">
                  <span class="text-[#0059bb] font-semibold">
                    {{ material.code }}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="emit('openEditMaterial', material)"
              class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0059bb] text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 shrink-0"
            >
              <Edit3 class="w-3.5 h-3.5" />
              <span>編輯</span>
            </button>
          </div>

          <!-- Material Info -->
          <div
            class="mt-4 p-3 rounded-xl bg-gray-50/80 border border-gray-100 grid grid-cols-3 gap-2 text-center text-xs"
          >
            <div>
              <span class="text-[10px] text-gray-400 block">
                計量單位
              </span>
              <span class="font-bold text-gray-900">
                {{ material.unit }}
              </span>
            </div>

            <div class="border-x border-gray-200">
              <span class="text-[10px] text-gray-400 block">
                原物料成本
              </span>
              <span class="font-bold text-blue-700">
                NT$ {{ material.cost }}
              </span>
            </div>

            <div>
              <span class="text-[10px] text-gray-400 block">
                安全庫存
              </span>
              <span class="font-bold text-gray-900">
                {{ material.safetyStock ?? 0 }} {{ material.unit }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="pt-3 border-t border-gray-100/80 text-[11px] text-gray-500 flex items-center justify-between"
        >
          <span>Material ID：{{ material.id }}</span>
          <span
            class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold"
          >
            原物料主檔
          </span>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="glass-panel rounded-2xl p-10 text-center text-sm text-gray-400"
    >
      目前沒有原物料資料
    </div>

  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted
} from 'vue'

import {
  Package,
  DollarSign,
  ShieldCheck,
  Scale,
  Edit3,
  Plus
} from 'lucide-vue-next'

import MetricCard from './styles/components/common/MetricCard.vue'
import httpClient from '@/service/httpClient'

const emit = defineEmits([
  'openAddMaterial',
  'openEditMaterial'
])

const materials = ref([])
const loading = ref(false)
const errorMessage = ref('')

const loadMaterials = () => {
  loading.value = true
  errorMessage.value = ''

  httpClient
    .get('/api/material')
    .then((response) => {
      materials.value = response.data
      console.log('原物料主檔：', materials.value)
    })
    .catch((error) => {
      console.error('取得原物料失敗：', error)
      errorMessage.value = '取得原物料資料失敗'
    })
    .finally(() => {
      loading.value = false
    })
}

const averageCost = computed(() => {
  if (materials.value.length === 0) {
    return 0
  }

  const total = materials.value.reduce(
    (sum, material) => sum + Number(material.cost || 0),
    0
  )

  return total / materials.value.length
})

const safetyStockCount = computed(() => {
  return materials.value.filter(
    material => Number(material.safetyStock || 0) > 0
  ).length
})

const unitCount = computed(() => {
  const units = new Set(
    materials.value
      .map(material => material.unit)
      .filter(unit => unit)
  )

  return units.size
})

onMounted(() => {
  loadMaterials()
})
</script>
