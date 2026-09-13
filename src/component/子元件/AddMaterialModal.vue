<script setup>
import { ref } from "vue";
import httpClient from "@/service/httpClient";

const props = defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["update:open", "success"]);

const form = ref({
  name: "",
  code: "",
  cost: 0,
  unit: "kg",
  safetyStock: 10,
});

const isSubmitting = ref(false);
const errorMsg = ref("");

const closeModal = () => {
  emit("update:open", false);
};

const handleSubmit = async () => {
  if (!form.value.name || !form.value.code) {
    errorMsg.value = "請填寫物料名稱與料號";
    return;
  }
  isSubmitting.value = true;
  errorMsg.value = "";
  try {
    await httpClient.post("/api/materials", form.value);
    emit("success");
    closeModal();
  } catch (err) {
    errorMsg.value = err.response?.data?.message || "新增物料失敗";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/60 backdrop-blur-xs" @click="closeModal"></div>
    <div class="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 class="text-base font-bold text-white">新增原物料主檔</h3>
        <button @click="closeModal" class="text-slate-400 hover:text-white cursor-pointer">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div v-if="errorMsg" class="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1 font-semibold">物料名稱</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="例如：衣索比亞 耶加雪菲"
            required
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div>
          <label class="block text-slate-400 mb-1 font-semibold">物料料號 (Code)</label>
          <input
            v-model="form.code"
            type="text"
            placeholder="例如：RAW-COF-01"
            required
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1 font-semibold">單項成本 (NT$)</label>
            <input
              v-model.number="form.cost"
              type="number"
              min="0"
              step="0.1"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-semibold">計量單位</label>
            <input
              v-model="form.unit"
              type="text"
              placeholder="kg / 包 / 升"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-slate-400 mb-1 font-semibold">安全庫存水位</label>
          <input
            v-model.number="form.safetyStock"
            type="number"
            min="0"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold cursor-pointer disabled:opacity-50"
          >
            {{ isSubmitting ? "儲存中..." : "建立主檔" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

