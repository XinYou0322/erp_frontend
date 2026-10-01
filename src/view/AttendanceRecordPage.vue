<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth.store";
// Codex 修改：新增請假與查看假單均使用既有請假系統。
import { useRouter } from "vue-router";
const router = useRouter();
const leaveTypeLabels: Record<string, string> = { ANNUAL: "特休", SICK: "病假", PERSONAL: "事假", MARRIAGE: "婚假" };
type CalendarLeave = { id: number; leaveType: string; status: string; durationType: string; startTime: string | null; endTime: string | null };
const leaveLabel = (leave: CalendarLeave) => `${leaveTypeLabels[leave.leaveType] || leave.leaveType} · ${leave.status === 'APPROVED' ? '已核准' : '審核中'}`;
const createLeave = (date?: string) => router.push({ name: "leave-create", query: { from: "attendance", ...(date ? { date } : {}) } });

type ClockRecordItem = {
  id?: number | string;
  userId?: number | string;
  clockType?: "CLOCK_IN" | "CLOCK_OUT";
  clockTime?: string;
  label?: string;
};

type AttendanceStatus =
  | "LEAVE"
  | "NORMAL"
  | "LATE"
  | "EARLY_LEAVE"
  | "LATE_AND_EARLY_LEAVE"
  | "ABSENT"
  | "INCOMPLETE"
  | "REST_DAY"
  | "FUTURE";

type DailyAttendance = {
  // Codex 修改：由出勤 API 帶回同日期的請假系統資料。
  leaves?: CalendarLeave[];
  date: string; // yyyy-MM-dd
  status: AttendanceStatus | null;
  statusLabel: string | null;
  clockInTime: string | null;
  clockOutTime: string | null;
  records: ClockRecordItem[];
};

const authStore = useAuthStore();

// 高權限(admin/manager)才可以輸入員工編號查詢別人的行事曆
const hasAccessAll = computed(() => authStore.isManager);

const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth() + 1); // 1-12

// 預設查詢自己；管理員可輸入其他員工編號
const targetUserId = ref<string>(String(authStore.currentUser?.id ?? ""));

const loading = ref(false);
const errorMessage = ref("");
const calendarDays = ref<DailyAttendance[]>([]);
const selectedDay = ref<DailyAttendance | null>(null);

const yearMonthLabel = computed(
  () => `${currentYear.value} 年 ${String(currentMonth.value).padStart(2, "0")} 月`
);

const yearMonthParam = computed(
  () => `${currentYear.value}-${String(currentMonth.value).padStart(2, "0")}`
);

// 狀態顯示樣式對照表
const STATUS_META: Record<
  AttendanceStatus,
  { label: string; dot: string; badge: string }
> = {
  LEAVE: { label: "已核准請假", dot: "bg-violet-400", badge: "bg-violet-500/10 text-violet-300 border border-violet-500/30" },
  NORMAL: {
    label: "正常出勤",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  },
  LATE: {
    label: "遲到",
    dot: "bg-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  },
  EARLY_LEAVE: {
    label: "早退",
    dot: "bg-orange-400",
    badge: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
  },
  LATE_AND_EARLY_LEAVE: {
    label: "遲到/早退",
    dot: "bg-rose-400",
    badge: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
  },
  ABSENT: {
    label: "缺勤",
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-400 border border-red-500/30",
  },
  INCOMPLETE: {
    label: "上班中",
    dot: "bg-sky-400",
    badge: "bg-sky-500/10 text-sky-400 border border-sky-500/30",
  },
  REST_DAY: {
    label: "休假日",
    dot: "bg-slate-600",
    badge: "bg-slate-700/40 text-slate-400 border border-slate-700",
  },
  FUTURE: {
    label: "",
    dot: "bg-slate-700",
    badge: "bg-slate-800 text-slate-500 border border-slate-700",
  },
};

const statusMeta = (status: AttendanceStatus | null) =>
  status ? STATUS_META[status] : STATUS_META.FUTURE;

// 月曆需要的「星期幾對齊用」空白格數 (該月 1 號是星期幾，週一為第一欄)
const leadingBlankCount = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1);
  const jsWeekday = firstDay.getDay(); // 0=日 ... 6=六
  return jsWeekday === 0 ? 6 : jsWeekday - 1; // 轉成週一開頭
});

const weekLabels = ["一", "二", "三", "四", "五", "六", "日"];

const summary = computed(() => {
  const counts: Record<string, number> = {
    LATE: 0,
    EARLY_LEAVE: 0,
    LATE_AND_EARLY_LEAVE: 0,
    ABSENT: 0,
    NORMAL: 0,
    LEAVE: 0,
  };
  for (const day of calendarDays.value) {
    if (day.status && counts[day.status] !== undefined) {
      counts[day.status]++;
    }
  }
  return counts;
});

const formatTime = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const dayNumber = (dateStr: string) => Number(dateStr.split("-")[2]);

const isToday = (dateStr: string) => {
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return dateStr === todayStr;
};

const loadCalendar = async () => {
  if (!targetUserId.value) {
    errorMessage.value = "請選擇員工";
    return;
  }
  loading.value = true;
  // Codex 修改：切換月份或員工後關閉舊明細，避免顯示上一筆資料。
  selectedDay.value = null;
  errorMessage.value = "";
  try {
    const res = await fetch(
      `/api/attendance/calendar?userId=${encodeURIComponent(
        targetUserId.value
      )}&yearMonth=${yearMonthParam.value}`,
      {
        // 避免瀏覽器用 ETag 做條件式快取，導致回傳 304 (No Content) 被誤判成失敗
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      }
    );
    // 304 代表瀏覽器快取仍有效但被視為非成功狀態，這裡額外容錯一次
    if (res.status === 304) {
      errorMessage.value = "";
      return;
    }
    if (!res.ok) throw new Error("查詢失敗");
    const data = await res.json();
    calendarDays.value = data.days || [];
  } catch (e) {
    errorMessage.value = "讀取行事曆失敗，請稍後再試。";
    calendarDays.value = [];
  } finally {
    loading.value = false;
  }
};

const goPrevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value -= 1;
  } else {
    currentMonth.value -= 1;
  }
};

const goNextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value += 1;
  } else {
    currentMonth.value += 1;
  }
};

const goToday = () => {
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth() + 1;
};

const openDay = (day: DailyAttendance) => {
  selectedDay.value = day;
};

const closeDay = () => {
  selectedDay.value = null;
};

watch([currentYear, currentMonth], loadCalendar);

onMounted(async () => {
  // 下拉選單需要完整員工清單，管理員第一次進來時若 store 裡還沒有資料就先撈一次
  if (hasAccessAll.value && (!authStore.users || authStore.users.length === 0)) {
    await authStore.fetchUsersFromApi();
  }
  loadCalendar();
});
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex items-center gap-2 text-emerald-400">
          <span class="material-symbols-outlined text-base">calendar_month</span>
          <p class="text-xs uppercase tracking-[0.18em]">Attendance</p>
        </div>
        <h1 class="mt-1 text-2xl font-black text-white">出勤行事曆</h1>
        <!-- Codex 修改：僅能替自己新增請假，沿用既有申請與簽核流程。 -->
        <button v-if="String(targetUserId) === String(authStore.currentUser?.id)" type="button"
          @click="createLeave()" class="mt-3 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950">新增請假</button>
        <button type="button" @click="loadCalendar" class="ml-3 text-xs text-emerald-400">重新整理</button>
      </div>

      <!-- 管理員可從下拉選單挑選員工查詢別人的行事曆，一般員工只能看自己 -->
      <div v-if="hasAccessAll" class="flex items-center gap-2">
        <label class="text-xs text-slate-400">員工</label>
        <select
          v-model="targetUserId"
          @change="loadCalendar"
          class="w-48 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
        >
          <option value="" disabled>請選擇員工</option>
          <option v-for="u in authStore.users" :key="u.id" :value="String(u.id)">
            {{ u.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- 月份切換 -->
    <div class="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
      <button
        type="button"
        @click="goPrevMonth"
        class="rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-800 cursor-pointer"
      >
        ‹ 上個月
      </button>
      <div class="flex items-center gap-3">
        <div class="text-sm font-bold text-white">{{ yearMonthLabel }}</div>
        <button
          type="button"
          @click="goToday"
          class="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800 cursor-pointer"
        >
          回到今天
        </button>
      </div>
      <button
        type="button"
        @click="goNextMonth"
        class="rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-800 cursor-pointer"
      >
        下個月 ›
      </button>
    </div>

    <!-- 當月統計摘要 -->
    <div class="grid grid-cols-2 gap-2 md:grid-cols-6">
      <div
        v-for="(item, key) in [
          { key: 'NORMAL', label: '正常出勤' },
          { key: 'LATE', label: '遲到' },
          { key: 'EARLY_LEAVE', label: '早退' },
          { key: 'LATE_AND_EARLY_LEAVE', label: '遲到/早退' },
          { key: 'ABSENT', label: '缺勤' },
          { key: 'LEAVE', label: '核准全天假' },
        ]"
        :key="key"
        class="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-center"
      >
        <div class="text-lg font-black text-white">{{ summary[item.key] ?? 0 }}</div>
        <div class="text-[10px] text-slate-400">{{ item.label }}</div>
      </div>
    </div>

    <div v-if="errorMessage" class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
      {{ errorMessage }}
    </div>

    <!-- 月曆本體 -->
    <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/10">
      <div v-if="loading" class="py-8 text-center text-xs text-slate-400">載入中...</div>

      <template v-else>
        <div class="grid grid-cols-7 gap-1.5 text-center text-[11px] text-slate-400 mb-2">
          <div v-for="w in weekLabels" :key="w">{{ w }}</div>
        </div>

        <div class="grid grid-cols-7 gap-1.5">
          <div v-for="n in leadingBlankCount" :key="'blank-' + n" class="aspect-square" />

          <button
            v-for="day in calendarDays"
            :key="day.date"
            type="button"
            @click="openDay(day)"
            class="aspect-square rounded-xl border p-1.5 text-left transition-colors cursor-pointer flex flex-col justify-between"
            :class="[
              isToday(day.date)
                ? 'border-emerald-500/60 bg-slate-950'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-600',
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-200">{{ dayNumber(day.date) }}</span>
              <span
                v-if="day.status && day.status !== 'FUTURE'"
                class="h-1.5 w-1.5 rounded-full"
                :class="statusMeta(day.status).dot"
              />
            </div>
            <span
              v-if="day.status && day.status !== 'FUTURE'"
              class="truncate rounded px-1 py-0.5 text-[9px] font-bold"
              :class="statusMeta(day.status).badge"
            >
              {{ statusMeta(day.status).label }}
            </span>
            <!-- Codex 修改：日期格呈現假別及狀態，多張假單皆可在明細查看。 -->
            <span v-for="leave in (day.leaves || []).slice(0, 2)" :key="leave.id"
              :title="leaveLabel(leave)" class="truncate text-[9px] text-violet-300">{{ leaveLabel(leave) }}</span>
            <span v-if="(day.leaves?.length || 0) > 2" class="text-[9px] text-slate-400">更多請假…</span>
          </button>
        </div>
      </template>
    </div>

    <!-- 當日明細 Modal -->
    <div
      v-if="selectedDay"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      @click.self="closeDay"
    >
      <div class="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-bold text-white">{{ selectedDay.date }}</div>
            <span
              class="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
              :class="statusMeta(selectedDay.status).badge"
            >
              {{ selectedDay.statusLabel || statusMeta(selectedDay.status).label }}
            </span>
          </div>
          <button type="button" @click="closeDay" class="text-slate-400 hover:text-white cursor-pointer">✕</button>
        </div>

        <div class="mt-4 space-y-2">
          <!-- Codex 修改：查看假別、全天／時段及原請假單，點選日期可直接申請。 -->
          <button v-if="String(targetUserId) === String(authStore.currentUser?.id)" type="button"
            @click="createLeave(selectedDay.date)" class="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950">當日新增請假</button>
          <button v-for="leave in selectedDay.leaves || []" :key="leave.id" type="button"
            @click="router.push({ name: 'leave-detail', params: { id: leave.id } })"
            class="block w-full rounded-lg border border-violet-500/30 p-3 text-left text-xs text-violet-300">
            <div>{{ leaveLabel(leave) }}</div>
            <div class="mt-1">{{ leave.durationType === 'FULL_DAY' ? '全天' : `${leave.startTime?.slice(0, 5)}～${leave.endTime?.slice(0, 5)}` }} · 查看請假單 #{{ leave.id }}</div>
          </button>
          <div v-if="!selectedDay.records || selectedDay.records.length === 0" class="text-xs text-slate-400">
            當天沒有打卡紀錄。
          </div>
          <div
            v-for="record in selectedDay.records"
            :key="record.id"
            class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2"
          >
            <div class="flex items-center gap-2">
              <span
                class="h-2 w-2 rounded-full"
                :class="record.clockType === 'CLOCK_IN' ? 'bg-emerald-400' : 'bg-rose-400'"
              />
              <span class="text-xs font-bold text-white">{{ record.label }}</span>
            </div>
            <span class="text-[11px] text-slate-300">{{ formatTime(record.clockTime ?? null) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
