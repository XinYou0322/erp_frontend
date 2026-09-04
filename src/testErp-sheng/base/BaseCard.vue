<script setup lang="ts">
interface Props {
  hoverable?: boolean;
  padded?: boolean;
}

withDefaults(defineProps<Props>(), {
  hoverable: false,
  padded: true,
});
</script>

<template>
  <div
    class="bento-card transition-all"
    :class="[
      padded ? 'p-5 sm:p-6' : '',
      hoverable ? 'hover:border-slate-700/80 hover:shadow-level-2' : '',
    ]"
  >
    <div v-if="$slots.header" class="mb-4 pb-3 border-b border-slate-800/80 flex items-center justify-between">
      <slot name="header" />
    </div>

    <slot />

    <div v-if="$slots.footer" class="mt-4 pt-3 border-t border-slate-800/80">
      <slot name="footer" />
    </div>
  </div>
</template>
