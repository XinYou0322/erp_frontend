<template>
  <ModalWrapper
    :is-open="isOpen"
    :title="`配置物料配方 (BOM) - ${product?.name || ''}`"
    subtitle="設定飲品單杯標準製程配方，連結原物料庫存並自動核算單杯物料成本"
    max-width="3xl"
    :icon="FlaskConical"
    @close="emit('close')"
  >
    <div v-if="product" class="space-y-5">
      <div class="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-bold text-sm text-[#181c23]">{{ product.name }}</span>
            <span class="text-xs px-2 py-0.5 rounded bg-blue-100 text-[#0059bb] font-medium font-mono">{{ product.sku }}</span>
            <span class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{{ product.category }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            銷售單位：{{ product.unit || '杯' }}
          </p>
        </div>

        <div class="flex items-center space-x-4 text-xs font-mono">
          <div class="text-right">
            <span class="text-gray-400 block text-[10px]">門市售價</span>
            <span class="font-bold text-base text-gray-900">
              NT$ {{ Number(product.sellingPrice || 0).toFixed(1) }}
            </span>
          </div>

          <div class="text-right border-l pl-4 border-blue-200">
            <span class="text-gray-400 block text-[10px]">配方單杯成本</span>
            <span class="font-bold text-base text-blue-700">
              NT$ {{ calculatedTotalCost.toFixed(1) }}
            </span>
          </div>

          <div class="text-right border-l pl-4 border-blue-200">
            <span class="text-gray-400 block text-[10px]">即時預估毛利率</span>
            <span
              class="font-bold text-base"
              :class="calculatedMargin >= 65 ? 'text-emerald-600' : 'text-amber-600'"
            >
              {{ calculatedMargin }}%
            </span>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-xs text-gray-700 flex items-center space-x-1.5">
            <Layers class="w-4 h-4 text-[#0070ea]" />
            <span>單杯消耗原物料清單 (Bill of Materials)</span>
          </h4>

          <button
            type="button"
            @click="addIngredientRow"
            class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0059bb] font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>加入配方原料</span>
          </button>
        </div>

        <div
          v-if="loading"
          class="border border-gray-200/80 rounded-xl bg-white p-6 text-center text-xs text-gray-400"
        >
          正在載入原物料與配方資料...
        </div>

        <div
          v-else
          class="border border-gray-200/80 rounded-xl overflow-hidden bg-white"
        >
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase">
                <th class="py-2.5 px-3">原物料綁定庫存品項</th>
                <th class="py-2.5 px-3 w-28">單杯用量</th>
                <th class="py-2.5 px-3 w-24">計量單位</th>
                <th class="py-2.5 px-3 w-28">原料進料成本</th>
                <th class="py-2.5 px-3 w-24 text-right">單杯分攤成本</th>
                <th class="py-2.5 px-2 w-10 text-center">操作</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(item, idx) in ingredientsList"
                :key="idx"
                class="hover:bg-blue-50/30 transition-colors"
              >
                <td class="py-2.5 px-3">
                  <select
                    v-model="item.materialId"
                    @change="onMaterialChange(item)"
                    class="input-field py-1 text-xs"
                  >
                    <option value="" disabled>請選擇原物料...</option>
                    <option
                      v-for="material in materials"
                      :key="material.id"
                      :value="material.id"
                    >
                      {{ material.name }} ({{ material.code }})
                    </option>
                  </select>
                </td>

                <td class="py-2.5 px-3">
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    step="any"
                    min="0"
                    class="input-field no-number-spinner py-1 text-xs font-mono"
                  />
                </td>

                <td class="py-2.5 px-3">
                  <span class="px-2 py-1 bg-gray-100 rounded text-gray-600 font-mono">
                    {{ item.unit || '-' }}
                  </span>
                </td>

                <td class="py-2.5 px-3 text-gray-500 font-mono">
                  NT$ {{ getMaterialUnitCost(item.materialId) }}
                </td>

                <td class="py-2.5 px-3 text-right font-mono font-bold text-gray-800">
                  NT$ {{ computeIngredientCost(item).toFixed(1) }}
                </td>

                <td class="py-2.5 px-2 text-center">
                  <button
                    type="button"
                    @click="removeIngredientRow(idx)"
                    class="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="刪除此原料"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>

              <tr v-if="ingredientsList.length === 0">
                <td colspan="6" class="py-6 text-center text-gray-400 text-xs">
                  尚未配置原物料清單，請點擊上方「加入配方原料」設定配比。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-xs text-gray-500 flex items-center justify-between">
        <span>
          儲存後會直接更新此商品的整份 BOM，並由後端重新計算商品成本。
        </span>
        <span class="font-bold text-emerald-600">BOM 成本連動</span>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        class="btn-secondary text-xs"
      >
        取消
      </button>

      <button
        type="button"
        @click="handleSaveRecipe"
        class="btn-primary text-xs flex items-center space-x-1.5"
      >
        <Save class="w-4 h-4" />
        <span>儲存配方與更新成本</span>
      </button>
    </template>
  </ModalWrapper>
</template>

<script setup>

import {
  ref,
  computed,
  watch
} from 'vue'

import {
  FlaskConical,
  Plus,
  Trash2,
  Layers,
  Save
} from 'lucide-vue-next'

import ModalWrapper from '../子元件/ModalWrapper.vue'
import httpClient from '@/service/httpClient'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },

  product: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'close',
  'success'
])

const materials = ref([])
const ingredientsList = ref([])
const loading = ref(false)

const loadMaterials = () => {
  return httpClient
    .get('/api/material')
    .then((response) => {
      materials.value = response.data
    })
}

const loadBom = (productId) => {
  return httpClient
    .get(`/api/bom/product/${productId}`)
    .then((response) => {
      ingredientsList.value = response.data.map((bom) => ({
        bomId: bom.id,
        materialId: bom.materialId,
        materialName: bom.materialName,
        quantity: Number(bom.quantity),
        unit: bom.unit,
        materialCost: Number(bom.materialCost || 0)
      }))
    })
}

watch(
  () => [props.isOpen, props.product?.id],

  ([isOpen, productId]) => {
    if (!isOpen || !productId) {
      return
    }

    loading.value = true

    Promise
      .all([
        loadMaterials(),
        loadBom(productId)
      ])
      .catch((error) => {
        console.error(
          '載入 BOM 編輯資料失敗：',
          error
        )
      })
      .finally(() => {
        loading.value = false
      })
  },

  {
    immediate: true
  }
)

const addIngredientRow = () => {
  ingredientsList.value.push({
    bomId: null,
    materialId: '',
    materialName: '',
    quantity: 0,
    unit: '',
    materialCost: 0
  })
}

const removeIngredientRow = (idx) => {
  ingredientsList.value.splice(idx, 1)
}

const onMaterialChange = (item) => {
  const target =
    materials.value.find(
      material =>
        material.id === item.materialId
    )

  if (!target) {
    return
  }

  item.materialName = target.name
  item.unit = target.unit
  item.materialCost = Number(target.cost || 0)
}

const getMaterialUnitCost = (materialId) => {
  const target =
    materials.value.find(
      material =>
        material.id === materialId
    )

  if (!target) {
    return '0'
  }

  return `${Number(target.cost || 0).toFixed(2)}/${target.unit}`
}

const computeIngredientCost = (item) => {
  const target =
    materials.value.find(
      material =>
        material.id === item.materialId
    )

  if (!target) {
    return 0
  }

  const cost = Number(target.cost || 0)
  const quantity = Number(item.quantity || 0)

  return cost * quantity
}

const calculatedTotalCost = computed(() => {
  return ingredientsList.value.reduce(
    (sum, item) =>
      sum + computeIngredientCost(item),
    0
  )
})

const calculatedMargin = computed(() => {
  const sellingPrice =
    Number(
      props.product?.sellingPrice || 0
    )

  if (sellingPrice <= 0) {
    return 0
  }

  const cost =
    calculatedTotalCost.value

  const margin =
    (
      (sellingPrice - cost)
      /
      sellingPrice
    ) * 100

  return Math.max(
    0,
    Math.round(margin)
  )
})

const handleSaveRecipe = () => {
  if (!props.product) {
    return
  }

  const items =
    ingredientsList.value
      .filter(
        item =>
          item.materialId &&
          Number(item.quantity) >= 0
      )
      .map(
        item => ({
          materialId:
            Number(item.materialId),

          quantity:
            Number(item.quantity)
        })
      )

  const data = {
    items
  }

  console.log(
    '準備儲存整份 BOM：',
    data
  )

  httpClient
    .put(
      `/api/bom/product/${props.product.id}`,
      data
    )
    .then((response) => {
      console.log(
        '整份 BOM 儲存成功：',
        response.data
      )

      emit('success')
      emit('close')
    })
    .catch((error) => {
      console.error(
        '整份 BOM 儲存失敗：',
        error
      )
    })
}

</script>
