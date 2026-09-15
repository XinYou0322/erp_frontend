/**
 * =====================================================================
 * 【全域行事曆與排程狀態管理 (Calendar & Scheduling Store)】: src/stores/calendar.store.js
 * =====================================================================
 * 職責說明：
 * 1. 集中管理企業全方位行事曆排程：採購交期、多階BOM試產、員工差假排班、設備保養維護、跨部門會議與促銷活動。
 * 2. 支援四種視圖模式：月檢視 (Month)、週檢視 (Week)、日檢視 (Day)、待辦清單檢視 (Agenda)。
 * 3. 具備完整的事件增刪改查 (CRUD)、分類過濾、關鍵字搜尋與狀態切換。
 * 4. 內建標準 iCalendar (.ics) 與 CSV 檔案匯出引擎，可一鍵匯入 Google Calendar、Apple Calendar 與 Outlook。
 * 5. 與系統通知中心 (notification.store) 和安全稽核紀錄 (auth.store) 自動連動。
 */

import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import httpClient from "../service/httpClient";
import { StorageService } from "../services/storage.service";
import { useNotificationStore } from "./notification.store";
import { useAuthStore } from "./auth.store";

/** 預設初始行事曆事件資料集 (基準時間聚焦於 2026 年 9 月) */
const INITIAL_CALENDAR_EVENTS = [
  {
    id: "evt-20260902-01",
    title: "生豆採購進貨驗收 (PO-2026-0301)",
    description:
      "宏達咖啡進口之衣索比亞耶加雪菲生豆 300kg 與瓜地馬拉水洗豆 200kg 到貨，由烘豆倉品管員進行水分與瑕疵豆抽樣。",
    category: "procurement",
    date: "2026-09-02",
    startTime: "09:30",
    endTime: "11:30",
    location: "台北一號烘豆倉驗收碼頭",
    organizer: "Linda Wang",
    attendees: ["Alex Smith", "Linda Wang"],
    priority: "high",
    status: "completed",
    relatedRef: "PO-2026-0301",
    reminderMinutes: 30,
  },
  {
    id: "evt-20260904-01",
    title: "Probat 12kg 烘豆機加熱槽例行保養",
    description:
      "第三季精密設備巡檢：瓦斯燃燒噴嘴清潔、熱電偶溫度感測器校正及抽風管道清碳作業。",
    category: "maintenance",
    date: "2026-09-04",
    startTime: "14:00",
    endTime: "17:00",
    location: "烘豆工廠 A 區",
    organizer: "Alex Smith",
    attendees: ["維修原廠技師", "Alex Smith"],
    priority: "medium",
    status: "completed",
    relatedRef: "EQUIP-PROBAT-01",
    reminderMinutes: 60,
  },
  {
    id: "evt-20260907-01",
    title: "Q3 營運戰情月會暨秋季新配方杯測",
    description:
      "各分店營收數據覆盤檢討，並進行「秋嵐花果香混調配方」BOM 成本分析評估與風味盲測。",
    category: "meeting",
    date: "2026-09-07",
    startTime: "10:00",
    endTime: "12:00",
    location: "總部 3F 玻璃會議室 (線上 Zoom 同步)",
    organizer: "Alex Smith",
    attendees: ["Alex Smith", "Linda Wang", "門市督導團隊", "財務部"],
    priority: "high",
    status: "in_progress",
    relatedRef: "BOM-BLEND-AUTUMN",
    reminderMinutes: 15,
  },
  {
    id: "evt-20260909-01",
    title: "員工差假：Alex Smith (特休 1 天)",
    description:
      "烘豆主管排定個人休假，期間烘焙排程由資深烘豆助理 Linda 代理，急事請洽行政窗口。",
    category: "leave",
    date: "2026-09-09",
    startTime: "09:00",
    endTime: "18:00",
    location: "休假 (離線)",
    organizer: "Alex Smith",
    attendees: ["Alex Smith"],
    priority: "low",
    status: "pending",
    relatedRef: "LEAVE-2026-0909",
    reminderMinutes: 0,
  },
  {
    id: "evt-20260912-01",
    title: "秋日手沖咖啡快閃會員日 (全門市促銷)",
    description:
      "實體收銀 POS 啟用快閃折扣代碼「AUTUMN2026」，單品手沖現折 $20，精品咖啡豆滿千贈耳掛包。",
    category: "marketing",
    date: "2026-09-12",
    startTime: "11:00",
    endTime: "20:00",
    location: "信義旗艦店 / 中山風格店",
    organizer: "行銷推廣組",
    attendees: ["全門市門店夥伴"],
    priority: "high",
    status: "pending",
    relatedRef: "POS-CAMP-0912",
    reminderMinutes: 120,
  },
  {
    id: "evt-20260915-01",
    title: "佳賀包裝 250g 透氣閥包裝袋交期驗收",
    description:
      "佳賀包裝科技供應之訂單 PO-2026-0304：牛皮紙排氣閥夾鏈袋 5,000 PCS 入庫核對印刷樣色。",
    category: "procurement",
    date: "2026-09-15",
    startTime: "13:30",
    endTime: "15:00",
    location: "二號物料倉 (B區包材貨架)",
    organizer: "採購部",
    attendees: ["倉管團隊", "採購人員"],
    priority: "medium",
    status: "pending",
    relatedRef: "PO-2026-0304",
    reminderMinutes: 30,
  },
  {
    id: "evt-20260918-01",
    title: "全倉物料季末大盤點 (BOM 耗損率校正)",
    description:
      "停機 4 小時進行原物料實體數量盤點，比對 ERP 庫存帳面與實際損耗率，調整安全水位警戒值。",
    category: "production",
    date: "2026-09-18",
    startTime: "18:00",
    endTime: "22:00",
    location: "台北一號與二號倉儲全區",
    organizer: "Alex Smith",
    attendees: ["全體生管與倉儲人員"],
    priority: "high",
    status: "pending",
    relatedRef: "INV-AUDIT-Q3",
    reminderMinutes: 60,
  },
  {
    id: "evt-20260922-01",
    title: "多階 BOM 新機器人手臂組裝試產檢討",
    description:
      "工廠試產組裝【六軸精密工業機械手臂 (ASM-ROBOT-001)】次總成，驗證公差與工時預估。",
    category: "production",
    date: "2026-09-22",
    startTime: "09:00",
    endTime: "12:00",
    location: "模組實驗裝配車間",
    organizer: "工程部研發組",
    attendees: ["研發主管", "製程工程師", "Alex Smith"],
    priority: "medium",
    status: "pending",
    relatedRef: "ASM-ROBOT-001",
    reminderMinutes: 30,
  },
  {
    id: "evt-20260925-01",
    title: "門市義式咖啡機半年保養 (La Marzocco)",
    description:
      "更換沖煮頭墊圈、均壓分水網、洩壓閥及鍋爐水垢軟化水質濾芯置換。",
    category: "maintenance",
    date: "2026-09-25",
    startTime: "08:00",
    endTime: "10:30",
    location: "信義旗艦店 吧檯",
    organizer: "設備組",
    attendees: ["值班吧檯店長", "設備技工"],
    priority: "low",
    status: "pending",
    relatedRef: "EQUIP-LM-02",
    reminderMinutes: 30,
  },
  {
    id: "evt-20260928-01",
    title: "SCA 國際咖啡風味輪杯測在職訓練",
    description:
      "內部教育訓練：新進員工與吧檯咖啡師感官感度校準、風味標記對齊訓練。",
    category: "meeting",
    date: "2026-09-28",
    startTime: "14:30",
    endTime: "17:00",
    location: "培訓中心教室",
    organizer: "Linda Wang",
    attendees: ["烘豆學員", "吧檯實習生"],
    priority: "low",
    status: "pending",
    relatedRef: "HR-TRAIN-09",
    reminderMinutes: 15,
  },
];

export const useCalendarStore = defineStore("calendar", () => {
  // =====================================================================
  // 1. 核心狀態 (State)
  // =====================================================================
  const events = ref(
    StorageService.get("calendar_events_v2", INITIAL_CALENDAR_EVENTS),
  );

  // 當前瀏覽焦點日期 (預設 2026 年 9 月 6 日)
  const currentYear = ref(2026);
  const currentMonth = ref(8); // 0-indexed, 8 = 9月
  const currentDay = ref(6);

  // 當前視圖模式：'month' | 'week' | 'day' | 'agenda'
  const currentView = ref("month");

  // 類別過濾：'all' | 'procurement' | 'production' | 'meeting' | 'leave' | 'maintenance' | 'marketing'
  const selectedCategory = ref("all");

  // 狀態過濾：'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
  const statusFilter = ref("all");

  // 優先級過濾：'all' | 'high' | 'medium' | 'low'
  const priorityFilter = ref("all");

  // 搜尋關鍵字
  const searchQuery = ref("");

  // 當前選中的日期字串 (YYYY-MM-DD)，用於彈窗或日檢視
  const selectedDate = ref("2026-09-06");

  // 事件編輯彈窗控制狀態
  const isEventModalOpen = ref(false);
  const editingEvent = ref(null); // null 表示新增模式

  // 日期詳情抽屜/彈窗
  const isDayDetailModalOpen = ref(false);

  const normalizeTimeValue = (value, fallback = "09:00") => {
    if (!value && value !== 0) return fallback;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return fallback;
      const [hour, minute] = trimmed.split(":");
      return `${String(hour ?? 0).padStart(2, "0")}:${String(minute ?? 0).padStart(2, "0")}`;
    }
    return fallback;
  };

  const normalizeCalendarEvent = (event) => {
    if (!event) return null;
    const safeDate = event.date || selectedDate.value || "2026-09-06";
    return {
      id:
        event.id ||
        `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: event.title || "未命名排程事件",
      description: event.description || "",
      category: event.category || "meeting",
      date: String(safeDate).slice(0, 10),
      startTime: normalizeTimeValue(event.startTime, "09:00"),
      endTime: normalizeTimeValue(event.endTime, "10:00"),
      location: event.location || "",
      organizer: event.organizer || "管理員",
      attendees: Array.isArray(event.attendees) ? event.attendees : [],
      priority: event.priority || "medium",
      status: event.status || "pending",
      relatedRef: event.relatedRef || "",
      reminderMinutes: Number(event.reminderMinutes ?? 15),
    };
  };

  const buildCalendarQuery = () => ({
    startDate: `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, "0")}-01`,
    endDate: `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, "0")}-${new Date(currentYear.value, currentMonth.value + 1, 0).getDate()}`,
    searchQuery: searchQuery.value,
    statusFilter: statusFilter.value,
    priorityFilter: priorityFilter.value,
    selectedCategory: selectedCategory.value,
  });

  const toApiPayload = (eventData) => ({
    title: eventData.title || "未命名排程事件",
    description: eventData.description || "",
    category: eventData.category || "meeting",
    date: eventData.date || selectedDate.value,
    startTime: normalizeTimeValue(eventData.startTime, "09:00"),
    endTime: normalizeTimeValue(eventData.endTime, "10:00"),
    location: eventData.location || "",
    organizer: eventData.organizer || "管理員",
    attendees: Array.isArray(eventData.attendees) ? eventData.attendees : [],
    priority: eventData.priority || "medium",
    status: eventData.status || "pending",
    relatedRef: eventData.relatedRef || "",
    reminderMinutes: Number(eventData.reminderMinutes ?? 15),
  });

  // 持久化儲存監聽
  watch(
    events,
    (newList) => {
      StorageService.set("calendar_events_v2", newList);
    },
    { deep: true },
  );

  watch(
    [searchQuery, statusFilter, priorityFilter, selectedCategory],
    () => {
      loadEvents(false);
    },
    { flush: "post" },
  );

  // =====================================================================
  // 2. 分類定義與色彩語義 (Category Metadata)
  // =====================================================================
  const CATEGORY_MAP = {
    all: {
      label: "全部類別",
      icon: "apps",
      color: "slate",
      badgeClass: "bg-slate-800 text-slate-200 border-slate-700",
    },
    procurement: {
      label: "採購供鏈",
      icon: "local_shipping",
      color: "amber",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    production: {
      label: "生產排程",
      icon: "precision_manufacturing",
      color: "emerald",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    meeting: {
      label: "會議例會",
      icon: "groups",
      color: "cyan",
      badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    },
    leave: {
      label: "差假排班",
      icon: "beach_access",
      color: "purple",
      badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    maintenance: {
      label: "設備保養",
      icon: "build",
      color: "rose",
      badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    },
    marketing: {
      label: "促銷活動",
      icon: "campaign",
      color: "indigo",
      badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    },
  };

  const STATUS_MAP = {
    all: { label: "全部狀態" },
    pending: {
      label: "待處理",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    in_progress: {
      label: "進行中",
      badgeClass:
        "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 animate-pulse",
    },
    completed: {
      label: "已完成",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    cancelled: {
      label: "已取消",
      badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
    },
  };

  const PRIORITY_MAP = {
    high: {
      label: "高急迫",
      badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    },
    medium: {
      label: "中優先",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    low: {
      label: "常態",
      badgeClass: "bg-slate-700/60 text-slate-300 border-slate-600",
    },
  };

  // =====================================================================
  // 3. 計算屬性 (Getters & Computeds)
  // =====================================================================
  /** 當前月份名稱字串 (如：2026 年 9 月) */
  const currentMonthTitle = computed(() => {
    return `${currentYear.value} 年 ${currentMonth.value + 1} 月`;
  });

  /** 符合篩選條件的事件清單 */
  const filteredEvents = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    return events.value.filter((evt) => {
      // 類別過濾
      if (
        selectedCategory.value !== "all" &&
        evt.category !== selectedCategory.value
      ) {
        return false;
      }
      // 狀態過濾
      if (statusFilter.value !== "all" && evt.status !== statusFilter.value) {
        return false;
      }
      // 優先級過濾
      if (
        priorityFilter.value !== "all" &&
        evt.priority !== priorityFilter.value
      ) {
        return false;
      }
      // 搜尋關鍵字
      if (q) {
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchDesc = evt.description?.toLowerCase().includes(q);
        const matchLoc = evt.location?.toLowerCase().includes(q);
        const matchRef = evt.relatedRef?.toLowerCase().includes(q);
        const matchOrganizer = evt.organizer?.toLowerCase().includes(q);
        if (
          !matchTitle &&
          !matchDesc &&
          !matchLoc &&
          !matchRef &&
          !matchOrganizer
        ) {
          return false;
        }
      }
      return true;
    });
  });

  /** 各類別事件統計計數 */
  const categoryCounts = computed(() => {
    const counts = {
      all: events.value.length,
      procurement: 0,
      production: 0,
      meeting: 0,
      leave: 0,
      maintenance: 0,
      marketing: 0,
    };
    events.value.forEach((evt) => {
      if (counts[evt.category] !== undefined) {
        counts[evt.category]++;
      }
    });
    return counts;
  });

  /** 依日期 (YYYY-MM-DD) 分組的事件字典 */
  const eventsByDate = computed(() => {
    const map = {};
    filteredEvents.value.forEach((evt) => {
      if (!map[evt.date]) {
        map[evt.date] = [];
      }
      map[evt.date].push(evt);
    });
    // 依開始時間由早到晚排序
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) =>
        (a.startTime || "").localeCompare(b.startTime || ""),
      );
    });
    return map;
  });

  /** 月曆網格 (6 週 x 7 天 = 42 天) 計算 */
  const monthGrid = computed(() => {
    const year = currentYear.value;
    const month = currentMonth.value;

    // 當月第一天是星期幾 (0 = 週日, 6 = 週六)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // 當月總天數
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // 上個月總天數
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = [];
    const todayStr = "2026-09-06"; // 系統模擬基準日期

    // 1. 填補上個月尾數
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonthNum = month === 0 ? 11 : month - 1;
      const prevYearNum = month === 0 ? year - 1 : year;
      const dateStr = `${prevYearNum}-${String(prevMonthNum + 1).padStart(2, "0")}-${String(prevDay).padStart(2, "0")}`;
      grid.push({
        year: prevYearNum,
        month: prevMonthNum,
        day: prevDay,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: eventsByDate.value[dateStr] || [],
      });
    }

    // 2. 填補當月天數
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      grid.push({
        year,
        month,
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: eventsByDate.value[dateStr] || [],
      });
    }

    // 3. 填補下個月前綴直至 42 天
    const remaining = 42 - grid.length;
    for (let n = 1; n <= remaining; n++) {
      const nextMonthNum = month === 11 ? 0 : month + 1;
      const nextYearNum = month === 11 ? year + 1 : year;
      const dateStr = `${nextYearNum}-${String(nextMonthNum + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
      grid.push({
        year: nextYearNum,
        month: nextMonthNum,
        day: n,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: eventsByDate.value[dateStr] || [],
      });
    }

    return grid;
  });

  /** 週檢視 7 天清單計算 (以 selectedDate 或 currentDay 所在週為基準) */
  const weekDays = computed(() => {
    const baseDate = new Date(
      selectedDate.value ||
        `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, "0")}-${String(currentDay.value).padStart(2, "0")}`,
    );
    const dayOfWeek = baseDate.getDay(); // 0 是週日
    const sunday = new Date(baseDate);
    sunday.setDate(baseDate.getDate() - dayOfWeek);

    const days = [];
    const todayStr = "2026-09-06";

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const dayNum = d.getDate();
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({
        year: y,
        month: m,
        day: dayNum,
        dayOfWeek: i,
        dayName: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][i],
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate.value,
        events: eventsByDate.value[dateStr] || [],
      });
    }
    return days;
  });

  /** 今日或選定日期的詳細事件 */
  const selectedDateEvents = computed(() => {
    return eventsByDate.value[selectedDate.value] || [];
  });

  /** 未來即將到來的事件清單 (依日期升冪，最多 5 筆) */
  const upcomingEvents = computed(() => {
    const todayStr = "2026-09-06";
    return filteredEvents.value
      .filter(
        (e) =>
          e.date >= todayStr &&
          e.status !== "completed" &&
          e.status !== "cancelled",
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          (a.startTime || "").localeCompare(b.startTime || ""),
      )
      .slice(0, 6);
  });

  // =====================================================================
  // 4. 操作函式 (Actions)
  // =====================================================================
  /** 切換上一個月份/週期 */
  const prevPeriod = () => {
    if (currentView.value === "month") {
      if (currentMonth.value === 0) {
        currentMonth.value = 11;
        currentYear.value--;
      } else {
        currentMonth.value--;
      }
    } else if (currentView.value === "week") {
      const d = new Date(selectedDate.value);
      d.setDate(d.getDate() - 7);
      selectedDate.value = d.toISOString().slice(0, 10);
      currentYear.value = d.getFullYear();
      currentMonth.value = d.getMonth();
      currentDay.value = d.getDate();
    } else {
      const d = new Date(selectedDate.value);
      d.setDate(d.getDate() - 1);
      selectedDate.value = d.toISOString().slice(0, 10);
      currentYear.value = d.getFullYear();
      currentMonth.value = d.getMonth();
      currentDay.value = d.getDate();
    }
  };

  /** 切換下一個月份/週期 */
  const nextPeriod = () => {
    if (currentView.value === "month") {
      if (currentMonth.value === 11) {
        currentMonth.value = 0;
        currentYear.value++;
      } else {
        currentMonth.value++;
      }
    } else if (currentView.value === "week") {
      const d = new Date(selectedDate.value);
      d.setDate(d.getDate() + 7);
      selectedDate.value = d.toISOString().slice(0, 10);
      currentYear.value = d.getFullYear();
      currentMonth.value = d.getMonth();
      currentDay.value = d.getDate();
    } else {
      const d = new Date(selectedDate.value);
      d.setDate(d.getDate() + 1);
      selectedDate.value = d.toISOString().slice(0, 10);
      currentYear.value = d.getFullYear();
      currentMonth.value = d.getMonth();
      currentDay.value = d.getDate();
    }
  };

  /** 返回今天 */
  const goToToday = () => {
    currentYear.value = 2026;
    currentMonth.value = 8; // 9月
    currentDay.value = 6;
    selectedDate.value = "2026-09-06";
  };

  /** 選擇特定日期 */
  const selectDate = (dateStr) => {
    selectedDate.value = dateStr;
    const parts = dateStr.split("-");
    currentYear.value = parseInt(parts[0], 10);
    currentMonth.value = parseInt(parts[1], 10) - 1;
    currentDay.value = parseInt(parts[2], 10);
  };

  /** 開啟新增事件彈窗 */
  const openCreateModal = (defaultDate = "") => {
    editingEvent.value = null;
    if (defaultDate) {
      selectedDate.value = defaultDate;
    }
    isEventModalOpen.value = true;
  };

  /** 開啟編輯事件彈窗 */
  const openEditModal = (evt) => {
    editingEvent.value = { ...evt };
    isEventModalOpen.value = true;
  };

  const loadEvents = async (shouldUseLocalFallback = true) => {
    try {
      const payload = buildCalendarQuery();
      const { data } = await httpClient.post(
        "/api/calendar/events/search",
        payload,
      );
      const normalized = Array.isArray(data)
        ? data.map(normalizeCalendarEvent).filter(Boolean)
        : [];
      events.value = normalized;
      return normalized;
    } catch (error) {
      console.error("載入行事曆事件失敗，使用本地資料：", error);
      if (shouldUseLocalFallback) {
        const fallback = StorageService.get(
          "calendar_events_v2",
          INITIAL_CALENDAR_EVENTS,
        );
        events.value = fallback.map(normalizeCalendarEvent).filter(Boolean);
        return events.value;
      }
      return events.value;
    }
  };

  /** 新增事件 */
  const addEvent = async (eventData) => {
    const notifStore = useNotificationStore();
    const authStore = useAuthStore();

    const newEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: eventData.title || "未命名排程事件",
      description: eventData.description || "",
      category: eventData.category || "meeting",
      date: eventData.date || selectedDate.value,
      startTime: normalizeTimeValue(eventData.startTime, "09:00"),
      endTime: normalizeTimeValue(eventData.endTime, "10:00"),
      location: eventData.location || "",
      organizer: eventData.organizer || authStore.currentUser?.name || "管理員",
      attendees: eventData.attendees || [],
      priority: eventData.priority || "medium",
      status: eventData.status || "pending",
      relatedRef: eventData.relatedRef || "",
      reminderMinutes: Number(eventData.reminderMinutes ?? 15),
    };

    try {
      const response = await httpClient.post(
        "/api/calendar/events",
        toApiPayload(newEvent),
      );
      const savedEvent = normalizeCalendarEvent(response.data);
      events.value = [
        savedEvent,
        ...events.value.filter((e) => e.id !== savedEvent.id),
      ];

      authStore.recordAuditLog(
        "行事曆新增排程",
        "calendar",
        `新增排程「${savedEvent.title}」於 ${savedEvent.date} ${savedEvent.startTime}`,
        "success",
      );

      notifStore.addNotification({
        title: `行事曆新排程：${savedEvent.title}`,
        message: `已建立 ${savedEvent.date} (${CATEGORY_MAP[savedEvent.category]?.label || "事件"})，地點：${savedEvent.location || "未定"}。`,
        type: savedEvent.priority === "high" ? "warning" : "info",
        category: "system",
        actionLabel: "查看行事曆",
        actionRoute: "/calendar",
      });

      isEventModalOpen.value = false;
      return savedEvent;
    } catch (error) {
      console.error("新增行事曆事件失敗，改用本地資料：", error);
      events.value.unshift(newEvent);
      authStore.recordAuditLog(
        "行事曆新增排程",
        "calendar",
        `新增排程「${newEvent.title}」於 ${newEvent.date} ${newEvent.startTime}`,
        "success",
      );
      notifStore.addNotification({
        title: `行事曆新排程：${newEvent.title}`,
        message: `已建立 ${newEvent.date} (${CATEGORY_MAP[newEvent.category]?.label || "事件"})，地點：${newEvent.location || "未定"}。`,
        type: newEvent.priority === "high" ? "warning" : "info",
        category: "system",
        actionLabel: "查看行事曆",
        actionRoute: "/calendar",
      });
      isEventModalOpen.value = false;
      return newEvent;
    }
  };

  /** 更新事件 */
  const updateEvent = async (id, updatedData) => {
    const authStore = useAuthStore();
    const idx = events.value.findIndex((e) => e.id === id);
    const patchData = {
      ...(events.value[idx] || {}),
      ...updatedData,
    };

    try {
      const response = await httpClient.put(
        `/api/calendar/events/${id}`,
        toApiPayload(patchData),
      );
      const updatedEvent = normalizeCalendarEvent(response.data);
      if (updatedEvent) {
        events.value = events.value.map((e) =>
          e.id === id ? updatedEvent : e,
        );
      }
      authStore.recordAuditLog(
        "行事曆更新排程",
        "calendar",
        `更新排程「${updatedEvent?.title || patchData.title}」`,
        "success",
      );
      isEventModalOpen.value = false;
      return updatedEvent;
    } catch (error) {
      console.error("更新行事曆事件失敗，改用本地資料：", error);
      if (idx !== -1) {
        events.value[idx] = {
          ...events.value[idx],
          ...updatedData,
        };
      }
      authStore.recordAuditLog(
        "行事曆更新排程",
        "calendar",
        `更新排程「${patchData.title}」`,
        "success",
      );
      isEventModalOpen.value = false;
      return patchData;
    }
  };

  /** 刪除事件 */
  const deleteEvent = async (id) => {
    const authStore = useAuthStore();
    const target = events.value.find((e) => e.id === id);

    try {
      await httpClient.delete(`/api/calendar/events/${id}`);
      if (target) {
        events.value = events.value.filter((e) => e.id !== id);
      }
      authStore.recordAuditLog(
        "行事曆刪除排程",
        "calendar",
        `刪除排程「${target?.title || "未知排程"}」`,
        "warning",
      );
      isEventModalOpen.value = false;
      return true;
    } catch (error) {
      console.error("刪除行事曆事件失敗，改用本地資料：", error);
      if (target) {
        events.value = events.value.filter((e) => e.id !== id);
      }
      authStore.recordAuditLog(
        "行事曆刪除排程",
        "calendar",
        `刪除排程「${target?.title || "未知排程"}」`,
        "warning",
      );
      isEventModalOpen.value = false;
      return true;
    }
  };

  /** 快速切換事件狀態 (pending <-> completed) */
  const toggleEventStatus = async (id) => {
    const target = events.value.find((e) => e.id === id);
    if (!target) return null;

    const nextStatus = target.status === "completed" ? "pending" : "completed";
    try {
      const response = await httpClient.patch(
        `/api/calendar/events/${id}/toggle-status`,
      );
      const updatedEvent = normalizeCalendarEvent(response.data);
      if (updatedEvent) {
        events.value = events.value.map((e) =>
          e.id === id ? updatedEvent : e,
        );
      }
      return updatedEvent || { ...target, status: nextStatus };
    } catch (error) {
      console.error("切換狀態失敗，改用本地資料：", error);
      target.status = nextStatus;
      return { ...target, status: nextStatus };
    }
  };

  /**
   * 產生標準 iCalendar (.ics) 檔案並自動觸發瀏覽器下載
   * 格式相容 RFC 5545，可直接匯入 Google Calendar、Apple Calendar 與 Outlook
   */

  const exportICS = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Humanist Coffee ERP//Enterprise Calendar//ZH-TW",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Humanist ERP 企業營運行事曆",
      "X-WR-TIMEZONE:Asia/Taipei",
    ];

    events.value.forEach((evt) => {
      // 轉換日期時間格式: YYYYMMDDTHHmmSS
      const dateNoDash = evt.date.replace(/-/g, "");
      const startClean = (evt.startTime || "09:00").replace(":", "") + "00";
      const endClean = (evt.endTime || "10:00").replace(":", "") + "00";

      const dtStart = `${dateNoDash}T${startClean}`;
      const dtEnd = `${dateNoDash}T${endClean}`;
      const nowStamp =
        new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${evt.id}@humanist.coffee`);
      lines.push(`DTSTAMP:${nowStamp}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${evt.title.replace(/[,;\n]/g, " ")}`);
      lines.push(
        `DESCRIPTION:${(evt.description || "").replace(/\n/g, "\\n")}`,
      );
      if (evt.location) {
        lines.push(`LOCATION:${evt.location.replace(/[,;\n]/g, " ")}`);
      }
      lines.push(
        `CATEGORIES:${CATEGORY_MAP[evt.category]?.label || evt.category}`,
      );
      lines.push(
        `STATUS:${evt.status === "completed" ? "COMPLETED" : "CONFIRMED"}`,
      );
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");
    const icsContent = lines.join("\r\n");

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Humanist_ERP_Schedule_${currentYear.value}_${currentMonth.value + 1}.ics`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /** 匯出 CSV 排程清單大表 */
  const exportCSV = () => {
    const headers = [
      "事件編號",
      "活動標題",
      "類別",
      "日期",
      "開始時間",
      "結束時間",
      "地點",
      "負責人",
      "優先級",
      "狀態",
      "關聯單據",
      "詳細說明",
    ];
    const rows = events.value.map((e) => [
      `"${e.id}"`,
      `"${(e.title || "").replace(/"/g, '""')}"`,
      `"${CATEGORY_MAP[e.category]?.label || e.category}"`,
      `"${e.date}"`,
      `"${e.startTime || ""}"`,
      `"${e.endTime || ""}"`,
      `"${(e.location || "").replace(/"/g, '""')}"`,
      `"${(e.organizer || "").replace(/"/g, '""')}"`,
      `"${PRIORITY_MAP[e.priority]?.label || e.priority}"`,
      `"${STATUS_MAP[e.status]?.label || e.status}"`,
      `"${e.relatedRef || ""}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `ERP_Calendar_Events_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    // 狀態
    events,
    currentYear,
    currentMonth,
    currentDay,
    currentView,
    selectedCategory,
    statusFilter,
    priorityFilter,
    searchQuery,
    selectedDate,
    isEventModalOpen,
    editingEvent,
    isDayDetailModalOpen,
    // 常數定義
    CATEGORY_MAP,
    STATUS_MAP,
    PRIORITY_MAP,
    // 計算屬性
    currentMonthTitle,
    filteredEvents,
    categoryCounts,
    eventsByDate,
    monthGrid,
    weekDays,
    selectedDateEvents,
    upcomingEvents,
    // 動作
    prevPeriod,
    nextPeriod,
    goToToday,
    selectDate,
    openCreateModal,
    openEditModal,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleEventStatus,
    exportICS,
    exportCSV,
  };
});
