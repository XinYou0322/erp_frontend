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
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <!-- 名稱 / 代碼 -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- 原物料名稱 -->
        <div>
          <label
            class="
              mb-1
              block
              text-xs
              font-bold
              text-[var(--on-surface)]
            "
          >
            原物料名稱
            <span class="text-[var(--error)]">*</span>
          </label>

          <input
            v-model="name"
            type="text"
            required
            class="input-field"
            placeholder="例如：阿薩姆紅茶原葉"
          />
        </div>

        <!-- 物料代碼 -->
        <div>
          <label
            class="
              mb-1
              block
              text-xs
              font-bold
              text-[var(--on-surface)]
            "
          >
            物料代碼
            <span class="text-[var(--error)]">*</span>
          </label>

          <input
            v-model="code"
            type="text"
            required
            class="input-field font-data-mono"
            placeholder="例如：TEA-001"
          />
        </div>
      </div>

      <!-- 計量單位 -->
      <div>
        <label
          class="
            mb-1
            block
            text-xs
            font-bold
            text-[var(--on-surface)]
          "
        >
          計量單位
          <span class="text-[var(--error)]">*</span>
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

      <!-- 庫存基準與成本 -->
      <div
        class="
          space-y-3
          rounded-xl
          border
          border-[var(--outline)]
          bg-[var(--surface-container-high)]
          p-3.5
        "
      >
        <div
          class="
            flex
            items-center
            gap-1.5
            text-xs
            font-bold
            text-[var(--primary)]
          "
        >
          <Layers class="h-4 w-4" />

          <span>庫存基準與成本</span>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <!-- 安全庫存 -->
          <div>
            <label
              class="
                mb-1
                block
                text-xs
                font-semibold
                text-[var(--on-surface-variant)]
              "
            >
              安全庫存
            </label>

            <div class="relative">
              <input
                v-model.number="safetyStock"
                type="number"
                min="0"
                step="any"
                required
                class="input-field no-number-spinner pr-12"
              />

              <span
                class="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-xs
                  text-[var(--on-surface-variant)]
                  pointer-events-none
                "
              >
                {{ unit }}
              </span>
            </div>
          </div>

          <!-- 成本 -->
          <div>
            <label
              class="
                mb-1
                block
                text-xs
                font-semibold
                text-[var(--on-surface-variant)]
              "
            >
              原物料成本 (NT$)
            </label>

            <div class="relative">
              <input
                v-model.number="cost"
                type="number"
                min="0"
                step="any"
                required
                class="input-field no-number-spinner pr-14"
              />

              <span
                class="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-xs
                  text-[var(--on-surface-variant)]
                  pointer-events-none
                "
              >
                /{{ unit }}
              </span>
            </div>
          </div>
        </div>
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

    <!-- Footer -->
    <template #footer>
      <button
        type="button"
        class="btn-secondary text-xs"
        :disabled="submitting"
        @click="emit('close')"
      >
        取消
      </button>

      <button
        type="submit"
        form="add-material-form"
        class="
          btn-primary
          flex
          items-center
          gap-1.5
          text-xs
        "
        :disabled="submitting"
      >
        <Check class="h-4 w-4" />

        <span>
          {{ submitting ? '建立中...' : '確認建立原物料' }}
        </span>
      </button>
    </template>
  </ModalWrapper>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  PackagePlus,
  Check,
  Layers
} from 'lucide-vue-next'

import ModalWrapper from '../子元件/ModalWrapper.vue'
import httpClient from '@/service/httpClient'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const name = ref('')
const code = ref('')
const unit = ref('kg')

const cost = ref(0)
const safetyStock = ref(0)

const submitting = ref(false)
const errorMessage = ref('')

const resetForm = () => {
  name.value = ''
  code.value = ''
  unit.value = 'kg'
  cost.value = 0
  safetyStock.value = 0

  errorMessage.value = ''
}

watch(
  () => props.isOpen,

  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  }
)

const handleSubmit = async () => {
  if (
    !name.value.trim()
    ||
    !code.value.trim()
  ) {
    return
  }

  submitting.value = true
  errorMessage.value = ''

  const data = {
    code: code.value.trim(),
    name: name.value.trim(),
    unit: unit.value,
    cost: Number(cost.value),
    safetyStock: Number(safetyStock.value)
  }

  console.log(
    '準備新增的原物料：',
    data
  )

  try {
    const response = await httpClient.post(
      '/api/material/add',
      data
    )

    console.log(
      '新增原物料成功：',
      response.data
    )

    emit('success')
    emit('close')

    resetForm()
  } catch (error) {
    console.error(
      '新增原物料失敗：',
      error
    )

    errorMessage.value =
      '新增原物料失敗，請確認物料代碼是否重複或後端是否正常。'
  } finally {
    submitting.value = false
  }
}
</script>