<template>
  <section ref="pageRoot" class="w-full min-h-full p-6 text-[var(--on-surface)]">
    <header class="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-[var(--on-surface)]">
          新增供應商
        </h1>
        <p class="mt-1 text-sm text-[var(--on-surface-variant)]">
          可一次新增多筆供應商，勾選要儲存的資料並拖曳調整順序。
        </p>
      </div>

      <button
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--on-primary)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        form="add-supplier-form"
        :disabled="!canSave"
      >
        <svg class="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 4h12l2 2v14H5zM8 4v6h8V4M8 20v-6h8v6" />
        </svg>
        {{ isSaving ? '儲存中…' : `儲存已選 ${selectedCount} 筆` }}
      </button>
    </header>

    <div class="mb-5 flex items-center gap-4 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3">
      <label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--on-surface)]">
        <input
          ref="selectAllInput"
          v-model="allSelected"
          class="h-4 w-4 accent-[var(--primary)]"
          type="checkbox"
        />
        <span>全選</span>
      </label>

      <span class="h-5 w-px bg-[var(--outline)]" aria-hidden="true"></span>

      <p class="text-sm text-[var(--on-surface-variant)]" aria-live="polite">
        已選 <strong class="text-[var(--primary)]">{{ selectedCount }}</strong> / {{ suppliers.length }}
      </p>
    </div>

    <p
      v-if="formMessage || apiError || successMessage"
      class="mb-5 rounded-xl border px-4 py-3 text-sm"
      :class="
        successMessage && !formMessage && !apiError
          ? 'border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]'
          : 'border-[var(--error)]/40 bg-[var(--error)]/10 text-[var(--error)]'
      "
      role="alert"
    >
      {{ apiError || formMessage || successMessage }}
    </p>

    <form
      id="add-supplier-form"
      class="space-y-4"
      novalidate
      @submit.prevent="saveSelectedSuppliers"
    >
      <article
        v-for="(supplier, index) in suppliers"
        :key="supplier.localId"
        class="supplier-entry rounded-2xl border bg-[var(--surface-container)] p-5 shadow-level-1 transition"
        :class="{
          'border-[var(--primary)]/60': supplier.selected && !supplier.invalid,
          'border-[var(--outline)]': !supplier.selected && !supplier.invalid,
          'is-invalid border-[var(--error)]': supplier.invalid,
          'opacity-60': draggedLocalId === supplier.localId
        }"
        @dragover.prevent
        @drop="dropSupplier(supplier.localId)"
      >
        <div class="mb-5 flex items-center justify-between gap-4 border-b border-[var(--outline-variant)] pb-4">
          <label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--on-surface)]">
            <input
              v-model="supplier.selected"
              class="h-4 w-4 accent-[var(--primary)]"
              type="checkbox"
              :aria-label="`選取第 ${index + 1} 筆供應商`"
            />
            <span>選取此筆</span>
          </label>

          <div class="flex items-center gap-1">
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--on-surface-variant)] transition hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]"
              type="button"
              :aria-expanded="supplier.expanded"
              :aria-controls="`supplier-note-${supplier.localId}`"
              :title="supplier.expanded ? '收合備註' : '展開備註'"
              @click="toggleSupplier(supplier)"
            >
              <svg
                class="h-5 w-5 fill-none stroke-current stroke-2 transition-transform"
                :class="{ 'rotate-180': supplier.expanded }"
                aria-hidden="true"
                viewBox="0 0 24 24"
              >
                <path d="m7 10 5 5 5-5" />
              </svg>
              <span class="sr-only">
                {{ supplier.expanded ? '收合備註' : '展開備註' }}
              </span>
            </button>

            <span
              class="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-lg text-[var(--on-surface-variant)] transition hover:bg-[var(--surface-container-high)] hover:text-[var(--secondary)] active:cursor-grabbing"
              draggable="true"
              role="button"
              tabindex="0"
              title="拖曳調整順序"
              :aria-label="`拖曳第 ${index + 1} 筆供應商以調整順序`"
              @dragstart="startDrag(supplier.localId, $event)"
              @dragend="finishDrag"
            >
              <svg class="h-5 w-5 fill-current" aria-hidden="true" viewBox="0 0 24 24">
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
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--on-surface-variant)] transition hover:bg-[var(--error)]/10 hover:text-[var(--error)]"
              type="button"
              title="移除此筆"
              :aria-label="`移除第 ${index + 1} 筆供應商`"
              @click="removeSupplier(supplier.localId)"
            >
              <svg class="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
              </svg>
              <span class="sr-only">移除此筆</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          <div class="xl:col-span-3">
            <label class="mb-1.5 block text-sm font-medium text-[var(--on-surface)]" :for="`supplier-name-${supplier.localId}`">
              供應商名稱 <span class="text-[var(--error)]">*</span>
            </label>
            <input
              :id="`supplier-name-${supplier.localId}`"
              v-model="supplier.name"
              class="w-full rounded-xl border bg-[var(--surface-container-low)] px-3 py-2.5 text-sm text-[var(--on-surface)] outline-none transition placeholder:text-[var(--on-surface-variant)]/60 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              :class="supplier.errors.name ? 'border-[var(--error)]' : 'border-[var(--outline)]'"
              type="text"
              maxlength="50"
              autocomplete="organization"
              placeholder="輸入供應商名稱"
              @input="clearError(supplier, 'name')"
            />
            <span v-if="supplier.errors.name" class="mt-1 block text-xs text-[var(--error)]">
              {{ supplier.errors.name }}
            </span>
          </div>

          <div class="md:col-span-2 xl:col-span-4">
            <label class="mb-1.5 block text-sm font-medium text-[var(--on-surface)]" :for="`supplier-phone-${supplier.localId}`">
              聯絡電話 <span class="text-[var(--error)]">*</span>
            </label>

            <div class="flex items-center gap-2">
              <input
                v-model="supplier.callingCode"
                class="w-20 rounded-xl border bg-[var(--surface-container-low)] px-3 py-2.5 text-sm text-[var(--on-surface)] outline-none transition placeholder:text-[var(--on-surface-variant)]/60 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                :class="supplier.errors.callingCode ? 'border-[var(--error)]' : 'border-[var(--outline)]'"
                type="tel"
                inputmode="tel"
                maxlength="4"
                aria-label="國際碼"
                placeholder="+886"
                @input="clearError(supplier, 'callingCode')"
              />
              <span class="text-[var(--on-surface-variant)]" aria-hidden="true">-</span>
              <input
                :id="`supplier-phone-${supplier.localId}`"
                v-model="supplier.phone"
                class="min-w-0 flex-1 rounded-xl border bg-[var(--surface-container-low)] px-3 py-2.5 text-sm text-[var(--on-surface)] outline-none transition placeholder:text-[var(--on-surface-variant)]/60 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                :class="supplier.errors.phone ? 'border-[var(--error)]' : 'border-[var(--outline)]'"
                type="tel"
                inputmode="numeric"
                maxlength="15"
                aria-label="電話號碼"
                placeholder="例如 223456789"
                @input="clearError(supplier, 'phone')"
              />
              <span class="text-[var(--on-surface-variant)]" aria-hidden="true">-</span>
              <input
                v-model="supplier.extension"
                class="w-28 rounded-xl border bg-[var(--surface-container-low)] px-3 py-2.5 text-sm text-[var(--on-surface)] outline-none transition placeholder:text-[var(--on-surface-variant)]/60 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                :class="supplier.errors.extension ? 'border-[var(--error)]' : 'border-[var(--outline)]'"
                type="tel"
                inputmode="numeric"
                maxlength="10"
                aria-label="分機碼"
                placeholder="分機"
                @input="clearError(supplier, 'extension')"
              />
            </div>

            <span v-if="phoneError(supplier)" class="mt-1 block text-xs text-[var(--error)]">
              {{ phoneError(supplier) }}
            </span>
          </div>

          <div class="xl:col-span-3">
            <label class="mb-1.5 block text-sm font-medium text-[var(--on-surface)]" :for="`supplier-email-${supplier.localId}`">
              電子信箱 <span class="text-[var(--error)]">*</span>
            </label>
            <input
              :id="`supplier-email-${supplier.localId}`"
              v-model="supplier.email"
              class="w-full rounded-xl border bg-[var(--surface-container-low)] px-3 py-2.5 text-sm text-[var(--on-surface)] outline-none transition placeholder:text-[var(--on-surface-variant)]/60 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              :class="supplier.errors.email ? 'border-[var(--error)]' : 'border-[var(--outline)]'"
              type="email"
              autocomplete="email"
              placeholder="name@company.com"
              @input="clearError(supplier, 'email')"
            />
            <span v-if="supplier.errors.email" class="mt-1 block text-xs text-[var(--error)]">
              {{ supplier.errors.email }}
            </span>
          </div>

          <div class="xl:col-span-2">
            <label class="mb-1.5 block text-sm font-medium text-[var(--on-surface)]" :for="`supplier-status-${supplier.localId}`">
              供應商狀態 <span class="text-[var(--error)]">*</span>
            </label>
            <select
              :id="`supplier-status-${supplier.localId}`"
              v-model="supplier.status"
              class="w-full rounded-xl border bg-[var(--surface-container-low)] px-3 py-2.5 text-sm text-[var(--on-surface)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              :class="supplier.errors.status ? 'border-[var(--error)]' : 'border-[var(--outline)]'"
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
            <span v-if="supplier.errors.status" class="mt-1 block text-xs text-[var(--error)]">
              {{ supplier.errors.status }}
            </span>
          </div>

          <div class="md:col-span-2 xl:col-span-12">
            <label class="mb-1.5 block text-sm font-medium text-[var(--on-surface)]" :for="`supplier-address-${supplier.localId}`">
              地址 <span class="text-[var(--error)]">*</span>
            </label>
            <input
              :id="`supplier-address-${supplier.localId}`"
              v-model="supplier.address"
              class="w-full rounded-xl border bg-[var(--surface-container-low)] px-3 py-2.5 text-sm text-[var(--on-surface)] outline-none transition placeholder:text-[var(--on-surface-variant)]/60 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              :class="supplier.errors.address ? 'border-[var(--error)]' : 'border-[var(--outline)]'"
              type="text"
              maxlength="200"
              autocomplete="street-address"
              placeholder="輸入完整地址"
              @input="clearError(supplier, 'address')"
            />
            <span v-if="supplier.errors.address" class="mt-1 block text-xs text-[var(--error)]">
              {{ supplier.errors.address }}
            </span>
          </div>
        </div>

        <div
          v-show="supplier.expanded"
          :id="`supplier-note-${supplier.localId}`"
          class="mt-5 border-t border-[var(--outline-variant)] pt-5"
        >
          <div>
            <label class="mb-1.5 block text-sm font-medium text-[var(--on-surface)]" :for="`supplier-note-input-${supplier.localId}`">
              備註（選填）
            </label>
            <textarea
              :id="`supplier-note-input-${supplier.localId}`"
              v-model="supplier.supplierNotes.remark"
              class="w-full resize-y rounded-xl border border-[var(--outline)] bg-[var(--surface-container-low)] px-3 py-2.5 text-sm text-[var(--on-surface)] outline-none transition placeholder:text-[var(--on-surface-variant)]/60 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              rows="3"
              placeholder="輸入合作條件、聯絡偏好或其他備註"
            ></textarea>
            <span v-if="supplier.errors.remark" class="mt-1 block text-xs text-[var(--error)]">
              {{ supplier.errors.remark }}
            </span>
          </div>
        </div>
      </article>

      <button
        class="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--outline)] bg-[var(--surface-container-low)] px-4 py-4 text-sm font-semibold text-[var(--secondary)] transition hover:border-[var(--secondary)] hover:bg-[var(--surface-container)]"
        type="button"
        @click="addSupplier"
      >
        <span class="text-xl leading-none" aria-hidden="true">＋</span>
        新增另一筆供應商
      </button>
    </form>
  </section>
</template>

<script setup>
import httpClient from '@/service/httpClient'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  //AddSupplier.vue 接收兩個 props：initialCount 
  //type: Number -> 接收 Number
  initialCount: {
    type: Number,
    default: 3,
    validator: function (value) {
      return Number.isInteger(value) && value > 0
    }
  },
  //和 loginUserId
  //type: [Number, String], -> Number/String都可
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
      remark: ''
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
  const remark = supplier.supplierNotes.remark.trim()


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

  if (remark.length > 200) {
    errors.remark = '備註不可超過 200 個字'
  }
  supplier.errors = errors
  supplier.invalid = Object.keys(errors).length > 0

  return !supplier.invalid
}

function toCreatePayload(supplier) {

  const noteRemark = supplier.supplierNotes.remark.trim()

  return {
    name: supplier.name.trim(),
    callingCode: supplier.callingCode.trim(),
    phone: supplier.phone.trim(),
    extension: supplier.extension.trim() || null,
    address: supplier.address.trim(),
    email: supplier.email.trim(),
    status: supplier.status,
    supplierNotes: noteRemark
      ? {
          remark: noteRemark
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
      const firstInvalidCard = pageRoot.value.querySelector('.supplier-entry.is-invalid')

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
      response = await httpClient.post(
        '/api/Supplier/add',
        payload[0],
        requestConfig
      )
    } else {
      // 選兩筆以上時，Body 要送 List<SupplierCreDTO> 陣列。
      response = await httpClient.post(
        '/api/Suppliers/addAll',
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
    console.error("後端錯誤內容：", error.response?.data)
    console.error("HTTP 狀態碼：", error.response?.status)
    // console.error("送出的資料：", supplierData)
    apiError.value =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      (typeof error.response?.data === 'string' ? error.response.data : '') ||
      '新增供應商失敗，請稍後再試'
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
