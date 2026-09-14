<template>
  <ModalWrapper
    :is-open="isOpen"
    :title="`配置物料配方 (BOM) - ${product?.name || ''}`"
    subtitle="設定飲品單杯標準製程配方，連結原物料庫存並自動核算單杯物料成本"
    max-width="3xl"
    :icon="FlaskConical"
    @close="emit('close')"
  >
    <div
      v-if="product"
      class="space-y-5"
    >
      <!-- 商品資訊 -->
      <div
        class="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          rounded-xl
          border
          border-[var(--outline)]
          bg-[var(--surface-container-high)]
          p-4
        "
      >
        <div>
          <div class="flex items-center gap-2">
            <span
              class="
                text-sm
                font-bold
                text-[var(--on-surface)]
              "
            >
              {{ product.name }}
            </span>

            <span
              class="
                rounded
                bg-[var(--primary)]/15
                px-2
                py-0.5
                text-xs
                font-medium
                font-data-mono
                text-[var(--primary)]
              "
            >
              {{ product.sku }}
            </span>

            <span
              class="
                rounded
                bg-[var(--surface-container-highest)]
                px-2
                py-0.5
                text-xs
                text-[var(--on-surface-variant)]
              "
            >
              {{ product.category }}
            </span>
          </div>

          <p
            class="
              mt-1
              text-xs
              text-[var(--on-surface-variant)]
            "
          >
            銷售單位：{{ product.unit || '杯' }}
          </p>
        </div>

        <!-- 售價 / 成本 / 毛利率 -->
        <div
          class="
            flex
            items-center
            gap-4
            text-xs
            font-data-mono
          "
        >
          <div class="text-right">
            <span
              class="
                block
                text-[10px]
                text-[var(--on-surface-variant)]
              "
            >
              門市售價
            </span>

            <span
              class="
                text-base
                font-bold
                text-[var(--on-surface)]
              "
            >
              NT$ {{ Number(product.sellingPrice || 0).toFixed(1) }}
            </span>
          </div>

          <div
            class="
              border-l
              border-[var(--outline)]
              pl-4
              text-right
            "
          >
            <span
              class="
                block
                text-[10px]
                text-[var(--on-surface-variant)]
              "
            >
              配方單杯成本
            </span>

            <span
              class="
                text-base
                font-bold
                text-[var(--primary)]
              "
            >
              NT$ {{ calculatedTotalCost.toFixed(1) }}
            </span>
          </div>

          <div
            class="
              border-l
              border-[var(--outline)]
              pl-4
              text-right
            "
          >
            <span
              class="
                block
                text-[10px]
                text-[var(--on-surface-variant)]
              "
            >
              即時預估毛利率
            </span>

            <span
              class="text-base font-bold"
              :class="
                calculatedMargin >= 65
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--tertiary)]'
              "
            >
              {{ calculatedMargin }}%
            </span>
          </div>
        </div>
      </div>

      <!-- BOM 原物料 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4
            class="
              flex
              items-center
              gap-1.5
              text-xs
              font-bold
              text-[var(--on-surface)]
            "
          >
            <Layers
              class="
                h-4
                w-4
                text-[var(--primary)]
              "
            />

            <span>
              單杯消耗原物料清單 (Bill of Materials)
            </span>
          </h4>

          <button
            type="button"
            @click="addIngredientRow"
            class="
              flex
              cursor-pointer
              items-center
              gap-1
              rounded-lg
              border
              border-[var(--primary)]/30
              bg-[var(--primary)]/10
              px-2.5
              py-1
              text-xs
              font-bold
              text-[var(--primary)]
              transition-colors
              hover:bg-[var(--primary)]/20
            "
          >
            <Plus class="h-3.5 w-3.5" />

            <span>加入配方原料</span>
          </button>
        </div>

        <!-- Loading -->
        <div
          v-if="loading"
          class="
            rounded-xl
            border
            border-[var(--outline)]
            bg-[var(--surface-container)]
            p-6
            text-center
            text-xs
            text-[var(--on-surface-variant)]
          "
        >
          正在載入原物料與配方資料...
        </div>

        <!-- BOM Table -->
        <div
          v-else
          class="
            overflow-hidden
            rounded-xl
            border
            border-[var(--outline)]
            bg-[var(--surface-container)]
          "
        >
          <table
            class="
              w-full
              border-collapse
              text-left
              text-xs
            "
          >
            <thead>
              <tr
                class="
                  border-b
                  border-[var(--outline)]
                  bg-[var(--surface-container-high)]
                  text-[11px]
                  font-bold
                  uppercase
                  text-[var(--on-surface-variant)]
                "
              >
                <th class="px-3 py-2.5">
                  原物料綁定庫存品項
                </th>

                <th class="w-28 px-3 py-2.5">
                  單杯用量
                </th>

                <th class="w-24 px-3 py-2.5">
                  計量單位
                </th>

                <th class="w-28 px-3 py-2.5">
                  原料進料成本
                </th>

                <th class="w-24 px-3 py-2.5 text-right">
                  單杯分攤成本
                </th>

                <th class="w-10 px-2 py-2.5 text-center">
                  操作
                </th>
              </tr>
            </thead>

            <tbody
              class="
                divide-y
                divide-[var(--outline-variant)]
              "
            >
              <tr
                v-for="(item, idx) in ingredientsList"
                :key="idx"
                class="
                  transition-colors
                  hover:bg-[var(--surface-container-high)]
                "
              >
                <!-- 原物料 -->
                <td class="px-3 py-2.5">
                  <select
                    v-model="item.materialId"
                    class="input-field py-1 text-xs"
                    @change="onMaterialChange(item)"
                  >
                    <option
                      value=""
                      disabled
                    >
                      請選擇原物料...
                    </option>

                    <option
                      v-for="material in materials"
                      :key="material.id"
                      :value="material.id"
                    >
                      {{ material.name }} ({{ material.code }})
                    </option>
                  </select>
                </td>

                <!-- 用量 -->
                <td class="px-3 py-2.5">
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    step="any"
                    min="0"
                    class="
                      input-field
                      no-number-spinner
                      py-1
                      text-xs
                      font-data-mono
                    "
                  />
                </td>

                <!-- 單位 -->
                <td class="px-3 py-2.5">
                  <span
                    class="
                      rounded
                      bg-[var(--surface-container-highest)]
                      px-2
                      py-1
                      font-data-mono
                      text-[var(--on-surface-variant)]
                    "
                  >
                    {{ item.unit || '-' }}
                  </span>
                </td>

                <!-- 原料成本 -->
                <td
                  class="
                    px-3
                    py-2.5
                    font-data-mono
                    text-[var(--on-surface-variant)]
                  "
                >
                  NT$ {{ getMaterialUnitCost(item.materialId) }}
                </td>

                <!-- 單杯成本 -->
                <td
                  class="
                    px-3
                    py-2.5
                    text-right
                    font-data-mono
                    font-bold
                    text-[var(--on-surface)]
                  "
                >
                  NT$ {{ computeIngredientCost(item).toFixed(1) }}
                </td>

                <!-- 刪除 -->
                <td class="px-2 py-2.5 text-center">
                  <button
                    type="button"
                    title="刪除此原料"
                    @click="removeIngredientRow(idx)"
                    class="
                      cursor-pointer
                      p-1
                      text-[var(--on-surface-variant)]
                      transition-colors
                      hover:text-[var(--error)]
                    "
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>

              <!-- 空資料 -->
              <tr v-if="ingredientsList.length === 0">
                <td
                  colspan="6"
                  class="
                    py-6
                    text-center
                    text-xs
                    text-[var(--on-surface-variant)]
                  "
                >
                  尚未配置原物料清單，請點擊上方「加入配方原料」設定配比。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- BOM 說明 -->
      <div
        class="
          flex
          items-center
          justify-between
          rounded-xl
          border
          border-[var(--outline)]
          bg-[var(--surface-container-low)]
          p-3
          text-xs
          text-[var(--on-surface-variant)]
        "
      >
        <span>
          儲存後會直接更新此商品的整份 BOM，並由後端重新計算商品成本。
        </span>

        <span
          class="
            font-bold
            text-[var(--primary)]
          "
        >
          BOM 成本連動
        </span>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <button
        type="button"
        class="btn-secondary text-xs"
        @click="emit('close')"
      >
        取消
      </button>

      <button
        type="button"
        class="
          btn-primary
          flex
          items-center
          gap-1.5
          text-xs
        "
        @click="handleSaveRecipe"
      >
        <Save class="h-4 w-4" />

        <span>
          儲存配方與更新成本
        </span>
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
