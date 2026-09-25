<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/50" @click.self="close" @keydown.esc.stop.prevent="close" @keydown.tab="trapFocus">
      <section ref="dialog" class="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl p-5 bg-[var(--surface-container)] text-[var(--on-surface)] border border-[var(--outline)] shadow-xl" role="dialog" aria-modal="true" :aria-labelledby="titleId" :aria-busy="isSaving">
        <h3 :id="titleId" class="font-bold text-[length:var(--font-title)]">{{ successful ? successTitle : title }}</h3>
        <form v-if="!successful" @submit.prevent="submit">
          <p class="mt-2 mb-4 break-words text-sm text-[var(--on-surface-variant)]">{{ subtitle }}</p>
          <label :for="inputId" class="supplier-field__label block mb-2">{{ label }}</label>
          <textarea class="supplier-input input-glow resize-y" :id="inputId" ref="reasonInput" v-model="reason" rows="4" :maxlength="maxLength" :disabled="isSaving" @input="validationError = ''" />
          <p v-if="validationError || error" class="mt-2 text-sm text-[var(--error)]" role="alert">{{ validationError || error }}</p>
          <div class="flex justify-end gap-2 mt-5">
            <button type="button" class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2" :disabled="isSaving" @click="close">取消</button>
            <button type="submit" class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2" :disabled="isSaving">{{ isSaving ? savingText : confirmText }}</button>
          </div>
        </form>
        <div v-else class="flex justify-end gap-2 mt-5">
          <button ref="closeButton" type="button" class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2" :disabled="isSaving" @click="close">關閉</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch, useId } from 'vue'
const props = defineProps({
  isOpen: Boolean,
  isSaving: Boolean,
  successful: Boolean,
  title: { type: String, default: '輸入內容' },
  subtitle: { type: String, default: '' },
  label: { type: String, default: '請輸入內容' },
  confirmText: { type: String, default: '確認儲存' },
  savingText: { type: String, default: '儲存中…' },
  successTitle: { type: String, default: '儲存成功' },
  maxLength: { type: Number, default: 1000 },
  initialValue: { type: String, default: '' },
  error: { type: String, default: '' }
})
const emit = defineEmits(['close', 'confirm'])
const titleId = useId()
const inputId = useId()
const reason = ref('')
const validationError = ref('')
const reasonInput = ref(null)
const closeButton = ref(null)
const dialog = ref(null)
let previousFocus = null
watch(() => props.isOpen, async (open) => {
  if (open) {
    previousFocus = document.activeElement
    reason.value = props.initialValue
    validationError.value = ''
    await nextTick()
    reasonInput.value?.focus()
  } else {
    previousFocus?.focus?.()
  }
})
watch(() => [props.successful, props.isSaving], async ([success, saving]) => {
  if (success && !saving) {
    await nextTick()
    closeButton.value?.focus()
  }
})
onBeforeUnmount(() => previousFocus?.focus?.())
function close() {
  if (!props.isSaving) emit('close')
}
function submit() {
  if (props.isSaving || props.successful) return
  const value = reason.value.trim()
  if (!value || value.length > props.maxLength) {
    validationError.value = `請填寫內容，最多 ${props.maxLength} 個字。`
    reasonInput.value?.focus()
    return
  }
  emit('confirm', value)
}
function trapFocus(event) {
  const elements = dialog.value?.querySelectorAll('button:not(:disabled), textarea:not(:disabled)')
  if (!elements?.length) { event.preventDefault(); return }
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
</script>
