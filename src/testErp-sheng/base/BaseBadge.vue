<script setup lang="ts">
interface Props {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  dot?: boolean;
  size?: 'sm' | 'md';
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  dot: false,
  size: 'md',
});
</script>

<template>
  <span
    class="inline-flex items-center font-bold font-data-mono uppercase tracking-wider rounded-lg border"
    :class="[
      size === 'sm' ? 'px-2 py-0.5 text-[10px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5',
      variant === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : '',
      variant === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : '',
      variant === 'danger' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : '',
      variant === 'info' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : '',
      variant === 'neutral' ? 'bg-slate-800/80 text-slate-300 border-slate-700' : '',
      variant === 'purple' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : '',
    ]"
  >
    <span
      v-if="dot"
      class="size-1.5 rounded-full"
      :class="[
        variant === 'success' ? 'bg-emerald-400' : '',
        variant === 'warning' ? 'bg-amber-400' : '',
        variant === 'danger' ? 'bg-rose-400' : '',
        variant === 'info' ? 'bg-cyan-400' : '',
        variant === 'neutral' ? 'bg-slate-400' : '',
        variant === 'purple' ? 'bg-purple-400' : '',
      ]"
    />
    <slot />
  </span>
</template>
