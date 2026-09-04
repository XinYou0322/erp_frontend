<template>
  <span
    class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
    :class="statusClasses"
  >
    <span
      v-if="showDot"
      class="w-1.5 h-1.5 rounded-full"
      :class="dotClasses"
    ></span>
    <span>{{ labelText }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    status: 'active' | 'low_stock' | 'out_of_stock' | 'archived' | 'normal' | 'low' | 'urgent' | 'pending' | 'preparing' | 'completed';
    label?: string;
    showDot?: boolean;
  }>(),
  {
    showDot: true,
  }
);

const statusClasses = computed(() => {
  switch (props.status) {
    case 'active':
    case 'normal':
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
    case 'low_stock':
    case 'low':
    case 'preparing':
      return 'bg-amber-50 text-amber-700 border border-amber-200/50';
    case 'out_of_stock':
    case 'urgent':
      return 'bg-red-50 text-red-700 border border-red-200/50';
    case 'archived':
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200/50';
  }
});

const dotClasses = computed(() => {
  switch (props.status) {
    case 'active':
    case 'normal':
    case 'completed':
      return 'bg-emerald-500';
    case 'low_stock':
    case 'low':
      return 'bg-amber-500 animate-pulse';
    case 'preparing':
      return 'bg-amber-500 animate-ping';
    case 'out_of_stock':
    case 'urgent':
      return 'bg-red-500 animate-pulse';
    case 'archived':
    case 'pending':
    default:
      return 'bg-gray-400';
  }
});

const labelText = computed(() => {
  if (props.label) return props.label;
  switch (props.status) {
    case 'active':
      return '販售中';
    case 'low_stock':
      return '庫存告急';
    case 'out_of_stock':
      return '已售罄';
    case 'archived':
      return '已封存';
    case 'normal':
      return '存量充足';
    case 'low':
      return '偏低需補';
    case 'urgent':
      return '緊急缺料';
    case 'pending':
      return '等候接單';
    case 'preparing':
      return '調飲製作中';
    case 'completed':
      return '已出餐';
    default:
      return props.status;
  }
});
</script>
