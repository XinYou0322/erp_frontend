<script setup>
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

function formatCurrency(value) {
  if (value == null) return "$0";
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value);
}
</script>

<template>
  <section class="stats-grid">
    <!-- 今日營收 -->
    <div class="stat-card revenue">
      <div class="stat-card__icon">
        <span class="material-symbols-outlined">payments</span>
      </div>

      <div class="stat-card__content">
        <span class="stat-card__label">今日營收</span>
        <h2>{{ formatCurrency(data.todayRevenue) }}</h2>
      </div>
    </div>

    <!-- 今日訂單 -->
    <div class="stat-card orders">
      <div class="stat-card__icon">
        <span class="material-symbols-outlined">receipt_long</span>
      </div>

      <div class="stat-card__content">
        <span class="stat-card__label">今日訂單</span>
        <h2>{{ data.todayOrders ?? 0 }}</h2>
      </div>
    </div>

    <!-- 平均客單價 -->
    <div class="stat-card average">
      <div class="stat-card__icon">
        <span class="material-symbols-outlined">shopping_cart</span>
      </div>

      <div class="stat-card__content">
        <span class="stat-card__label">平均客單價</span>
        <h2>{{ formatCurrency(data.averageOrderAmount) }}</h2>
      </div>
    </div>

    <!-- 待簽核
    <div class="stat-card approval">
      <div class="stat-card__icon">
        <span class="material-symbols-outlined">approval</span>
      </div>

      <div class="stat-card__content">
        <span class="stat-card__label">待簽核</span>
        <h2>{{ data.pendingApprovals ?? 0 }}</h2>
      </div>
    </div>--> 
    
  </section>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--surface-container);
  border: 1px solid var(--outline);
  border-radius: 20px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all .2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(16,185,129,.35);
  box-shadow: 0 10px 28px rgba(0,0,0,.35);
}

.stat-card__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card__icon span {
  font-size: 28px;
}

.stat-card__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card__label {
  color: var(--on-surface-variant);
  font-size: .85rem;
}

.stat-card h2 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
}

/* 每張卡不同顏色 */

.revenue .stat-card__icon {
  background: rgba(16,185,129,.15);
  color: var(--primary);
}

.orders .stat-card__icon {
  background: rgba(6,182,212,.15);
  color: var(--secondary);
}

.average .stat-card__icon {
  background: rgba(245,158,11,.15);
  color: var(--tertiary);
}

.approval .stat-card__icon {
  background: rgba(99,102,241,.15);
  color: #818cf8;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(1fr);
  }
}

</style>