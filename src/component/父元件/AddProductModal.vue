<template>
  <ModalWrapper
    :is-open="isOpen"
    title="新增飲品"
    subtitle="建立商品基本資料，配方可於商品建立後另外設定"
    max-width="2xl"
    :icon="Plus"
    @close="emit('close')"
  >

    <form
      id="add-product-form"
      @submit.prevent="handleSubmit"
      class="space-y-4"
    >

      <!-- SKU / 商品名稱 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label
            class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            "
          >
            商品編號 SKU
            <span class="text-[var(--error)]">*</span>
          </label>

          <input
            v-model.trim="sku"
            type="text"
            required
            placeholder="例如：DRINK-008"
            class="input-field"
          />
        </div>


        <div>
          <label
            class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            "
          >
            商品名稱
            <span class="text-[var(--error)]">*</span>
          </label>

          <input
            v-model.trim="name"
            type="text"
            required
            placeholder="例如：珍珠奶茶"
            class="input-field"
          />
        </div>

      </div>


      <!-- 分類 / 售價 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label
            class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            "
          >
            商品分類
            <span class="text-[var(--error)]">*</span>
          </label>

          <select
            v-model="categoryId"
            class="input-field"
            required
          >
            <option
              :value="null"
              disabled
            >
              請選擇商品分類
            </option>

            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>


        <div>
          <label
            class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            "
          >
            售價 (NT$)
            <span class="text-[var(--error)]">*</span>
          </label>

          <input
            v-model.number="sellingPrice"
            type="number"
            min="0"
            step="1"
            required
            class="input-field"
          />
        </div>

      </div>


      <!-- 單位 / 狀態 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label
            class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            "
          >
            單位
          </label>

          <select
            v-model="unit"
            class="input-field"
          >
            <option value="杯">杯</option>
            <option value="瓶">瓶</option>
            <option value="份">份</option>
          </select>
        </div>


        <div>
          <label
            class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            "
          >
            狀態
          </label>

          <select
            v-model="status"
            class="input-field"
          >
            <option value="ACTIVE">啟用</option>
            <option value="INACTIVE">停用</option>
          </select>
        </div>

      </div>


      <!-- BOM 說明 -->
      <div
        class="
          rounded-xl
          border
          border-[var(--outline)]
          bg-[var(--surface-container-high)]
          p-3.5
          text-xs
          text-[var(--on-surface-variant)]
        "
      >
        商品成本不在這裡手動輸入。新增商品後，再到 BOM 配方設定原物料與用量，後端會重新計算商品成本。
      </div>


      <!-- 錯誤訊息 -->
      <p
        v-if="errorMessage"
        class="
          text-xs
          font-semibold
          text-[var(--error)]
        "
      >
        {{ errorMessage }}
      </p>

    </form>


    <template #footer>

      <button
        type="button"
        @click="emit('close')"
        class="btn-secondary text-xs"
      >
        取消
      </button>


      <button
        type="submit"
        form="add-product-form"
        class="
          btn-primary
          text-xs
          flex
          items-center
          space-x-1.5
        "
        :disabled="submitting"
      >
        <Check class="w-4 h-4" />

        <span>
          {{ submitting ? '新增中...' : '新增產品' }}
        </span>
      </button>

    </template>

  </ModalWrapper>
</template>


<script setup lang="ts">

import {
  ref,
  watch
} from 'vue'

import {
  Plus,
  Check
} from 'lucide-vue-next'

import ModalWrapper
  from '../子元件/ModalWrapper.vue'

import httpClient
  from '@/service/httpClient.js'


const props = defineProps<{
  isOpen: boolean
}>()


const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()


const categories = ref<any[]>([])

const sku = ref('')
const name = ref('')
const categoryId = ref<number | null>(null)
const sellingPrice = ref<number>(0)
const unit = ref('杯')
const status = ref('ACTIVE')

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

      loadCategories()

    }

  }
)


const resetForm = () => {

  sku.value = ''

  name.value = ''

  categoryId.value = null

  sellingPrice.value = 0

  unit.value = '杯'

  status.value = 'ACTIVE'

  errorMessage.value = ''

}


const handleSubmit = async () => {

  if (
    !sku.value.trim()
    ||
    !name.value.trim()
    ||
    !categoryId.value
  ) {
    return
  }

  submitting.value = true

  errorMessage.value = ''

  try {

    await httpClient.post(
      '/api/product/add',
      {
        sku: sku.value,

        name: name.value,

        categoryId:
          Number(categoryId.value),

        sellingPrice:
          Number(sellingPrice.value),

        unit: unit.value,

        status: status.value
      }
    )

    emit('success')

    emit('close')

    resetForm()

  } catch (error) {

    console.error(
      '新增產品失敗：',
      error
    )

    errorMessage.value =
      '新增產品失敗，請確認 SKU、分類或後端是否正常。'

  } finally {

    submitting.value = false

  }

}

</script>