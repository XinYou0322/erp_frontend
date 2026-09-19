<template>
  <div class="flex justify-center">
    <button
      v-if="material.status === 'ACTIVE'"
      type="button"
      class="
        mt-3 w-1/3 px-3 py-2 rounded-xl border
        text-[length:var(--font-body)] font-bold
        transition-colors cursor-pointer
        bg-[var(--error)]/10
        hover:bg-[var(--error)]/20
        text-[var(--error)]
        border-[var(--error)]/30
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
      :disabled="loading"
      @click="openConfirm"
    >
      停用原物料
    </button>

    <div
      v-else
      class="
        mt-3 w-full px-3 py-2 rounded-xl border
        text-center text-[length:var(--font-body)] font-bold
        bg-[var(--surface-container-low)]
        text-[var(--on-surface-variant)]
        border-[var(--outline)]
        opacity-60
      "
    >
      已停用
    </div>

    <Teleport to="body">
      <div
        v-if="confirmOpen"
        class="
          fixed inset-0 z-[100]
          flex items-center justify-center
          bg-black/60 backdrop-blur-sm
          p-4
        "
        @click.self="closeConfirm"
      >
        <div
          class="
            w-full max-w-md rounded-2xl
            bg-[var(--surface-container)]
            border border-[var(--outline)]
            shadow-2xl p-6
          "
        >
          <h3
            class="
              text-[length:var(--font-heading)]
              font-bold
              text-[var(--on-surface)]
            "
          >
            確認停用原物料
          </h3>

          <p
            class="
              mt-3 text-[length:var(--font-body)]
              text-[var(--on-surface-variant)]
              leading-6
            "
          >
            確定要停用
            <span class="font-bold text-[var(--on-surface)]">
              {{ material.name }}
            </span>
            嗎？停用後此頁不提供重新啟用功能。
          </p>

          <p
            v-if="errorMessage"
            class="mt-3 text-sm text-[var(--error)]"
          >
            {{ errorMessage }}
          </p>

          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="btn-secondary px-4 py-2"
              :disabled="loading"
              @click="closeConfirm"
            >
              取消
            </button>

            <button
              type="button"
              class="
                px-4 py-2 rounded-xl border
                bg-[var(--error)]/10
                hover:bg-[var(--error)]/20
                text-[var(--error)]
                border-[var(--error)]/30
                font-bold transition-colors
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
              :disabled="loading"
              @click="disableMaterial"
            >
              {{ loading ? '處理中...' : '確認停用' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import httpClient from '@/service/httpClient'

const props = defineProps({
  material: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'success',
  'error'
])

const confirmOpen = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const openConfirm = () => {
  errorMessage.value = ''
  confirmOpen.value = true
}

const closeConfirm = () => {
  if (loading.value) return

  confirmOpen.value = false
  errorMessage.value = ''
}

const disableMaterial = async () => {
  if (!props.material?.id || loading.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    await httpClient.patch(
      `/api/material/${props.material.id}/status`,
      null,
      {
        params: {
          status: 'INACTIVE'
        }
      }
    )

    confirmOpen.value = false

    emit('success', props.material.id)
  } catch (error) {
    console.error('停用原物料失敗：', error)

    errorMessage.value = '停用原物料失敗，請稍後再試。'
    emit('error', error)
  } finally {
    loading.value = false
  }
}
</script>