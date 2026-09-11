<template>
  <ModalWrapper
    :is-open="isOpen"
    title="新增原物料"
    subtitle="建立原物料主檔資料"
    max-width="xl"
    :icon="PackagePlus"
    @close="emit('close')"
  >

    <form
      id="add-material-form"
      @submit.prevent="handleSubmit"
      class="space-y-4"
    >

      <!-- 名稱 / 代碼 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label class="block font-bold text-gray-700 text-xs mb-1">
            原物料名稱
            <span class="text-red-500">*</span>
          </label>

          <input
            v-model="name"
            type="text"
            required
            class="input-field"
            placeholder="例如：阿薩姆紅茶原葉"
          />
        </div>


        <div>
          <label class="block font-bold text-gray-700 text-xs mb-1">
            物料代碼
            <span class="text-red-500">*</span>
          </label>

          <input
            v-model="code"
            type="text"
            required
            class="input-field font-mono"
            placeholder="例如：TEA-001"
          />
        </div>

      </div>


      <!-- 單位 -->
      <div>
        <label class="block font-bold text-gray-700 text-xs mb-1">
          計量單位
          <span class="text-red-500">*</span>
        </label>

        <select
          v-model="unit"
          required
          class="input-field"
        >
          <option value="kg">公斤 (kg)</option>
          <option value="g">公克 (g)</option>
          <option value="L">公升 (L)</option>
          <option value="ml">毫升 (ml)</option>
          <option value="瓶">瓶</option>
          <option value="包">包</option>
          <option value="桶">桶</option>
          <option value="個">個</option>
          <option value="箱">箱</option>
          <option value="支">支</option>
        </select>
      </div>


      <!-- 安全庫存 / 成本 -->
      <div
        class="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3"
      >

        <div
          class="flex items-center space-x-1.5 text-xs font-bold text-[#0059bb]"
        >
          <Layers class="w-4 h-4" />

          <span>
            庫存基準與成本
          </span>
        </div>


        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <!-- 安全庫存 -->
          <div>

            <label class="block font-semibold text-gray-600 text-xs mb-1">
              安全庫存
            </label>

            <div class="relative">

              <input
                v-model.number="safetyStock"
                type="number"
                step="any"
                min="0"
                required
                class="input-field no-number-spinner bg-white pr-12"
              />

              <span
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
              >
                {{ unit }}
              </span>

            </div>

          </div>


          <!-- 成本 -->
          <div>

            <label class="block font-semibold text-gray-600 text-xs mb-1">
              原物料成本 (NT$)
            </label>

            <div class="relative">

              <input
                v-model.number="cost"
                type="number"
                step="any"
                min="0"
                required
                class="input-field no-number-spinner bg-white pr-14"
              />

              <span
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
              >
                /{{ unit }}
              </span>

            </div>

          </div>

        </div>

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
        form="add-material-form"
        class="btn-primary text-xs flex items-center space-x-1.5"
      >

        <Check class="w-4 h-4" />

        <span>
          確認建立原物料
        </span>

      </button>

    </template>

  </ModalWrapper>
</template>


<script setup>

import {
  ref,
  watch
} from 'vue'

import {
  PackagePlus,
  Check,
  Layers
} from 'lucide-vue-next'

import ModalWrapper from '../子元件/ModalWrapper.vue'

import httpClient
  from '@/service/httpClient'


const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})


const emit = defineEmits([
  'close',
  'success'
])


const name = ref('')
const code = ref('')
const unit = ref('kg')
const cost = ref(0)
const safetyStock = ref(0)


watch(
  () => props.isOpen,

  (isOpen) => {

    if (isOpen) {

      name.value = ''
      code.value = ''
      unit.value = 'kg'
      cost.value = 0
      safetyStock.value = 0

    }

  }
)


const handleSubmit = () => {

  const data = {

    code: code.value.trim(),

    name: name.value.trim(),

    unit: unit.value,

    cost: Number(cost.value),

    safetyStock:
      Number(safetyStock.value)

  }


  console.log(
    '準備新增的原物料：',
    data
  )


  httpClient
    .post('/api/material/add', data)

    .then((response) => {

      console.log(
        '新增原物料成功：',
        response.data
      )

      emit('success')

      emit('close')

    })

    .catch((error) => {

      console.error(
        '新增原物料失敗：',
        error
      )

    })

}

</script>