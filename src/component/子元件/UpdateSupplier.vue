<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="supplier-modal-backdrop"
      @click.self="closeModal"
    >
      <div class="supplier-modal supplier-modal--form bento-card shadow-level-2">
        <div class="supplier-modal__header">
          <div>
            <p class="supplier-modal__eyebrow">EDIT SUPPLIER</p>
            <h2 class="supplier-modal__title">修改供應商</h2>
          </div>
          <button
            type="button"
            class="supplier-icon-button supplier-modal__close"
            aria-label="關閉"
            @click="closeModal"
          >×</button>
        </div>
        <div class="supplier-modal__body supplier-form-grid">
          <div class="supplier-field supplier-field--half">
            <label class="supplier-field__label">ID</label>
            <input v-model="form.id" class="supplier-input input-glow" type="text" disabled>
          </div>
          <div class="supplier-field supplier-field--half">
            <label class="supplier-field__label">供應商名稱</label>
            <input v-model="form.name" class="supplier-input input-glow" type="text">
          </div>
          <div class="supplier-field supplier-field--narrow">
            <label class="supplier-field__label">國際碼</label>
            <input v-model="form.callingCode" class="supplier-input input-glow" type="text">
          </div>
          <div class="supplier-field supplier-field--wide">
            <label class="supplier-field__label">電話</label>
            <input v-model="form.phone" class="supplier-input input-glow" type="text">
          </div>
          <div class="supplier-field supplier-field--narrow">
            <label class="supplier-field__label">分機</label>
            <input v-model="form.extension" class="supplier-input input-glow" type="text">
          </div>
          <div class="supplier-field supplier-field--full">
            <label class="supplier-field__label">地址</label>
            <input v-model="form.address" class="supplier-input input-glow" type="text">
          </div>
          <div class="supplier-field supplier-field--half">
            <label class="supplier-field__label">Email</label>
            <input v-model="form.email" class="supplier-input input-glow" type="email">
          </div>
          <div class="supplier-field supplier-field--half">
            <label class="supplier-field__label">狀態</label>
            <select v-model="form.status" class="supplier-select input-glow">
              <option value="PENDING">PENDING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="BLACKLISTED">BLACKLISTED</option>
            </select>
          </div>
        </div>
        <div class="supplier-modal__footer supplier-modal__footer--form">
          <button type="button" class="supplier-btn supplier-btn--secondary" @click="closeModal">取消</button>
          <button type="button" class="supplier-btn supplier-btn--primary" @click="submitUpdate">送出修改</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
<script setup>
import { reactive, watch } from 'vue'

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
const emit = defineEmits(['close', 'update'])
const form = reactive({
  id: null,
  name: '',
  callingCode: '',
  phone: '',
  extension: '',
  address: '',
  email: '',
  status: ''
})
watch(
  () => props.supplier,
  (supplier) => {
    if (!supplier) {
      return
    }
    form.id = supplier.id ?? null
    form.name = supplier.name ?? ''
    form.callingCode = supplier.callingCode ?? ''
    form.phone = supplier.phone ?? ''
    form.extension = supplier.extension ?? ''
    form.address = supplier.address ?? ''
    form.email = supplier.email ?? ''
    form.status = supplier.status ?? ''
  },
  {
    immediate: true
  }
)
function closeModal() {
  emit('close')
}
function submitUpdate() {
  emit('update', {
    id: form.id,
    name: form.name,
    callingCode: form.callingCode,
    phone: form.phone,
    extension: form.extension,
    address: form.address,
    email: form.email,
    status: form.status
  })
}
</script>