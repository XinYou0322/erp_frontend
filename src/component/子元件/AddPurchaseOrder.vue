<template>
  <section class="w-full min-h-full p-6 text-[var(--on-surface)]">
    <header class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">新增採購單</h1>
        <p class="mt-1 text-sm text-[var(--on-surface-variant)]">
          可一次新增多張採購單，勾選要儲存的資料並填寫採購明細。
        </p>
      </div>
      <button
        type="submit"
        form="add-purchase-order-form"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--on-primary)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canSave"
      >
        <span aria-hidden="true">▣</span>
        {{ isSaving ? '儲存中…' : `儲存已選 ${selectedCount} 筆` }}
      </button>
    </header>

    <div class="mb-5 flex items-center gap-4 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3">
      <label class="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input ref="selectAllInput" v-model="allSelected" class="h-4 w-4 accent-[var(--primary)]" type="checkbox">
        <span>全選</span>
      </label>
      <span class="h-5 w-px bg-[var(--outline)]" aria-hidden="true"></span>
      <p class="text-sm text-[var(--on-surface-variant)]">
        已選 <strong class="text-[var(--primary)]">{{ selectedCount }}</strong> / {{ orders.length }}
      </p>
    </div>

    <p
      v-if="message"
      class="mb-5 rounded-xl border px-4 py-3 text-sm"
      :class="saveSuccessful ? 'border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--error)]/40 bg-[var(--error)]/10 text-[var(--error)]'"
      role="alert"
    >{{ message }}</p>

    <form id="add-purchase-order-form" class="space-y-4" novalidate @submit.prevent="saveSelectedOrders">
      <article
        v-for="(order, orderIndex) in orders"
        :key="order.localId"
        class="rounded-2xl border bg-[var(--surface-container)] p-5 shadow-level-1 transition"
        :class="order.invalid ? 'border-[var(--error)]' : order.selected ? 'border-[var(--primary)]/60' : 'border-[var(--outline)]'"
      >
        <div class="mb-5 flex items-center justify-between gap-4 border-b border-[var(--outline-variant)] pb-4">
          <label class="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input v-model="order.selected" class="h-4 w-4 accent-[var(--primary)]" type="checkbox">
            <span>選取此筆</span>
          </label>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-[var(--on-surface-variant)] transition hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]"
              :title="order.expanded ? '收合採購明細' : '展開採購明細'"
              :aria-label="order.expanded ? '收合採購明細' : '展開採購明細'"
              :aria-expanded="order.expanded"
              @click="order.expanded = !order.expanded"
            >
              <svg
                class="h-5 w-5 fill-none stroke-current stroke-2 transition-transform"
                :class="{ 'rotate-180': order.expanded }"
                aria-hidden="true"
                viewBox="0 0 24 24"
              >
                <path d="m7 10 5 5 5-5" />
              </svg>
            </button>
            <button v-if="orders.length > 1" type="button" title="移除此筆" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--on-surface-variant)] hover:bg-[var(--error)]/10 hover:text-[var(--error)]" @click="removeOrder(order.localId)">✕</button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium">供應商 <span class="text-[var(--error)]">*</span></label>
            <select v-model="order.supplierId" class="w-full rounded-xl border border-[var(--outline)] bg-[var(--surface-container-low)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" @change="clearOrderError(order)">
              <option value="">請選擇合作中的供應商</option>
              <option v-for="supplier in supplierOptions" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium">簽核人 <span class="text-[var(--error)]">*</span></label>
            <select v-model="order.approvedByUserId" class="w-full rounded-xl border border-[var(--outline)] bg-[var(--surface-container-low)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" @change="clearOrderError(order)">
              <option value="">請選擇簽核人</option>
              <option v-for="user in approverOptions" :key="user.id" :value="user.id">{{ user.name || user.username }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium">預計到貨日 <span class="text-[var(--error)]">*</span></label>
            <input
              v-model="order.expectedDeliveryDate"
              :min="today"
              type="date"
              class="w-full cursor-pointer rounded-xl border border-[var(--outline)] bg-[var(--surface-container-low)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              style="color-scheme: dark"
              @click="openDatePicker"
              @input="clearOrderError(order)"
            >
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium">建立方式 <span class="text-[var(--error)]">*</span></label>
            <select
              v-model="order.saveAsDraft"
              class="w-full rounded-xl border border-[var(--outline)] bg-[var(--surface-container-low)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option :value="true">儲存草稿</option>
              <option :value="false">建立後送簽</option>
            </select>
          </div>
        </div>

        <div v-show="order.expanded" class="mt-5 border-t border-[var(--outline-variant)] pt-5">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold">採購明細</h3>
            <strong class="text-sm text-[var(--primary)]">總金額 {{ formatMoney(orderTotal(order)) }}</strong>
          </div>

          <div class="space-y-3">
            <div v-for="(item, itemIndex) in order.items" :key="item.localId" class="grid grid-cols-1 gap-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-3 md:grid-cols-12 md:items-end">
              <div class="md:col-span-5">
                <label class="mb-1 block text-xs text-[var(--on-surface-variant)]">原物料</label>
                <select v-model="item.materialId" class="w-full rounded-lg border border-[var(--outline)] bg-[var(--surface-container)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" @change="materialChanged(item, order)">
                  <option value="">請選擇原物料</option>
                  <option v-for="material in materialOptions" :key="material.id" :value="material.id">{{ material.code }}｜{{ material.name }}</option>
                </select>
              </div>
              <div class="md:col-span-3">
                <label class="mb-1 block text-xs text-[var(--on-surface-variant)]">數量</label>
                <div class="flex overflow-hidden rounded-lg border border-[var(--outline)] bg-[var(--surface-container)] transition focus-within:border-[var(--primary)]">
                  <input
                    v-model="item.quantity"
                    type="text"
                    inputmode="decimal"
                    class="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none"
                    autocomplete="off"
                    @input="handleDecimalInput(item, 'quantity', $event, order)"
                  >
                  <span class="inline-flex min-w-16 items-center justify-center border-l border-[var(--outline-variant)] px-3 text-xs font-medium text-[var(--on-surface-variant)]">
                    {{ materialUnit(item) }}
                  </span>
                </div>
              </div>
              <div class="md:col-span-3">
                <label class="mb-1 block text-xs text-[var(--on-surface-variant)]">單價</label>
                <div class="flex overflow-hidden rounded-lg border border-[var(--outline)] bg-[var(--surface-container)] transition focus-within:border-[var(--primary)]">
                  <input
                    v-model="item.price"
                    type="text"
                    inputmode="decimal"
                    class="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none"
                    autocomplete="off"
                    @input="handleDecimalInput(item, 'price', $event, order)"
                  >
                  <span class="inline-flex min-w-20 items-center justify-center border-l border-[var(--outline-variant)] px-3 text-xs font-medium text-[var(--on-surface-variant)]">
                    {{ priceUnit(item) }}
                  </span>
                </div>
              </div>
              <button type="button" class="h-10 rounded-lg text-[var(--error)] hover:bg-[var(--error)]/10 disabled:opacity-40 md:col-span-1" :disabled="order.items.length === 1" :aria-label="`刪除第 ${itemIndex + 1} 筆明細`" @click="removeItem(order, item.localId)">✕</button>
            </div>
          </div>

          <button type="button" class="mt-3 w-full rounded-xl border border-dashed border-[var(--outline)] px-4 py-2.5 text-sm font-semibold text-[var(--secondary)] hover:border-[var(--secondary)]" @click="addItem(order)">＋ 新增一筆採購明細</button>
          <p v-if="order.error" class="mt-3 text-sm text-[var(--error)]">第 {{ orderIndex + 1 }} 筆：{{ order.error }}</p>
        </div>
      </article>

      <button type="button" class="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--outline)] bg-[var(--surface-container-low)] px-4 py-4 text-sm font-semibold text-[var(--secondary)] hover:border-[var(--secondary)]" @click="addOrder">＋ 新增另一張採購單</button>
    </form>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import httpClient from '@/service/httpClient'

const props = defineProps({
  loginUserId: { type: [Number, String], required: true },
  initialCount: { type: Number, default: 3 }
})
const emit = defineEmits(['saved'])

const orders = ref([])
const supplierOptions = ref([])
const materialOptions = ref([])
const approverOptions = ref([])
const selectAllInput = ref(null)
const isSaving = ref(false)
const message = ref('')
const saveSuccessful = ref(false)
let nextOrderId = 1
let nextItemId = 1
const today = new Date().toISOString().slice(0, 10)

function emptyItem() {
  return { localId: nextItemId++, materialId: '', quantity: 1, price: '' }
}
function emptyOrder(selected = false, expanded = false) {
  return { localId: nextOrderId++, selected, expanded, invalid: false, error: '', supplierId: '', approvedByUserId: '', expectedDeliveryDate: '', saveAsDraft: true, items: [emptyItem()] }
}
for (let index = 0; index < props.initialCount; index += 1) orders.value.push(emptyOrder(index === 0, index === 0))

const selectedCount = computed(() => orders.value.filter(order => order.selected).length)
const canSave = computed(() => selectedCount.value > 0 && !isSaving.value)
const allSelected = computed({
  get: () => orders.value.length > 0 && selectedCount.value === orders.value.length,
  set: checked => orders.value.forEach(order => { order.selected = checked })
})
watch(selectedCount, updateIndeterminate)
watch(() => orders.value.length, updateIndeterminate)

onMounted(async () => {
  updateIndeterminate()
  await Promise.all([loadSuppliers(), loadMaterials(), loadApprovers()])
})

function updateIndeterminate() {
  if (selectAllInput.value) selectAllInput.value.indeterminate = selectedCount.value > 0 && selectedCount.value < orders.value.length
}
function addOrder() { orders.value.push(emptyOrder(false, true)) }
function removeOrder(localId) { orders.value = orders.value.filter(order => order.localId !== localId) }
function addItem(order) { order.items.push(emptyItem()); clearOrderError(order) }
function removeItem(order, localId) { if (order.items.length > 1) order.items = order.items.filter(item => item.localId !== localId); clearOrderError(order) }
function clearOrderError(order) { order.invalid = false; order.error = ''; message.value = ''; saveSuccessful.value = false }
function materialChanged(item, order) {
  const material = materialOptions.value.find(option => String(option.id) === String(item.materialId))
  if (material && (item.price === '' || Number(item.price) <= 0)) item.price = material.purchaseCost ?? material.cost ?? ''
  clearOrderError(order)
}
function selectedMaterial(item) {
  return materialOptions.value.find(option => String(option.id) === String(item.materialId))
}
function materialUnit(item) {
  const material = selectedMaterial(item)
  return material?.purchaseUnit || material?.unit || '—'
}
function priceUnit(item) {
  const unit = materialUnit(item)
  return unit === '—' ? '元' : `元／${unit}`
}
function handleDecimalInput(item, field, event, order) {
  let value = String(event.target.value ?? '').replace(/[^0-9.]/g, '')
  const decimalPoint = value.indexOf('.')
  if (decimalPoint >= 0) {
    value = value.slice(0, decimalPoint + 1) + value.slice(decimalPoint + 1).replace(/\./g, '')
  }
  item[field] = value
  event.target.value = value
  clearOrderError(order)
}
function openDatePicker(event) {
  const input = event.currentTarget
  if (typeof input?.showPicker === 'function') {
    try {
      input.showPicker()
    } catch {
      // 不支援 showPicker 的瀏覽器仍可使用原生日期欄位。
    }
  }
}
function orderTotal(order) { return order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0) }
function formatMoney(value) { return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 2 }).format(value) }

async function loadSuppliers() {
  const response = await httpClient.get('/api/Supplier/page', { params: { status: 'ACTIVE', page: 0, size: 50 } })
  supplierOptions.value = Array.isArray(response.data?.content) ? response.data.content : []
}
async function loadMaterials() {
  const response = await httpClient.get('/api/material/active')
  materialOptions.value = Array.isArray(response.data) ? response.data : []
}
async function loadApprovers() {
  // 【修改】名單由後端依 Session 與 role_level 決定，前端不自行篩選資格。
  const response = await httpClient.get('/api/purchaseOrder/approvers')
  approverOptions.value = Array.isArray(response.data) ? response.data : []
}

function validateOrder(order) {
  let error = ''
  if (!order.supplierId) error = '請選擇供應商'
  else if (!order.approvedByUserId) error = '請選擇簽核人'
  else if (!order.expectedDeliveryDate) error = '請選擇預計到貨日'
  else if (order.expectedDeliveryDate < today) error = '預計到貨日不可早於今天'
  else if (!order.items.length) error = '至少需要一筆採購明細'
  else {
    const materialIds = new Set()
    for (const item of order.items) {
      if (!item.materialId) { error = '請選擇每一筆明細的原物料'; break }
      if (materialIds.has(String(item.materialId))) { error = '同一張採購單不可重複選擇原物料'; break }
      materialIds.add(String(item.materialId))
      if (!(Number(item.quantity) > 0)) { error = '採購數量必須大於 0'; break }
      if (!(Number(item.price) > 0)) { error = '採購單價必須大於 0'; break }
    }
  }
  order.error = error
  order.invalid = Boolean(error)
  if (error) order.expanded = true
  return !error
}

async function saveSelectedOrders() {
  const selected = orders.value.filter(order => order.selected)
  if (!selected.length) { message.value = '請至少選取一張採購單'; return }
  const valid = selected.map(validateOrder).every(Boolean)
  if (!valid) { message.value = '請修正紅框採購單中的必填資料'; return }

  const payload = selected.map(order => ({
    saveAsDraft: order.saveAsDraft,
    supplierId: Number(order.supplierId),
    approvedByUserId: Number(order.approvedByUserId),
    expectedDeliveryDate: order.expectedDeliveryDate,
    items: order.items.map(item => ({ materialId: Number(item.materialId), quantity: Number(item.quantity), price: Number(item.price) }))
  }))

  isSaving.value = true
  message.value = ''
  saveSuccessful.value = false
  try {
    const response = await httpClient.post('/api/purchaseOrder/addAll', payload, { params: { loginUserId: props.loginUserId } })
    saveSuccessful.value = true
    message.value = `已成功新增 ${payload.length} 張採購單`
    emit('saved', response.data)
    orders.value = [emptyOrder(true, true), emptyOrder(false, false), emptyOrder(false, false)]
  } catch (error) {
    message.value = error.response?.data?.message || error.response?.data?.detail || (typeof error.response?.data === 'string' ? error.response.data : '') || '採購單新增失敗'
  } finally {
    isSaving.value = false
  }
}
</script>
