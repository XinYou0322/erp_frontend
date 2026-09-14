<script setup>
defineProps({
  title: { type: String, default: "" },
  value: { type: [String, Number], default: "" },
  growth: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  variant: { type: String, default: "blue" },
  icon: { type: [Object, Function], default: null },
});
</script>

<template>
  <div class="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-slate-400">{{ title }}</span>
      <div
        v-if="icon"
        class="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-800 text-emerald-400 border border-slate-700/60"
      >
        <component :is="icon" class="w-4 h-4" />
      </div>
    </div>
    <div class="flex items-baseline justify-between">
      <div class="text-2xl font-bold text-white tracking-tight">{{ value }}</div>
      <span
        v-if="growth"
        class="text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
      >
        {{ growth }}
      </span>
    </div>
    <div v-if="subtitle" class="text-[11px] text-slate-500 truncate">
      {{ subtitle }}
    </div>
  </div>
</template>

