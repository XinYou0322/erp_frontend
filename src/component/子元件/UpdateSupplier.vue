<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="erp-modal-layer erp-modal-layer--supplier"
      @click.self="closeModal"
    >
      <div class="erp-modal erp-modal--supplier-form">
        <div class="erp-modal__head erp-modal__head--supplier">
          <h2 class="erp-modal__title">修改供應商</h2>
          <button
            type="button"
            class="erp-icon-btn erp-modal__close"
            aria-label="關閉"
            @click="closeModal"
          >×</button>
        </div>
        <div class="erp-modal__body erp-modal__body--supplier-form erp-form-grid erp-form-grid--supplier">
          <div class="erp-field erp-field--half">
            <label class="erp-field__label">ID</label>
            <input v-model="form.id" class="erp-input" type="text" disabled>
          </div>
          <div class="erp-field erp-field--half">
            <label class="erp-field__label">供應商名稱</label>
            <input v-model="form.name" class="erp-input" type="text">
          </div>
          <div class="erp-field erp-field--narrow">
            <label class="erp-field__label">國際碼</label>
            <input v-model="form.callingCode" class="erp-input" type="text">
          </div>
          <div class="erp-field erp-field--wide">
            <label class="erp-field__label">電話</label>
            <input v-model="form.phone" class="erp-input" type="text">
          </div>
          <div class="erp-field erp-field--narrow">
            <label class="erp-field__label">分機</label>
            <input v-model="form.extension" class="erp-input" type="text">
          </div>
          <div class="erp-field erp-field--full">
            <label class="erp-field__label">地址</label>
            <input v-model="form.address" class="erp-input" type="text">
          </div>
          <div class="erp-field erp-field--half">
            <label class="erp-field__label">Email</label>
            <input v-model="form.email" class="erp-input" type="email">
          </div>
          <div class="erp-field erp-field--half">
            <label class="erp-field__label">狀態</label>
            <select v-model="form.status" class="erp-select">
              <option value="PENDING">PENDING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="BLACKLISTED">BLACKLISTED</option>
            </select>
          </div>
        </div>
        <div class="erp-modal__footer erp-modal__footer--supplier">
          <button type="button" class="erp-btn erp-btn--soft" @click="closeModal">取消</button>
          <button type="button" class="erp-btn erp-btn--primary" @click="submitUpdate">送出修改</button>
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