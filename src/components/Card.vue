<template>
  <section class="erp-card product-card">
    <!-- 卡片上方標題區 -->
    <div class="erp-card__head">
      <h2 class="erp-card__title">
       name
      </h2>
    </div>

    <!-- 商品圖片區 -->
    <div class="product-image">
      <img
        v-if="image"
        :src="image"
        :alt="name"
      >

      <span v-else>
        圖片
      </span>
    </div>

    <!-- 卡片副標題 -->
    <p class="erp-card__subtitle">
      價格：NT$ 100
    </p>
    <span class="a">
        <button class="erp-btn erp-btn--primary">+</button>
        <span>數量</span>
        <button class="erp-btn erp-btn--primary">-</button>
    </span>

  </section>
</template>

<script setup>
// defineProps({
//   name: String,
//   image: String,
//   price: Number
// })

</script>

<style scoped>
.product-card {
  width: 220px;
}

.product-image {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 120px;
  overflow: hidden;

  border: 2px solid #333;
  border-radius: 16px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.a{
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 6px;
    width: 100%;
  
}
</style>