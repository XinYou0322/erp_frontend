<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="supplier-modal-backdrop"
      @click.self="closeModal"
    >
      <div class="supplier-modal bento-card shadow-level-2">
        <!------------------------------------------->
        <div class="supplier-modal__header">
          <div>
            <p class="supplier-modal__eyebrow">SUPPLIER DETAIL</p>
            <h2 class="supplier-modal__title">{{ supplier?.name || '供應商詳細資料' }}</h2>
          </div>
          <button
            type="button"
            class="supplier-icon-button supplier-modal__close"
            aria-label="關閉"
            @click="closeModal"
          >×</button>
        </div>
         <!------------------------------------------->
        <div class="supplier-modal__body">
          <section class="supplier-detail-section">
            <div class="supplier-detail-section__header">
              <span>基本資料</span>
              <span class="supplier-status" :class="statusClass">{{ supplier?.status || '-' }}</span>
            </div>
            <div class="supplier-detail-grid">
              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">ID</span>
                <span class="supplier-detail-item__value">{{ supplier?.id ?? '-' }}</span>
              </div>
              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">供應商名稱</span>
                <span class="supplier-detail-item__value">{{ supplier?.name || '-' }}</span>
              </div>
              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">電話</span>
                <span class="supplier-detail-item__value">{{ fullPhone }}</span>
              </div>
              <div class="supplier-detail-item">
                <span class="supplier-detail-item__label">Email</span>
                <span class="supplier-detail-item__value">{{ supplier?.email || '-' }}</span>
              </div>
              <div class="supplier-detail-item supplier-detail-item--full">
                <span class="supplier-detail-item__label">地址</span>
                <span class="supplier-detail-item__value">{{ supplier?.address || '-' }}</span>
              </div>
            </div>
          </section>
          <section class="supplier-detail-section">
            <div class="supplier-detail-section__header">
              <span>供應商備註</span>
              <span class="supplier-count-badge">{{ supplierNotes.length }} 筆</span>
            </div>
            <div v-if="supplierNotes.length > 0" class="supplier-note-list">
              <div v-for="(note, index) in supplierNotes" :key="note.id ?? index" class="supplier-note-card">
                <div class="supplier-note-card__header">
                  <div class="supplier-note-card__number">備註 {{ index + 1 }}</div>
                  <div class="supplier-note-card__time">{{ formatDate(note.createTime || note.createdAt) }}</div>
                </div>
                <div class="supplier-note-card__content">{{ note.content || '-' }}</div>
                <div class="supplier-note-card__footer">
                  <span class="supplier-note-card__label">建立人</span>
                  <span>{{ getCreatorName(note) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="supplier-empty-state">此供應商目前沒有備註</div>
          </section>
        </div>
        <div class="supplier-modal__footer">
          <button type="button" class="supplier-btn supplier-btn--primary" @click="closeModal">關閉</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  supplier: {
    type: Object,
    default: () => ({})
  }
})
const emit = defineEmits(['close'])
const closeModal = () => {
  emit('close')
}
const fullPhone = computed(() => {
  const callingCode = props.supplier?.callingCode
  const phone = props.supplier?.phone
  const extension = props.supplier?.extension
  const phoneParts = []
  if (callingCode) {
    const formattedcallingCode = String(callingCode).startsWith('+') ? callingCode : `+${callingCode}`
    phoneParts.push(formattedcallingCode)
  }
  if (phone) {
    phoneParts.push(phone)
  }
  if (extension) {
    const formattedExtension = String(extension).startsWith('#') ? extension : `#${extension}`
    phoneParts.push(formattedExtension)
  }
  return phoneParts.length > 0 ? phoneParts.join('-') : '-'
})
const supplierNotes = computed(() => {
  return props.supplier?.supplierNotes ?? props.supplier?.notes ?? []
})
const statusClass = computed(() => {
  const status = props.supplier?.status?.toLowerCase()
  return status ? `supplier-status--${status}` : ''
})
const getCreatorName = (note) => {
  if (note.createdByName) {
    return note.createdByName
  }
  if (typeof note.createdBy === 'string') {
    return note.createdBy
  }
  if (note.createdBy?.name) {
    return note.createdBy.name
  }
  if (note.createdBy?.username) {
    return note.createdBy.username
  }
  return '-'
}
const formatDate = (date) => {
  if (!date) {
    return '-'
  }
  const dateObject = new Date(date)
  if (Number.isNaN(dateObject.getTime())) {
    return date
  }
  return dateObject.toLocaleString('zh-TW')
}
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.visible) {
    closeModal()
  }
}
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
