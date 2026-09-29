<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

function goToRevenueDetail() {
  router.push({ name: "revenue-detail" });
}

function goToTodayOrders() {
  router.push({ name: "SalesOrder", query: { date: "today" } });
}

function goToOrderValueAnalysis() {
  router.push('/dashboard/order-value-analysis');
}

function goToCostDetail() {
  router.push({ name: "cost-detail" });
}

function goToProfitDetail() {
  router.push({ name: "profit-detail" });
}

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const todayProfit = computed(
  () => (Number(props.data.todayRevenue) || 0) - (Number(props.data.todayCost) || 0),
);

const todayMargin = computed(() => {
  const revenue = Number(props.data.todayRevenue) || 0;
  return revenue > 0 ? (todayProfit.value / revenue) * 100 : null; // 沒營收就不算毛利率
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
    <div
    class="stat-card revenue clickable"
    role="button"
    tabindex="0"
    title="點擊查看整週／整月營收"
    @click="goToRevenueDetail"
    @keyup.enter="goToRevenueDetail"
  >
    <div class="stat-card__icon">
      <span class="material-symbols-outlined">payments</span>
    </div>

    <div class="stat-card__content">
      <span class="stat-card__label">今日營收</span>
      <h2>{{ formatCurrency(data.todayRevenue) }}</h2>
      <!-- 新增：較昨日徽章 -->
      <span class="stat-compare">
        <span v-if="data.revenueChangeRate == null" class="compare compare--na">
          昨日無營收資料
        </span>
        <span
          v-else
          :class="['compare', data.revenueChangeRate >= 0 ? 'compare--up' : 'compare--down']"
        >
          <span class="material-symbols-outlined">
            {{ data.revenueChangeRate >= 0 ? "trending_up" : "trending_down" }}
          </span>
          {{ data.revenueChangeRate >= 0 ? "+" : "" }}{{ data.revenueChangeRate }}%
          <!-- <em>較昨日同期</em> -->
        </span>
      </span>
    </div> 
  </div>

    <!-- 今日成本 -->
  <div
    class="stat-card cost clickable"
    role="button"
    tabindex="0"
    title="點擊查看成本報表"
    @click="goToCostDetail"
    @keyup.enter="goToCostDetail"
  >
    <div class="stat-card__icon">
      <span class="material-symbols-outlined">inventory_2</span>
    </div>

    <div class="stat-card__content">
      <span class="stat-card__label">今日成本</span>
      <h2>{{ formatCurrency(data.todayCost) }}</h2>

      <span class="stat-compare">
        <span v-if="data.costChangeRate == null" class="compare compare--na">
          昨日無成本資料
        </span>
        <!-- 成本上升是壞事：顏色與營收相反 -->
        <span
          v-else
          :class="['compare', data.costChangeRate > 0 ? 'compare--down' : 'compare--up']"
        >
          <span class="material-symbols-outlined">
            {{ data.costChangeRate >= 0 ? "trending_up" : "trending_down" }}
          </span>
          {{ data.costChangeRate >= 0 ? "+" : "" }}{{ data.costChangeRate }}%
          <!-- <em>較昨日同期</em> -->
        </span>
      </span>

      <span v-if="data.todayMissingCostCount > 0" class="stat-warning">
        <span class="material-symbols-outlined">warning</span>
        {{ data.todayMissingCostCount }} 筆缺成本
      </span>
    </div>
  </div>

  <!-- 今日毛利 -->
      <div
      class="stat-card profit clickable"
      role="button"
      tabindex="0"
      title="點擊查看毛利報表"
      @click="goToProfitDetail"
      @keyup.enter="goToProfitDetail"
    >
    <div class="stat-card__icon">
      <span class="material-symbols-outlined">savings</span>
    </div>

    <div class="stat-card__content">
      <span class="stat-card__label">今日毛利</span>
      <h2>{{ formatCurrency(todayProfit) }}</h2>

      <span class="stat-compare">
        <span v-if="todayMargin == null" class="compare compare--na">今日無營收</span>
        <span
          v-else
          :class="['compare', todayProfit >= 0 ? 'compare--up' : 'compare--down']"
        >
          毛利率 {{ todayMargin.toFixed(1) }}%
        </span>
      </span>

      <span v-if="data.todayMissingCostCount > 0" class="stat-warning">
        <span class="material-symbols-outlined">warning</span>
        成本不完整，毛利可能偏高
      </span>
    </div>
  </div>

    <!-- 今日訂單 -->
    <div class="stat-card orders clickable"
      role="button"
      tabindex="0"
      title="點擊查看今日訂單"
      @click="goToTodayOrders"
      @keyup.enter="goToTodayOrders">
      <div class="stat-card__icon">
        <span class="material-symbols-outlined">receipt_long</span>
      </div>

      <div class="stat-card__content">
        <span class="stat-card__label">今日訂單</span>
        <h2>{{ data.todayOrders ?? 0 }}</h2>
      </div>
    </div>

    <!-- 平均客單價 -->
    <div 
      class="stat-card average clickable"
      role="button"                  
      tabindex="0"                   
      title="點擊查看客單價詳細分析"  
      @click="goToOrderValueAnalysis"
      @keyup.enter="goToOrderValueAnalysis" 
    >
      <div class="stat-card__icon">
        <span class="material-symbols-outlined">shopping_cart</span>
      </div>

      <div class="stat-card__content">
        <span class="stat-card__label">平均客單價</span>
        <h2>{{ formatCurrency(data.averageOrderAmount) }}</h2>
      </div>
    </div>

    
    
  </section>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

.cost .stat-card__icon {
  background: rgba(244, 63, 94, .15);
  color: #fb7185;
}

.profit .stat-card__icon {
  background: rgba(99, 102, 241, .15);
  color: #818cf8;
}

/* 可點擊卡片的樣式 */
.stat-card.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card.clickable:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* 小箭頭提示（可選） */
.stat-card__hint {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 18px;
  color: var(--on-surface-variant);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.stat-card.clickable:hover .stat-card__hint {
  opacity: 1;
}

.stat-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #fbbf24;
}

.stat-warning .material-symbols-outlined {
  font-size: 14px;
}

.stat-compare {
  display: block;
  margin-top: 0.35rem;
}

.compare {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.compare .material-symbols-outlined {
  font-size: 16px;
}

.compare--up { color: #4ade80; }
.compare--down { color: #f87171; }
.compare--na { color: var(--on-surface-variant); font-weight: 400; }

.compare em {
  font-style: normal;
  font-weight: 400;
  color: var(--on-surface-variant);
  margin-left: 2px;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

</style>