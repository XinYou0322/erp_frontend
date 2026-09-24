<template>

  <ModalWrapper
    :is-open="visible && !saveSuccessful"
    title="修改供應商"
    subtitle="請確認資料後再送出修改"
    max-width="3xl"
    :confirm-close="true"
    confirm-close-message="尚未儲存的供應商修改將會遺失。"
    @close="emit('close')"
  >
    <form
      id="update-supplier-form"
      class="supplier-form-grid"
      novalidate
      @submit.prevent="submitUpdate"
    >
      <!-- API 或前端驗證失敗時留在視窗內顯示訊息，方便繼續修正。 -->
      <p
        v-if="formError || apiError"
        class="supplier-field supplier-field--full rounded-xl border border-[var(--error)]/40 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
        role="alert"
      >
        {{ apiError || formError }}
      </p>

      <div class="supplier-field supplier-field--half">
        <label class="supplier-field__label" for="update-supplier-id">ID</label>
        <input id="update-supplier-id" v-model="form.id" class="supplier-input input-glow" type="text" disabled>
      </div>

      <div class="supplier-field supplier-field--half">
        <label class="supplier-field__label" for="update-supplier-name">供應商名稱</label>
        <input
          id="update-supplier-name"
          v-model="form.name"
          class="supplier-input input-glow"
          :class="{ 'border-[var(--error)]': errors.name }"
          type="text"
          maxlength="50"
          @input="clearError('name')"
        >
        <span v-if="errors.name" class="text-xs text-[var(--error)]">{{ errors.name }}</span>
      </div>

      <div class="supplier-field supplier-field--narrow">
        <label class="supplier-field__label" for="update-supplier-calling-code">國際碼</label>
        <input
          id="update-supplier-calling-code"
          v-model="form.callingCode"
          class="supplier-input input-glow"
          :class="{ 'border-[var(--error)]': errors.callingCode }"
          type="text"
          maxlength="4"
          @input="clearError('callingCode')"
        >
        <span v-if="errors.callingCode" class="text-xs text-[var(--error)]">{{ errors.callingCode }}</span>
      </div>

      <div class="supplier-field supplier-field--wide">
        <label class="supplier-field__label" for="update-supplier-phone">電話</label>
        <input
          id="update-supplier-phone"
          v-model="form.phone"
          class="supplier-input input-glow"
          :class="{ 'border-[var(--error)]': errors.phone }"
          type="text"
          maxlength="15"
          @input="clearError('phone')"
        >
        <span v-if="errors.phone" class="text-xs text-[var(--error)]">{{ errors.phone }}</span>
      </div>

      <div class="supplier-field supplier-field--narrow">
        <label class="supplier-field__label" for="update-supplier-extension">分機</label>
        <input
          id="update-supplier-extension"
          v-model="form.extension"
          class="supplier-input input-glow"
          :class="{ 'border-[var(--error)]': errors.extension }"
          type="text"
          maxlength="10"
          @input="clearError('extension')"
        >
        <span v-if="errors.extension" class="text-xs text-[var(--error)]">{{ errors.extension }}</span>
      </div>

      <div class="supplier-field supplier-field--full">
        <label class="supplier-field__label" for="update-supplier-address">地址</label>
        <input
          id="update-supplier-address"
          v-model="form.address"
          class="supplier-input input-glow"
          :class="{ 'border-[var(--error)]': errors.address }"
          type="text"
          maxlength="200"
          @input="clearError('address')"
        >
        <span v-if="errors.address" class="text-xs text-[var(--error)]">{{ errors.address }}</span>
      </div>

      <div class="supplier-field supplier-field--half">
        <label class="supplier-field__label" for="update-supplier-email">Email</label>
        <input
          id="update-supplier-email"
          v-model="form.email"
          class="supplier-input input-glow"
          :class="{ 'border-[var(--error)]': errors.email }"
          type="email"
          maxlength="50"
          @input="clearError('email')"
        >
        <span v-if="errors.email" class="text-xs text-[var(--error)]">{{ errors.email }}</span>
      </div>

      <div class="supplier-field supplier-field--half">
        <label class="supplier-field__label" for="update-supplier-status">狀態</label>
        <select
          id="update-supplier-status"
          v-model="form.status"
          class="supplier-select input-glow"
          :class="{ 'border-[var(--error)]': errors.status }"
          @change="clearError('status')"
        >
          <option value="PENDING">PENDING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="BLACKLISTED">BLACKLISTED</option>
        </select>
        <span v-if="errors.status" class="text-xs text-[var(--error)]">{{ errors.status }}</span>
      </div>
    </form>

    <!-- slot 提供的 close 會呼叫 ModalWrapper.requestClose()，取消時才會出現確認視窗。 -->
    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-3">
        <button type="button" class="supplier-btn supplier-btn--secondary" :disabled="isSaving" @click="close">
          取消
        </button>
        <button
          type="submit"
          form="update-supplier-form"
          class="supplier-btn supplier-btn--primary"
          :disabled="isSaving"
        >
          {{ isSaving ? '修改中…' : '送出修改' }}
        </button>
      </div>
    </template>
  </ModalWrapper>
  <ConfirmSuccessfulModal
    :is-open="visible && saveSuccessful"
    item-name="供應商"
    @confirm="emit('close')"
    @cancel="emit('close')"
  />
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import ModalWrapper from '@/component/子元件/ModalWrapper.vue'
import ConfirmSuccessfulModal from '@/component/子元件/ConfirmSuccessfulModal.vue'

const props = defineProps({
  saveSuccessful: {
    type: Boolean,
    default: false
  },
  visible: {
    type: Boolean,
    default: false
  },
  supplier: {
    type: Object,
    default: () => ({})
  },
  // 由父元件傳入 API 執行狀態，避免使用者重複送出。
  isSaving: {
    type: Boolean,
    default: false
  },
  // 由父元件傳入後端錯誤，失敗時不關閉修改視窗。
  apiError: {
    type: String,
    default: ''
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

// 前端欄位驗證，規則與 SuppliersUpdateDTO 保持一致。
const errors = reactive({})
const formError = ref('')

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
    clearAllErrors()
  },
  {
    immediate: true
  }
)

function clearError(fieldName) {
  if (errors[fieldName]) {
    delete errors[fieldName]
  }
  formError.value = ''
}

function clearAllErrors() {
  for (const fieldName of Object.keys(errors)) {
    delete errors[fieldName]
  }
  formError.value = ''
}

function validateForm() {
  clearAllErrors()

  const name = form.name.trim()
  const callingCode = form.callingCode.trim()
  const phone = form.phone.trim()
  const extension = form.extension.trim()
  const address = form.address.trim()
  const email = form.email.trim()

  if (!name) {
    errors.name = '供應商名稱不可為空'
  } else if (name.length > 50) {
    errors.name = '供應商名稱不可超過 50 個字'
  }

  if (!/^\+[1-9][0-9]{0,2}$/.test(callingCode)) {
    errors.callingCode = '國際碼格式錯誤，例如：+886'
  }

  if (!/^[0-9]{6,15}$/.test(phone)) {
    errors.phone = '電話只能包含 6～15 碼數字'
  }

  if (extension && !/^[0-9]{1,10}$/.test(extension)) {
    errors.extension = '分機只能包含數字，最多 10 碼'
  }

  if (!address) {
    errors.address = '地址不可為空'
  } else if (address.length > 200) {
    errors.address = '地址不可超過 200 個字'
  }

  if (!email) {
    errors.email = 'Email 不可為空'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email 格式錯誤'
  } else if (email.length > 50) {
    errors.email = 'Email 不可超過 50 個字'
  }

  if (!form.status) {
    errors.status = '請選擇供應商狀態'
  }

  if (Object.keys(errors).length > 0) {
    formError.value = '部分欄位尚未填寫正確，請檢查紅色提示'
    return false
  }

  return true
}

function submitUpdate() {
  if (props.isSaving || !validateForm()) {
    return
  }

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
