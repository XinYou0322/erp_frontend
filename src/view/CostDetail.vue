<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getCostDetail } from "@/service/dashboardService";

const router = useRouter();

// --- 狀態管理 ---
const activePreset = ref("month");
const startDate = ref("");
const endDate = ref("");
const groupBy = ref("DAY");

const data = ref(null);
const loading = ref(false);
const errorMessage = ref("");

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency", currency: "TWD", maximumFractionDigits: 0,
});
function formatCurrency(value) { return currency.format(Number(value) || 0); }

// --- 日期處理 ---
function toLocalDateStr(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const todayStr = toLocalDateStr(new Date());

// 依目前區間決定可選的顯示方式
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

// 目前選的顯示方式若不在可用範圍內（例如縮短自訂區間），退回可用的最粗粒度
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
    // custom：沿用現有日期；加上 T00:00:00 避免被當成 UTC 解析
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
    data.value = null;
    return;
  }
  clampGroupBy();
  load();
}

// --- 競態保護 ---
let requestSeq = 0;

async function load() {
  if (!startDate.value || !endDate.value) return;
  if (startDate.value > endDate.value) {
    errorMessage.value = "開始日期不能晚於結束日期";
    data.value = null;
    return;
  }

  const seq = ++requestSeq;
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await getCostDetail(startDate.value, endDate.value, groupBy.value);
    if (seq !== requestSeq) return; // 已有更新的請求，丟棄舊結果
    data.value = result;
  } catch (e) {
    if (seq !== requestSeq) return;
    console.error("❌ API 呼叫失敗:", e);
    errorMessage.value = "載入成本資料失敗";
    data.value = null;
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

// --- 統計計算 ---
const trend = computed(() => data.value?.dailyTrend ?? []);

const maxCost = computed(() =>
  Math.max(...trend.value.map((d) => Number(d.cost) || 0), 1),
);

// 平均：依顯示方式決定是日均、月均還是年均
const avgCost = computed(() => {
  if (!trend.value.length) return 0;
  return Number(data.value.totalCost) / trend.value.length;
});

const avgLabel = computed(() => {
  if (groupBy.value === "MONTH") return "月均成本";
  if (groupBy.value === "YEAR") return "年均成本";
  return "日均成本";
});

// 成本最高的時間桶；全部為 0 時不顯示
const peak = computed(() => {
  if (!trend.value.length) return null;
  const top = trend.value.reduce((a, b) => (Number(b.cost) > Number(a.cost) ? b : a));
  return Number(top.cost) > 0 ? top : null;
});

const peakLabel = computed(() => {
  if (groupBy.value === "MONTH") return "成本最高月份";
  if (groupBy.value === "YEAR") return "成本最高年度";
  return "成本最高單日";
});

const compareLabel = computed(() => {
  if (activePreset.value === "year") return "較去年同期";
  if (activePreset.value === "month") return "較上月同期";
  return "較前一期間";
});

// --- 圖表 ---
const useLineChart = computed(() => trend.value.length > 31);

const chartWidth = 1000;
const chartHeight = 280;
const topPadding = 20;
const bottomPadding = 30;
const usableHeight = chartHeight - topPadding - bottomPadding;
const baseY = chartHeight - bottomPadding;

function pointX(index, total) {
  return (index / Math.max(total - 1, 1)) * chartWidth;
}

function pointY(cost) {
  return topPadding + (1 - (Number(cost) || 0) / maxCost.value) * usableHeight;
}

const linePoints = computed(() =>
  trend.value.map((d, i) => `${pointX(i, trend.value.length)},${pointY(d.cost)}`).join(" "),
);

// 4 條水平網格線，橫跨整個圖表寬度
const gridYs = computed(() =>
  [0, 1, 2, 3].map((k) => topPadding + (usableHeight * k) / 3),
);

// 每個資料點的 hover 感應寬度
const hitWidth = computed(() => chartWidth / Math.max(trend.value.length - 1, 1));

function barHeight(cost) {
  return `${(Number(cost) / maxCost.value) * 100}%`;
}

function labelOf(dateStr) {
  if (!dateStr) return "";
  if (groupBy.value === "YEAR") return dateStr.substring(0, 4);
  if (groupBy.value === "MONTH") return dateStr.substring(0, 7);
  const d = new Date(dateStr + "T00:00:00");
  return activePreset.value === "month" ? `${d.getDate()}` : `${d.getMonth() + 1}/${d.getDate()}`;
}

function isToday(dateStr) {
  return dateStr === todayStr && groupBy.value === "DAY";
}

function tooltipOf(day) {
  const base = `${day.date} ${formatCurrency(day.cost)}`;
  return isToday(day.date) ? `${base}（今日進行中）` : base;
}

const hoveredIndex = ref(null);
const hoveredDay = computed(() =>
  hoveredIndex.value == null ? null : trend.value[hoveredIndex.value] ?? null,
);

onMounted(() => applyPreset("month"));
</script>

<template>
  <div class="revenue-detail cost-detail">
    <button class="back-link" @click="router.back()">
      <span class="material-symbols-outlined">arrow_back</span>
      返回 Dashboard
    </button>

    <div class="page-head">
      <h1>成本報表</h1>
    </div>

    <!-- 篩選器：快捷按鈕 + 自訂日期 -->
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

    <template v-else-if="data && Array.isArray(data.dailyTrend)">
      <!-- 缺成本提醒 -->
      <p v-if="data.missingCostCount > 0" class="cost-warning">
        <span class="material-symbols-outlined">warning</span>
        本區間有 {{ data.missingCostCount }} 筆銷售明細缺少成本資料，實際成本可能更高
      </p>

      <!-- 統計卡片 -->
      <div class="summary-grid">
        <div class="bento-card summary-card">
          <dt>總成本</dt>
          <dd class="summary-value">{{ formatCurrency(data.totalCost) }}</dd>
          <dd class="summary-compare">
            <span v-if="data.changeRate == null" class="compare compare--na">上期無成本資料</span>
            <!-- 成本上升是壞事，所以顏色與營收頁相反：上升用 down 樣式（警示色），下降用 up 樣式 -->
            <span v-else :class="['compare', data.changeRate > 0 ? 'compare--down' : 'compare--up']">
              <span class="material-symbols-outlined">{{ data.changeRate >= 0 ? "trending_up" : "trending_down" }}</span>
              {{ data.changeRate >= 0 ? "+" : "" }}{{ data.changeRate }}%
              <em>{{ compareLabel }}</em>
            </span>
          </dd>
          <dd v-if="data.previousCost != null" class="summary-sub">上期：{{ formatCurrency(data.previousCost) }}</dd>
        </div>
        <div class="bento-card summary-card">
          <dt>{{ avgLabel }}</dt>
          <dd class="summary-value">{{ formatCurrency(avgCost) }}</dd>
        </div>
        <div v-if="peak" class="bento-card summary-card">
          <dt>{{ peakLabel }}</dt>
          <dd class="summary-value">{{ labelOf(peak.date) }}</dd>
          <dd class="summary-sub">{{ formatCurrency(peak.cost) }}</dd>
        </div>
      </div>

      <!-- 圖表 -->
      <div class="bento-card chart-card">
        <h2>
          成本趨勢
          ({{ groupBy === 'DAY' ? '每日' : groupBy === 'MONTH' ? '每月' : '每年' }})
        </h2>

        <!-- 長條圖 -->
        <div v-if="!useLineChart" class="chart">
          <div
            v-for="day in trend"
            :key="day.date"
            class="chart__col"
            :class="{ 'chart__col--today': isToday(day.date) }"
            :title="tooltipOf(day)"
          >
            <div class="chart__bar" :style="{ height: barHeight(day.cost) }"></div>
            <span class="chart__label">
              {{ isToday(day.date) ? "今日" : labelOf(day.date) }}
            </span>
          </div>
        </div>

        <!-- 折線圖 -->
        <div v-else class="line-chart-wrapper">
          <div v-if="hoveredDay" class="chart-tooltip">
            <strong>{{ hoveredDay.date }}</strong>
            <span>{{ formatCurrency(hoveredDay.cost) }}</span>
          </div>

          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="line-chart">
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
              </linearGradient>
            </defs>

            <!-- 網格線 -->
            <line
              v-for="y in gridYs"
              :key="y"
              x1="0"
              :x2="chartWidth"
              :y1="y"
              :y2="y"
              class="grid-line"
            />

            <!-- Hover 垂直線 -->
            <line
              v-if="hoveredIndex !== null"
              :x1="pointX(hoveredIndex, trend.length)"
              :x2="pointX(hoveredIndex, trend.length)"
              :y1="topPadding"
              :y2="baseY"
              class="hover-line"
            />

            <!-- 漸層 -->
            <polygon
              :points="`${linePoints} ${chartWidth},${baseY} 0,${baseY}`"
              fill="url(#costGradient)"
              pointer-events="none"
            />

            <!-- 折線 -->
            <polyline
              :points="linePoints"
              fill="none"
              stroke="#f59e0b"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
              pointer-events="none"
            />

            <!-- 高亮點 -->
            <circle
              v-if="hoveredIndex !== null && trend[hoveredIndex]"
              :cx="pointX(hoveredIndex, trend.length)"
              :cy="pointY(trend[hoveredIndex].cost)"
              r="5"
              fill="#f59e0b"
              stroke="white"
              stroke-width="2"
              pointer-events="none"
            />

            <!-- Hover 感應區：每個資料點一條垂直長條，最後畫才會在最上層 -->
            <rect
              v-for="(day, index) in trend"
              :key="'hit-' + day.date"
              :x="pointX(index, trend.length) - hitWidth / 2"
              y="0"
              :width="hitWidth"
              :height="chartHeight"
              fill="transparent"
              @mouseenter="hoveredIndex = index"
              @mouseleave="hoveredIndex = null"
            />
          </svg>

          <div class="line-labels">
            <span>{{ labelOf(trend[0]?.date) }}</span>
            <span>{{ labelOf(trend.at(-1)?.date) }}</span>
          </div>
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

.cost-warning {
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

.cost-warning .material-symbols-outlined {
  font-size: 18px;
}
</style>
