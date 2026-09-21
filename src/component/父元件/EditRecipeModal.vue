<template>
  <ModalWrapper
    :is-open="isOpen"
    :title="`配置物料配方 (BOM) - ${product?.name || ''}`"
    subtitle="設定飲品單杯標準製程配方，連結原物料庫存並自動核算單杯物料成本"
    max-width="3xl"
    :icon="FlaskConical"
    @close="handleClose"
  >
    <template #header-actions>
      <button
        v-if="product"
        type="button"
        class="px-3 py-1.5 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="saving || disabling"
        @click="openImagePicker"
      >
        <ImagePlus class="w-4 h-4" />
        <span>{{ displayedImageUrl ? '更換圖片' : '新增圖片' }}</span>
      </button>
    </template>

    <div
      v-if="product"
      class="space-y-5"
    >
      <input
        ref="imageInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="sr-only"
        @change="handleImageChange"
      />

      <div v-if="displayedImageUrl" class="flex justify-center">
        <ProductImage
          :src="displayedImageUrl"
          :alt="`${product.name}圖片預覽`"
          class="max-w-md h-52 p-2"
        />
      </div>

      <p v-if="imageError" class="text-xs font-semibold text-[var(--error)]">
        {{ imageError }}
      </p>

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
                      v-for="material in getSelectableMaterials(item)"
                      :key="material.id"
                      :value="material.id"
                      :disabled="material.status === 'INACTIVE'"
                    >
                      {{ material.name }} ({{ material.code }})
                      {{ material.status === 'INACTIVE' ? '【已停用】' : '' }}
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

      <p v-if="saveError" class="text-xs font-semibold text-[var(--error)]">
        {{ saveError }}
      </p>
    </div>

    <!-- Footer -->
  <template #footer>
  <div class="flex w-full items-center justify-between">
    <button
      v-if="product?.status === 'ACTIVE'"
      type="button"
      class="
        px-4 py-2 rounded-xl border
        bg-[var(--error)]/10
        hover:bg-[var(--error)]/20
        text-[var(--error)]
        border-[var(--error)]/30
        font-bold text-xs
        transition-colors cursor-pointer
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
      :disabled="disabling || saving"
      @click.stop="openDisableConfirm"
    >
      停用商品
    </button>

    <span
      v-else
      class="
        px-4 py-2 rounded-xl border
        border-[var(--outline)]
        text-[var(--on-surface-variant)]
        font-bold text-xs opacity-60
      "
    >
      已停用
    </span>

    <button
      type="button"
      class="btn-primary flex items-center gap-1.5 text-xs"
      :disabled="disabling || saving"
      @click="handleSaveRecipe"
    >
      <Save class="h-4 w-4" />
      <span>{{ saving ? '儲存中...' : '儲存配方與更新成本' }}</span>
    </button>
  </div>
</template>
  </ModalWrapper>
  <ConfirmActionModal
  :is-open="disableConfirmOpen"
  title="確認停用商品"
  :message="`確定要停用「${product?.name || ''}」嗎？`"
  warning="停用後，商品將標示為未啟用；原本的 BOM 配方資料仍會保留。"
  :loading="disabling"
  :error-message="disableError"
  confirm-text="確認停用"
  cancel-text="返回"
  loading-text="停用中..."
  @confirm="confirmDisableProduct"
  @cancel="closeDisableConfirm"
/>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { FlaskConical, ImagePlus, Layers, Plus, Save, Trash2 } from 'lucide-vue-next'

import ModalWrapper from '../子元件/ModalWrapper.vue'
import ConfirmActionModal from '../子元件/ConfirmActionModal.vue'
import ProductImage from '../子元件/ProductImage.vue'
import httpClient from '@/service/httpClient'

// ==============================
// Props / Emits
// ==============================
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },

  product: {
    type: Object,
    default: null
  },

  initialBom: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'close',
  'success',
  'disabled'
])

// ==============================
// State
// ==============================
const materials = ref([])
const ingredientsList = ref([])
const loading = ref(false)
const disableConfirmOpen = ref(false)
const disabling = ref(false)
const disableError = ref('')
const imageInput = ref(null)
const imageFile = ref(null)
const imagePreviewUrl = ref('')
const imageError = ref('')
const saving = ref(false)
const saveError = ref('')

// ==============================
// Computed
// ==============================
const calculatedTotalCost = computed(() => {
  return ingredientsList.value.reduce(
    (sum, item) => sum + computeIngredientCost(item),
    0
  )
})

const calculatedMargin = computed(() => {
  const sellingPrice = Number(props.product?.sellingPrice || 0)

  if (sellingPrice <= 0) {
    return 0
  }

  const margin = (
    (sellingPrice - calculatedTotalCost.value) /
    sellingPrice
  ) * 100

  return Math.max(0, Math.round(margin))
})

const displayedImageUrl = computed(() =>
  imagePreviewUrl.value || props.product?.imageUrl || ''
)

// ==============================
// 資料載入與初始化
// ==============================
const loadMaterials = () => {
  return httpClient({
    method: 'get',
    url: '/api/material',
    data: {}
  }).then((response) => {
    materials.value = response.data
  })
}

const setIngredients = (bomList = []) => {
  ingredientsList.value = bomList.map((bom) => ({
    bomId: bom.id,
    materialId: bom.materialId,
    originalMaterialId: bom.materialId,
    materialName: bom.materialName,
    quantity: Number(bom.quantity),
    unit: bom.unit,
    materialCost: Number(bom.materialCost || 0)
  }))
}

watch(
  () => [
    props.isOpen,
    props.product?.id,
    props.initialBom
  ],
  async ([isOpen, productId, initialBom]) => {
    if (!isOpen || productId == null) {
      return
    }

    loading.value = true
    ingredientsList.value = []

    try {
      await loadMaterials()
      setIngredients(initialBom)
    } catch (error) {
      console.error('載入 BOM 編輯資料失敗：', error)
    } finally {
      loading.value = false
    }
  },
  {
    immediate: true,
    deep: true
  }
)

// ==============================
// 商品圖片
// ==============================
const resetImageSelection = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }

  imageFile.value = null
  imagePreviewUrl.value = ''
  imageError.value = ''

  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const handleClose = () => {
  if (saving.value || disabling.value) return

  resetImageSelection()
  saveError.value = ''
  emit('close')
}

const openImagePicker = () => {
  imageInput.value?.click()
}

const handleImageChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    imageError.value = '圖片格式只支援 PNG、JPEG 或 WebP。'
    event.target.value = ''
    return
  }

  if (file.size > 8 * 1024 * 1024) {
    imageError.value = '商品圖片不可超過 8MB。'
    event.target.value = ''
    return
  }

  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }

  imageFile.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
  imageError.value = ''
}

const uploadProductImage = async () => {
  const formData = new FormData()
  formData.append('file', imageFile.value)

  const response = await httpClient.post('/api/product/upload-image', formData)
  return response.data.imageUrl
}

watch(
  () => [props.isOpen, props.product?.id],
  () => {
    resetImageSelection()
    saveError.value = ''
  },
  { immediate: true }
)

// ==============================
// 停用商品
// ==============================
const openDisableConfirm = () => {
  if (
    props.product?.id == null ||
    props.product.status !== 'ACTIVE' ||
    disabling.value ||
    saving.value
  ) {
    return
  }

  disableError.value = ''
  disableConfirmOpen.value = true
}

const closeDisableConfirm = () => {
  if (disabling.value) return

  disableConfirmOpen.value = false
  disableError.value = ''
}

const confirmDisableProduct = async () => {
  // 使用 == null，避免 ID 為 0 時被錯誤阻擋
  if (
    props.product?.id == null ||
    disabling.value
  ) {
    return
  }

  disabling.value = true
  disableError.value = ''

  try {
    await httpClient.patch(
      `/api/product/${props.product.id}/status`,
      null,
      {
        params: {
          status: 'INACTIVE'
        }
      }
    )

    disableConfirmOpen.value = false

    emit('disabled', props.product.id)
    emit('close')
  } catch (error) {
    console.error('停用商品失敗：', error)

    disableError.value =
      error?.response?.data?.message ||
      '停用商品失敗，請稍後再試。'
  } finally {
    disabling.value = false
  }
}

// ==============================
// BOM 明細操作
// ==============================
const addIngredientRow = () => {
  ingredientsList.value.push({
    bomId: null,
    materialId: '',
    originalMaterialId: null,
    materialName: '',
    quantity: 0,
    unit: '',
    materialCost: 0
  })
}

const removeIngredientRow = (idx) => {
  ingredientsList.value.splice(idx, 1)
}

// 下拉選單規則：
// 1. ACTIVE 原物料都可以選
// 2. 舊 BOM 原本綁定的 INACTIVE 原物料仍要顯示，但不可重新選擇
// 3. 其他 INACTIVE 原物料完全不出現在這一列的選單
const getSelectableMaterials = (item) => {
  return materials.value.filter((material) => {
    if (material.status === 'ACTIVE') {
      return true
    }

    return material.id === item.originalMaterialId
  })
}

const onMaterialChange = (item) => {
  const target = materials.value.find(
    material => material.id === item.materialId
  )

  if (!target) {
    return
  }

  item.materialName = target.name
  item.unit = target.unit
  item.materialCost = Number(target.cost || 0)
}

const getMaterialUnitCost = (materialId) => {
  const target = materials.value.find(
    material => material.id === materialId
  )

  if (!target) {
    return '0'
  }

  return `${Number(target.cost || 0).toFixed(2)}/${target.unit}`
}

// ==============================
// 成本計算
// ==============================
const computeIngredientCost = (item) => {
  const target = materials.value.find(
    material => material.id === item.materialId
  )

  if (!target) {
    return 0
  }

  const cost = Number(target.cost || 0)
  const quantity = Number(item.quantity || 0)

  return cost * quantity
}

// ==============================
// 儲存 BOM
// ==============================
const handleSaveRecipe = async () => {
  if (!props.product || saving.value || disabling.value) {
    return
  }

  saveError.value = ''

  // 前端再做一次防呆：停用原物料只能保留在原本的 BOM 關聯，
  // 不允許被新增或改選成新的 BOM 原料。
  const hasInvalidInactiveMaterial = ingredientsList.value.some((item) => {
    if (!item.materialId) {
      return false
    }

    const material = materials.value.find(
      material => material.id === item.materialId
    )

    if (!material || material.status !== 'INACTIVE') {
      return false
    }

    return material.id !== item.originalMaterialId
  })

  if (hasInvalidInactiveMaterial) {
    console.error('停用原物料不可新增至 BOM')
    saveError.value = '停用原物料不可新增至 BOM。'
    return
  }

  const items = ingredientsList.value
    .filter(
      item =>
        item.materialId &&
        Number(item.quantity) >= 0
    )
    .map((item) => ({
      materialId: Number(item.materialId),
      quantity: Number(item.quantity)
    }))

  const data = { items }

  console.log('準備儲存整份 BOM：', data)

  saving.value = true
  let bomSaved = false

  try {
    const response = await httpClient({
      method: 'put',
      url: `/api/bom/product/${props.product.id}`,
      data
    })
    bomSaved = true
      console.log('整份 BOM 儲存成功：', response.data)

    if (imageFile.value) {
      const imageUrl = await uploadProductImage()
      await httpClient.patch(`/api/product/${props.product.id}/image`, {
        imageUrl
      })
    }

    resetImageSelection()
    emit('success')
    emit('close')
  } catch (error) {
    console.error('儲存配方或商品圖片失敗：', error)
    saveError.value = bomSaved
      ? '配方已儲存，但圖片更新失敗，請重試儲存。'
      : '儲存配方失敗，請稍後再試。'
  } finally {
    saving.value = false
  }
}
</script>
