<template>
  <aside class="bento-card pos-detail">
    <div class="pos-detail__header">
      <div>
        <p class="pos-detail__eyebrow">ORDER DETAIL</p>
        <h2 class="pos-detail__title">明細</h2>
      </div>

      <span class="pos-detail__count font-data-mono">
        {{ totalQuantity }}
      </span>
    </div>

    <div class="pos-detail__body">
      <div 
        v-if="items.length === 0"
        class="pos-detail__empty">
        尚未選擇商品
      </div>
    <ul
        v-else
        class="pos-detail__list"
      >
        <li
          v-for="item in items"
          :key="item.id"
          class="pos-detail__item"
        >
          <span class="pos-detail__item-name">
            {{ item.name }}
          </span>
          <div class="pos-detail__quantity-controls">
            <button
              type="button"
              class="pos-detail__qty-btn"
              aria-label="增加商品數量"
              @click="increaseItem(item)"
            >
              +
            </button>

            <span class="pos-detail__item-quantity font-data-mono">
              {{ item.quantity }}
            </span>

            <button
              type="button"
              class="pos-detail__qty-btn pos-detail__qty-btn--secondary"
              aria-label="減少商品數量"
              @click="decreaseItem(item)"
            >
              −
            </button>
          </div>

        <span class="pos-detail__item-subtotal font-data-mono">
            NT$ {{ formatMoney(itemSubtotal(item)) }}
        </span>

        </li>
      </ul>
    </div>
    <div class="pos-detail__footer">
      <div class="pos-detail__summary">
        <span class="pos-detail__summary-label">
          總額
        </span>

        <strong class="pos-detail__summary-total font-data-mono">
          NT$ {{ formatMoney(totalAmount) }}
        </strong>
      </div>  
      <button
        type="button"
        class="pos-checkout-btn"
        :disabled="items.length === 0"
        @click="checkout"
      >
        結帳
      </button>
    </div>
  </aside>
</template>
<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
//明細數量相加
const totalQuantity = computed(() => {
  return props.items.reduce((total, item) => {
    return total + Number(item.quantity || 0)
  }, 0)
})
//整張訂單總額
const totalAmount = computed(() => {
  return props.items.reduce((total, item) => {
    return total + itemSubtotal(item)
  }, 0)
})
//計算單項商品小計
function itemSubtotal(item) {
  return Number(item.price || 0) * Number(item.quantity || 0)
}

//統一售價、小計與總額的顯示格式
function formatMoney(value) {
  const numberValue = Number(value)

  if (Number.isNaN(numberValue)) {
    return 0
  }

  return numberValue.toLocaleString('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

const emit = defineEmits(['increase', 'decrease', 'checkout'])

function increaseItem(item) {
  emit('increase', item)
}

function decreaseItem(item) {
  emit('decrease', item)
}


function checkout() {
  emit('checkout', props.items)
}
</script>
<style >
</style>