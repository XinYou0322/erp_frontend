<script setup lang="ts">
import { computed } from "vue";
import { useCalendarStore } from "../stores/calendar.store";
import { useAuthStore } from "../stores/auth.store";
import { useUIStore } from "../stores/ui.store";
import CalendarEventModal from "../component/子元件/CalendarEventModal.vue";
import CalendarDayDetailModal from "../component/子元件/CalendarDayDetailModal.vue";

const calendarStore = useCalendarStore();
const authStore = useAuthStore();
const uiStore = useUIStore();

type CalendarStatEvent = {
  status?: string;
  priority?: string;
  category?: string;
};

const eventList = computed<CalendarStatEvent[]>(() => {
  return (calendarStore.events ?? []) as CalendarStatEvent[];
});

const getCategoryMeta = (category?: string) => {
  const map = (calendarStore.CATEGORY_MAP ?? {}) as Record<string, any>;
  return (
    map[category ?? ""] ?? {
      badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      label: "未分類",
      icon: "help",
    }
  );
};

const getStatusMeta = (status?: string) => {
  const map = (calendarStore.STATUS_MAP ?? {}) as Record<string, any>;
  return (
    map[status ?? ""] ?? {
      badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      label: "未知狀態",
    }
  );
};

// 權限檢查
const canEdit = computed(() => {
  return authStore.hasPermission("calendar.edit" as any);
});

// 統計數據
const totalEvents = computed(() => eventList.value.length);
const pendingEventsCount = computed(
  () => eventList.value.filter((e) => e.status === "pending").length,
);
const completedEventsCount = computed(
  () => eventList.value.filter((e) => e.status === "completed").length,
);
const highPriorityCount = computed(
  () =>
    eventList.value.filter(
      (e) => e.priority === "high" && e.status !== "completed",
    ).length,
);

const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 21 }, (_, index) => currentYear - 10 + index);
});

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: `${index + 1} 月`,
}));

const handlePeriodChange = () => {
  const maxDay = new Date(
    calendarStore.currentYear,
    calendarStore.currentMonth + 1,
    0,
  ).getDate();
  const day = Math.min(calendarStore.currentDay, maxDay);
  const dateStr = `${calendarStore.currentYear}-${String(
    calendarStore.currentMonth + 1,
  ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  calendarStore.selectDate(dateStr);
};

// 點擊月曆格子
const handleDayClick = (dayObj: any) => {
  calendarStore.selectDate(dayObj.dateStr);
  calendarStore.isDayDetailModalOpen = true;
};

// 點擊月曆上的單一事件
const handleEventClick = (e: MouseEvent, evt: any) => {
  e.stopPropagation();
  calendarStore.openEditModal(evt);
};

// 點擊快速於該日新增
const handleAddOnDay = (e: MouseEvent, dateStr: string) => {
  e.stopPropagation();
  calendarStore.openCreateModal(dateStr);
};

// 匯出 ICS
const handleExportICS = () => {
  calendarStore.exportICS();
  uiStore.showToast("已匯出 iCalendar (.ics) 行事曆檔案", "success");
};

// 匯出 CSV
const handleExportCSV = () => {
  calendarStore.exportCSV();
  uiStore.showToast("已匯出排程清單 CSV 檔案", "success");
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header & Main Controls -->
    <div
      class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800"
    >
      <!-- Title & Context -->
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/40"
          >
            <span class="material-symbols-outlined text-[24px]"
              >calendar_month</span
            >
          </div>
          <div>
            <h1
              class="text-xl font-bold text-white tracking-tight flex items-center gap-2"
            >
              行事曆與營運排程
              <span
                class="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-normal"
              >
                {{ totalEvents }} 項排程
              </span>
            </h1>
            <p class="text-xs text-slate-400">
              整合採購到貨驗收、BOM 試產、設備保養巡檢、跨部門會議與差假排班
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation & Action Group -->
      <div class="flex items-center flex-wrap gap-2.5">
        <!-- Date Navigator -->
        <div
          class="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl p-1 shadow-xs"
        >
          <button
            @click="calendarStore.prevPeriod"
            title="上一個週期"
            class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]"
              >chevron_left</span
            >
          </button>
          <button
            @click="calendarStore.goToToday"
            class="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            今日
          </button>
          <button
            @click="calendarStore.nextPeriod"
            title="下一個週期"
            class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]"
              >chevron_right</span
            >
          </button>
        </div>

        <!-- Period Display -->
        <div
          class="flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-700/80 rounded-xl"
        >
          <select
            v-model.number="calendarStore.currentYear"
            @change="handlePeriodChange"
            aria-label="選擇年份"
            class="bg-transparent text-white font-bold text-sm font-data-mono focus:outline-hidden cursor-pointer"
          >
            <option
              v-for="year in yearOptions"
              :key="year"
              :value="year"
              class="bg-slate-950"
            >
              {{ year }} 年
            </option>
          </select>
          <select
            v-model.number="calendarStore.currentMonth"
            @change="handlePeriodChange"
            aria-label="選擇月份"
            class="bg-transparent text-white font-bold text-sm font-data-mono focus:outline-hidden cursor-pointer"
          >
            <option
              v-for="month in monthOptions"
              :key="month.value"
              :value="month.value"
              class="bg-slate-950"
            >
              {{ month.label }}
            </option>
          </select>
        </div>

        <!-- View Mode Switcher -->
        <div
          class="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl p-1"
        >
          <button
            v-for="v in [
              { key: 'month', label: '月檢視', icon: 'calendar_view_month' },
              { key: 'week', label: '週檢視', icon: 'calendar_view_week' },
              { key: 'day', label: '日檢視', icon: 'calendar_view_day' },
              { key: 'agenda', label: '清單', icon: 'view_agenda' },
            ]"
            :key="v.key"
            @click="calendarStore.currentView = v.key"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            :class="
              calendarStore.currentView === v.key
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            "
          >
            <span class="material-symbols-outlined text-[15px]">{{
              v.icon
            }}</span>
            <span class="hidden sm:inline">{{ v.label }}</span>
          </button>
        </div>

        <!-- Export Buttons Dropdown / Group -->
        <div class="flex items-center gap-1.5">
          <button
            @click="handleExportICS"
            title="匯出至 Google Calendar、Apple Calendar 或 Outlook"
            class="p-2 text-slate-400 hover:text-cyan-400 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]"
              >event_available</span
            >
            <span class="hidden md:inline">匯出 iCal</span>
          </button>
          <button
            @click="handleExportCSV"
            title="下載排程清單 CSV 大表"
            class="p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]"
              >file_download</span
            >
            <span class="hidden md:inline">CSV</span>
          </button>
        </div>

        <!-- Add Event Button -->
        <button
          v-if="canEdit"
          @click="calendarStore.openCreateModal()"
          class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span class="material-symbols-outlined text-[18px]">add_circle</span>
          <span>新增排程</span>
        </button>
      </div>
    </div>

    <!-- Quick Stats Cards Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <div
        class="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3"
      >
        <div
          class="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700/60"
        >
          <span class="material-symbols-outlined text-[20px]">event_note</span>
        </div>
        <div>
          <p class="text-[11px] text-slate-400 font-medium">總排程數</p>
          <p class="text-lg font-bold text-white font-data-mono">
            {{ totalEvents }}
          </p>
        </div>
      </div>

      <div
        class="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3"
      >
        <div
          class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20"
        >
          <span class="material-symbols-outlined text-[20px]"
            >pending_actions</span
          >
        </div>
        <div>
          <p class="text-[11px] text-slate-400 font-medium">待執行事項</p>
          <p class="text-lg font-bold text-amber-400 font-data-mono">
            {{ pendingEventsCount }}
          </p>
        </div>
      </div>

      <div
        class="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3"
      >
        <div
          class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20"
        >
          <span class="material-symbols-outlined text-[20px]"
            >priority_high</span
          >
        </div>
        <div>
          <p class="text-[11px] text-slate-400 font-medium">高急迫事項</p>
          <p class="text-lg font-bold text-rose-400 font-data-mono">
            {{ highPriorityCount }}
          </p>
        </div>
      </div>

      <div
        class="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3"
      >
        <div
          class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20"
        >
          <span class="material-symbols-outlined text-[20px]">task_alt</span>
        </div>
        <div>
          <p class="text-[11px] text-slate-400 font-medium">已完成排程</p>
          <p class="text-lg font-bold text-emerald-400 font-data-mono">
            {{ completedEventsCount }}
          </p>
        </div>
      </div>
    </div>

    <!-- Filter & Category Toolbar -->
    <div
      class="space-y-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80"
    >
      <!-- Search & Status Row -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative w-full sm:w-80">
          <span
            class="material-symbols-outlined absolute left-3 top-2 text-slate-500 text-[18px]"
          >
            search
          </span>
          <input
            v-model="calendarStore.searchQuery"
            type="text"
            placeholder="搜尋活動標題、負責人、地點或 PO 單號..."
            class="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
          <button
            v-if="calendarStore.searchQuery"
            @click="calendarStore.searchQuery = ''"
            class="absolute right-2.5 top-2 text-slate-400 hover:text-white"
          >
            <span class="material-symbols-outlined text-[16px]">cancel</span>
          </button>
        </div>

        <!-- Filter Dropdowns -->
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            v-model="calendarStore.statusFilter"
            class="px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">全部狀態</option>
            <option value="pending">待處理</option>
            <option value="in_progress">進行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>

          <select
            v-model="calendarStore.priorityFilter"
            class="px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">全部優先級</option>
            <option value="high">高急迫</option>
            <option value="medium">中優先</option>
            <option value="low">常態</option>
          </select>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div
        class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar"
      >
        <button
          v-for="(meta, catKey) in calendarStore.CATEGORY_MAP"
          :key="catKey"
          @click="calendarStore.selectedCategory = catKey"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer"
          :class="
            calendarStore.selectedCategory === catKey
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-xs'
              : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
          "
        >
          <span class="material-symbols-outlined text-[15px]">{{
            meta.icon
          }}</span>
          <span>{{ meta.label }}</span>
          <span
            class="px-1.5 py-0.2 rounded-full text-[10px]"
            :class="
              calendarStore.selectedCategory === catKey
                ? 'bg-slate-950/20 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400'
            "
          >
            {{ calendarStore.categoryCounts[catKey] || 0 }}
          </span>
        </button>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- VIEW 1: 月檢視 (Month View Grid) -->
    <!-- ================================================================= -->
    <div
      v-if="calendarStore.currentView === 'month'"
      class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
    >
      <!-- Weekday Headers -->
      <div
        class="grid grid-cols-7 border-b border-slate-800 bg-slate-950/80 text-center py-2.5 text-xs font-bold text-slate-400"
      >
        <div
          v-for="(day, idx) in weekdays"
          :key="day"
          :class="idx === 0 || idx === 6 ? 'text-amber-400/80' : ''"
        >
          {{ day }}
        </div>
      </div>

      <!-- 42 Days Calendar Cells Grid -->
      <div
        class="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80"
      >
        <div
          v-for="cell in calendarStore.monthGrid"
          :key="cell.dateStr"
          @click="handleDayClick(cell)"
          class="min-h-[110px] p-1.5 transition-all group relative cursor-pointer flex flex-col justify-between"
          :class="[
            cell.isCurrentMonth
              ? 'bg-slate-900/70 hover:bg-slate-800/50'
              : 'bg-slate-950/40 text-slate-600',
            cell.isToday
              ? 'ring-1 ring-inset ring-emerald-500/60 bg-emerald-500/5'
              : '',
          ]"
        >
          <!-- Cell Header: Day number & Quick Add button -->
          <div class="flex items-center justify-between mb-1">
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-data-mono font-bold transition-all"
              :class="[
                cell.isToday
                  ? 'bg-emerald-500 text-slate-950 shadow-xs font-extrabold'
                  : cell.isCurrentMonth
                    ? 'text-slate-200'
                    : 'text-slate-600',
              ]"
            >
              {{ cell.day }}
            </span>

            <!-- Hover Quick Add Plus Icon -->
            <button
              v-if="canEdit && cell.isCurrentMonth"
              @click="handleAddOnDay($event, cell.dateStr)"
              title="在此日新增排程"
              class="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>

          <!-- Event Chips Stack (Up to 3 chips) -->
          <div class="space-y-1 flex-1 overflow-hidden">
            <div
              v-for="evt in cell.events.slice(0, 3)"
              :key="evt.id"
              @click="handleEventClick($event, evt)"
              class="px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center gap-1 border transition-all cursor-pointer shadow-2xs"
              :class="[
                getCategoryMeta(evt.category).badgeClass,
                evt.status === 'completed' ? 'opacity-60 line-through' : '',
              ]"
              :title="`${evt.startTime} ${evt.title}`"
            >
              <span class="text-[9px] font-data-mono opacity-80 shrink-0">{{
                evt.startTime
              }}</span>
              <span class="truncate">{{ evt.title }}</span>
            </div>

            <!-- Overflow count badge -->
            <div
              v-if="cell.events.length > 3"
              class="text-[10px] font-bold text-slate-400 px-1 py-0.5 rounded hover:text-white"
            >
              + 還有 {{ cell.events.length - 3 }} 項排程
            </div>
          </div>

          <!-- Bottom indicator dots if any -->
          <div
            v-if="cell.events.length > 0"
            class="flex items-center gap-0.5 pt-1 mt-auto"
          >
            <span
              v-for="(evt, i) in cell.events.slice(0, 5)"
              :key="i"
              class="size-1 rounded-full"
              :class="[
                evt.priority === 'high' ? 'bg-rose-400' : 'bg-emerald-400',
              ]"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- VIEW 2: 週檢視 (Week View 7-Columns) -->
    <!-- ================================================================= -->
    <div
      v-else-if="calendarStore.currentView === 'week'"
      class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
    >
      <div
        class="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-800"
      >
        <div
          v-for="day in calendarStore.weekDays"
          :key="day.dateStr"
          class="p-3 flex flex-col min-h-[360px]"
          :class="
            day.isToday
              ? 'bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/30'
              : 'bg-slate-900/60'
          "
        >
          <!-- Day Header -->
          <div
            class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80"
          >
            <div>
              <p class="text-xs font-bold text-slate-400">{{ day.dayName }}</p>
              <p
                class="text-sm font-data-mono font-bold text-white flex items-center gap-1.5"
              >
                {{ day.month + 1 }}/{{ day.day }}
                <span
                  v-if="day.isToday"
                  class="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold"
                  >今日</span
                >
              </p>
            </div>
            <button
              v-if="canEdit"
              @click="handleAddOnDay($event, day.dateStr)"
              title="新增排程"
              class="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          <!-- Day Event Cards -->
          <div class="space-y-2 flex-1 overflow-y-auto">
            <div
              v-if="day.events.length === 0"
              class="h-full flex items-center justify-center text-slate-600 text-xs text-center py-6"
            >
              無預定排程
            </div>

            <div
              v-for="evt in day.events"
              :key="evt.id"
              @click="calendarStore.openEditModal(evt)"
              class="p-2.5 rounded-xl border bg-slate-950/80 transition-all hover:scale-[1.02] cursor-pointer space-y-1.5 shadow-sm"
              :class="[
                getCategoryMeta(evt.category).badgeClass,
                evt.status === 'completed' ? 'opacity-60' : '',
              ]"
            >
              <div
                class="flex items-center justify-between text-[10px] text-slate-400 font-data-mono font-semibold"
              >
                <span>{{ evt.startTime }} - {{ evt.endTime }}</span>
                <span
                  v-if="evt.priority === 'high'"
                  class="text-rose-400 font-bold"
                  >高急迫</span
                >
              </div>
              <h5 class="text-xs font-bold text-white leading-snug">
                {{ evt.title }}
              </h5>
              <p
                v-if="evt.location"
                class="text-[11px] text-slate-400 truncate flex items-center gap-0.5"
              >
                <span class="material-symbols-outlined text-[12px]"
                  >location_on</span
                >
                {{ evt.location }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- VIEW 3: 日檢視 (Day View Detailed Schedule) -->
    <!-- ================================================================= -->
    <div v-else-if="calendarStore.currentView === 'day'" class="space-y-4">
      <div
        class="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between"
      >
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            {{ calendarStore.selectedDate }} 當日營運日程
            <span
              class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-normal"
            >
              {{ calendarStore.selectedDateEvents.length }} 個活動
            </span>
          </h2>
          <p class="text-xs text-slate-400">
            點擊排程卡片可快速進行編輯、標記完成或刪除
          </p>
        </div>

        <button
          v-if="canEdit"
          @click="calendarStore.openCreateModal(calendarStore.selectedDate)"
          class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer"
        >
          <span class="material-symbols-outlined text-[16px]">add</span>
          <span>開立當日排程</span>
        </button>
      </div>

      <!-- Day Event Detail Timeline Cards -->
      <div class="space-y-3">
        <div
          v-if="calendarStore.selectedDateEvents.length === 0"
          class="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 space-y-3"
        >
          <span class="material-symbols-outlined text-[48px] text-slate-600"
            >event_busy</span
          >
          <p class="text-sm font-medium">本日尚未有任何活動或會議安排</p>
          <button
            @click="calendarStore.openCreateModal(calendarStore.selectedDate)"
            class="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]"
              >add_circle</span
            >
            <span>立即建立第一筆排程</span>
          </button>
        </div>

        <div
          v-for="evt in calendarStore.selectedDateEvents"
          :key="evt.id"
          class="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="px-2.5 py-1 rounded-lg bg-slate-950 text-emerald-400 font-data-mono font-bold text-xs border border-slate-800"
              >
                {{ evt.startTime }} ~ {{ evt.endTime }}
              </span>
              <span
                class="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1"
                :class="getCategoryMeta(evt.category).badgeClass"
              >
                <span class="material-symbols-outlined text-[14px]">
                  {{ getCategoryMeta(evt.category).icon }}
                </span>
                {{ getCategoryMeta(evt.category).label }}
              </span>
              <span
                v-if="evt.priority === 'high'"
                class="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold"
              >
                高急迫
              </span>
              <span
                class="px-2 py-0.5 rounded-md border text-xs font-medium"
                :class="getStatusMeta(evt.status).badgeClass"
              >
                {{ getStatusMeta(evt.status).label }}
              </span>
            </div>

            <h3
              class="text-base font-bold text-white"
              :class="
                evt.status === 'completed' ? 'line-through text-slate-400' : ''
              "
            >
              {{ evt.title }}
            </h3>

            <p
              v-if="evt.description"
              class="text-xs text-slate-400 leading-relaxed max-w-3xl"
            >
              {{ evt.description }}
            </p>

            <div
              class="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1"
            >
              <span v-if="evt.location" class="flex items-center gap-1">
                <span
                  class="material-symbols-outlined text-[14px] text-slate-500"
                  >location_on</span
                >
                {{ evt.location }}
              </span>
              <span v-if="evt.organizer" class="flex items-center gap-1">
                <span
                  class="material-symbols-outlined text-[14px] text-slate-500"
                  >person</span
                >
                發起人：{{ evt.organizer }}
              </span>
              <span
                v-if="evt.relatedRef"
                class="font-data-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]"
              >
                單據：{{ evt.relatedRef }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="calendarStore.toggleEventStatus(evt.id)"
              class="px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              :class="
                evt.status === 'completed'
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              "
            >
              <span class="material-symbols-outlined text-[16px]">
                {{
                  evt.status === "completed" ? "restart_alt" : "check_circle"
                }}
              </span>
              <span>{{
                evt.status === "completed" ? "重新開啟" : "標記完成"
              }}</span>
            </button>

            <button
              @click="calendarStore.openEditModal(evt)"
              class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="編輯排程"
            >
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- VIEW 4: 待辦清單 (Agenda View Chronological List) -->
    <!-- ================================================================= -->
    <div v-else-if="calendarStore.currentView === 'agenda'" class="space-y-4">
      <div
        v-if="calendarStore.filteredEvents.length === 0"
        class="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-3"
      >
        <span class="material-symbols-outlined text-[48px] text-slate-600"
          >search_off</span
        >
        <p class="text-sm font-medium">沒有符合目前篩選條件的排程紀錄</p>
      </div>

      <div
        v-for="evt in calendarStore.filteredEvents"
        :key="evt.id"
        class="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div class="flex items-start gap-3.5">
          <!-- Date & Time Box -->
          <div
            class="w-20 p-2 rounded-xl bg-slate-950 border border-slate-800 text-center shrink-0"
          >
            <p class="text-[10px] text-slate-400 font-semibold uppercase">
              {{ evt.date.slice(5) }}
            </p>
            <p class="text-sm font-extrabold text-white font-data-mono">
              {{ evt.startTime }}
            </p>
            <p class="text-[9px] text-slate-500 font-data-mono">
              {{ evt.endTime }}
            </p>
          </div>

          <!-- Main Info -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="px-2 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1"
                :class="getCategoryMeta(evt.category).badgeClass"
              >
                <span class="material-symbols-outlined text-[13px]">
                  {{ getCategoryMeta(evt.category).icon }}
                </span>
                {{ getCategoryMeta(evt.category).label }}
              </span>

              <span
                v-if="evt.priority === 'high'"
                class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold"
              >
                高急迫
              </span>

              <span
                class="px-2 py-0.5 rounded border text-[10px] font-medium"
                :class="getStatusMeta(evt.status).badgeClass"
              >
                {{ getStatusMeta(evt.status).label }}
              </span>
            </div>

            <h4
              class="text-sm font-bold text-white"
              :class="
                evt.status === 'completed' ? 'line-through text-slate-400' : ''
              "
            >
              {{ evt.title }}
            </h4>

            <p
              v-if="evt.description"
              class="text-xs text-slate-400 leading-relaxed line-clamp-2"
            >
              {{ evt.description }}
            </p>

            <div
              class="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap"
            >
              <span v-if="evt.location" class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]"
                  >location_on</span
                >
                {{ evt.location }}
              </span>
              <span v-if="evt.organizer" class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]"
                  >person</span
                >
                {{ evt.organizer }}
              </span>
              <span v-if="evt.relatedRef" class="font-data-mono text-slate-400">
                #{{ evt.relatedRef }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            @click="calendarStore.toggleEventStatus(evt.id)"
            class="px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            :class="
              evt.status === 'completed'
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            "
          >
            <span class="material-symbols-outlined text-[16px]">
              {{ evt.status === "completed" ? "restart_alt" : "check" }}
            </span>
            <span>{{ evt.status === "completed" ? "重開" : "完成" }}</span>
          </button>

          <button
            @click="calendarStore.openEditModal(evt)"
            class="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="編輯"
          >
            <span class="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CalendarEventModal />
    <CalendarDayDetailModal />
  </div>
</template>
