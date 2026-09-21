<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  allProducts: {
    type: Array,
    default: () => [],
  },
  recentProducts: {
    type: Array,
    default: () => [],
  },
  allRevenue: {
    type: Array,
    default: () => [],
  },
  recentRevenue: {
    type: Array,
    default: () => [],
  },
});

const period = ref("recent");   // recent / all
const sortBy = ref("quantity"); // quantity / revenue

const products = computed(() => {
  if (sortBy.value === "quantity") {
    return period.value === "recent"
      ? props.recentProducts
      : props.allProducts;
  }

  return period.value === "recent"
    ? props.recentRevenue
    : props.allRevenue;
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

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
</script>

<template>
  <div class="top-card">
    <div class="top-card__header">
      <div>
        <h3>熱門商品</h3>
        <p>{{ period === "recent" ? "最近 7 天 Top 5" : "長銷排行 Top 5" }}</p>
      </div>

      <span class="material-symbols-outlined">local_cafe</span>
    </div>

    <div class="top-card__switch">
      <button
        :class="{ active: period === 'recent' }"
        @click="period = 'recent'"
      >
        最近熱門
      </button>

      <button
        :class="{ active: period === 'all' }"
        @click="period = 'all'"
      >
        長銷排行
      </button>
    </div>

    <div class="top-card__switch">
        <button
            :class="{ active: sortBy === 'quantity' }"
            @click="sortBy = 'quantity'"
        >
            杯數
        </button>

        <button
            :class="{ active: sortBy === 'revenue' }"
            @click="sortBy = 'revenue'"
        >
            營收
        </button>
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
          <span class="quantity">
            {{ sortBy === "quantity"
                ? `${item.quantity} 杯`
                : formatCurrency(item.revenue)
            }}
        </span>
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
.top-card{
  display:flex;
  flex-direction:column;
  gap:16px;
}

.top-card__header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.top-card__header h3{
  margin:0;
}

.top-card__header p{
  margin:4px 0 0;
  color:var(--on-surface-variant);
  font-size:13px;
}

.top-card__switch{
  display:flex;
  background:var(--surface-container-low);
  border-radius:12px;
  padding:4px;
}

.top-card__switch button{
  flex:1;
  border:none;
  background:transparent;
  color:var(--on-surface-variant);
  padding:8px;
  border-radius:8px;
  cursor:pointer;
  transition:.2s;
}

.top-card__switch button.active{
  background:var(--primary);
  color:var(--on-primary);
}

.ranking{
  display:flex;
  flex-direction:column;
  gap:10px;
}

.ranking-item{
  display:flex;
  align-items:center;
  gap:12px;
  padding:12px;
  border-radius:12px;
  background:var(--surface-container-low);
}

.rank-badge{
  width:34px;
  height:34px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
}

.ranking-info{
  flex:1;
  display:flex;
  flex-direction:column;
}

.name{
  font-weight:600;
}

.quantity{
  font-size:13px;
  color:var(--on-surface-variant);
}

.medal{
  font-size:24px;
}

.empty{
  text-align:center;
  padding:30px;
  color:var(--on-surface-variant);
}
</style>