<template>
  <div
    :id="id"
    class="glass-panel p-4 rounded-2xl flex items-center space-x-4 hover:bg-white/90 transition-all cursor-default group hover:-translate-y-0.5 relative overflow-hidden"
    :class="[
      variant === 'danger' ? 'hover:bg-red-50/70 border border-red-200/50' : '',
    ]"
  >
    <!-- Background pulse effect for danger -->
    <div
      v-if="variant === 'danger'"
      class="absolute inset-0 bg-red-500/5 jelly-pulse pointer-events-none"
    ></div>

    <!-- Icon Container -->
    <div
      class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors relative z-10"
      :class="iconBgClasses"
    >
      <slot name="icon">
        <component :is="icon" v-if="icon" class="w-6 h-6" :class="iconColorClass" />
      </slot>
    </div>

    <!-- Content -->
    <div class="relative z-10 min-w-0 flex-1">
      <p class="text-[#414754] text-xs font-medium truncate">{{ title }}</p>
      <div class="flex items-baseline space-x-2 mt-0.5 flex-wrap">
        <p
          class="text-2xl font-bold tracking-tight"
          :class="variant === 'danger' ? 'text-[#ba1a1a]' : 'text-[#181c23]'"
        >
          {{ value }}
        </p>
        <span
          v-if="growth"
          class="text-xs flex items-center font-semibold"
          :class="growthClasses"
        >
          {{ growth }}
        </span>
        <span
          v-if="badge"
          class="text-xs font-bold px-1.5 py-0.5 rounded"
          :class="badgeClasses"
        >
          {{ badge }}
        </span>
      </div>
      <p v-if="subtitle" class="text-[11px] text-gray-500 mt-0.5 truncate">
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

const props = withDefaults(
  defineProps<{
    id?: string;
    title: string;
    value: string | number;
    subtitle?: string;
    growth?: string;
    growthType?: 'up' | 'down' | 'neutral' | 'warning';
    badge?: string;
    variant?: 'default' | 'cyan' | 'danger' | 'amber' | 'emerald';
    icon?: Component;
  }>(),
  {
    variant: 'default',
    growthType: 'up',
  }
);

const iconBgClasses = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-100 glowing-warning';
    case 'cyan':
      return 'bg-[#00d2ff]/20 group-hover:bg-[#00d2ff]/30';
    case 'amber':
      return 'bg-amber-100 group-hover:bg-amber-200';
    case 'emerald':
      return 'bg-emerald-100 group-hover:bg-emerald-200';
    default:
      return 'bg-[#0070ea]/10 group-hover:bg-[#0070ea]/20';
  }
});

const iconColorClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'text-[#ba1a1a]';
    case 'cyan':
      return 'text-[#00566a]';
    case 'amber':
      return 'text-amber-700';
    case 'emerald':
      return 'text-emerald-700';
    default:
      return 'text-[#0059bb]';
  }
});

const growthClasses = computed(() => {
  switch (props.growthType) {
    case 'down':
      return 'text-[#ba1a1a]';
    case 'warning':
      return 'text-amber-600';
    case 'neutral':
      return 'text-gray-500';
    default:
      return 'text-[#0070ea]';
  }
});

const badgeClasses = computed(() => {
  if (props.variant === 'danger') {
    return 'bg-red-100/80 text-[#ba1a1a]';
  }
  return 'bg-blue-100 text-[#0059bb]';
});
</script>
