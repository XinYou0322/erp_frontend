<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useCalendarStore } from "../../stores/calendar.store";
import { useAuthStore } from "../../stores/auth.store";
import { useUIStore } from "../../stores/ui.store";

const calendarStore = useCalendarStore();
const authStore = useAuthStore();
const uiStore = useUIStore();

const form = ref({
  id: "",
  title: "",
  description: "",
  category: "meeting",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  organizer: "",
  attendeesStr: "",
  priority: "medium",
  status: "pending",
  relatedRef: "",
  reminderMinutes: 15,
});

const isEditMode = computed(() => !!calendarStore.editingEvent);
const currentUserName = computed(
  () => authStore.currentUser?.name || "Alex Smith",
);

// 監聽彈窗開啟並初始化表單
watch(
  () => calendarStore.isEventModalOpen,
  (isOpen) => {
    if (!isOpen) return;

    const userName = currentUserName.value;

    if (calendarStore.editingEvent) {
      const e = calendarStore.editingEvent as any;

      if (!e) return;

      form.value = {
        id: e.id || "",
        title: e.title || "",
        description: e.description || "",
        category: e.category || "meeting",
        date: e.date || calendarStore.selectedDate,
        startTime: e.startTime || "09:00",
        endTime: e.endTime || "10:00",
        location: e.location || "",
        organizer: e.organizer || userName,
        attendeesStr: Array.isArray(e.attendees) ? e.attendees.join(", ") : "",
        priority: e.priority || "medium",
        status: e.status || "pending",
        relatedRef: e.relatedRef || "",
        reminderMinutes: e.reminderMinutes ?? 15,
      };
      return;
    }

    form.value = {
      id: "",
      title: "",
      description: "",
      category: "meeting",
      date: calendarStore.selectedDate || "2026-09-06",
      startTime: "09:00",
      endTime: "10:00",
      location: "台北總部 3F 會議室",
      organizer: userName,
      attendeesStr: userName,
      priority: "medium",
      status: "pending",
      relatedRef: "",
      reminderMinutes: 15,
    };
  },
);

// 快速模板標題標籤
const quickTemplates = [
  { label: "採購進貨驗收", category: "procurement", time: "10:00~11:30" },
  { label: "設備定期巡檢保養", category: "maintenance", time: "14:00~16:00" },
  { label: "跨部門營運月會", category: "meeting", time: "09:30~11:30" },
  { label: "BOM 試產與用量核對", category: "production", time: "13:30~16:00" },
  { label: "門市行銷會員日促銷", category: "marketing", time: "11:00~20:00" },
];

const applyTemplate = (tpl: (typeof quickTemplates)[0]) => {
  form.value.title = tpl.label;
  form.value.category = tpl.category;
  if (tpl.time.includes("~")) {
    const [start, end] = tpl.time.split("~");
    form.value.startTime = start;
    form.value.endTime = end;
  }
};

const handleSave = async () => {
  if (!authStore.isAdmin) {
    uiStore.showToast("只有最高權限可新增或修改排程", "warning");
    return;
  }
  if (!form.value.title.trim()) {
    uiStore.showToast("請輸入排程標題", "warning");
    return;
  }
  if (!form.value.date) {
    uiStore.showToast("請選擇排程日期", "warning");
    return;
  }

  const attendeesArray = form.value.attendeesStr
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const payload = {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    category: form.value.category,
    date: form.value.date,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    location: form.value.location.trim(),
    organizer: form.value.organizer.trim(),
    attendees: attendeesArray,
    priority: form.value.priority,
    status: form.value.status,
    relatedRef: form.value.relatedRef.trim(),
    reminderMinutes: Number(form.value.reminderMinutes) || 15,
  };

  if (isEditMode.value && form.value.id) {
    await calendarStore.updateEvent(form.value.id, payload);
    uiStore.showToast(`已更新排程「${payload.title}」`, "success");
  } else {
    await calendarStore.addEvent(payload);
    uiStore.showToast(`已建立新排程「${payload.title}」`, "success");
  }
};

const handleDelete = async () => {
  if (!authStore.isAdmin) {
    uiStore.showToast("只有最高權限可刪除排程", "warning");
    return;
  }
  if (!form.value.id) return;
  if (confirm(`確定要永久刪除此排程「${form.value.title}」嗎？`)) {
    await calendarStore.deleteEvent(form.value.id);
    uiStore.showToast("已刪除排程項目", "info");
  }
};

const closeModal = () => {
  calendarStore.isEventModalOpen = false;
};
</script>

<style scoped>
.date-field,
.time-field {
  color-scheme: dark;
  appearance: none;
  background-image: none;
  padding-right: 0.75rem;
}

.date-field::-webkit-calendar-picker-indicator,
.time-field::-webkit-calendar-picker-indicator {
  opacity: 0.9;
  cursor: pointer;
  filter: brightness(1.3) saturate(1.4) sepia(1) hue-rotate(110deg) saturate(2);
}

.date-field::-webkit-datetime-edit,
.time-field::-webkit-datetime-edit {
  color: #f8fafc;
}

.date-field:focus,
.time-field:focus,
.select-accent:focus,
.select-accent:focus-visible {
  border-color: rgba(52, 211, 153, 0.9);
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35);
  outline: none;
}

.select-accent {
  color-scheme: dark;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z' fill='%2347e4b9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.8rem center;
  background-size: 1rem;
  padding-right: 2.2rem;
}

.select-accent option {
  background: #020817;
  color: #e2e8f0;
}

.icon-accent {
  color: #34d399 !important;
}
</style>

<template>
  <div
    v-if="calendarStore.isEventModalOpen"
    class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity"
    @click.self="closeModal"
  >
    <div
      class="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs"
            :class="
              isEditMode
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            "
          >
            <span class="material-symbols-outlined text-[20px]">
              {{ isEditMode ? "edit_calendar" : "add_circle" }}
            </span>
          </div>
          <div>
            <h3 class="text-base font-bold text-white tracking-tight">
              {{ isEditMode ? "編輯排程活動" : "開立新排程活動" }}
            </h3>
            <p class="text-xs text-slate-400">
              {{
                isEditMode
                  ? `事件識別碼：${form.id}`
                  : "登記企業各類營運、交期與維護排程"
              }}
            </p>
          </div>
        </div>

        <button
          @click="closeModal"
          class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Quick Template Chips (僅新增模式顯示) -->
      <div
        v-if="!isEditMode"
        class="px-6 pt-3 pb-1 bg-slate-950/20 border-b border-slate-800/40 flex items-center gap-1.5 overflow-x-auto text-xs"
      >
        <span class="text-[11px] text-slate-400 font-semibold shrink-0"
          >常用範本：</span
        >
        <button
          v-for="tpl in quickTemplates"
          :key="tpl.label"
          type="button"
          @click="applyTemplate(tpl)"
          class="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shrink-0 text-[11px] transition-colors cursor-pointer"
        >
          {{ tpl.label }}
        </button>
      </div>

      <!-- Form Body -->
      <div class="px-6 py-5 overflow-y-auto space-y-4 text-xs">
        <!-- Title Input -->
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">
            活動標題 <span class="text-rose-400">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            placeholder="例如：生豆採購進貨驗收 (PO-2026-0301)"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 text-sm font-medium transition-colors"
          />
        </div>

        <!-- Category & Priority Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block font-semibold text-slate-300 mb-1.5">
              排程分類 <span class="text-rose-400">*</span>
            </label>
            <select
              v-model="form.category"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="procurement">採購供鏈 (供應商交期與驗收)</option>
              <option value="production">生產排程 (BOM試產與耗損盤點)</option>
              <option value="meeting">會議例會 (月會與跨部覆盤)</option>
              <option value="leave">差假排班 (員工休假與代理)</option>
              <option value="maintenance">設備保養 (機器清洗與耗損檢測)</option>
              <option value="marketing">促銷活動 (POS門市會員促銷)</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1.5"
              >優先級別</label
            >
            <div class="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                @click="form.priority = 'high'"
                class="py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1"
                :class="
                  form.priority === 'high'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:bg-slate-800'
                "
              >
                <span class="size-1.5 rounded-full bg-rose-400" />
                高急迫
              </button>
              <button
                type="button"
                @click="form.priority = 'medium'"
                class="py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1"
                :class="
                  form.priority === 'medium'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:bg-slate-800'
                "
              >
                <span class="size-1.5 rounded-full bg-amber-400" />
                中優先
              </button>
              <button
                type="button"
                @click="form.priority = 'low'"
                class="py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1"
                :class="
                  form.priority === 'low'
                    ? 'bg-slate-800 text-white border-slate-500 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:bg-slate-800'
                "
              >
                <span class="size-1.5 rounded-full bg-slate-400" />
                常態
              </button>
            </div>
          </div>
        </div>

        <!-- Date & Time Range Row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-semibold text-slate-300 mb-1.5">
              排程日期 <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="form.date"
              type="date"
              class="date-field w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500 font-data-mono"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1.5"
              >開始時間</label
            >
            <input
              v-model="form.startTime"
              type="time"
              class="time-field w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500 font-data-mono"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1.5"
              >結束時間</label
            >
            <input
              v-model="form.endTime"
              type="time"
              class="time-field w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500 font-data-mono"
            />
          </div>
        </div>

        <!-- Location & Status Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block font-semibold text-slate-300 mb-1.5"
              >地點或線上會議室</label
            >
            <div class="relative">
              <span
                class="material-symbols-outlined absolute left-3 top-2.5 text-emerald-400 text-[18px] icon-accent"
              >
                location_on
              </span>
              <input
                v-model="form.location"
                type="text"
                placeholder="例如：總部 3F 會議室 / 線上 Zoom"
                class="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1.5"
              >執行狀態</label
            >
            <select
              v-model="form.status"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="pending">待處理 (Pending)</option>
              <option value="in_progress">進行中 (In Progress)</option>
              <option value="completed">已完成 (Completed)</option>
              <option value="cancelled">已取消 (Cancelled)</option>
            </select>
          </div>
        </div>

        <!-- Organizer & Attendees & Related Document -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block font-semibold text-slate-300 mb-1.5"
              >發起人 / 負責人</label
            >
            <input
              v-model="form.organizer"
              type="text"
              placeholder="例如：Alex Smith"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1.5"
              >關聯單據或料號 (選填)</label
            >
            <input
              v-model="form.relatedRef"
              type="text"
              placeholder="例如：PO-2026-0301, BOM-ASM-01"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 font-data-mono"
            />
          </div>
        </div>

        <!-- Attendees String Input -->
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5"
            >參與成員 (以逗號分隔)</label
          >
          <input
            v-model="form.attendeesStr"
            type="text"
            placeholder="例如：Alex Smith, Linda Wang, 倉管品管組"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <!-- Description Textarea -->
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5"
            >排程事項說明與備註</label
          >
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="補充排程詳細步驟、驗收項目或重點注意事項..."
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 resize-none"
          />
        </div>
      </div>

      <!-- Footer Buttons -->
      <div
        class="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between"
      >
        <div>
          <button
            v-if="isEditMode"
            type="button"
            @click="handleDelete"
            class="px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">delete</span>
            <span>刪除排程</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSave"
            class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">check</span>
            <span>{{ isEditMode ? "儲存變更" : "建立排程" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
