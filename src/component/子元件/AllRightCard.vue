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
      <div class="pos-detail__checkout-meta">
        <div
          class="pos-detail__payment-methods"
          role="radiogroup"
          aria-label="付款方式"
        >
          <button
            type="button"
            class="pos-detail__payment-btn"
            :class="{
              'is-active': paymentMethod === 'CASH'
            }"
            role="radio"
            :aria-checked="paymentMethod === 'CASH'"
            aria-label="現金"
            @click="changePaymentMethod('CASH')"
          >
            <span
              class="material-symbols-outlined pos-detail__payment-icon"
              aria-hidden="true"
            >
              payments
            </span>
          </button>

          <button
            type="button"
            class="pos-detail__payment-btn"
            :class="{
              'is-active': paymentMethod === 'CREDIT_CARD'
            }"
            role="radio"
            :aria-checked="paymentMethod === 'CREDIT_CARD'"
            aria-label="信用卡"
            data-tooltip="信用卡"
            @click="changePaymentMethod('CREDIT_CARD')"
          >
            <span
              class="material-symbols-outlined pos-detail__payment-icon"
              aria-hidden="true"
            >
              credit_card
            </span>
          </button>

          <button
            type="button"
            class="pos-detail__payment-btn"
            :class="{
              'is-active': paymentMethod === 'MOBILE_PAYMENT'
            }"
            role="radio"
            :aria-checked="paymentMethod === 'MOBILE_PAYMENT'"
            aria-label="行動支付"
            data-tooltip="行動支付"
            @click="changePaymentMethod('MOBILE_PAYMENT')"
          >
            <span
              class="material-symbols-outlined pos-detail__payment-icon"
              aria-hidden="true"
            >
              qr_code_2
            </span>
          </button>
        </div>
      <div class="pos-detail__summary">
        <span class="pos-detail__summary-label">
          總額
        </span>

        <strong class="pos-detail__summary-total font-data-mono">
          NT$ {{ formatMoney(totalAmount) }}
        </strong>
      </div>
    </div>
      <!-- 顯示建立銷售單 API 的成功或錯誤結果 -->      
      <p
        v-if="checkoutError"
        class="pos-detail__checkout-message pos-detail__checkout-message--error"
        aria-live="polite"
      >
        {{ checkoutError }}
      </p>

      <p
        v-else-if="checkoutMessage"
        class="pos-detail__checkout-message"
        aria-live="polite"
      >
        {{ checkoutMessage }}
      </p>
      
      <button
        type="button"
        class="pos-checkout-btn"
        :disabled="items.length === 0 ||  !paymentMethod || checkingOut"
        @click="checkout"
      >
        {{ checkingOut ? '結帳中...' : '結帳' }}
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
  },
  //由 pos.vue 管理並送給銷售單 API 的付款方式
  paymentMethod: {
    type: String,
    default: ''
  },
  //防止 API 尚未回應時重複送出
  checkingOut: {
    type: Boolean,
    default: false
  },
  checkoutMessage: {
    type: String,
    default: ''
  },
  checkoutError: {
    type: String,
    default: ''
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

const emit = defineEmits([
  'increase',
  'decrease',
  'checkout',
  'update:paymentMethod'
])
function increaseItem(item) {
  emit('increase', item)
}

function decreaseItem(item) {
  emit('decrease', item)
}
function changePaymentMethod(method) {
  emit('update:paymentMethod', method)
}

function checkout() {
  // 避免沒有商品、沒有付款方式或重複點擊時送出事件。
  if (
    props.items.length === 0 ||
    !props.paymentMethod ||
    props.checkingOut
  ) {
    return
  }

  emit('checkout', props.items)
}
</script>
<style scoped>
/* 【我新增】讓提示文字以付款按鈕為定位基準。 */
.pos-detail__payment-btn {
  position: relative;
  overflow: visible;
}

/* 【我新增】停用全域 data-tooltip 的偽元素，避免出現重複提示框。 */
.pos-detail__payment-btn::after {
  display: none;
}

/* 【我新增】付款方式提示文字預設隱藏。 */
.pos-detail__payment-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  z-index: 30;
  padding: 6px 8px;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #f8fafc;
  background: #334155;
  box-shadow: 0 8px 18px -8px rgba(0, 0, 0, 0.8);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translate(-50%, 4px);
  transition: opacity 0.16s ease, visibility 0.16s ease,
    transform 0.16s ease;
}

/* 【我新增】滑鼠移入或鍵盤聚焦時顯示提示文字。 */
.pos-detail__payment-btn:hover .pos-detail__payment-tooltip,
.pos-detail__payment-btn:focus-visible .pos-detail__payment-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
}
</style>