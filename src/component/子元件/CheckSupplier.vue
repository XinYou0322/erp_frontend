<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="erp-modal-layer erp-modal-layer--supplier"
      @click.self="closeModal"
    >
      <div class="erp-modal erp-modal--supplier-detail">
        <!------------------------------------------->
        <div class="erp-modal__head erp-modal__head--supplier">
          <div>
            <p class="erp-modal__eyebrow">SUPPLIER DETAIL</p>
            <h2 class="erp-modal__title">{{ supplier?.name || '供應商詳細資料' }}</h2>
          </div>
          <button
            type="button"
            class="erp-icon-btn erp-modal__close"
            aria-label="關閉"
            @click="closeModal"
          >×</button>
        </div>
         <!------------------------------------------->
        <div class="erp-modal__body erp-modal__body--supplier">
          <section class="erp-detail-section">
            <div class="erp-detail-section__head">
              <span>基本資料</span>
              <span class="erp-status" :class="statusClass">{{ supplier?.status || '-' }}</span>
            </div>
            <div class="erp-detail-grid">
              <div class="erp-detail-item">
                <span class="erp-detail-item__label">ID</span>
                <span class="erp-detail-item__value">{{ supplier?.id ?? '-' }}</span>
              </div>
              <div class="erp-detail-item">
                <span class="erp-detail-item__label">供應商名稱</span>
                <span class="erp-detail-item__value">{{ supplier?.name || '-' }}</span>
              </div>
              <div class="erp-detail-item">
                <span class="erp-detail-item__label">電話</span>
                <span class="erp-detail-item__value">{{ fullPhone }}</span>
              </div>
              <div class="erp-detail-item">
                <span class="erp-detail-item__label">Email</span>
                <span class="erp-detail-item__value">{{ supplier?.email || '-' }}</span>
              </div>
              <div class="erp-detail-item erp-detail-item--full">
                <span class="erp-detail-item__label">地址</span>
                <span class="erp-detail-item__value">{{ supplier?.address || '-' }}</span>
              </div>
            </div>
          </section>
          <section class="erp-detail-section">
            <div class="erp-detail-section__head">
              <span>供應商備註</span>
              <span class="erp-count-badge">{{ supplierNotes.length }} 筆</span>
            </div>
            <div v-if="supplierNotes.length > 0" class="erp-note-list">
              <div v-for="(note, index) in supplierNotes" :key="note.id ?? index" class="erp-note-card">
                <div class="erp-note-card__head">
                  <div class="erp-note-card__number">備註 {{ index + 1 }}</div>
                  <div class="erp-note-card__time">{{ formatDate(note.createTime || note.createdAt) }}</div>
                </div>
                <div class="erp-note-card__content">{{ note.content || '-' }}</div>
                <div class="erp-note-card__footer">
                  <span class="erp-note-card__label">建立人</span>
                  <span>{{ getCreatorName(note) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="erp-empty-state">此供應商目前沒有備註</div>
          </section>
        </div>
        <div class="erp-modal__footer erp-modal__footer--supplier">
          <button type="button" class="erp-btn erp-btn--primary" @click="closeModal">關閉</button>
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
