<template>
  <section class="bento-card pos-product-card">
    <!-- 商品名稱 -->
    <div class="pos-product-card__header">
      <h2 class="pos-product-card__title">
        {{ name }}
      </h2>
    </div>

    <div class="pos-product-card__image">
      <!--統一交給 ProductImage 處理空圖片、相對路徑及載入失敗。-->
      <ProductImage
        :src="image"
        :alt="`${name} 商品圖片`"
      />
    </div>
  
    <!-- 商品價格 -->
    <p class="pos-product-card__price">
      價格：
      <span class="font-data-mono">
        NT$ {{ formatPrice(price) }}
      </span>
    </p>

    <!-- 【本次修改：POS 商品選擇畫面】
         點擊「選擇」後通知 pos.vue，以新的選品畫面取代左側商品卡。 -->
    <div class="pos-product-card__quantity">
      <button
        type="button"
        class="pos-product-card__select-button"
        @click="emit('select')"
      >
        選擇
      </button>
    </div>
  </section>
</template>

<script setup>
import ProductImage from './ProductImage.vue'

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
  // 【本次保留：向下相容】pos.vue 目前仍會傳入 quantity，先保留避免成為根元素屬性。
  quantity: {
    type: Number,
    default: 0
  }
})

// 【本次修改：POS 商品選擇畫面】新增 select；舊事件保留供其他引用端相容。
const emit = defineEmits(['select', 'increase', 'decrease'])

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

<style scoped>
/* 【本次新增：選擇按鈕】沿用 POS 主色系，使用完整文字按鈕取代原本三個數量控制項。 */
/* 【本次修改：縮小選擇按鈕】縮小最小寬度及左右內距。 */
.pos-product-card__select-button {
  min-width: 4.5rem;
  padding: 0.6rem 0.9rem;
  border: 1px solid rgba(16, 185, 129, 0.5);
  border-radius: 0.75rem;
  color: var(--on-primary);
  background: linear-gradient(135deg, var(--primary), var(--primary-container));
  box-shadow: 0 8px 20px -9px rgba(16, 185, 129, 0.72);
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.pos-product-card__select-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px -9px rgba(16, 185, 129, 0.88);
}

.pos-product-card__select-button:active {
  transform: translateY(0);
}
</style>



