<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getRevenueDetail } from "@/service/dashboardService";

const router = useRouter();

// --- 狀態管理 ---
const activePreset = ref("week");
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

// --- 日期處理與快捷按鈕 ---
function toLocalDateStr(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const todayStr = toLocalDateStr(new Date());

function applyPreset(preset) {
  activePreset.value = preset;
  const today = new Date();
  let start, end, defaultGroup = "DAY";

  if (preset === "week") {
    const day = today.getDay() === 0 ? 7 : today.getDay();
    start = new Date(today); start.setDate(today.getDate() - (day - 1));
    end = today;
    defaultGroup = "DAY";
  } else if (preset === "month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = today;
    defaultGroup = "DAY";
  } else if (preset === "year") {
    start = new Date(today.getFullYear(), 0, 1);
    end = today;
    defaultGroup = "MONTH";
  } else if (preset === "custom") {
    // 修正：只有「還沒選過日期」時才帶入今天，否則沿用現有選擇
    start = startDate.value ? new Date(startDate.value) : today;
    end = endDate.value ? new Date(endDate.value) : today;
    defaultGroup = groupBy.value;
  }

  startDate.value = toLocalDateStr(start);
  endDate.value = toLocalDateStr(end);
  groupBy.value = defaultGroup;
  load();
}

function changeGroupBy(newGroup) {
  if (groupBy.value === newGroup) return;
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
  load();
}

const availableGroups = computed(() => {
  switch (activePreset.value) {
    case "week":
      return ["DAY"];

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
    const result = await getRevenueDetail(startDate.value, endDate.value, groupBy.value);
    if (seq !== requestSeq) return; // 已經有更新的請求發出，丟棄這次結果
    data.value = result;
  } catch (e) {
    if (seq !== requestSeq) return;
    console.error("❌ API 呼叫失敗:", e);
    errorMessage.value = "載入營收資料失敗";
    data.value = null;
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

// --- 圖表與統計計算（不變） ---
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

const useLineChart = computed(() => {
  return (data.value?.dailyTrend?.length ?? 0) > 31;
});

const chartWidth = 1000;
const chartHeight = 280;
const topPadding = 20;
const bottomPadding = 30;
const usableHeight = chartHeight - topPadding - bottomPadding;

function pointX(index, total) {
  return (index / Math.max(total - 1, 1)) * chartWidth;
}

function pointY(revenue) {
  return topPadding +
    (1 - (Number(revenue) || 0) / maxRevenue.value) * usableHeight;
}

const linePoints = computed(() => {
  const list = data.value?.dailyTrend ?? [];
  if (!list.length) return "";

  return list
    .map((d, i) => `${pointX(i, list.length)},${pointY(d.revenue)}`)
    .join(" ");
});

function barHeight(revenue) {
  return `${(Number(revenue) / maxRevenue.value) * 100}%`;
}

function labelOf(dateStr) {
  if (!dateStr) return "";
  if (groupBy.value === "YEAR") return dateStr.substring(0, 4);
  if (groupBy.value === "MONTH") return dateStr.substring(0, 7);
  const d = new Date(dateStr + 'T00:00:00');
  return activePreset.value === "month" ? `${d.getDate()}` : `${d.getMonth() + 1}/${d.getDate()}`;
}

const compareLabel = computed(() => {
  if (groupBy.value === "YEAR") return "較去年同期";
  if (groupBy.value === "MONTH") return "較上月同期";
  return "較前 7 天同期";
});

function isToday(dateStr) {
  return dateStr === todayStr && groupBy.value === "DAY";
}

function tooltipOf(day) {
  const base = `${day.date} ${formatCurrency(day.revenue)}`;
  return isToday(day.date) ? `${base}（今日進行中）` : base;
}

const bestLabel = computed(() => {
  if (groupBy.value === "DAY") return "最佳單日";
  if (groupBy.value === "MONTH") return "最佳月份";
  return "最佳年度";
});

const hoveredIndex = ref(null);

const hoveredDay = computed(() => {
  if (hoveredIndex.value == null) return null;
  return data.value?.dailyTrend?.[hoveredIndex.value] ?? null;
});

onMounted(() => applyPreset("week"));
</script>

<template>
  <div class="revenue-detail">
    <button class="back-link" @click="router.back()">
      <span class="material-symbols-outlined">arrow_back</span>
      返回 Dashboard
    </button>

    <div class="page-head">
      <h1>營收報表</h1>
    </div>

    <!-- 篩選器：快捷按鈕 + 自訂日期 -->
    <div class="filter-bar">
      <div class="range-tabs">
        <button :class="{ active: activePreset === 'week' }" @click="applyPreset('week')">近 7 天</button>
        <button :class="{ active: activePreset === 'month' }" @click="applyPreset('month')">本月</button>
        <button :class="{ active: activePreset === 'year' }" @click="applyPreset('year')">本年</button>
        <button :class="{ active: activePreset === 'custom' }" @click="applyPreset('custom')">自訂</button>
      </div>
      
      <!-- B. 自訂日期輸入 (僅在自訂時顯示) -->
      <div v-if="activePreset === 'custom'" class="custom-date-range">
        <input type="date" v-model="startDate" @change="onCustomDateChange" class="input-glow" />
        <span class="date-separator">至</span>
        <input type="date" v-model="endDate" @change="onCustomDateChange" class="input-glow" />
      </div>

      <!-- C. 顯示粒度切換 (獨立出來，隨時可切換！) -->
      <div class="group-by-tabs">
        <span class="group-by-label">顯示方式：</span>

        <button
          v-for="option in ['DAY','MONTH','YEAR']"
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
      <!-- 統計卡片 -->
      <div class="summary-grid">
        <div class="bento-card summary-card">
          <dt>總營收</dt>
          <dd class="summary-value">{{ formatCurrency(data.totalRevenue) }}</dd>
          <dd class="summary-compare">
            <span v-if="data.changeRate == null" class="compare compare--na">上期無營收資料</span>
            <span v-else :class="['compare', data.changeRate >= 0 ? 'compare--up' : 'compare--down']">
              <span class="material-symbols-outlined">{{ data.changeRate >= 0 ? "trending_up" : "trending_down" }}</span>
              {{ data.changeRate >= 0 ? "+" : "" }}{{ data.changeRate }}%
              <em>{{ compareLabel }}</em>
            </span>
          </dd>
          <dd v-if="data.previousRevenue != null" class="summary-sub">上期：{{ formatCurrency(data.previousRevenue) }}</dd>
        </div>
        <div class="bento-card summary-card">
          <dt>日均營收</dt>
          <dd class="summary-value">{{ formatCurrency(avgRevenue) }}</dd>
        </div>
        <div v-if="bestDay" class="bento-card summary-card">
          <dt>{{ bestLabel }}</dt>
          <dd class="summary-value">{{ labelOf(bestDay.date) }}</dd>
          <dd class="summary-sub">{{ formatCurrency(bestDay.revenue) }}</dd>
        </div>
      </div>

      <!-- 圖表 -->
      <div class="bento-card chart-card">
        <h2>
          營收趨勢
          ({{ groupBy === 'DAY' ? '每日' : groupBy === 'MONTH' ? '每月' : '每年' }})
        </h2>

        <!-- 長條圖 -->
        <div v-if="!useLineChart" class="chart">
          <div
            v-for="day in data.dailyTrend"
            :key="day.date"
            class="chart__col"
            :class="{ 'chart__col--today': isToday(day.date) }"
            :title="tooltipOf(day)"
          >
            <div
              class="chart__bar"
              :style="{ height: barHeight(day.revenue) }"
            ></div>

            <span class="chart__label">
              {{ isToday(day.date) ? "今日" : labelOf(day.date) }}
            </span>
          </div>
        </div>

        <!-- 折線圖 -->
        <div v-else class="line-chart-wrapper">
          <div v-if="hoveredDay" class="chart-tooltip">
            <strong>{{ hoveredDay.date }}</strong>
            <span>{{ formatCurrency(hoveredDay.revenue) }}</span>
          </div>
          <svg viewBox="0 0 1000 280" class="line-chart">

            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#16c6f2" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#16c6f2" stop-opacity="0"/>
              </linearGradient>
            </defs>

            <!-- 網格線 -->
            <line x1="0" y1="15" x2="100" y2="15" class="grid-line"/>
            <line x1="0" y1="45" x2="100" y2="45" class="grid-line"/>
            <line x1="0" y1="75" x2="100" y2="75" class="grid-line"/>

            <!-- Hover 垂直線 -->
            <line
              v-if="hoveredIndex !== null"
              :x1="pointX(hoveredIndex, data.dailyTrend.length)"
              :x2="pointX(hoveredIndex, data.dailyTrend.length)"
              y1="10"
              y2="85"
              class="hover-line"
            />

            <!-- 漸層 -->
            <polygon
              :points="`${linePoints} ${chartWidth},${chartHeight} 0,${chartHeight}`"
              fill="url(#revenueGradient)"
              pointer-events="none"
            />

            <!-- 折線 -->
            <polyline
              :points="linePoints"
              fill="none"
              stroke="#16c6f2"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
              pointer-events="none"
            />

            <!-- Hover 熱區 -->
            <g v-for="(day, index) in data.dailyTrend" :key="day.date">
              <circle
                :cx="pointX(index, data.dailyTrend.length)"
                :cy="pointY(day.revenue)"
                r="4"
                fill="transparent"
                @mouseenter="hoveredIndex = index"
                @mouseleave="hoveredIndex = null"
              />

              <!-- 高亮點 -->
              <circle
                v-if="hoveredIndex === index"
                :cx="pointX(index, data.dailyTrend.length)"
                :cy="pointY(day.revenue)"
                r="0.9"
                fill="#16c6f2"
                stroke="white"
                stroke-width="0.25"
                pointer-events="none"
              />
            </g>
          </svg>

          <div class="line-labels">
            <span>{{ labelOf(data.dailyTrend[0]?.date) }}</span>
            <span>{{ labelOf(data.dailyTrend.at(-1)?.date) }}</span>
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
</style>