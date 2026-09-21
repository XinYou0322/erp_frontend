<template>
  <div class="filter-bar shadow-level-1">
    <div class="filter-side filter-side--left">
    <!-- 狀態下拉選單。 -->
    <div
      v-if="showStatus"
      class="filter-group filter-group--select filter-group--status"
    >
      <label :for="`${idPrefix}-status`" class="filter-label">
        {{ statusLabel }}
      </label>

      <select
        :id="`${idPrefix}-status`"
        :value="statusValue"
        class="filter-select input-glow"
        @change="handleStatusChange"
      >
        <option value="">
          {{ statusDefaultText }}
        </option>
        <option
          v-for="option in statusOptions"
          :key="option.key ?? String(option.value)"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- 【我新增】供應商下拉選單。 -->
    <div
      v-if="showSupplier"
      class="filter-group filter-group--select filter-group--supplier"
    >
      <label :for="`${idPrefix}-supplier`" class="filter-label">
        {{ supplierLabel }}
      </label>

      <select
        :id="`${idPrefix}-supplier`"
        :value="supplierValue"
        class="filter-select input-glow"
        @change="handleSupplierChange"
      >
        <option value="">
          {{ supplierDefaultText }}
        </option>
        <option
          v-for="option in supplierOptions"
          :key="option.key ?? String(option.value)"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- 採購日期區間。 -->
    <div
      v-if="showDateRange"
      class="filter-group filter-group--date-range"
    >
      <span class="filter-label">
        {{ dateLabel }}
      </span>

      <div class="filter-date-range">
        <input
          :id="`${idPrefix}-start-date`"
          :value="startDate"
          type="date"
          :min="minDate"
          :max="maxDate"
          class="filter-input input-glow"
          aria-label="日期起日"
          @input="handleStartDateInput"
        />

        <span class="filter-date-sep">
          {{ dateSeparator }}
        </span>

        <input
          :id="`${idPrefix}-end-date`"
          :value="endDate"
          type="date"
          :min="minDate"
          :max="maxDate"
          class="filter-input input-glow"
          aria-label="日期迄日"
          @input="handleEndDateInput"
        />
      </div>
    </div>
  </div>
  <div class="filter-side filter-side--right">
    <!-- 文字搜尋欄位。 -->
    <div
      v-if="showSearch"
      class="filter-group filter-group--search filter-group--grow"
    >
      <label :for="`${idPrefix}-search`" class="filter-label">
        {{ searchLabel }}
      </label>

      <input
        :id="`${idPrefix}-search`"
        :value="searchValue"
        type="search"
        :placeholder="searchPlaceholder"
        autocomplete="off"
        class="filter-input filter-input--search input-glow"
        @input="handleSearchInput"
      />
    </div>

    <!--
      根據父元件傳入的 fields 動態產生篩選欄位。
      採購單頁、簽核頁只要傳入不同的 fields，就能共用這個元件。
      新版採購單不會使用這一段，但保留它可避免舊頁面失效。
    -->
    <div
      v-for="field in fields"
      :key="getFieldKey(field)"
      :class="[
        'filter-group',
        `filter-group--${field.type}`,
        field.groupClass,
        { 'filter-group--grow': field.grow },
      ]"
    >
      <!-- 一般欄位的標題；日期區間因為有兩個 input，所以使用 span 顯示群組標題。 -->
      <label
        v-if="field.type !== 'date-range'"
        :for="getInputId(field)"
        class="filter-label"
      >
        {{ field.label }}
      </label>
      <span v-else class="filter-label">
        {{ field.label }}
      </span>

      <!-- 下拉選單：選項內容全部由 field.options 傳入。 -->
      <select
        v-if="field.type === 'select'"
        :id="getInputId(field)"
        :value="getFilterValue(field.key)"
        :disabled="field.disabled"
        :class="['filter-select', 'input-glow', field.inputClass]"
        @change="handleSelectChange(field, $event)"
      >
        <option
          v-for="option in field.options ?? []"
          :key="option.key ?? String(option.value)"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- 日期區間：起日、迄日分別寫回 fromKey 與 toKey。 -->
      <div v-else-if="field.type === 'date-range'" class="filter-date-range">
        <input
          :id="`${getInputId(field)}-from`"
          :value="getFilterValue(field.fromKey)"
          type="date"
          :min="field.min"
          :max="field.max"
          :disabled="field.disabled"
          :aria-label="field.fromAriaLabel"
          :class="['filter-input', 'input-glow', field.inputClass]"
          @input="updateFilter(field.fromKey, $event.target.value)"
        />

        <span class="filter-date-sep">
          {{ field.separator }}
        </span>

        <input
          :id="`${getInputId(field)}-to`"
          :value="getFilterValue(field.toKey)"
          type="date"
          :min="field.min"
          :max="field.max"
          :disabled="field.disabled"
          :aria-label="field.toAriaLabel"
          :class="['filter-input', 'input-glow', field.inputClass]"
          @input="updateFilter(field.toKey, $event.target.value)"
        />
      </div>
      
      <!-- 文字／搜尋欄位：提示文字、欄位值同樣都由父元件傳入。 -->
      <input
        v-else-if="field.type === 'text' || field.type === 'search'"
        :id="getInputId(field)"
        :value="getFilterValue(field.key)"
        :type="field.type === 'search' ? 'search' : 'text'"
        :placeholder="field.placeholder"
        :autocomplete="field.autocomplete"
        :disabled="field.disabled"
        :class="[
          'filter-input',
          'input-glow',
          field.inputClass,
          { 'filter-input--search': field.type === 'search' },
        ]"
        @input="updateFilter(field.key, $event.target.value)"
      />
    </div>

    <div
      v-if="showPageSize || showRefresh"
      class="filter-actions"
    >
      <!-- 每頁筆數由父元件傳入，變更後通知父元件重新查詢。 -->
      <select
        v-if="showPageSize"
        :value="pageSize"
        class="filter-select filter-select--page-size input-glow"
        aria-label="每頁顯示筆數"
        @change="handlePageSizeChange"
      >
        <option
          v-for="option in pageSizeOptions"
          :key="String(getPageSizeValue(option))"
          :value="getPageSizeValue(option)"
        >
          {{ getPageSizeLabel(option) }}
        </option>
      </select>
      </div>
      <div>
      <!-- 更新按鈕只發出 refresh，由父元件決定要重新查詢哪些資料。 -->
      <button
        v-if="showRefresh"
        class="filter-refresh"
        type="button"
        :title="refreshTitle"
        :aria-label="refreshTitle"
        @click="handleRefresh"
      >
        {{ refreshText }}
      </button>
    </div>
</div>
    <!-- 按下後使用父元件傳入的 resetValues 重設，不在共用元件中寫死預設值。 -->
    <button
      v-if="showReset"
      class="filter-reset"
      type="button"
      @click="handleReset"
    >
      {{ resetText }}
    </button>
    
  </div>
</template>

<script setup>
const props = defineProps({
  // 【可變資料】目前所有篩選值，由父元件使用 v-model 傳入。
  // 例如：{ status: "all", keyword: "", dateFrom: "", dateTo: "" }
  modelValue: {
    type: Object,
    //改為非必填，讓父元件可以使用明確的多組 v-model。
    default: () => ({}),
  },

  // 【可變資料】決定要顯示哪些欄位，以及每個欄位的標題、選項與提示文字。
  // 支援的 type：select、date-range、text、search。
  fields: {
    type: Array,
    //未傳入 fields 時，不產生舊版動態欄位。
    default: () => [],
  },

  // 【可變資料】按下重設按鈕後要套用的值，完全由父元件決定。
  resetValues: {
    type: Object,
    // 明確 props 寫法不一定需要 resetValues。
    default: () => ({}),
  },

  // 【可變資料】重設按鈕顯示的文字，例如「重設」或「清除條件」。
  resetText: {
    type: String,
    // 提供預設文字，父元件可省略。
    default: "重設",
  },

  // 【可變設定】父元件可決定是否顯示重設按鈕。
  showReset: {
    type: Boolean,
    default: true,
  },

  // 【可變設定】避免同一頁使用多個 Filter 時產生重複的 input id。
  idPrefix: {
    type: String,
    default: "filter",
  },

  // ---------- 狀態篩選 props ----------
  showStatus: {
    type: Boolean,
    default: false,
  },
  statusLabel: {
    type: String,
    default: "狀態",
  },
  statusDefaultText: {
    type: String,
    default: "全部狀態",
  },
  statusOptions: {
    type: Array,
    default: () => [],
  },
  statusValue: {
    type: String,
    default: "",
  },

  // ---------- 供應商篩選 props ----------
  showSupplier: {
    type: Boolean,
    default: false,
  },
  supplierLabel: {
    type: String,
    default: "供應商",
  },
  supplierDefaultText: {
    type: String,
    default: "全部供應商",
  },
  supplierOptions: {
    type: Array,
    default: () => [],
  },
  supplierValue: {
    type: [Number, String],
    default: "",
  },

  // ---------- 日期區間 props ----------
  showDateRange: {
    type: Boolean,
    default: false,
  },
  dateLabel: {
    type: String,
    default: "日期區間",
  },
  startDate: {
    type: String,
    default: "",
  },
  endDate: {
    type: String,
    default: "",
  },
  dateSeparator: {
    type: String,
    default: "至",
  },
  minDate: {
    type: String,
    default: "",
  },
  maxDate: {
    type: String,
    default: "",
  },

  // ---------- 搜尋 props ----------
  showSearch: {
    type: Boolean,
    default: false,
  },
  searchLabel: {
    type: String,
    default: "搜尋",
  },
  searchPlaceholder: {
    type: String,
    default: "請輸入搜尋內容",
  },
  searchValue: {
    type: String,
    default: "",
  },

  // 父元件目前選擇的每頁筆數。
  pageSize: {
    type: [Number, String],
    default: 10,
  },

  // 筆數選項可傳數字，也可傳入 { label, value }。
  pageSizeOptions: {
    type: Array,
    default: () => [10, 30, 50],
  },

  // 控制是否顯示筆數選單。
  showPageSize: {
    type: Boolean,
    default: false,
  },

  // 控制是否顯示更新按鈕。
  showRefresh: {
    type: Boolean,
    default: false,
  },

  // 更新按鈕顯示的文字或符號。
  refreshText: {
    type: String,
    default: "↻",
  },

  // 更新按鈕的提示文字與無障礙名稱。
  refreshTitle: {
    type: String,
    default: "更新資料",
  },
});

const emit = defineEmits([
  // Vue 3 v-model 的固定事件名稱，負責把新值同步回父元件。
  "update:modelValue",

  // 每次條件改變時通知父元件，可在父元件中串接查詢 API。
  "filter-changed",

  // 按下重設時額外通知父元件，例如可用來把分頁切回第 1 頁。
  "reset",

  // 使用者改變每頁筆數時，將新筆數傳回父元件。
  "page-size-changed",

  // 使用者按下更新按鈕時通知父元件。
  "refresh",

  // 以下事件提供類似 HeadNavBar 的多組 v-model 寫法。
  "update:statusValue",
  "update:supplierValue",
  "update:startDate",
  "update:endDate",
  "update:searchValue",
  "update:pageSize",
]);
// 取得父元件目前傳入的欄位值；尚未設定時以空字串顯示。
function getFilterValue(key) {
  return props.modelValue[key] ?? "";
}

// 產生 v-for 所需的唯一 key；日期區間使用 fromKey 與 toKey 組合。
function getFieldKey(field) {
  return field.key ?? `${field.fromKey}-${field.toKey}`;
}

// 產生 label 與 input 對應用的 id。
function getInputId(field) {
  return `${props.idPrefix}-${getFieldKey(field)}`;
}

// 更新單一條件時不直接修改 props，而是複製出新物件再回傳父元件。
// 這是 Vue 單向資料流的正確做法。
function updateFilter(key, value) {
  const nextFilters = {
    ...props.modelValue,
    [key]: value,
  };

  emit("update:modelValue", nextFilters);
  emit("filter-changed", nextFilters);
}

// select 的畫面值會變成字串；改從 fields 的 options 取回原始值，
// 這樣 supplierId 等數字型 value 仍能維持 Number，不會被轉成 String。
function handleSelectChange(field, event) {
  const selectedOption = field.options?.[event.target.selectedIndex];
  updateFilter(field.key, selectedOption?.value ?? "");
}

// 狀態第一個 option 是「全部狀態」，所以索引需減 1。
function handleStatusChange(event) {
  const optionIndex = event.target.selectedIndex - 1;
  const selectedOption = props.statusOptions[optionIndex];

  emit("update:statusValue", selectedOption?.value ?? "");
}

// 供應商第一個 option 是「全部供應商」，所以索引需減 1。
function handleSupplierChange(event) {
  const optionIndex = event.target.selectedIndex - 1;
  const selectedOption = props.supplierOptions[optionIndex];

  emit("update:supplierValue", selectedOption?.value ?? "");
}

//將日期與搜尋內容同步回父元件。
function handleStartDateInput(event) {
  emit("update:startDate", event.target.value);
}

function handleEndDateInput(event) {
  emit("update:endDate", event.target.value);
}

function handleSearchInput(event) {
  emit("update:searchValue", event.target.value);
}

// 同時支援數字選項與 { label, value } 格式。
function getPageSizeValue(option) {
  return typeof option === "object" ? option.value : option;
}

// 若父元件只傳數字，自動顯示成「10筆、30筆、50筆」。
function getPageSizeLabel(option) {
  return typeof option === "object" ? option.label : `${option}筆`;
}

// 保持 Number 型別後再傳回父元件，避免頁數計算收到字串。
function handlePageSizeChange(event) {
  const selectedOption = props.pageSizeOptions[event.target.selectedIndex];
  const selectedValue = getPageSizeValue(selectedOption);

  // 新增標準 v-model 事件，寫法與 HeadNavBar 相同。
  emit("update:pageSize", Number(selectedValue));

  //避免已使用舊事件名稱的頁面失效。
  emit("page-size-changed", Number(selectedValue));
}

// Filter 不直接呼叫 API，只通知父元件執行更新。
function handleRefresh() {
  emit("refresh");
}

// 合併父元件傳入的 resetValues，並把重設後的完整條件回傳。
// 保留 modelValue 中不屬於此篩選列的其他欄位。
function handleReset() {
  const resetFilters = {
    ...props.modelValue,
    ...props.resetValues,
  };

  emit("update:modelValue", resetFilters);

  //明確 props 寫法按下重設時，也同步清空各個父元件變數。
  emit("update:statusValue", "");
  emit("update:supplierValue", "");
  emit("update:startDate", "");
  emit("update:endDate", "");
  emit("update:searchValue", "");
  emit("reset", resetFilters);
  emit("filter-changed", resetFilters);
}
</script>



