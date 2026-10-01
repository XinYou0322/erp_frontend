<template>
  <div class="space-y-6 pb-12">
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="缺貨原物料"
        :value="summary.outOfStock"
        subtitle="目前可用庫存已不足"
        variant="danger"
        :icon="CircleAlert"
      />
      <MetricCard
        title="高風險原物料"
        :value="summary.highRisk"
        subtitle="庫存可能無法支撐採購交期"
        variant="danger"
        :icon="TriangleAlert"
      />
      <MetricCard
        title="需要注意"
        :value="summary.attention"
        subtitle="接近交期安全範圍"
        variant="amber"
        :icon="Clock3"
      />
      <MetricCard
        title="建議補貨品項"
        :value="summary.suggested"
        subtitle="建議採購量大於零"
        variant="cyan"
        :icon="PackagePlus"
      />
    </section>

    <Transition name="inventory-filter">
      <Filter
        v-show="filtersExpanded"
        v-model="filters"
        id-prefix="replenishment"
        :fields="filterFields"
        :reset-values="defaultFilters"
        reset-text="清除條件"
        @reset="currentPage = 1"
        @filter-changed="currentPage = 1"
      />
    </Transition>

    <div
      v-if="loading"
      class="rounded-2xl border border-[var(--outline)] bg-[var(--surface-container)] p-8 text-center text-[var(--on-surface-variant)]"
    >
      正在計算補貨建議...
    </div>

    <div
      v-else-if="errorMessage"
      class="rounded-2xl border border-[var(--error)]/30 bg-[var(--error)]/10 p-4 text-[var(--error)]"
    >
      <p class="font-bold">無法取得補貨建議</p>
      <p class="mt-1 text-sm">{{ errorMessage }}</p>
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--on-surface-variant)]">
        <p>
          分析日期：<span class="font-data-mono font-bold text-[var(--on-surface)]">{{ analysisDate }}</span>
          ｜依 7 日與 30 日平均耗用較高者估算
        </p>
        <p>共 {{ filteredSuggestions.length }} 項原物料</p>
      </div>

      <div class="data-table-card">
        <div class="data-table-scroll">
          <table class="data-table data-table--fixed">
            <colgroup>
              <col class="w-[18%]" />
              <col class="w-[15%]" />
              <col class="w-[17%]" />
              <col class="w-[12%]" />
              <col class="w-[15%]" />
              <col class="w-[11%]" />
              <col class="w-[12%]" />
            </colgroup>
            <thead>
              <tr class="data-table__head-row">
                <th class="data-table__header">原物料</th>
                <th class="data-table__header">可用／安全庫存</th>
                <th class="data-table__header">平均每日耗用</th>
                <th class="data-table__header">預估可用天數</th>
                <th class="data-table__header">建議補貨</th>
                <th class="data-table__header">風險</th>
                <th class="data-table__header data-table__header--right">詳細資訊</th>
              </tr>
            </thead>

            <tbody class="data-table__body">
              <template v-for="item in paginatedSuggestions" :key="item.materialId">
                <tr class="data-table__row">
                  <td class="data-table__cell">
                    <div class="font-bold text-[var(--on-surface)]">{{ item.materialName }}</div>
                    <div class="mt-1 font-data-mono text-xs text-[var(--on-surface-variant)]">
                      {{ item.materialCode }}
                    </div>
                  </td>
                  <td class="data-table__cell">
                    <div class="font-data-mono font-bold text-[var(--on-surface)]">
                      {{ formatQuantity(item.availableQuantity) }} {{ item.unit }}
                    </div>
                    <div class="mt-1 text-xs text-[var(--on-surface-variant)]">
                      安全 {{ formatQuantity(item.safetyStock) }} {{ item.unit }}
                    </div>
                  </td>
                  <td class="data-table__cell">
                    <div class="font-data-mono text-[var(--on-surface)]">
                      {{ formatQuantity(item.selectedAverageDailyUsage) }} {{ item.unit }}
                    </div>
                    <div class="mt-1 text-xs text-[var(--on-surface-variant)]">
                      7 日 {{ formatQuantity(item.averageDailyUsage7Days) }}／30 日 {{ formatQuantity(item.averageDailyUsage30Days) }}
                    </div>
                  </td>
                  <td class="data-table__cell font-data-mono">
                    <span v-if="item.estimatedDaysRemaining != null">
                      {{ formatQuantity(item.estimatedDaysRemaining) }} 天
                    </span>
                    <span v-else class="text-[var(--on-surface-variant)]">無近期耗用</span>
                    <div class="mt-1 text-xs text-[var(--on-surface-variant)]">
                      交期 {{ item.leadTimeDays }} 天
                    </div>
                  </td>
                  <td class="data-table__cell">
                    <div
                      class="font-data-mono font-bold"
                      :class="Number(item.suggestedPurchaseQuantity) > 0 ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'"
                    >
                      {{ formatQuantity(item.suggestedPurchaseQuantity) }} {{ item.unit }}
                    </div>
                    <div class="mt-1 text-xs text-[var(--on-surface-variant)]">
                      {{ formatQuantity(item.suggestedPackageCount) }} 包
                    </div>
                  </td>
                  <td class="data-table__cell">
                    <BaseBadge :variant="riskMeta(item.riskLevel).variant" dot size="sm">
                      {{ riskMeta(item.riskLevel).label }}
                    </BaseBadge>
                  </td>
                  <td class="data-table__cell data-table__cell--right">
                    <button
                      type="button"
                      class="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1.5 text-sm font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
                      @click="toggleDetails(item.materialId)"
                    >
                      {{ expandedMaterialId === item.materialId ? "收起" : "查看建議" }}
                    </button>
                  </td>
                </tr>

                <tr v-if="expandedMaterialId === item.materialId">
                  <td colspan="7" class="bg-[var(--surface-container-low)] px-6 py-5">
                    <div class="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
                      <div>
                        <p class="text-xs font-bold text-[var(--on-surface-variant)]">系統建議</p>
                        <p class="mt-2 leading-7 text-[var(--on-surface)]">{{ formatRecommendation(item.recommendation) }}</p>
                      </div>
                      <dl class="grid grid-cols-3 gap-2 text-xs">
                        <div class="rounded-lg border border-[var(--outline)] bg-[var(--surface-container)] px-2.5 py-2">
                          <dt class="truncate text-[var(--on-surface-variant)]" title="到貨前預估用量">到貨前預估用量</dt>
                          <dd class="mt-1 whitespace-nowrap font-data-mono font-bold">{{ formatQuantity(item.leadTimeDemandQuantity) }} {{ item.unit }}</dd>
                        </div>
                        <div class="rounded-lg border border-[var(--outline)] bg-[var(--surface-container)] px-2.5 py-2">
                          <dt class="truncate text-[var(--on-surface-variant)]" title="已核准待到貨">已核准待到貨</dt>
                          <dd class="mt-1 whitespace-nowrap font-data-mono font-bold">{{ formatQuantity(item.pendingPurchasePackageCount) }} {{ item.purchaseUnit || item.unit }}</dd>
                        </div>
                        <div class="rounded-lg border border-[var(--outline)] bg-[var(--surface-container)] px-2.5 py-2">
                          <dt class="truncate text-[var(--on-surface-variant)]" title="過期庫存（不計可用）">過期庫存</dt>
                          <dd class="mt-1 whitespace-nowrap font-data-mono font-bold">{{ formatQuantity(item.expiredQuantity) }} {{ item.unit }}</dd>
                        </div>
                      </dl>
                      <ReplenishmentChart
                        class="lg:col-span-2"
                        :item="item"
                      />
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="filteredSuggestions.length === 0">
                <td colspan="7" class="py-12 text-center text-[var(--on-surface-variant)]">
                  沒有符合目前篩選條件的補貨建議
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @change-page="goToPage"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { CircleAlert, Clock3, PackagePlus, TriangleAlert } from "lucide-vue-next";

import BaseBadge from "@/component/子元件/BaseBadge.vue";
import Filter from "@/component/子元件/Filter.vue";
import MetricCard from "@/component/子元件/MetricCard.vue";
import Pagination from "@/component/子元件/Pagination.vue";
import ReplenishmentChart from "@/component/父元件/ReplenishmentChart.vue";
import { getReplenishmentSuggestions } from "@/service/operationsAnalyticsService";

defineProps({
  filtersExpanded: {
    type: Boolean,
    default: false,
  },
});

const suggestions = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const currentPage = ref(1);
const pageSize = 8;
const expandedMaterialId = ref(null);
const analysisDate = ref(toLocalDateInput(new Date()));

const defaultFilters = {
  keyword: "",
  riskLevel: "",
  suggestionState: "all",
};
const filters = ref({ ...defaultFilters });

const filterFields = [
  {
    key: "riskLevel",
    type: "select",
    label: "風險等級",
    options: [
      { label: "全部風險", value: "" },
      { label: "缺貨", value: "OUT_OF_STOCK" },
      { label: "高風險", value: "HIGH" },
      { label: "需要注意", value: "ATTENTION" },
      { label: "正常", value: "NORMAL" },
      { label: "無近期耗用", value: "NO_RECENT_USAGE" },
    ],
  },
  {
    key: "suggestionState",
    type: "select",
    label: "補貨狀態",
    options: [
      { label: "全部原物料", value: "all" },
      { label: "只看建議補貨", value: "suggested" },
      { label: "暫不需補貨", value: "notSuggested" },
    ],
  },
  {
    key: "keyword",
    type: "search",
    label: "搜尋原物料",
    placeholder: "輸入名稱或料號",
    grow: true,
  },
];

const filteredSuggestions = computed(() => {
  const keyword = filters.value.keyword.trim().toLowerCase();

  return suggestions.value.filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.materialName?.toLowerCase().includes(keyword) ||
      item.materialCode?.toLowerCase().includes(keyword);
    const matchesRisk =
      !filters.value.riskLevel || item.riskLevel === filters.value.riskLevel;
    const quantity = Number(item.suggestedPurchaseQuantity || 0);
    const matchesSuggestion =
      filters.value.suggestionState === "all" ||
      (filters.value.suggestionState === "suggested" && quantity > 0) ||
      (filters.value.suggestionState === "notSuggested" && quantity <= 0);

    return matchesKeyword && matchesRisk && matchesSuggestion;
  });
});

const summary = computed(() => ({
  outOfStock: suggestions.value.filter((item) => item.riskLevel === "OUT_OF_STOCK").length,
  highRisk: suggestions.value.filter((item) => item.riskLevel === "HIGH").length,
  attention: suggestions.value.filter((item) => item.riskLevel === "ATTENTION").length,
  suggested: suggestions.value.filter((item) => Number(item.suggestedPurchaseQuantity) > 0).length,
}));

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSuggestions.value.length / pageSize)),
);
const paginatedSuggestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredSuggestions.value.slice(start, start + pageSize);
});

watch(filteredSuggestions, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
  expandedMaterialId.value = null;
});

function toLocalDateInput(date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatQuantity(value) {
  if (value == null || value === "") return "—";
  return Math.round(Number(value)).toLocaleString("zh-TW");
}

function formatRecommendation(value) {
  if (!value) return "目前沒有系統建議。";
  return value.replace(/-?\d+(?:\.\d+)?/g, (number) =>
    Math.round(Number(number)).toLocaleString("zh-TW"),
  );
}

function riskMeta(riskLevel) {
  const risks = {
    OUT_OF_STOCK: { label: "缺貨", variant: "danger" },
    HIGH: { label: "高風險", variant: "danger" },
    ATTENTION: { label: "需要注意", variant: "warning" },
    NORMAL: { label: "正常", variant: "success" },
    NO_RECENT_USAGE: { label: "無近期耗用", variant: "neutral" },
  };
  return risks[riskLevel] ?? { label: riskLevel || "未知", variant: "neutral" };
}

function toggleDetails(materialId) {
  expandedMaterialId.value = expandedMaterialId.value === materialId ? null : materialId;
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  expandedMaterialId.value = null;
}

async function loadSuggestions() {
  loading.value = true;
  errorMessage.value = "";
  expandedMaterialId.value = null;

  try {
    const response = await getReplenishmentSuggestions({
      date: analysisDate.value,
      historyDays: 7,
      forecastDays: 7,
    });
    suggestions.value = Array.isArray(response.data) ? response.data : [];
    currentPage.value = 1;
  } catch (error) {
    console.error("取得補貨建議失敗：", error);
    errorMessage.value = error.response?.data?.message || "請確認後端服務與分析 API 是否正常。";
  } finally {
    loading.value = false;
  }
}

defineExpose({ refresh: loadSuggestions });

onMounted(loadSuggestions);
</script>

