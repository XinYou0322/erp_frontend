<template>
  <!-- 【本次新增：POS 商品選擇畫面】
       取代原本左側商品卡區；右側訂單明細仍由 pos.vue 保留。 -->
  <section class="bento-card pos-selection-panel">
    <div class="pos-selection-panel__body">
      <div class="pos-selection-panel__catalog">
        <header class="pos-selection-panel__heading">
          <div>
            <p class="pos-selection-panel__eyebrow">PRODUCT OPTIONS</p>
            <h2 class="pos-selection-panel__title">
              {{ product?.name || '商品客製選項' }}
            </h2>
          </div>
          <span class="pos-selection-panel__count">
            {{ selectedOptionCount }} / {{ customizationGroups.length }}
          </span>
        </header>

        <div
          v-if="product"
          class="pos-selection-panel__groups"
        >
          <section
            v-for="group in customizationGroups"
            :key="group.key"
            class="pos-selection-group"
          >
            <div class="pos-selection-group__header">
              <h3 class="pos-selection-group__title">{{ group.name }}</h3>
              <span class="pos-selection-group__line" aria-hidden="true"></span>
              <span class="pos-selection-group__count">
                {{ group.options.length }}
              </span>
            </div>

            <div class="pos-selection-group__options">
              <button
                v-for="option in group.options"
                :key="option.value"
                type="button"
                class="pos-selection-option"
                :class="{
                  'is-selected': selectedOptions[group.key] === option.value
                }"
                :aria-pressed="selectedOptions[group.key] === option.value"
                @click="selectOption(group.key, option.value)"
              >
                <span class="pos-selection-option__name">
                  {{ option.label }}
                </span>
                <span
                  v-if="option.description"
                  class="pos-selection-option__description"
                >
                  {{ option.description }}
                </span>
              </button>
            </div>
          </section>
        </div>

        <p v-else class="pos-selection-panel__empty">
          目前沒有可設定的商品
        </p>
      </div>

      <aside class="pos-selection-keypad" aria-label="商品數量鍵盤">
        <div class="pos-selection-keypad__summary">
          <p class="pos-selection-keypad__label">目前選擇</p>
          <h3 class="pos-selection-keypad__product">
            {{ product?.name || '請選擇商品' }}
          </h3>
          <p class="pos-selection-keypad__price font-data-mono">
            <template v-if="product">
              NT$ {{ formatPrice(product.sellingPrice) }}
            </template>
            <template v-else>—</template>
          </p>
        </div>

        <label class="pos-selection-keypad__quantity">
          <span>加入數量</span>
          <input
            :value="quantityText"
            type="text"
            inputmode="none"
            readonly
            aria-label="加入數量"
          >
        </label>

        <div class="pos-selection-keypad__keys">
          <button
            v-for="key in keypadKeys"
            :key="key"
            type="button"
            class="pos-selection-keypad__key"
            :class="{
              'pos-selection-keypad__key--utility': key === '清除' || key === '⌫'
            }"
            @click="pressKey(key)"
          >
            {{ key }}
          </button>
        </div>
      </aside>
    </div>

    <footer class="pos-selection-panel__footer">
      <button
        type="button"
        class="pos-selection-panel__button pos-selection-panel__button--secondary"
        @click="emit('back')"
      >
        返回
      </button>
      <button
        type="button"
        class="pos-selection-panel__button pos-selection-panel__button--primary"
        :disabled="!canAdd"
        @click="addSelection"
      >
        新增
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  product: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['back', 'add'])

const quantityText = ref('1')
const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清除', '0', '⌫']

// 【本次修改：POS 商品客製類別】依需求固定為糖度、冰塊及 Size。
// 後端目前沒有客製選項主檔，因此先集中定義於此，日後可直接改接 API。
const customizationGroups = [
  {
    key: 'sugar',
    name: '糖度',
    defaultValue: 'full',
    options: [
      { value: 'full', label: '全糖' },
      { value: 'less', label: '少糖' },
      { value: 'half', label: '半糖' },
      { value: 'light', label: '微糖' },
      { value: 'none', label: '無糖' }
    ]
  },
  {
    key: 'ice',
    name: '冰塊',
    defaultValue: 'normal',
    options: [
      { value: 'normal', label: '正常冰' },
      { value: 'less', label: '少冰' },
      { value: 'light', label: '微冰' },
      { value: 'none', label: '去冰' },
      { value: 'hot', label: '熱飲' }
    ]
  },
  {
    key: 'size',
    name: 'Size',
    defaultValue: 'medium',
    options: [
      { value: 'medium', label: '中杯', detailLabel: '中' },
      { value: 'large', label: '大杯', detailLabel: '大' }
    ]
  }
]

const selectedOptions = ref(createDefaultOptions())

const quantity = computed(() => Number(quantityText.value) || 0)
const selectedOptionCount = computed(() => {
  return customizationGroups.filter((group) => selectedOptions.value[group.key]).length
})
const canAdd = computed(() => {
  return props.product &&
    quantity.value > 0 &&
    selectedOptionCount.value === customizationGroups.length
})

// 每次由商品卡開啟時，重設客製選項及數量。
watch(
  () => props.product?.id,
  () => {
    selectedOptions.value = createDefaultOptions()
    quantityText.value = '1'
  },
  { immediate: true }
)

function createDefaultOptions() {
  return Object.fromEntries(
    customizationGroups.map((group) => [group.key, group.defaultValue])
  )
}

function selectOption(groupKey, optionValue) {
  selectedOptions.value[groupKey] = optionValue
}

function pressKey(key) {
  if (key === '清除') {
    quantityText.value = '0'
    return
  }

  if (key === '⌫') {
    quantityText.value = quantityText.value.length > 1
      ? quantityText.value.slice(0, -1)
      : '0'
    return
  }

  const nextValue = quantityText.value === '0'
    ? key
    : `${quantityText.value}${key}`

  // POS 單次輸入上限為三位數，避免誤觸造成異常大數量。
  quantityText.value = nextValue.slice(0, 3)
}

function addSelection() {
  if (!canAdd.value) return

  // 【本次新增：POS 客製細項】將目前三個選項整理成右側明細的小字內容。
  const optionLabels = customizationGroups.map((group) => {
    const selectedValue = selectedOptions.value[group.key]
    const selectedOption = group.options.find((option) => {
      return option.value === selectedValue
    })

    return selectedOption?.detailLabel || selectedOption?.label || ''
  })

  emit('add', {
    product: props.product,
    quantity: quantity.value,
    options: { ...selectedOptions.value },
    optionText: optionLabels.filter(Boolean).join('、')
  })
}

function formatPrice(value) {
  const numberValue = Number(value)

  if (Number.isNaN(numberValue)) {
    return value || 0
  }

  return numberValue.toLocaleString('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}
</script>
