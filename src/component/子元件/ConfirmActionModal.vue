<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      @click.self="requestCancel"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-[var(--outline)] bg-[var(--surface-container)] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
      >
        <h3
          id="confirm-action-title"
          class="text-[length:var(--font-heading)] font-bold text-[var(--on-surface)]"
        >
          {{ title }}
        </h3>

        <p class="mt-3 leading-6 text-[length:var(--font-body)] text-[var(--on-surface-variant)]">
          {{ message }}
        </p>

        <div
          v-if="warning"
          class="mt-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
        >
          {{ warning }}
        </div>

        <p
          v-if="errorMessage"
          class="mt-3 text-sm font-bold text-[var(--error)]"
        >
          {{ errorMessage }}
        </p>

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="btn-secondary px-4 py-2"
            :disabled="loading"
            @click="requestCancel"
          >
            {{ cancelText }}
          </button>

          <button
            type="button"
            class="cursor-pointer rounded-xl border border-[var(--error)] bg-[var(--error)] px-4 py-2 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading"
           @click.stop="requestConfirm"
          >
            {{ loading ? loadingText : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '確認操作'
  },
  message: {
    type: String,
    default: '確定要執行這項操作嗎？'
  },
  warning: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  confirmText: {
    type: String,
    default: '確認'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  loadingText: {
    type: String,
    default: '處理中...'
  }
})
const requestConfirm = () => {
  console.log(
    '[ConfirmActionModal] 點擊確認',
    {
      loading: props.loading
    }
  )

  if (props.loading) {
    return
  }

  emit('confirm')
}
const emit = defineEmits(['confirm', 'cancel'])

const requestCancel = () => {
  if (props.loading) return
  emit('cancel')
}
</script>
