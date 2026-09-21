<template>
  <section class="bento-card pos-product-card">
    <!-- 商品名稱 -->
    <div class="pos-product-card__header">
      <h2 class="pos-product-card__title">
        {{ name }}
      </h2>
    </div>

    <!-- 商品圖片 -->
    <div class="pos-product-card__image">
      <img
        v-if="image"
        :src="image"
        :alt="name"
      >
      <span
        v-else
        class="pos-product-card__image-placeholder"
      >
        圖片
      </span>
    </div>
    <!-- 商品價格 -->
    <p class="pos-product-card__price">
      價格：
      <span class="font-data-mono">
        NT$ {{ formatPrice(price) }}
      </span>
    </p>

    <!-- 數量操作 -->
    <div class="pos-product-card__quantity">
      <button
        type="button"
        class="pos-qty-btn"
        @click="emit('increase')"
      >
        +
      </button>

      <span class="pos-product-card__quantity-label">
        數量{{ quantity }}
      </span>

      <button
        type="button"
        class="pos-qty-btn pos-qty-btn--secondary"
        @click="emit('decrease')"
      >
        −
      </button>
    </div>
  </section>
</template>
<script setup>
defineProps({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  price: {
    type: [Number, String],
    default: 0
  },
  quantity: {
    type: Number,
    default: 0
  }
})

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
const emit = defineEmits(['increase', 'decrease'])
</script>

