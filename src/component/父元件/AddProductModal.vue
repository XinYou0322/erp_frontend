<template>
  <ModalWrapper
    :is-open="isOpen"
    :title="retailMode ? '新增零售商品' : '新增飲品'"
    :subtitle="retailMode ? '建立商品後，系統會同步建立一筆原物料與一筆 BOM' : '建立商品基本資料，配方可於商品建立後另外設定'"
    max-width="2xl"
    :icon="Plus"
    @close="handleClose"
  >

    <template #header-actions>
      <button
        type="button"
        class="
          px-3
          py-1.5
          rounded-lg
          border
          border-[var(--primary)]/30
          bg-[var(--primary)]/10
          text-[var(--primary)]
          hover:bg-[var(--primary)]/20
          text-xs
          font-bold
          flex
          items-center
          gap-1.5
          transition-colors
          cursor-pointer
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
        :disabled="submitting || uploadingImage"
        @click="openImagePicker"
      >
        <ImagePlus class="w-4 h-4" />
        <span>{{ imageFile ? '更換圖片' : '新增圖片' }}</span>
      </button>
    </template>

    <form id="add-product-form" @submit.prevent="handleSubmit" class="space-y-4">
      <input
        ref="imageInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="sr-only"
        @change="handleImageChange"
      />

      <div
        v-if="imagePreviewUrl"
        class="flex justify-center"
      >
        <ProductImage
          :src="imagePreviewUrl"
          :alt="name ? `${name}圖片預覽` : '商品圖片預覽'"
          class="max-w-md h-52 p-2"
        />
      </div>

      <!-- SKU / 商品名稱 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            ">
            商品編號 SKU
            <span class="text-[var(--error)]">*</span>
          </label>

          <input v-model.trim="sku" type="text" required placeholder="例如：DRINK-008" class="input-field" />
        </div>


        <div>
          <label class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            ">
            商品名稱
            <span class="text-[var(--error)]">*</span>
          </label>

          <input v-model.trim="name" type="text" required placeholder="例如：珍珠奶茶" class="input-field" />
        </div>

      </div>


      <!-- 分類 / 售價 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            ">
            商品分類
            <span class="text-[var(--error)]">*</span>
          </label>

          <select v-model="categoryId" class="input-field" required>
            <option :value="null" disabled>
              請選擇商品分類
            </option>

            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>


        <div>
          <label class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            ">
            售價 (NT$)
            <span class="text-[var(--error)]">*</span>
          </label>

          <input v-model.number="sellingPrice" type="number" min="0" step="1" required class="input-field" />
        </div>

      </div>


      <!-- 單位 / 狀態 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            ">
            單位
          </label>

          <select v-model="unit" class="input-field">
            <option value="杯">杯</option>
            <option value="瓶">瓶</option>
            <option value="份">份</option>
            <option v-if="retailMode" value="個">個</option>
            <option v-if="retailMode" value="盒">盒</option>
            <option v-if="retailMode" value="包">包</option>
          </select>
        </div>


        <div>
          <label class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            ">
            狀態
          </label>

          <select v-model="status" class="input-field">
            <option value="ACTIVE">啟用</option>
            <option value="INACTIVE">停用</option>
          </select>
        </div>

      </div>

      <div v-if="retailMode">
        <label class="block font-bold text-[var(--on-surface)] text-xs mb-1">
          進貨成本 (NT$)
          <span class="text-[var(--error)]">*</span>
        </label>
        <input
          v-model.number="retailCost"
          type="number"
          min="0"
          step="0.01"
          required
          class="input-field"
          placeholder="此成本會同步寫入對應原物料"
        />
      </div>


      <!-- BOM 說明 -->
      <div v-if="!retailMode" class="
          rounded-xl
          border
          border-[var(--outline)]
          bg-[var(--surface-container-high)]
          p-3.5
          text-xs
          text-[var(--on-surface-variant)]
        ">
        商品成本不在這裡手動輸入。新增商品後，再到 BOM 配方設定原物料與用量，後端會重新計算商品成本。
      </div>


      <!-- 錯誤訊息 -->
      <p v-if="errorMessage" class="
          text-xs
          font-semibold
          text-[var(--error)]
        ">
        {{ errorMessage }}
      </p>

    </form>


    <template #footer>

      <button
        type="button"
        class="btn-secondary text-xs"
        :disabled="submitting || uploadingImage"
        @click="handleClose"
      >
        取消
      </button>


      <button type="submit" form="add-product-form" class="
          btn-primary
          text-xs
          flex
          items-center
          space-x-1.5
        " :disabled="submitting || uploadingImage">
        <Check class="w-4 h-4" />

        <span>
          {{
            uploadingImage
              ? '圖片上傳中...'
              : submitting
                ? '新增中...'
                : '新增產品'
          }}
        </span>
      </button>
    </template>




  </ModalWrapper>
</template>


<script setup>

import {
  ref,
  watch,

} from 'vue'

import {
  Plus,
  Check,
  ImagePlus
} from 'lucide-vue-next'

import ModalWrapper
  from '../子元件/ModalWrapper.vue'
import ProductImage from '../子元件/ProductImage.vue'

import httpClient
  from '@/service/httpClient.js'


const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  retailMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'close',
  'success'
])
//圖片用變數
const imageFile = ref(null)
const imagePreviewUrl = ref('')
const uploadingImage = ref(false)
const imageInput = ref(null)



const categories = ref([])

const sku = ref('')
const name = ref('')
const categoryId = ref(null)
const sellingPrice = ref(0)
const unit = ref('杯')
const status = ref('ACTIVE')
const retailCost = ref(0)

const submitting = ref(false)
const errorMessage = ref('')


// 取得啟用中的商品分類
const loadCategories = async () => {

  try {

    const response =
      await httpClient.get(
        '/api/product-categories/active'
      )

    categories.value =
      response.data

  } catch (error) {

    console.error(
      '取得商品分類失敗：',
      error
    )

    errorMessage.value =
      '取得商品分類失敗'
  }

}


// Modal 打開時重新抓分類
watch(
  () => props.isOpen,

  (isOpen) => {

    if (isOpen) {
      unit.value = props.retailMode ? '個' : '杯'
      loadCategories()

    }

  }
)

const resetForm = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }

  imageFile.value = null
  imagePreviewUrl.value = ''

  if (imageInput.value) {
    imageInput.value.value = ''
  }

  sku.value = ''
  name.value = ''
  categoryId.value = null
  sellingPrice.value = 0
  unit.value = props.retailMode ? '個' : '杯'
  status.value = 'ACTIVE'
  retailCost.value = 0
  errorMessage.value = ''
}

const handleClose = () => {
  if (submitting.value || uploadingImage.value) {
    return
  }

  resetForm()
  emit('close')
}

const openImagePicker = () => {
  imageInput.value?.click()
}


const handleSubmit = async () => {

  if (
    !sku.value.trim() ||
    !name.value.trim() ||
    categoryId.value == null
  ) {
    errorMessage.value = '請填寫商品編號、商品名稱與分類。'
    return
  }

  if (props.retailMode && Number(retailCost.value) < 0) {
    errorMessage.value = '進貨成本不可小於 0。'
    return
  }

  errorMessage.value = ''

  submitting.value = true

  try {
    let uploadedImageUrl = ''

    if (imageFile.value) {
      uploadingImage.value = true

      uploadedImageUrl =
        await uploadProductImage()

      uploadingImage.value = false
    }

    await httpClient.post(
      '/api/product/add',
      {
        sku: sku.value,
        name: name.value,
        categoryId: Number(categoryId.value),
        sellingPrice: Number(sellingPrice.value),
        unit: unit.value,
        status: status.value,
        imageUrl: uploadedImageUrl,
        ...(props.retailMode
          ? {
              productType: 'RETAIL',
              retailCost: Number(retailCost.value)
            }
          : {
              productType: 'RECIPE'
            })
      }
    )

    emit('success')
    emit('close')
    resetForm()
  } catch (error) {
    console.error('新增產品失敗：', error)

    errorMessage.value =
      error?.response?.data?.message ||
      '新增產品失敗，請確認 SKU、分類、圖片或後端是否正常。'
  } finally {
    submitting.value = false
    uploadingImage.value = false
  }
}

const handleImageChange = (event) => {
  const file = event.target.files?.[0] || null

  // 清除上一張圖片的預覽網址
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }

  if (!file) {
    imageFile.value = null
    imagePreviewUrl.value = ''
    return
  }

  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/webp'
  ]

  if (!allowedTypes.includes(file.type)) {
    imageFile.value = null
    imagePreviewUrl.value = ''
    event.target.value = ''
    errorMessage.value = '圖片格式只支援 PNG、JPEG 或 WebP。'
    return
  }

  const maxFileSize = 8 * 1024 * 1024

  if (file.size > maxFileSize) {
    imageFile.value = null
    imagePreviewUrl.value = ''
    event.target.value = ''
    errorMessage.value = '商品圖片不可超過 8MB。'
    return
  }

  imageFile.value = file
  errorMessage.value = ''
  imagePreviewUrl.value =
    URL.createObjectURL(file)
}

const uploadProductImage = async () => {
  if (!imageFile.value) {
    return ''
  }

  const formData = new FormData()
  formData.append('file', imageFile.value)

  const response = await httpClient.post(
    '/api/product/upload-image',
    formData
  )

  return response.data.imageUrl
}
</script>
