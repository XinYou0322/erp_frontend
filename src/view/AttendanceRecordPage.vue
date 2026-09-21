<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth.store";

type ClockRecord = {
  id?: number | string;
  userId?: number | string;
  userName?: string;
  action?: string;
  timestamp?: string;
};

const authStore = useAuthStore();

// 1. 讀取 Store 的權限計算屬性 (包含 admin 與 manager)
const hasAccessAll = computed(() => authStore.isManager);

// 2. 預設過濾器：高權限預設看全部('all')，一般員工強制鎖定在我的紀錄('mine')
const currentFilter = ref<"all" | "mine">(hasAccessAll.value ? "all" : "mine");
const loading = ref(false);

// 💡 調整重點 1：前端加上強型態防禦過濾 (String 轉型比對)
const displayedRecords = computed(() => {
  const list: ClockRecord[] = authStore.clockRecords || [];
  const currentUserId = authStore.currentUser?.id;

  // 安全防護：如果是一般員工，或是管理員主動切換到「我的紀錄」
  if (!hasAccessAll.value || currentFilter.value === "mine") {
    return list.filter((record: ClockRecord) => {
      if (!record.userId || !currentUserId) return false;
      // 關鍵！兩邊都轉成 String 比對，徹底解決後端 String 與前端 Number 的衝突
      return String(record.userId) === String(currentUserId);
    });
  }

  // 管理員在「全部紀錄」標籤下，直接回傳後端撈到的所有人紀錄（已包含管理員自己）
  return list;
});

const totalCount = computed(() => displayedRecords.value.length);

const formatTime = (value: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTypeClass = (action: string) =>
  action === "上班打卡"
    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
    : "bg-rose-500/10 text-rose-400 border border-rose-500/30";

// 💡 調整重點 2：精準 API 請求，發送前強制轉成 String
const loadRecords = async () => {
  loading.value = true;
  try {
    let targetUserId: string | undefined = undefined;

    // 如果是一般員工，或者管理員主動切換到「我的紀錄」
    if (!hasAccessAll.value || currentFilter.value === "mine") {
      if (
        authStore.currentUser?.id !== undefined &&
        authStore.currentUser?.id !== null
      ) {
        // 關鍵！強制轉成 String，完美對接後端的 @RequestParam String userId
        targetUserId = String(authStore.currentUser.id);
      }
    }

    // 發送請求給後端：
    // 管理員看全部 -> 傳 undefined -> 後端執行 findAll...
    // 一般員工或看個人 -> 傳 String -> 後端執行 findByUserId...
    await authStore.fetchClockRecords(targetUserId);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRecords();
});
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <div
      class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <div class="flex items-center gap-2 text-emerald-400">
          <span class="material-symbols-outlined text-base">record</span>
          <p class="text-xs uppercase tracking-[0.18em]">Attendance</p>
        </div>
        <h1 class="mt-1 text-2xl font-black text-white">打卡紀錄列表</h1>
      </div>

      <!-- 只有最高權限者 (admin/manager) 才能看到並操作切換按鈕 -->
      <div
        v-if="hasAccessAll"
        class="inline-flex rounded-xl border border-slate-700 bg-slate-900 p-1"
      >
        <button
          type="button"
          @click="
            currentFilter = 'all';
            loadRecords();
          "
          class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
          :class="
            currentFilter === 'all'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-slate-300'
          "
        >
          全部紀錄
        </button>
        <button
          type="button"
          @click="
            currentFilter = 'mine';
            loadRecords();
          "
          class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
          :class="
            currentFilter === 'mine'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-slate-300'
          "
        >
          我的紀錄
        </button>
      </div>
    </div>

    <div
      class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/10"
    >
      <div class="mb-3 flex items-center justify-between">
        <div class="text-sm font-bold text-white">打卡時間軸</div>
        <div class="text-xs text-slate-400">共 {{ totalCount }} 筆</div>
      </div>

      <div v-if="loading" class="py-8 text-center text-xs text-slate-400">
        載入中...
      </div>

      <div
        v-else-if="displayedRecords.length === 0"
        class="py-8 text-center text-xs text-slate-400"
      >
        目前沒有打卡紀錄。
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="record in displayedRecords"
          :key="record.id"
          class="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-3"
        >
          <div class="flex items-center gap-3">
            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="
                record.action === '上班打卡' ? 'bg-emerald-400' : 'bg-rose-400'
              "
            />
            <div>
              <div class="font-bold text-white">{{ record.action }}</div>
              <!-- 優化顯示：如果後端沒給中文名字，至少會顯示轉型後的用戶 ID -->
              <div class="text-[10px] text-slate-400">
                {{ record.userName || "員工 ID: " + record.userId }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span
              class="rounded-full px-2 py-1 text-[10px] font-bold"
              :class="getTypeClass(record.action || '')"
            >
              {{ record.action || "打卡" }}
            </span>
            <span class="text-[11px] text-slate-300">
              {{ formatTime(record.timestamp || "") }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
