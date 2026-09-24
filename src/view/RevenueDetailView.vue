<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getRevenueDetail } from "../service/dashboardService";

const router = useRouter();

const range = ref("week"); // 'week' | 'month'
const data = ref(null);
const loading = ref(false);
const errorMessage = ref("");

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  return currency.format(Number(value) || 0);
}

// 安全解析日期字串（避免時區問題）
function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    data.value = await getRevenueDetail(range.value);
  } catch (e) {
    errorMessage.value = "載入營收資料失敗";
  } finally {
    loading.value = false;
  }
}

function switchRange(next) {
  if (range.value === next) return;
  range.value = next;
  load();
}

// 圖表用的最大值（避免除以 0）
const maxRevenue = computed(() => {
  const list = data.value?.dailyTrend ?? [];
  return Math.max(...list.map((d) => Number(d.revenue) || 0), 1);
});

const avgRevenue = computed(() => {
  const list = data.value?.dailyTrend ?? [];
  if (!list.length) return 0;
  return Number(data.value.totalRevenue) / list.length;
});

const bestDay = computed(() => {
  const list = data.value?.dailyTrend ?? [];
  if (!list.length) return null;
  return list.reduce((a, b) => (Number(b.revenue) > Number(a.revenue) ? b : a));
});

function barHeight(revenue) {
  return `${(Number(revenue) / maxRevenue.value) * 100}%`;
}

// 週視圖顯示 9/17，月視圖只顯示 17
function labelOf(dateStr) {
  const d = parseDate(dateStr);
  return range.value === "week"
    ? `${d.getMonth() + 1}/${d.getDate()}`
    : `${d.getDate()}`;
}

const compareLabel = computed(() =>
  range.value === "week" ? "較前 7 天同期" : "較上月同期"
);

// 今天的日期字串（後端格式是 2026-09-23）
const todayStr = (() => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
})();

function isToday(dateStr) {
  return dateStr === todayStr;
}

// tooltip：今天多加「進行中」提示
function tooltipOf(day) {
  const base = `${day.date}　${formatCurrency(day.revenue)}`;
  return isToday(day.date) ? `${base}（今日進行中）` : base;
}

onMounted(load);
</script>

<template>
  <div class="revenue-detail">
    <button class="back-link" @click="router.back()">
      <span class="material-symbols-outlined">arrow_back</span>
      返回 Dashboard
    </button>

    <div class="page-head">
      <h1>營收報表</h1>
      <div class="range-tabs">
        <button :class="{ active: range === 'week' }" @click="switchRange('week')">
          近 7 天
        </button>
        <button :class="{ active: range === 'month' }" @click="switchRange('month')">
          本月
        </button>
      </div>
    </div>

    <p v-if="loading" class="state-text">載入中...</p>
    <p v-else-if="errorMessage" class="state-text state-text--error">
      {{ errorMessage }}
    </p>

    <template v-else-if="data">
      <!-- 統計卡片 -->
      <div class="summary-grid">
        <div class="bento-card summary-card">
          <dt>總營收</dt>
          <dd class="summary-value">{{ formatCurrency(data.totalRevenue) }}</dd>
          <dd class="summary-compare">
                <!-- 上期沒資料 -->
                <span v-if="data.changeRate == null" class="compare compare--na">
                上期無營收資料
                </span>
                <!-- 有環比數據 -->
                <span
                v-else
                :class="['compare', data.changeRate >= 0 ? 'compare--up' : 'compare--down']"
                >
                <span class="material-symbols-outlined">
                    {{ data.changeRate >= 0 ? "trending_up" : "trending_down" }}
                </span>
                {{ data.changeRate >= 0 ? "+" : "" }}{{ data.changeRate }}%
                <em>{{ compareLabel }}</em>
                </span>
         </dd>
         <dd v-if="data.previousRevenue != null" class="summary-sub">
            上期：{{ formatCurrency(data.previousRevenue) }}
         </dd>
        </div>
        <div class="bento-card summary-card">
          <dt>日均營收</dt>
          <dd class="summary-value">{{ formatCurrency(avgRevenue) }}</dd>
        </div>
        <div v-if="bestDay" class="bento-card summary-card">
          <dt>最佳單日</dt>
          <dd class="summary-value">{{ labelOf(bestDay.date) }}</dd>
          <dd class="summary-sub">{{ formatCurrency(bestDay.revenue) }}</dd>
        </div>
      </div>

      <!-- 長條圖 -->
      <div class="bento-card chart-card">
        <h2>每日營收</h2>
        <div class="chart">
          <div
            v-for="day in data.dailyTrend"
            :key="day.date"
            class="chart__col"
            :class="{ 'chart__col--today': isToday(day.date) }"
            :title="tooltipOf(day)"
            >
            <div class="chart__bar" :style="{ height: barHeight(day.revenue) }"></div>
            <span class="chart__label">
                {{ isToday(day.date) ? "今日" : labelOf(day.date) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 每日明細（由新到舊） -->
      <div class="bento-card list-card">
        <h2>每日明細</h2>
        <ul class="daily-list">
          <li  v-for="day in [...data.dailyTrend].reverse()"
            :key="day.date"
            :class="{ 'daily-item--today': isToday(day.date) }">
            <span class="daily-list__date font-data-mono">
                {{ day.date }}
            </span>
            
            <span class="daily-list__bar">
              <i :style="{ width: barHeight(day.revenue) }"></i>
            </span>
            <span class="daily-list__value font-data-mono">
              {{ formatCurrency(day.revenue) }}
            </span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.revenue-detail {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.page-head h1 {
  font-size: 1.4rem;
  margin: 0;
}

/* 本週/本月切換鈕 */
.range-tabs {
  display: flex;
  gap: 0.3rem;
  background: var(--surface-container, rgba(255, 255, 255, 0.06));
  padding: 0.25rem;
  border-radius: 999px;
}

.range-tabs button {
  border: none;
  background: transparent;
  color: var(--on-surface-variant);
  padding: 0.4rem 1.1rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.range-tabs button.active {
  background: var(--secondary);
  color: var(--on-secondary, #fff);
}

/* 統計卡片 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.summary-card {
  padding: 1.25rem;
}

.summary-card dt {
  font-size: 0.8rem;
  color: var(--on-surface-variant);
  margin-bottom: 0.4rem;
}

.summary-value {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.summary-sub {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--on-surface-variant);
}

/* 長條圖 */
.chart-card {
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.chart-card h2,
.list-card h2 {
  font-size: 1rem;
  margin: 0 0 1rem;
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 220px;
}

.chart__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  height: 100%;
}

.chart__bar {
  width: 100%;
  max-width: 42px;
  min-height: 2px;
  background: var(--secondary);
  border-radius: 6px 6px 2px 2px;
  transition: height 0.4s ease;
}

.chart__col:hover .chart__bar {
  opacity: 0.8;
}

.chart__label {
  font-size: 0.7rem;
  color: var(--on-surface-variant);
}

/* 明細列表 */
.list-card {
  padding: 1.5rem;
}

.daily-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.daily-list li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--outline-variant);
}

.daily-list li:last-child {
  border-bottom: none;
}

.daily-list__date {
  width: 110px;
  font-size: 0.85rem;
  color: var(--on-surface-variant);
}

.daily-list__bar {
  flex: 1;
  height: 6px;
  background: var(--outline-variant);
  border-radius: 3px;
  overflow: hidden;
}

.daily-list__bar i {
  display: block;
  height: 100%;
  background: var(--secondary);
  border-radius: 3px;
}

.daily-list__value {
  width: 110px;
  text-align: right;
  font-size: 0.9rem;
}

.summary-compare {
  margin: 0.5rem 0 0;
}

.compare {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.compare .material-symbols-outlined {
  font-size: 16px;
}

.compare--up { color: #4ade80; }   /* 漲：綠 */
.compare--down { color: #f87171; } /* 跌：紅 */
.compare--na { color: var(--on-surface-variant); font-weight: 400; }

.compare em {
  font-style: normal;
  font-weight: 400;
  color: var(--on-surface-variant);
  margin-left: 4px;
}

/* 圖例小字 */
.chart__legend {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--on-surface-variant);
  margin-left: 8px;
}

/* 今日長條：虛線邊框＋半透明填充，一眼看出「還沒結束」 */
.chart__col--today .chart__bar {
  background: rgba(255, 255, 255, 0.08); /*  fallback */
  background: color-mix(in srgb, var(--secondary) 30%, transparent);
  border: 2px dashed var(--secondary);
  box-sizing: border-box;
}

/* 今日標籤強調 */
.chart__col--today .chart__label {
  color: var(--secondary);
  font-weight: 700;
}

/* 明細列表：今日的進度條改成斜紋 */
.daily-item--today .daily-list__bar i {
  background: repeating-linear-gradient(
    45deg,
    var(--secondary) 0 6px,
    transparent 6px 10px
  );
}

/* 「進行中」小標籤 */
.today-tag {
  font-style: normal;
  font-size: 0.65rem;
  color: var(--secondary);
  border: 1px solid var(--secondary);
  border-radius: 4px;
  padding: 1px 5px;
  margin-left: 6px;
  vertical-align: middle;
}
</style>