<template>
  <TextInputModal
    :is-open="isOpen" :is-saving="isSaving" :successful="successful" :error="error"
    title="作廢銷售單" :subtitle="orderNumber" label="請輸入作廢原因"
    confirm-text="確認作廢" saving-text="作廢中…" success-title="這筆銷售單作廢成功"
    :max-length="1000" @close="emit('close')" @confirm="emit('confirm', $event)"
  />
</template>
<script setup>
import TextInputModal from '@/component/子元件/TextInputModal.vue'
defineProps({ isOpen: Boolean, isSaving: Boolean, successful: Boolean,
  orderNumber: { type: String, default: '' }, error: { type: String, default: '' } })
const emit = defineEmits(['close', 'confirm'])
</script>
