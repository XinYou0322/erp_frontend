<template>
  <ModalWrapper
    :is-open="isOpen"
    title="新增進貨批次"
    subtitle="選擇原物料並登錄本次進貨數量與有效期限"
    max-width="xl"
    :icon="PackagePlus"
    @close="emit('close')"
  >
    <form
      id="add-inventory-form"
      @submit.prevent="handleSubmit"
      class="space-y-4"
    >

      <!-- 原物料 -->
      <div>
        <label class="block font-bold text-gray-700 text-xs mb-1">
          原物料
          <span class="text-red-500">*</span>
        </label>

        <select
          v-model="materialId"
          required
          class="input-field"
        >
          <option value="" disabled>
            請選擇原物料
          </option>

          <option
            v-for="material in materials"
            :key="material.id"
            :value="material.id"
          >
            {{ material.name }}（{{ material.code }}）
          </option>
        </select>
      </div>


      <!-- 進貨數量 -->
      <div>
        <label class="block font-bold text-gray-700 text-xs mb-1">
          進貨數量
          <span class="text-red-500">*</span>
        </label>

        <input
          v-model.number="quantity"
          type="number"
          min="0.0001"
          step="any"
          required
          class="input-field"
          placeholder="請輸入本次進貨數量"
        />
      </div>


      <!-- 有效期限 -->
      <div>
        <label class="block font-bold text-gray-700 text-xs mb-1">
          有效期限
        </label>

        <input
          v-model="expiryDate"
          type="date"
          class="input-field font-mono"
        />
      </div>

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
        form="add-inventory-form"
        class="btn-primary text-xs flex items-center space-x-1.5"
      >
        <Check class="w-4 h-4" />
        <span>確認入庫</span>
      </button>

    </template>
  </ModalWrapper>
</template>


<script setup>

import {
  ref,
  watch,
  onMounted
} from 'vue'

import {
  PackagePlus,
  Check
} from 'lucide-vue-next'

import ModalWrapper from '../common/ModalWrapper.vue'

import httpClient from '@/service/httpClient'


// 父元件傳入
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})


// 傳回父元件
const emit = defineEmits([
  'close',
  'success'
])


// 原物料清單
const materials = ref([])


// 表單資料
const materialId = ref('')
const quantity = ref(null)
const expiryDate = ref('')


// 取得所有原物料
const loadMaterials = () => {

  httpClient
    .get('/api/material')

    .then((response) => {

      materials.value = response.data

    })

    .catch((error) => {

      console.error(
        '取得原物料失敗：',
        error
      )

    })

}


// Modal 每次開啟時清空表單
watch(
  () => props.isOpen,

  (isOpen) => {

    if (isOpen) {

      materialId.value = ''
      quantity.value = null
      expiryDate.value = ''

    }

  }
)


// 送出進貨
const handleSubmit = () => {

  const data = {

    material: {
      id: Number(materialId.value)
    },

    quantity: Number(quantity.value),

    expiryDate:
      expiryDate.value || null

  }


  console.log(
    '準備送出的進貨資料：',
    data
  )


  httpClient
    .post('/api/inventory', data)

    .then((response) => {

      console.log(
        '進貨成功：',
        response.data
      )

      emit('success')

      emit('close')

    })

    .catch((error) => {

      console.error(
        '進貨失敗：',
        error
      )

    })

}


// 元件載入後先取得原物料
onMounted(() => {

  loadMaterials()

})

</script>