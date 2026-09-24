<template>
  <section class="purchase-order-detail">
    <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
      <button type="button" class="purchase-order-detail__back" :disabled="isSavingNote" @click="emit('close')">← 返回供應商列表</button>
      <button type="button" class="btn-primary" :disabled="isSavingNote" @click="openNoteModal">＋ 新增備註</button>
    </div>
    <TextInputModal :is-open="noteModalOpen" :is-saving="isSavingNote" :successful="noteSaved"
      :error="noteError" title="新增供應商備註" :subtitle="supplier.name" label="請輸入備註"
      confirm-text="新增備註" saving-text="儲存中…" success-title="供應商備註新增成功"
      :max-length="200" @close="closeNoteModal" @confirm="saveNote" />
    <div class="purchase-order-detail__layout">
      <article class="purchase-order-detail__main bento-card">
        <header class="purchase-order-detail__header">
          <div>
            <p class="purchase-order-detail__eyebrow">SUPPLIER DETAIL</p>
            <h1 class="purchase-order-detail__title">{{ supplier.name || '供應商詳細資料' }}</h1>
          </div>
          <span class="supplier-status" :class="statusClass">{{ supplier.status || '-' }}</span>
        </header>
        <section class="purchase-order-detail__section">
          <h2 class="purchase-order-detail__section-title">供應商基本資料</h2>
          <dl class="purchase-order-detail__info-grid">
            <div class="purchase-order-detail__info-row"><dt>ID</dt><dd>{{ supplier.id ?? '-' }}</dd></div>
            <div class="purchase-order-detail__info-row"><dt>供應商名稱</dt><dd>{{ supplier.name || '-' }}</dd></div>
            <div class="purchase-order-detail__info-row"><dt>電話</dt><dd>{{ fullPhone }}</dd></div>
            <div class="purchase-order-detail__info-row"><dt>Email</dt><dd>{{ supplier.email || '-' }}</dd></div>
            <div class="purchase-order-detail__info-row"><dt>地址</dt><dd>{{ supplier.address || '-' }}</dd></div>
            <div class="purchase-order-detail__info-row"><dt>狀態</dt><dd>{{ supplier.status || '-' }}</dd></div>
          </dl>
        </section>
      </article>
      <aside>
        <SupplierNote :key="`${supplier.id}-${noteRefreshKey}`" :supplier="supplier" :visible="true" />
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import TextInputModal from '@/component/子元件/TextInputModal.vue'
import httpClient from '@/service/httpClient'
import { useAuthStore } from '@/stores/auth.store'
import SupplierNote from '@/component/子元件/SupplierNote.vue'
const props = defineProps({ supplier: { type: Object, required: true } })
const emit = defineEmits(['close'])
const statusClass = computed(() => props.supplier.status ? `supplier-status--${props.supplier.status.toLowerCase()}` : '')
const fullPhone = computed(() => {
  const { callingCode, phone, extension } = props.supplier
  const parts = []
  if (callingCode) parts.push(String(callingCode).startsWith('+') ? callingCode : `+${callingCode}`)
  if (phone) parts.push(phone)
  if (extension) parts.push(String(extension).startsWith('#') ? extension : `#${extension}`)
  return parts.join('-') || '-'
})
const authStore = useAuthStore()
const noteModalOpen = ref(false)
const isSavingNote = ref(false)
const noteSaved = ref(false)
const noteError = ref('')
const noteRefreshKey = ref(0)
function openNoteModal() {
  if (isSavingNote.value) return
  noteSaved.value = false
  noteError.value = ''
  noteModalOpen.value = true
}
function closeNoteModal() {
  if (!isSavingNote.value) noteModalOpen.value = false
}
async function saveNote(value) {
  if (isSavingNote.value || noteSaved.value) return
  const remark = value.trim()
  if (!remark || remark.length > 200) {
    noteError.value = '備註不可為空，最多 200 個字。'
    return
  }
  const userId = authStore.currentUser?.id
  if (userId === null || userId === undefined || String(userId).trim() === '' ||
      !Number.isSafeInteger(Number(userId)) || Number(userId) < 0) {
    noteError.value = '無法取得登入者資料，請重新登入後再新增備註。'
    return
  }
  isSavingNote.value = true
  noteError.value = ''
  try {
    await httpClient.post(`/api/supplierNote/${props.supplier.id}`, { remark },
      { params: { loginUserId: Number(userId) } })
    noteSaved.value = true
    noteModalOpen.value = false
    noteRefreshKey.value += 1
  } catch (error) {
    const data = error.response?.data
    noteError.value = data?.message || data?.detail ||
      (typeof data === 'string' ? data : '新增備註失敗，請稍後再試。')
  } finally {
    isSavingNote.value = false
  }
}
</script>
