<script setup>
defineProps({
  products: {
    type: Array,
    default: () => [],
  },
});

function getRankColor(index) {
  switch (index) {
    case 0:
      return "#f59e0b"; // 金牌
    case 1:
      return "#94a3b8"; // 銀牌
    case 2:
      return "#b45309"; // 銅牌
    default:
      return "#475569";
  }
}
</script>

<template>
  <div class="top-card">
    <div class="top-card__header">
      <div>
        <h3>熱門商品</h3>
        <p>銷售排行榜 Top 5</p>
      </div>

      <span class="material-symbols-outlined">local_cafe</span>
    </div>

    <div v-if="products.length === 0" class="empty">
      目前沒有銷售資料
    </div>

    <div v-else class="ranking">
      <div
        v-for="(item, index) in products"
        :key="item.productName"
        class="ranking-item"
      >
        <div
          class="rank-badge"
          :style="{ backgroundColor: getRankColor(index) + '22', color: getRankColor(index) }"
        >
          {{ index + 1 }}
        </div>

        <div class="ranking-info">
          <span class="name">{{ item.productName }}</span>
          <span class="quantity">{{ item.quantity }} 杯</span>
        </div>

        <span
            v-if="index < 3"
            class="material-symbols-outlined medal"
            :style="{ color: getRankColor(index) }"
        >
          emoji_events
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-card {
  background: var(--surface-container);
  border: 1px solid var(--outline);
  border-radius: 20px;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.top-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.top-card__header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.top-card__header p {
  margin: 4px 0 0;
  font-size: .82rem;
  color: var(--on-surface-variant);
}

.top-card__header .material-symbols-outlined {
  font-size: 30px;
  color: var(--primary);
}

.empty {
  text-align: center;
  color: var(--on-surface-variant);
  padding: 30px 0;
}

.ranking {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--outline-variant);
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
}

.ranking-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 600;
}

.quantity {
  font-size: .82rem;
  color: var(--on-surface-variant);
}

.medal {
  font-size: 22px;
}
</style>