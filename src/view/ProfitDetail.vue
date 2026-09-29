<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getRevenueDetail, getCostDetail } from "@/service/dashboardService";

const router = useRouter();

// --- 狀態管理 ---
const activePreset = ref("month");
const startDate = ref("");
const endDate = ref("");
const groupBy = ref("DAY");

const revenueData = ref(null);
const costData = ref(null);
const loading = ref(false);
const errorMessage = ref("");

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency", currency: "TWD", maximumFractionDigits: 0,
});
const compact = new Intl.NumberFormat("zh-TW", {
  notation: "compact", maximumFractionDigits: 1,
});
function formatCurrency(value) { return currency.format(Number(value) || 0); }

// --- 日期處理 ---
function toLocalDateStr(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const todayStr = toLocalDateStr(new Date());

function shortDate(str) {
  if (!str) return "";
  const [y, m, d] = String(str).split("-").map(Number);
  return y === new Date().getFullYear() ? `${m}/${d}` : `${y}/${m}/${d}`;
}

const availableGroups = computed(() => {
  switch (activePreset.value) {
    case "month":
      return ["DAY"];
    case "year":
      return ["DAY", "MONTH"];
    case "custom": {
      if (!startDate.value || !endDate.value) return ["DAY"];
      const start = new Date(startDate.value + "T00:00:00");
      const end = new Date(endDate.value + "T00:00:00");
      const days = Math.floor((end - start) / 86400000) + 1;
      if (days <= 31) return ["DAY"];
      if (days <= 365) return ["DAY", "MONTH"];
      return ["DAY", "MONTH", "YEAR"];
    }
    default:
      return ["DAY"];
  }
});

function clampGroupBy() {
  if (!availableGroups.value.includes(groupBy.value)) {
    groupBy.value = availableGroups.value[availableGroups.value.length - 1];
  }
}

function applyPreset(preset) {
  activePreset.value = preset;
  const today = new Date();
  let start, end, defaultGroup = "DAY";

  if (preset === "month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = today;
    defaultGroup = "DAY";
  } else if (preset === "year") {
    start = new Date(today.getFullYear(), 0, 1);
    end = today;
    defaultGroup = "MONTH";
  } else {
    start = startDate.value ? new Date(startDate.value + "T00:00:00") : today;
    end = endDate.value ? new Date(endDate.value + "T00:00:00") : today;
    defaultGroup = groupBy.value;
  }

  startDate.value = toLocalDateStr(start);
  endDate.value = toLocalDateStr(end);
  groupBy.value = defaultGroup;
  clampGroupBy();
  load();
}

function changeGroupBy(newGroup) {
  if (groupBy.value === newGroup) return;
  if (!availableGroups.value.includes(newGroup)) return;
  groupBy.value = newGroup;
  load();
}

function onCustomDateChange() {
  activePreset.value = "custom";
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    errorMessage.value = "開始日期不能晚於結束日期";
    revenueData.value = null;
    costData.value = null;
    return;
  }
  clampGroupBy();
  load();
}

// --- 載入：同時取得營收與成本，用相同的區間與顯示方式 ---
let requestSeq = 0;

async function load() {
  if (!startDate.value || !endDate.value) return;
  if (startDate.value > endDate.value) {
    errorMessage.value = "開始日期不能晚於結束日期";
    revenueData.value = null;
    costData.value = null;
    return;
  }

  const seq = ++requestSeq;
  loading.value = true;
  errorMessage.value = "";
  try {
    const [rev, cost] = await Promise.all([
      getRevenueDetail(startDate.value, endDate.value, groupBy.value),
      getCostDetail(startDate.value, endDate.value, groupBy.value),
    ]);
    if (seq !== requestSeq) return;
    revenueData.value = rev;
    costData.value = cost;
  } catch (e) {
    if (seq !== requestSeq) return;
    console.error("❌ API 呼叫失敗:", e);
    errorMessage.value = "載入毛利資料失敗";
    revenueData.value = null;
    costData.value = null;
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

const hasData = computed(
  () =>
    Array.isArray(revenueData.value?.dailyTrend) &&
    Array.isArray(costData.value?.dailyTrend),
);

// --- 合併營收與成本 ---
// 營收回傳的日期：按月 2026-09-01、按年 2026-01-01
// 成本回傳的日期：按月 2026-09、按年 2026
// 統一截成同一種 key 才對得起來
function keyOf(dateStr) {
  if (!dateStr) return "";
  const s = String(dateStr);
  if (groupBy.value === "YEAR") return s.substring(0, 4);
  if (groupBy.value === "MONTH") return s.substring(0, 7);
  return s.substring(0, 10);
}

const rows = computed(() => {
  if (!hasData.value) return [];
  const map = new Map();

  for (const d of revenueData.value.dailyTrend) {
    const key = keyOf(d.date);
    map.set(key, { date: key, revenue: Number(d.revenue) || 0, cost: 0 });
  }
  for (const d of costData.value.dailyTrend) {
    const key = keyOf(d.date);
    const row = map.get(key) ?? { date: key, revenue: 0, cost: 0 };
    row.cost = Number(d.cost) || 0;
    map.set(key, row);
  }

  return [...map.values()]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((r) => ({ ...r, profit: r.revenue - r.cost }));
});

// --- 統計 ---
const totalRevenue = computed(() => Number(revenueData.value?.totalRevenue) || 0);
const totalCost = computed(() => Number(costData.value?.totalCost) || 0);
const totalProfit = computed(() => totalRevenue.value - totalCost.value);
const margin = computed(() =>
  totalRevenue.value > 0 ? (totalProfit.value / totalRevenue.value) * 100 : null,
);

const prevRevenue = computed(() => Number(revenueData.value?.previousRevenue) || 0);
const prevCost = computed(() => Number(costData.value?.previousCost) || 0);
const prevProfit = computed(() => prevRevenue.value - prevCost.value);
const prevMargin = computed(() =>
  prevRevenue.value > 0 ? (prevProfit.value / prevRevenue.value) * 100 : null,
);

// 上期毛利 <= 0 時，百分比沒有意義，視為無法比較
const profitChangeRate = computed(() =>
  prevProfit.value > 0
    ? ((totalProfit.value - prevProfit.value) / prevProfit.value) * 100
    : null,
);

const previousRangeText = computed(() => {
  const s = costData.value?.previousStartDate;
  const e = costData.value?.previousEndDate;
  return s && e ? `${shortDate(s)} ~ ${shortDate(e)}` : "";
});

// --- 圖表（三條線：營收、成本、毛利；毛利為負時會顯示 0 軸） ---
const chartWidth = 1000;
const chartHeight = 320;
const padTop = 20;
const padBottom = 34;
const padLeft = 64;
const padRight = 16;
const plotW = chartWidth - padLeft - padRight;
const plotH = chartHeight - padTop - padBottom;

function niceStep(rawStep) {
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const n = rawStep / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

// 刻度取整：上限、下限都對齊刻度間距，標籤就會是 1000、2000 這種整數
const axis = computed(() => {
  const rawMax = Math.max(...rows.value.map((r) => Math.max(r.revenue, r.cost, r.profit)), 1);
  const rawMin = Math.min(0, ...rows.value.map((r) => r.profit));
  const step = Math.max(1, niceStep((rawMax - rawMin) / 4));
  return {
    step,
    min: Math.floor(rawMin / step) * step,
    max: Math.ceil(rawMax / step) * step,
  };
});

const yMax = computed(() => axis.value.max);
const yMin = computed(() => axis.value.min);
const yRange = computed(() => yMax.value - yMin.value || 1);

const gridLines = computed(() => {
  const { step, min, max } = axis.value;
  const lines = [];
  for (let v = min; v <= max + step / 2; v += step) {
    lines.push({ y: py(v), label: compact.format(v) });
  }
  return lines;
});

function px(index) {
  const n = rows.value.length;
  if (n <= 1) return padLeft + plotW / 2;
  return padLeft + (index / (n - 1)) * plotW;
}

function py(value) {
  return padTop + (1 - (value - yMin.value) / yRange.value) * plotH;
}

function pointsOf(field) {
  return rows.value.map((r, i) => `${px(i)},${py(r[field])}`).join(" ");
}

const revenuePoints = computed(() => pointsOf("revenue"));
const costPoints = computed(() => pointsOf("cost"));
const profitPoints = computed(() => pointsOf("profit"));


const zeroY = computed(() => py(0));

const showDots = computed(() => rows.value.length <= 31);

const hitWidth = computed(() =>
  rows.value.length <= 1 ? plotW : plotW / (rows.value.length - 1),
);

function labelOf(key) {
  if (!key) return "";
  if (groupBy.value === "DAY") {
    const [, m, d] = key.split("-");
    return `${Number(m)}/${Number(d)}`;
  }
  return key; // 按月 yyyy-MM、按年 yyyy
}

// X 軸最多顯示約 8 個標籤，避免擠在一起
const xLabels = computed(() => {
  const n = rows.value.length;
  if (!n) return [];
  const step = Math.max(1, Math.ceil(n / 8));
  const out = [];
  for (let i = 0; i < n; i += step) {
    out.push({ x: px(i), text: labelOf(rows.value[i].date) });
  }
  return out;
});

function isToday(key) {
  return key === todayStr && groupBy.value === "DAY";
}

const hoveredIndex = ref(null);
const hovered = computed(() =>
  hoveredIndex.value == null ? null : rows.value[hoveredIndex.value] ?? null,
);
const hoveredMargin = computed(() =>
  hovered.value && hovered.value.revenue > 0
    ? (hovered.value.profit / hovered.value.revenue) * 100
    : null,
);

onMounted(() => applyPreset("month"));
</script>

<template>
  <div class="revenue-detail profit-detail">
    <button class="back-link" @click="router.back()">
      <span class="material-symbols-outlined">arrow_back</span>
      返回 Dashboard
    </button>

    <div class="page-head">
      <h1>毛利報表</h1>
    </div>

    <!-- 篩選器 -->
    <div class="filter-bar">
      <div class="range-tabs">
        <button :class="{ active: activePreset === 'month' }" @click="applyPreset('month')">本月</button>
        <button :class="{ active: activePreset === 'year' }" @click="applyPreset('year')">本年</button>
        <button :class="{ active: activePreset === 'custom' }" @click="applyPreset('custom')">自訂</button>
      </div>

      <div v-if="activePreset === 'custom'" class="custom-date-range">
        <input type="date" v-model="startDate" @change="onCustomDateChange" class="input-glow" />
        <span class="date-separator">至</span>
        <input type="date" v-model="endDate" @change="onCustomDateChange" class="input-glow" />
      </div>

      <div class="group-by-tabs">
        <span class="group-by-label">顯示方式：</span>
        <button
          v-for="option in ['DAY', 'MONTH', 'YEAR']"
          :key="option"
          :class="{ active: groupBy === option }"
          :disabled="!availableGroups.includes(option)"
          @click="changeGroupBy(option)"
        >
          {{ option === 'DAY' ? '按天' : option === 'MONTH' ? '按月' : '按年' }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="state-text">載入中...</p>
    <p v-else-if="errorMessage" class="state-text state-text--error">{{ errorMessage }}</p>

    <template v-else-if="hasData">
      <!-- 缺成本提醒：缺成本的明細沒被算進成本，毛利會被高估 -->
      <p v-if="costData.missingCostCount > 0" class="profit-warning">
        <span class="material-symbols-outlined">warning</span>
        本區間有 {{ costData.missingCostCount }} 筆銷售明細缺少成本資料，毛利可能偏高
      </p>

      <!-- 統計卡片 -->
      <div class="summary-grid">
        <div class="bento-card summary-card">
          <dt>總毛利</dt>
          <dd class="summary-value">{{ formatCurrency(totalProfit) }}</dd>
          <dd class="summary-compare">
            <span v-if="profitChangeRate == null" class="compare compare--na">上期無可比較的毛利</span>
            <span v-else :class="['compare', profitChangeRate >= 0 ? 'compare--up' : 'compare--down']">
              <span class="material-symbols-outlined">
                {{ profitChangeRate >= 0 ? "trending_up" : "trending_down" }}
              </span>
              {{ profitChangeRate >= 0 ? "+" : "" }}{{ profitChangeRate.toFixed(1) }}%
              <em>較前一期間</em>
            </span>
          </dd>
          <dd class="summary-sub">
            上期<template v-if="previousRangeText">（{{ previousRangeText }}）</template>：{{ formatCurrency(prevProfit) }}
          </dd>
        </div>

        <div class="bento-card summary-card">
          <dt>毛利率</dt>
          <dd class="summary-value">{{ margin == null ? "—" : margin.toFixed(1) + "%" }}</dd>
          <dd class="summary-sub">
            上期：{{ prevMargin == null ? "—" : prevMargin.toFixed(1) + "%" }}
          </dd>
        </div>

        <div class="bento-card summary-card">
          <dt>營收 / 成本</dt>
          <dd class="summary-value">{{ formatCurrency(totalRevenue) }}</dd>
          <dd class="summary-sub">成本 {{ formatCurrency(totalCost) }}</dd>
        </div>
      </div>

      <!-- 趨勢圖 -->
      <div class="bento-card chart-card">
        <h2>
          營收 / 成本 / 毛利趨勢
          ({{ groupBy === 'DAY' ? '每日' : groupBy === 'MONTH' ? '每月' : '每年' }})
        </h2>

        <div class="profit-legend">
          <span><i class="legend-dot legend-dot--revenue"></i>營收</span>
          <span><i class="legend-dot legend-dot--cost"></i>成本</span>
          <span><i class="legend-dot legend-dot--profit"></i>毛利</span>
        </div>

        <div class="profit-chart-wrapper">
          <div v-if="hovered" class="profit-tooltip">
            <strong>
              {{ hovered.date }}<template v-if="isToday(hovered.date)">（今日進行中）</template>
            </strong>
            <span><i class="legend-dot legend-dot--revenue"></i>營收 {{ formatCurrency(hovered.revenue) }}</span>
            <span><i class="legend-dot legend-dot--cost"></i>成本 {{ formatCurrency(hovered.cost) }}</span>
            <span><i class="legend-dot legend-dot--profit"></i>毛利 {{ formatCurrency(hovered.profit) }}</span>
            <span v-if="hoveredMargin != null">毛利率 {{ hoveredMargin.toFixed(1) }}%</span>
          </div>

          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="profit-chart">
            <!-- 網格線與 Y 軸標籤 -->
            <g v-for="(g, i) in gridLines" :key="'g' + i">
              <line :x1="padLeft" :x2="chartWidth - padRight" :y1="g.y" :y2="g.y" class="grid-line" />
              <text :x="padLeft - 8" :y="g.y + 4" text-anchor="end" class="axis-text">{{ g.label }}</text>
            </g>

            <!-- 0 軸：毛利為負時才需要 -->
            <line
              v-if="yMin < 0"
              :x1="padLeft"
              :x2="chartWidth - padRight"
              :y1="zeroY"
              :y2="zeroY"
              class="zero-line"
            />

            <!-- X 軸標籤 -->
            <text
              v-for="(l, i) in xLabels"
              :key="'x' + i"
              :x="l.x"
              :y="chartHeight - 10"
              text-anchor="middle"
              class="axis-text"
            >{{ l.text }}</text>

            <!-- Hover 垂直線 -->
            <line
              v-if="hoveredIndex !== null"
              :x1="px(hoveredIndex)"
              :x2="px(hoveredIndex)"
              :y1="padTop"
              :y2="padTop + plotH"
              class="hover-line"
            />

            <!-- 三條線 -->
            <polyline :points="revenuePoints" class="series series--revenue" />
            <polyline :points="costPoints" class="series series--cost" />
            <polyline :points="profitPoints" class="series series--profit" />

            <!-- 資料點（點數不多時才畫，避免太擠） -->
            <template v-if="showDots">
              <g v-for="(r, i) in rows" :key="'d' + r.date">
                <circle :cx="px(i)" :cy="py(r.revenue)" r="3" class="pt pt--revenue" />
                <circle :cx="px(i)" :cy="py(r.cost)" r="3" class="pt pt--cost" />
                <circle :cx="px(i)" :cy="py(r.profit)" r="3" class="pt pt--profit" />
              </g>
            </template>

            <!-- Hover 高亮點 -->
            <template v-if="hovered">
              <circle :cx="px(hoveredIndex)" :cy="py(hovered.revenue)" r="5" class="pt-hover pt--revenue" />
              <circle :cx="px(hoveredIndex)" :cy="py(hovered.cost)" r="5" class="pt-hover pt--cost" />
              <circle :cx="px(hoveredIndex)" :cy="py(hovered.profit)" r="5" class="pt-hover pt--profit" />
            </template>

            <!-- Hover 感應區：每個資料點一條垂直長條，最後畫才會在最上層 -->
            <rect
              v-for="(r, i) in rows"
              :key="'hit-' + r.date"
              :x="px(i) - hitWidth / 2"
              y="0"
              :width="hitWidth"
              :height="chartHeight"
              fill="transparent"
              @mouseenter="hoveredIndex = i"
              @mouseleave="hoveredIndex = null"
            />
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.grid-line {
  stroke: rgba(255,255,255,.08);
  stroke-width: .3;
}

.line-chart-wrapper {
  height: 260px;
  display: flex;
  flex-direction: column;
}

.line-chart {
  flex: 1;
  width: 100%;
}

.line-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}

.group-by-tabs button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

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

.page-head h1 { font-size: 1.4rem; margin: 0; }

/* 篩選器區塊 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

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
  transition: all 0.2s;
}

.range-tabs button.active {
  background: var(--secondary);
  color: var(--on-secondary, #fff);
}

/* 自訂日期選擇器 */
.custom-date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.input-glow {
  background: var(--surface-container, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--outline-variant);
  color: var(--on-surface);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.85rem;
}
.date-separator { color: var(--on-surface-variant); font-size: 0.85rem; }

/* 顯示粒度切換區塊 */
.group-by-tabs {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--surface-container, rgba(255, 255, 255, 0.06));
  padding: 0.25rem;
  border-radius: 999px;
  margin-left: auto; /* 推到右側 */
}

.group-by-label {
  font-size: 0.85rem;
  color: var(--on-surface-variant);
  padding: 0 0.5rem;
}

.group-by-tabs button {
  border: none;
  background: transparent;
  color: var(--on-surface-variant);
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.group-by-tabs button.active {
  background: var(--secondary);
  color: var(--on-secondary, #fff);
}

/* 響應式：螢幕變小時讓篩選器換行 */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .group-by-tabs {
    margin-left: 0;
    justify-content: center;
    margin-top: 0.5rem;
  }
}

/* 統計卡片 */
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
.summary-card { padding: 1.25rem; }
.summary-card dt { font-size: 0.8rem; color: var(--on-surface-variant); margin-bottom: 0.4rem; }
.summary-value { margin: 0; font-size: 1.5rem; font-weight: 700; }
.summary-sub { margin: 0.2rem 0 0; font-size: 0.85rem; color: var(--on-surface-variant); }

.summary-compare { margin: 0.5rem 0 0; }
.compare { display: inline-flex; align-items: center; gap: 4px; font-size: 0.85rem; font-weight: 600; }
.compare .material-symbols-outlined { font-size: 16px; }
.compare--up { color: #4ade80; }
.compare--down { color: #f87171; }
.compare--na { color: var(--on-surface-variant); font-weight: 400; }
.compare em { font-style: normal; font-weight: 400; color: var(--on-surface-variant); margin-left: 4px; }

/* 長條圖 */
.chart-card { padding: 1.5rem; margin-bottom: 1rem; }
.chart-card h2, .list-card h2 { font-size: 1rem; margin: 0 0 1rem; }
.chart { display: flex; align-items: flex-end; gap: 6px; height: 220px; overflow-x: auto; }
.chart__col { flex: 1; min-width: 30px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px; height: 100%; }
.chart__bar { width: 100%; max-width: 42px; min-height: 2px; background: var(--secondary); border-radius: 6px 6px 2px 2px; transition: height 0.4s ease; }
.chart__col:hover .chart__bar { opacity: 0.8; }
.chart__label { font-size: 0.7rem; color: var(--on-surface-variant); white-space: nowrap; }


.chart__col--today .chart__bar {
  background: color-mix(in srgb, var(--secondary) 30%, transparent);
  border: 2px dashed var(--secondary);
  box-sizing: border-box;
}
.chart__col--today .chart__label { color: var(--secondary); font-weight: 700; }
.daily-item--today .daily-list__bar i {
  background: repeating-linear-gradient(45deg, var(--secondary) 0 6px, transparent 6px 10px);
}

.line-chart-wrapper {
  position: relative;
  height: 280px;
}

.line-chart {
  width: 100%;
  height: 100%;
}

.grid-line {
  stroke: rgba(255,255,255,.08);
  stroke-width: .3;
}

.hover-line {
  stroke: rgba(255,255,255,.35);
  stroke-width: .35;
  stroke-dasharray: 1.2 1.2;
}

.chart-tooltip {
  position: absolute;
  top: 12px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(8,18,40,.92);
  border: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(10px);
  pointer-events: none;
}

.chart-tooltip strong {
  color: white;
  font-size: .85rem;
}

.chart-tooltip span {
  color: #16c6f2;
  font-weight: 600;
}

.profit-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  padding: 0.65rem 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  font-size: 0.85rem;
}

.profit-warning .material-symbols-outlined {
  font-size: 18px;
}

.profit-legend {
  display: flex;
  gap: 1.25rem;
  margin: 0.5rem 0 0.75rem;
  font-size: 0.85rem;
  color: var(--on-surface-variant);
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.4rem;
}

.legend-dot--revenue { background: #16c6f2; }
.legend-dot--cost { background: #fb7185; }
.legend-dot--profit { background: #818cf8; }

.profit-chart-wrapper {
  position: relative;
}

.profit-chart {
  display: block;
  width: 100%;
  height: auto;
}

.profit-tooltip {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0.6rem;
  border: 1px solid var(--outline);
  background: var(--surface-container, #0f172a);
  font-size: 0.8rem;
  pointer-events: none;
}

.grid-line {
  stroke: rgba(148, 163, 184, 0.15);
  stroke-width: 1;
}

.zero-line {
  stroke: rgba(148, 163, 184, 0.55);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.hover-line {
  stroke: rgba(148, 163, 184, 0.5);
  stroke-width: 1;
}

.axis-text {
  fill: var(--on-surface-variant, #94a3b8);
  font-size: 11px;
}

.series {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.series--revenue { stroke: #16c6f2; }
.series--cost { stroke: #fb7185; }
.series--profit { stroke: #818cf8; }

.pt { pointer-events: none; }
.pt--revenue { fill: #16c6f2; }
.pt--cost { fill: #fb7185; }
.pt--profit { fill: #818cf8; }

.pt-hover {
  stroke: white;
  stroke-width: 2;
  pointer-events: none;
}

.compare {
  flex-wrap: wrap;
}

.compare em {
  white-space: nowrap;
}

</style>
