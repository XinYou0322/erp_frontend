<template>
  <ModalWrapper
    :is-open="isOpen"
    title="新增飲品"
    subtitle="建立商品基本資料，配方可於商品建立後另外設定"
    max-width="2xl"
    :icon="Plus"
    @close="emit('close')"
  >
    <form id="add-product-form" @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block font-bold text-gray-700 text-xs mb-1">
            商品編號 SKU <span class="text-red-500">*</span>
          </label>
          <input v-model.trim="sku" type="text" required placeholder="例如：DRINK-008" class="input-field" />
        </div>

        <div>
          <label class="block font-bold text-gray-700 text-xs mb-1">
            商品名稱 <span class="text-red-500">*</span>
          </label>
          <input v-model.trim="name" type="text" required placeholder="例如：珍珠奶茶" class="input-field" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block font-bold text-gray-700 text-xs mb-1">
            商品分類 <span class="text-red-500">*</span>
          </label>
          <select v-model="category" class="input-field" required>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-gray-700 text-xs mb-1">
            售價 (NT$) <span class="text-red-500">*</span>
          </label>
          <input v-model.number="sellingPrice" type="number" min="0" step="1" required class="input-field" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block font-bold text-gray-700 text-xs mb-1">單位</label>
          <select v-model="unit" class="input-field">
            <option value="杯">杯</option>
            <option value="瓶">瓶</option>
            <option value="份">份</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-gray-700 text-xs mb-1">狀態</label>
          <select v-model="status" class="input-field">
            <option value="ACTIVE">啟用</option>
            <option value="INACTIVE">停用</option>
          </select>
        </div>
      </div>

      <div class="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-gray-600">
        商品成本不在這裡手動輸入。新增商品後，再到 BOM 配方設定原物料與用量，後端會重新計算商品成本。
      </div>

      <p v-if="errorMessage" class="text-xs font-semibold text-red-500">
        {{ errorMessage }}
      </p>
    </form>

    <template #footer>
      <button type="button" @click="emit('close')" class="btn-secondary text-xs">
        取消
      </button>
      <button
        type="submit"
        form="add-product-form"
        class="btn-primary text-xs flex items-center space-x-1.5"
        :disabled="submitting"
      >
        <Check class="w-4 h-4" />
        <span>{{ submitting ? '新增中...' : '新增產品' }}</span>
      </button>
    </template>
  </ModalWrapper>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Check } from 'lucide-vue-next'
import ModalWrapper from '../common/ModalWrapper.vue'
import httpClient from '@/service/httpClient.js';



defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const categories = ['純茶類', '鮮奶類', '手作特調', '果茶類', '奶茶類', '季節限定']

const sku = ref('')
const name = ref('')
const category = ref(categories[0])
const sellingPrice = ref<number>(0)
const unit = ref('杯')
const status = ref('ACTIVE')

const submitting = ref(false)
const errorMessage = ref('')

const resetForm = () => {
  sku.value = ''
  name.value = ''
  category.value = categories[0]
  sellingPrice.value = 0
  unit.value = '杯'
  status.value = 'ACTIVE'
  errorMessage.value = ''
}

const handleSubmit = async () => {
  if (!sku.value.trim() || !name.value.trim()) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await httpClient.post('/api/product/add', {
      sku: sku.value,
      name: name.value,
      category: category.value,
      sellingPrice: sellingPrice.value,
      unit: unit.value,
      status: status.value
    })

    emit('success')
    emit('close')
    resetForm()
  } catch (error) {
    console.error('新增產品失敗：', error)
    errorMessage.value = '新增產品失敗，請確認 SKU 是否重複或後端是否正常。'
  } finally {
    submitting.value = false
  }
}
</script>
