<template>
  <div class="purchase-order-edit">
    <section class="purchase-order-detail__section">
      <h2 class="purchase-order-detail__section-title">基本資料</h2>

      <div class="purchase-order-edit__info-grid">
        <label class="purchase-order-edit__field">
          <span>供應商 <b aria-hidden="true">*</b></span>
          <select
            v-model="form.supplierId"
            class="purchase-order-edit__control"
            :disabled="optionsLoading || saving"
            @change="handleSupplierChange"
          >
            <option value="">請選擇供應商</option>
            <option
              v-for="supplier in supplierOptions"
              :key="supplier.id"
              :value="String(supplier.id)"
            >{{ supplier.name }}</option>
          </select>
        </label>

        <label class="purchase-order-edit__field">
          <span>總金額</span>
          <input
            :value="formatCurrency(total)"
            class="purchase-order-edit__control"
            type="text"
            readonly
          >
        </label>

        <label class="purchase-order-edit__field">
          <span>建立人</span>
          <input
            :value="getUserDisplay(purchaseOrder.createdByName, purchaseOrder.createdByUserId)"
            class="purchase-order-edit__control"
            type="text"
            readonly
          >
        </label>

        <label class="purchase-order-edit__field">
          <span>簽核人</span>
          <input
            :value="getUserDisplay(purchaseOrder.approvedByName, purchaseOrder.approvedByUserId)"
            class="purchase-order-edit__control"
            type="text"
            readonly
          >
        </label>

        <label class="purchase-order-edit__field">
          <span>建立時間</span>
          <input
            :value="formatDate(purchaseOrder.createdAt)"
            class="purchase-order-edit__control"
            type="text"
            readonly
          >
        </label>

        <label class="purchase-order-edit__field">
          <span>更新時間</span>
          <input
            :value="formatDate(purchaseOrder.updatedAt)"
            class="purchase-order-edit__control"
            type="text"
            readonly
          >
        </label>

        <label class="purchase-order-edit__field">
          <span>預計到貨日 <b aria-hidden="true">*</b></span>
          <input
            v-model="form.expectedDeliveryDate"
            class="purchase-order-edit__control"
            type="date"
            :min="today"
            :disabled="saving"
          >
        </label>

        <label class="purchase-order-edit__field">
          <span>實際收貨時間</span>
          <input
            :value="formatDate(purchaseOrder.receivedAt)"
            class="purchase-order-edit__control"
            type="text"
            readonly
          >
        </label>

        <label class="purchase-order-edit__field">
          <span>收貨人</span>
          <input
            :value="getUserDisplay(purchaseOrder.receivedByName, purchaseOrder.receivedByUserId)"
            class="purchase-order-edit__control"
            type="text"
            readonly
          >
        </label>

        <div class="purchase-order-edit__field">
          <span>收貨憑證</span>
          <div class="purchase-order-edit__control purchase-order-edit__readonly">
            <a
              v-if="purchaseOrder.receiptUrl"
              class="purchase-order-detail__link"
              :href="purchaseOrder.receiptUrl"
              target="_blank"
              rel="noopener noreferrer"
            >查看憑證</a>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </section>

    <section class="purchase-order-detail__section">
      <div class="purchase-order-detail__section-heading">
        <h2 class="purchase-order-detail__section-title">採購明細</h2>
        <span class="purchase-order-detail__count">{{ form.items.length }} 項</span>
      </div>

      <div class="purchase-order-detail__table-wrap">
        <table class="purchase-order-detail__table purchase-order-edit__table">
          <thead>
            <tr>
              <th>原物料</th>
              <th>數量</th>
              <th>單價</th>
              <th>小計</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in form.items" :key="item.localKey">
              <td>
                <select
                  v-model="item.materialId"
                  class="purchase-order-edit__control"
                  :disabled="optionsLoading || saving"
                  @change="handleMaterialChange(item)"
                >
                  <option value="">請選擇原物料</option>
                  <option
                    v-for="material in materialOptions"
                    :key="material.id"
                    :value="material.id"
                  >{{ material.code }}－{{ material.name }}</option>
                </select>
              </td>
              <td>
                <input
                  v-model="item.quantity"
                  class="purchase-order-edit__control purchase-order-edit__number"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :disabled="saving"
                  @input="sanitizeDecimal(item, 'quantity', $event)"
                >
              </td>
              <td>
                <input
                  v-model="item.price"
                  class="purchase-order-edit__control purchase-order-edit__number"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :disabled="saving"
                  @input="sanitizeDecimal(item, 'price', $event)"
                >
              </td>
              <td>{{ formatCurrency(getSubtotal(item)) }}</td>
              <td>
                <button
                  type="button"
                  class="purchase-order-edit__delete"
                  :disabled="form.items.length === 1 || saving"
                  :aria-label="`刪除第 ${index + 1} 筆明細`"
                  @click="removeItem(index)"
                >×</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        type="button"
        class="purchase-order-edit__add"
        :disabled="saving"
        @click="addItem"
      >＋ 新增原物料</button>
    </section>

    <section class="purchase-order-detail__section purchase-order-detail__section--remark">
      <h2 class="purchase-order-detail__section-title">簽核備註</h2>
      <textarea
        v-model="form.decisionRemark"
        class="purchase-order-edit__textarea"
        maxlength="1000"
        rows="3"
        placeholder="請輸入備註內容…"
        :disabled="saving"
      ></textarea>
      <div class="purchase-order-edit__remark-count">
        {{ form.decisionRemark.length }}/1000
      </div>
    </section>

    <p v-if="errorMessage" class="purchase-order-edit__error">{{ errorMessage }}</p>

    <footer class="purchase-order-detail__actions">
      <button
        type="button"
        class="purchase-order-detail__button purchase-order-detail__button--cancel"
        :disabled="saving"
        @click="emit('cancel')"
      >取消</button>
      <button
        type="button"
        class="purchase-order-detail__button purchase-order-detail__button--edit"
        :disabled="saving || optionsLoading"
        @click="submit"
      >{{ saving ? '儲存中…' : '儲存修改' }}</button>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import httpClient from '@/service/httpClient'

const props = defineProps({
  purchaseOrder: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'cancel'])
const today = new Date().toISOString().slice(0, 10)
const supplierOptions = ref([])
const materialOptions = ref([])
const optionsLoading = ref(false)
const errorMessage = ref('')
const form = ref(createEmptyForm())
let nextItemKey = 1

const total = computed(() => {
  return form.value.items.reduce((sum, item) => sum + getSubtotal(item), 0)
})

watch(
  () => props.purchaseOrder,
  async () => {
    populateForm()
    await loadOptions()
  },
  { immediate: true }
)

function createEmptyForm() {
  return {
    supplierId: '',
    expectedDeliveryDate: '',
    decisionRemark: '',
    items: []
  }
}

function createItem(item = {}) {
  return {
    localKey: `purchase-order-edit-item-${nextItemKey++}`,
    id: item.id ?? null,
    materialId: item.materialId ?? item.material?.id ?? '',
    materialCode: getMaterialCode(item),
    materialName: getMaterialName(item),
    quantity: String(item.quantity ?? ''),
    price: String(item.price ?? item.unitPrice ?? '')
  }
}

function populateForm() {
  const sourceItems = Array.isArray(props.purchaseOrder.items)
    ? props.purchaseOrder.items
    : []

  form.value = {
    supplierId: getOriginalSupplierId(),
    expectedDeliveryDate: String(
      props.purchaseOrder.expectedDeliveryDate ?? ''
    ).slice(0, 10),
    decisionRemark: props.purchaseOrder.decisionRemark ?? '',
    items: sourceItems.map(createItem)
  }

  if (form.value.items.length === 0) form.value.items.push(createItem())
  errorMessage.value = ''
}

async function loadOptions() {
  optionsLoading.value = true
  errorMessage.value = ''
  try {
    const [supplierResponse, materialResponse] = await Promise.all([
      httpClient.get('/api/Supplier/page', {
        params: { status: 'ACTIVE', page: 0, size: 50 }
      }),
      httpClient.get('/api/material/active')
    ])

    supplierOptions.value = Array.isArray(supplierResponse.data?.content)
      ? supplierResponse.data.content
      : []
    materialOptions.value = Array.isArray(materialResponse.data)
      ? materialResponse.data
      : []

    preserveCurrentOptions()
    restoreSupplierIdFromOptions()
  } catch (error) {
    console.error('讀取採購單修改選項失敗：', error)
    errorMessage.value = '供應商或原物料選項讀取失敗，請稍後再試'
  } finally {
    optionsLoading.value = false
  }
}

function preserveCurrentOptions() {
  if (
    props.purchaseOrder.supplierId != null
    && !supplierOptions.value.some(
      option => String(option.id) === String(props.purchaseOrder.supplierId)
    )
  ) {
    supplierOptions.value.push({
      id: props.purchaseOrder.supplierId,
      name: props.purchaseOrder.supplierName
    })
  }

  for (const item of props.purchaseOrder.items ?? []) {
    const materialId = item.materialId ?? item.material?.id
    if (
      materialId != null
      && !materialOptions.value.some(
        option => String(option.id) === String(materialId)
      )
    ) {
      materialOptions.value.push({
        id: materialId,
        code: getMaterialCode(item),
        name: getMaterialName(item),
        purchaseCost: item.price ?? item.unitPrice
      })
    }
  }
}

function getOriginalSupplierId() {
  const supplierId = props.purchaseOrder.supplierId
    ?? props.purchaseOrder.supplier?.id
  return supplierId == null ? '' : String(supplierId)
}

function restoreSupplierIdFromOptions() {
  if (String(form.value.supplierId ?? '').trim()) return

  const originalSupplierId = getOriginalSupplierId()
  if (originalSupplierId) {
    form.value.supplierId = originalSupplierId
    return
  }

  const originalSupplierName = String(props.purchaseOrder.supplierName ?? '').trim()
  const matchedSupplier = supplierOptions.value.find(
    option => String(option.name ?? '').trim() === originalSupplierName
  )
  if (matchedSupplier?.id != null) {
    form.value.supplierId = String(matchedSupplier.id)
  }
}

function getEffectiveSupplierId() {
  const selectedSupplierId = String(form.value.supplierId ?? '').trim()
  return selectedSupplierId || getOriginalSupplierId()
}

function handleSupplierChange() {
  errorMessage.value = ''
}

function addItem() {
  form.value.items.push(createItem())
}

function removeItem(index) {
  if (form.value.items.length > 1) form.value.items.splice(index, 1)
}

function handleMaterialChange(item) {
  const material = materialOptions.value.find(
    option => String(option.id) === String(item.materialId)
  )
  if (!material) return
  item.materialCode = material.code ?? ''
  item.materialName = material.name ?? ''
  if (!(Number(item.price) > 0)) {
    item.price = String(material.purchaseCost ?? material.cost ?? '')
  }
}

function sanitizeDecimal(item, field, event) {
  let value = String(event.target.value ?? '').replace(/[^0-9.]/g, '')
  const dotIndex = value.indexOf('.')
  if (dotIndex >= 0) {
    value = value.slice(0, dotIndex + 1)
      + value.slice(dotIndex + 1).replace(/\./g, '')
  }
  item[field] = value
  event.target.value = value
}

function submit() {
  const validationMessage = validate()
  if (validationMessage) {
    errorMessage.value = validationMessage
    return
  }

  errorMessage.value = ''
  emit('save', {
    id: props.purchaseOrder.id,
    supplierId: Number(getEffectiveSupplierId()),
    expectedDeliveryDate: form.value.expectedDeliveryDate,
    decisionRemark: form.value.decisionRemark.trim() || null,
    items: form.value.items.map(item => ({
      id: item.id ?? null,
      materialId: Number(item.materialId),
      quantity: Number(item.quantity),
      price: Number(item.price)
    }))
  })
}

function validate() {
  if (!getEffectiveSupplierId()) return '請選擇供應商'
  if (!form.value.expectedDeliveryDate) return '請選擇預計到貨日'
  if (form.value.expectedDeliveryDate < today) return '預計到貨日不可早於今天'
  if (form.value.items.length === 0) return '至少需要一筆採購明細'

  const materialIds = new Set()
  for (const item of form.value.items) {
    if (!item.materialId) return '請選擇每一筆明細的原物料'
    if (materialIds.has(String(item.materialId))) {
      return '同一張採購單不可重複選擇原物料'
    }
    materialIds.add(String(item.materialId))
    if (!(Number(item.quantity) > 0)) return '採購數量必須大於 0'
    if (!(Number(item.price) > 0)) return '採購單價必須大於 0'
  }
  return ''
}

function getSubtotal(item) {
  return (Number(item.quantity) || 0) * (Number(item.price) || 0)
}

function getMaterialCode(item) {
  return item.materialCode ?? item.material?.code ?? item.code ?? ''
}

function getMaterialName(item) {
  return item.materialName ?? item.material?.name ?? item.name ?? ''
}

function getUserDisplay(name, userId) {
  return name || (userId != null ? `使用者 #${userId}` : '-')
}

function formatCurrency(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '-'
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

function formatDate(value) {
  if (!value) return '-'
  const dateText = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return dateText.replaceAll('-', '/')
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return dateText
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
