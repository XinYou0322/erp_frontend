<script setup lang="ts">
import { computed } from "vue";
import { useCalendarStore } from "../../stores/calendar.store";
import { useAuthStore } from "../../stores/auth.store";

const calendarStore = useCalendarStore();
const authStore = useAuthStore();

const canMutateCalendar = computed(() => !!authStore.isAdmin);

const formattedDateTitle = computed(() => {
  if (!calendarStore.selectedDate) return "";
  const [y, m, d] = calendarStore.selectedDate.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  return `${y} 年 ${m} 月 ${d} 日 (${weekdays[dateObj.getDay()]})`;
});

const dayEvents = computed(() => {
  return calendarStore.selectedDateEvents;
});

const getCategoryMeta = (category?: string) => {
  const categoryMap = (calendarStore.CATEGORY_MAP ?? {}) as Record<string, any>;
  return (
    categoryMap[category ?? ""] ?? {
      badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      label: "未分類",
      icon: "help",
    }
  );
};

const handleQuickAdd = () => {
  if (!authStore.isAdmin) {
    return;
  }
  calendarStore.isDayDetailModalOpen = false;
  calendarStore.openCreateModal(calendarStore.selectedDate);
};

const handleEdit = (evt: any) => {
  if (!authStore.isAdmin) {
    return;
  }
  calendarStore.openEditModal(evt);
};

const closeModal = () => {
  calendarStore.isDayDetailModalOpen = false;
};
</script>

<template>
  <div
    v-if="calendarStore.isDayDetailModalOpen"
    class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity"
    @click.self="closeModal"
  >
    <div
      class="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Modal Header -->
      <div
        class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center"
          >
            <span class="material-symbols-outlined text-[20px]"
              >calendar_today</span
            >
          </div>
          <div>
            <h3 class="text-base font-bold text-white tracking-tight">
              {{ formattedDateTitle }}
            </h3>
            <p class="text-xs text-slate-400">
              共計 {{ dayEvents.length }} 個預排活動行程
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

      <!-- Content List -->
      <div class="p-6 overflow-y-auto space-y-3">
        <div
          v-if="dayEvents.length === 0"
          class="py-10 text-center text-slate-400 space-y-3"
        >
          <span class="material-symbols-outlined text-[48px] text-slate-600"
            >event_busy</span
          >
          <p class="text-sm font-medium">當日尚未安排任何營運或會議排程</p>
          <button
            v-if="canMutateCalendar"
            @click="handleQuickAdd"
            class="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]"
              >add_circle</span
            >
            <span>建立當日排程</span>
          </button>
        </div>

        <div
          v-for="evt in dayEvents"
          :key="evt.id"
          class="p-4 rounded-xl border transition-all space-y-2 bg-slate-950/60"
          :class="
            evt.status === 'completed'
              ? 'border-slate-800/80 opacity-75'
              : 'border-slate-700/80 hover:border-slate-600'
          "
        >
          <!-- Top Row: Time, Category, Priority, Action -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-data-mono font-bold text-[11px]"
              >
                {{ evt.startTime }} - {{ evt.endTime }}
              </span>
              <span
                class="px-2 py-0.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1"
                :class="getCategoryMeta(evt.category).badgeClass"
              >
                <span class="material-symbols-outlined text-[13px]">
                  {{ getCategoryMeta(evt.category).icon }}
                </span>
                {{ getCategoryMeta(evt.category).label }}
              </span>
              <span
                v-if="evt.priority === 'high'"
                class="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold"
              >
                高急迫
              </span>
            </div>

            <div class="flex items-center gap-1">
              <button
                v-if="canMutateCalendar"
                @click="calendarStore.toggleEventStatus(evt.id)"
                :title="
                  evt.status === 'completed' ? '設為待處理' : '標記已完成'
                "
                class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span class="material-symbols-outlined text-[18px]">
                  {{
                    evt.status === "completed"
                      ? "check_circle"
                      : "radio_button_unchecked"
                  }}
                </span>
              </button>
              <button
                v-if="canMutateCalendar"
                @click="handleEdit(evt)"
                title="編輯排程"
                class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>
          </div>

          <!-- Title -->
          <h4
            class="text-sm font-bold text-white"
            :class="
              evt.status === 'completed' ? 'line-through text-slate-400' : ''
            "
          >
            {{ evt.title }}
          </h4>

          <!-- Description -->
          <p
            v-if="evt.description"
            class="text-xs text-slate-400 leading-relaxed"
          >
            {{ evt.description }}
          </p>

          <!-- Meta Footnote: Location, Organizer, RelatedRef -->
          <div
            class="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2"
          >
            <div class="flex items-center gap-3">
              <span v-if="evt.location" class="flex items-center gap-1">
                <span
                  class="material-symbols-outlined text-[13px] text-slate-500"
                  >location_on</span
                >
                <span>{{ evt.location }}</span>
              </span>
              <span v-if="evt.organizer" class="flex items-center gap-1">
                <span
                  class="material-symbols-outlined text-[13px] text-slate-500"
                  >person</span
                >
                <span>{{ evt.organizer }}</span>
              </span>
            </div>

            <span
              v-if="evt.relatedRef"
              class="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-data-mono text-[10px]"
            >
              {{ evt.relatedRef }}
            </span>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div
        class="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between"
      >
        <button
          v-if="canMutateCalendar"
          @click="handleQuickAdd"
          class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span class="material-symbols-outlined text-[16px]">add</span>
          <span>新增此日排程</span>
        </button>

        <button
          @click="closeModal"
          class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          關閉
        </button>
      </div>
    </div>
  </div>
</template>
