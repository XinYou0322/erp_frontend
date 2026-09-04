<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="overflow-visible"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.35" />
        <stop offset="100%" :stop-color="color" stop-opacity="0.0" />
      </linearGradient>
    </defs>

    <!-- Fill area under curve -->
    <path
      v-if="areaPath"
      :d="areaPath"
      :fill="`url(#${gradientId})`"
    />

    <!-- Stroke curve -->
    <path
      :d="linePath"
      fill="none"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Final point dot -->
    <circle
      v-if="lastPoint"
      :cx="lastPoint.x"
      :cy="lastPoint.y"
      r="3"
      :fill="color"
      stroke="#ffffff"
      stroke-width="1.5"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    data: number[];
    color?: string;
    width?: number;
    height?: number;
    id?: string;
  }>(),
  {
    color: '#0070ea',
    width: 90,
    height: 28,
  }
);

const gradientId = computed(() => `sparkline-grad-${props.id || Math.random().toString(36).substring(2, 9)}`);

const points = computed(() => {
  if (!props.data || props.data.length < 2) return [];
  const min = Math.min(...props.data);
  const max = Math.max(...props.data);
  const range = max - min || 1;
  const padding = 4;
  const availableHeight = props.height - padding * 2;
  const stepX = props.width / (props.data.length - 1);

  return props.data.map((val, idx) => {
    const x = idx * stepX;
    const normalized = (val - min) / range;
    const y = props.height - padding - normalized * availableHeight;
    return { x, y };
  });
});

const linePath = computed(() => {
  if (points.value.length === 0) return '';
  return points.value.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[idx - 1];
    const cpX1 = prev.x + (pt.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (pt.x - prev.x) / 2;
    const cpY2 = pt.y;
    return `${acc} C ${cpX1},${cpY1} ${cpX2},${cpY2} ${pt.x},${pt.y}`;
  }, '');
});

const areaPath = computed(() => {
  if (!linePath.value || points.value.length === 0) return '';
  const last = points.value[points.value.length - 1];
  const first = points.value[0];
  return `${linePath.value} L ${last.x},${props.height} L ${first.x},${props.height} Z`;
});

const lastPoint = computed(() => {
  if (points.value.length === 0) return null;
  return points.value[points.value.length - 1];
});
</script>
