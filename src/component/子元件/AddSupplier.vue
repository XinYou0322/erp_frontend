<template>
  <section ref="pageRoot" class="erp-page erp-add-supplier">
    <header class="erp-page-head erp-add-supplier__head">
      <div>
        <h1 class="erp-page-head__title">新增供應商</h1>
        <p class="erp-page-head__description">
          可一次新增多筆供應商，勾選要儲存的資料並拖曳調整順序。
        </p>
      </div>

      <button
        class="erp-btn erp-btn--primary erp-add-supplier__save"
        type="submit"
        form="add-supplier-form"
        :disabled="!canSave"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 4h12l2 2v14H5zM8 4v6h8V4M8 20v-6h8v6" />
        </svg>
        {{ isSaving ? '儲存中…' : `儲存已選 ${selectedCount} 筆` }}
      </button>
    </header>

    <div class="erp-add-supplier__toolbar">
      <label class="erp-add-supplier__select-all">
        <input
          ref="selectAllInput"
          v-model="allSelected"
          class="erp-supplier-checkbox"
          type="checkbox"
        />
        <span>全選</span>
      </label>

      <span class="erp-add-supplier__divider" aria-hidden="true"></span>

      <p class="erp-add-supplier__counter" aria-live="polite">
        已選 <strong>{{ selectedCount }}</strong> / {{ suppliers.length }}
      </p>
    </div>

    <p
      v-if="formMessage || apiError || successMessage"
      class="erp-add-supplier__message"
      :class="{ 'is-success': successMessage && !formMessage && !apiError }"
      role="alert"
    >
      {{ apiError || formMessage || successMessage }}
    </p>

    <form
      id="add-supplier-form"
      class="erp-supplier-batch"
      novalidate
      @submit.prevent="saveSelectedSuppliers"
    >
      <article
        v-for="(supplier, index) in suppliers"
        :key="supplier.localId"
        class="erp-supplier-entry"
        :class="{
          'is-selected': supplier.selected,
          'is-invalid': supplier.invalid,
          'is-dragging': draggedLocalId === supplier.localId
        }"
        @dragover.prevent
        @drop="dropSupplier(supplier.localId)"
      >
        <div class="erp-supplier-entry__topbar">
          <label class="erp-supplier-entry__selector">
            <input
              v-model="supplier.selected"
              class="erp-supplier-checkbox"
              type="checkbox"
              :aria-label="`選取第 ${index + 1} 筆供應商`"
            />
            <span>選取此筆</span>
          </label>

          <div class="erp-supplier-entry__actions">
            <button
              class="erp-icon-btn erp-supplier-entry__icon-btn"
              type="button"
              :aria-expanded="supplier.expanded"
              :aria-controls="`supplier-note-${supplier.localId}`"
              :title="supplier.expanded ? '收合備註' : '展開備註'"
              @click="toggleSupplier(supplier)"
            >
              <svg
                class="erp-supplier-entry__chevron"
                :class="{ 'is-open': supplier.expanded }"
                aria-hidden="true"
                viewBox="0 0 24 24"
              >
                <path d="m7 10 5 5 5-5" />
              </svg>
              <span class="erp-u-sr-only">
                {{ supplier.expanded ? '收合備註' : '展開備註' }}
              </span>
            </button>

            <span
              class="erp-supplier-entry__drag"
              draggable="true"
              role="button"
              tabindex="0"
              title="拖曳調整順序"
              :aria-label="`拖曳第 ${index + 1} 筆供應商以調整順序`"
              @dragstart="startDrag(supplier.localId, $event)"
              @dragend="finishDrag"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="9" cy="5" r="1.5" />
                <circle cx="15" cy="5" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="19" r="1.5" />
                <circle cx="15" cy="19" r="1.5" />
              </svg>
            </span>

            <button
              v-if="suppliers.length > 1"
              class="erp-icon-btn erp-supplier-entry__icon-btn erp-supplier-entry__remove"
              type="button"
              title="移除此筆"
              :aria-label="`移除第 ${index + 1} 筆供應商`"
              @click="removeSupplier(supplier.localId)"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
              </svg>
              <span class="erp-u-sr-only">移除此筆</span>
            </button>
          </div>
        </div>

        <div class="erp-supplier-entry__grid">
          <div class="erp-field erp-supplier-entry__field--name">
            <label class="erp-field__label" :for="`supplier-name-${supplier.localId}`">
              供應商名稱 <span class="erp-required">*</span>
            </label>
            <input
              :id="`supplier-name-${supplier.localId}`"
              v-model="supplier.name"
              class="erp-input"
              :class="{ 'is-error': supplier.errors.name }"
              type="text"
              maxlength="50"
              autocomplete="organization"
              placeholder="輸入供應商名稱"
              @input="clearError(supplier, 'name')"
            />
            <span v-if="supplier.errors.name" class="erp-field__error">
              {{ supplier.errors.name }}
            </span>
          </div>

          <div class="erp-field erp-supplier-entry__field--phone">
            <label class="erp-field__label" :for="`supplier-phone-${supplier.localId}`">
              聯絡電話 <span class="erp-required">*</span>
            </label>

            <div class="erp-phone-composer">
              <input
                v-model="supplier.callingCode"
                class="erp-input erp-phone-composer__code"
                :class="{ 'is-error': supplier.errors.callingCode }"
                type="tel"
                inputmode="tel"
                maxlength="4"
                aria-label="國際碼"
                placeholder="+886"
                @input="clearError(supplier, 'callingCode')"
              />
              <span class="erp-phone-composer__separator" aria-hidden="true">-</span>
              <input
                :id="`supplier-phone-${supplier.localId}`"
                v-model="supplier.phone"
                class="erp-input erp-phone-composer__number"
                :class="{ 'is-error': supplier.errors.phone }"
                type="tel"
                inputmode="numeric"
                maxlength="15"
                aria-label="電話號碼"
                placeholder="例如 223456789"
                @input="clearError(supplier, 'phone')"
              />
              <span
                class="erp-phone-composer__separator erp-phone-composer__separator--extension"
                aria-hidden="true"
              >-</span>
              <input
                v-model="supplier.extension"
                class="erp-input erp-phone-composer__extension"
                :class="{ 'is-error': supplier.errors.extension }"
                type="tel"
                inputmode="numeric"
                maxlength="10"
                aria-label="分機碼"
                placeholder="分機（選填）"
                @input="clearError(supplier, 'extension')"
              />
            </div>

            <span v-if="phoneError(supplier)" class="erp-field__error">
              {{ phoneError(supplier) }}
            </span>
          </div>

          <div class="erp-field erp-supplier-entry__field--email">
            <label class="erp-field__label" :for="`supplier-email-${supplier.localId}`">
              電子信箱 <span class="erp-required">*</span>
            </label>
            <input
              :id="`supplier-email-${supplier.localId}`"
              v-model="supplier.email"
              class="erp-input"
              :class="{ 'is-error': supplier.errors.email }"
              type="email"
              autocomplete="email"
              placeholder="name@company.com"
              @input="clearError(supplier, 'email')"
            />
            <span v-if="supplier.errors.email" class="erp-field__error">
              {{ supplier.errors.email }}
            </span>
          </div>

          <div class="erp-field erp-supplier-entry__field--status">
            <label class="erp-field__label" :for="`supplier-status-${supplier.localId}`">
              供應商狀態 <span class="erp-required">*</span>
            </label>
            <select
              :id="`supplier-status-${supplier.localId}`"
              v-model="supplier.status"
              class="erp-select"
              :class="{ 'is-error': supplier.errors.status }"
              @change="clearError(supplier, 'status')"
            >
              <option
                v-for="option in statusOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <span v-if="supplier.errors.status" class="erp-field__error">
              {{ supplier.errors.status }}
            </span>
          </div>

          <div class="erp-field erp-supplier-entry__field--address">
            <label class="erp-field__label" :for="`supplier-address-${supplier.localId}`">
              地址 <span class="erp-required">*</span>
            </label>
            <input
              :id="`supplier-address-${supplier.localId}`"
              v-model="supplier.address"
              class="erp-input"
              :class="{ 'is-error': supplier.errors.address }"
              type="text"
              maxlength="200"
              autocomplete="street-address"
              placeholder="輸入完整地址"
              @input="clearError(supplier, 'address')"
            />
            <span v-if="supplier.errors.address" class="erp-field__error">
              {{ supplier.errors.address }}
            </span>
          </div>
        </div>

        <div
          v-show="supplier.expanded"
          :id="`supplier-note-${supplier.localId}`"
          class="erp-supplier-entry__note"
        >
          <div class="erp-field">
            <label class="erp-field__label" :for="`supplier-note-input-${supplier.localId}`">
              備註（選填）
            </label>
            <textarea
              :id="`supplier-note-input-${supplier.localId}`"
              v-model="supplier.supplierNotes.content"
              class="erp-textarea"
              rows="3"
              placeholder="輸入合作條件、聯絡偏好或其他備註"
            ></textarea>
          </div>
        </div>
      </article>

      <button
        class="erp-add-supplier__append"
        type="button"
        @click="addSupplier"
      >
        <span class="erp-add-supplier__append-icon" aria-hidden="true">＋</span>
        新增另一筆供應商
      </button>
    </form>
  </section>
</template>

<script setup>
import axios from 'axios'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  initialCount: {
    type: Number,
    default: 3,
    validator: function (value) {
      return Number.isInteger(value) && value > 0
    }
  },
  loginUserId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits({
  saved: function (responseData) {
    return responseData !== undefined
  }
})

const rawApiBaseUrl = import.meta.env.VITE_AXIOS_HTTP_BASEURL || ''
const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '')

const statusOptions = [
  { value: 'PENDING', label: '待審核' },
  { value: 'ACTIVE', label: '啟用' },
  { value: 'INACTIVE', label: '停用' },
  { value: 'SUSPENDED', label: '暫停合作' },
  { value: 'BLACKLISTED', label: '黑名單' }
]

const pageRoot = ref(null)
const selectAllInput = ref(null)
const suppliers = ref([])
const formMessage = ref('')
const apiError = ref('')
const successMessage = ref('')
const isSaving = ref(false)
const draggedLocalId = ref(null)
let nextLocalId = 1

function createEmptySupplier(selected, expanded) {
  return {
    localId: nextLocalId++,
    selected: selected,
    expanded: expanded,
    invalid: false,
    errors: {},
    name: '',
    callingCode: '+886',
    phone: '',
    extension: '',
    address: '',
    email: '',
    status: 'PENDING',
    supplierNotes: {
      content: ''
    }
  }
}

function initializeSuppliers() {
  for (let index = 0; index < props.initialCount; index += 1) {
    suppliers.value.push(createEmptySupplier(index === 0, index === 0))
  }
}

initializeSuppliers()

const selectedCount = computed(function () {
  let count = 0

  for (const supplier of suppliers.value) {
    if (supplier.selected) {
      count += 1
    }
  }

  return count
})

const allSelected = computed({
  get: function () {
    return suppliers.value.length > 0 && selectedCount.value === suppliers.value.length
  },
  set: function (checked) {
    for (const supplier of suppliers.value) {
      supplier.selected = checked
    }
  }
})

const canSave = computed(function () {
  return selectedCount.value > 0 && !isSaving.value
})

function updateSelectAllState() {
  if (selectAllInput.value) {
    selectAllInput.value.indeterminate =
      selectedCount.value > 0 && selectedCount.value < suppliers.value.length
  }
}

watch(selectedCount, updateSelectAllState)
watch(
  function () {
    return suppliers.value.length
  },
  updateSelectAllState
)
onMounted(updateSelectAllState)

function phoneError(supplier) {
  return (
    supplier.errors.callingCode ||
    supplier.errors.phone ||
    supplier.errors.extension ||
    ''
  )
}

function clearError(supplier, fieldName) {
  if (supplier.errors[fieldName]) {
    delete supplier.errors[fieldName]
  }

  supplier.invalid = Object.keys(supplier.errors).length > 0

  if (formMessage.value) {
    formMessage.value = ''
  }

  apiError.value = ''
  successMessage.value = ''
}

function validateSupplier(supplier) {
  const errors = {}
  const name = supplier.name.trim()
  const callingCode = supplier.callingCode.trim()
  const phone = supplier.phone.trim()
  const extension = supplier.extension.trim()
  const address = supplier.address.trim()
  const email = supplier.email.trim()

  if (!name) {
    errors.name = '供應商名稱不可為空'
  } else if (name.length > 50) {
    errors.name = '供應商名稱不可超過 50 個字'
  }

  if (!/^\+[1-9][0-9]{0,2}$/.test(callingCode)) {
    errors.callingCode = '國際碼格式錯誤，例如：+886、+81、+1'
  }

  if (!/^[0-9]{6,15}$/.test(phone)) {
    errors.phone = '電話只能包含數字，長度需為 6～15 碼'
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
  }

  if (!supplier.status) {
    errors.status = '請選擇供應商狀態'
  }

  supplier.errors = errors
  supplier.invalid = Object.keys(errors).length > 0

  return !supplier.invalid
}

function toCreatePayload(supplier) {
  const noteContent = supplier.supplierNotes.content.trim()

  return {
    name: supplier.name.trim(),
    callingCode: supplier.callingCode.trim(),
    phone: supplier.phone.trim(),
    extension: supplier.extension.trim() || null,
    address: supplier.address.trim(),
    email: supplier.email.trim(),
    status: supplier.status,
    supplierNotes: noteContent
      ? {
          content: noteContent
        }
      : null
  }
}

async function saveSelectedSuppliers() {
  formMessage.value = ''
  apiError.value = ''
  successMessage.value = ''

  if (
    props.loginUserId === null ||
    props.loginUserId === undefined ||
    props.loginUserId === ''
  ) {
    formMessage.value = '缺少 loginUserId，無法送出新增資料'
    return
  }

  if (selectedCount.value === 0) {
    formMessage.value = '請至少勾選一筆要儲存的供應商'
    return
  }

  const selectedSuppliers = []
  let allValid = true

  for (const supplier of suppliers.value) {
    if (!supplier.selected) {
      continue
    }

    if (!validateSupplier(supplier)) {
      allValid = false
    }

    selectedSuppliers.push(supplier)
  }

  if (!allValid) {
    formMessage.value = '部分欄位尚未填寫正確，請檢查紅色提示'
    await nextTick()

    if (pageRoot.value) {
      const firstInvalidCard = pageRoot.value.querySelector('.erp-supplier-entry.is-invalid')

      if (firstInvalidCard) {
        firstInvalidCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    return
  }

  const payload = []

  for (const supplier of selectedSuppliers) {
    payload.push(toCreatePayload(supplier))
  }

  isSaving.value = true

  try {
    const requestConfig = {
      params: {
        loginUserId: props.loginUserId
      }
    }

    let response

    // 只選一筆時，Body 要送 SupplierCreDTO 物件。
    if (payload.length === 1) {
      response = await axios.post(
        `${apiBaseUrl}/api/Supplier/add`,
        payload[0],
        requestConfig
      )
    } else {
      // 選兩筆以上時，Body 要送 List<SupplierCreDTO> 陣列。
      response = await axios.post(
        `${apiBaseUrl}/api/Suppliers/addAll`,
        payload,
        requestConfig
      )
    }

    // 單筆 API 回傳一個物件，多筆 API 回傳陣列；統一整理成陣列再交給父元件。
    const savedSuppliers = Array.isArray(response.data)
      ? response.data
      : [response.data]
    const savedCount = savedSuppliers.length

    // 清空輸入欄位，但不切換 activeTab，所以會繼續留在新增頁。
    resetSupplierRows()
    successMessage.value = `已成功新增 ${savedCount} 筆供應商`
    emit('saved', savedSuppliers)
  } catch (error) {
    console.error('新增供應商失敗：', error)
    apiError.value = '新增錯誤'
  } finally {
    isSaving.value = false
  }
}

function addSupplier() {
  suppliers.value.push(createEmptySupplier(true, true))
  formMessage.value = ''
  apiError.value = ''
  successMessage.value = ''
}

function removeSupplier(localId) {
  const index = suppliers.value.findIndex(function (supplier) {
    return supplier.localId === localId
  })

  if (index >= 0) {
    suppliers.value.splice(index, 1)
  }
}

function toggleSupplier(supplier) {
  supplier.expanded = !supplier.expanded
}

function startDrag(localId, event) {
  draggedLocalId.value = localId

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(localId))
  }
}

function finishDrag() {
  draggedLocalId.value = null
}

function dropSupplier(targetLocalId) {
  const sourceLocalId = draggedLocalId.value

  if (sourceLocalId === null || sourceLocalId === targetLocalId) {
    finishDrag()
    return
  }

  const sourceIndex = suppliers.value.findIndex(function (supplier) {
    return supplier.localId === sourceLocalId
  })
  const targetIndex = suppliers.value.findIndex(function (supplier) {
    return supplier.localId === targetLocalId
  })

  if (sourceIndex < 0 || targetIndex < 0) {
    finishDrag()
    return
  }

  const movedSuppliers = suppliers.value.splice(sourceIndex, 1)
  suppliers.value.splice(targetIndex, 0, movedSuppliers[0])
  finishDrag()
}

function resetSupplierRows() {
  suppliers.value = []
  nextLocalId = 1
  initializeSuppliers()
}

function resetForm() {
  resetSupplierRows()
  formMessage.value = ''
  apiError.value = ''
  successMessage.value = ''
}

defineExpose({
  resetForm: resetForm
})
</script>
