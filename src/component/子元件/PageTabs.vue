<template>
  <div
    class="
      flex
      items-center
      gap-2
      border-b
      border-[var(--outline)]
      pb-3
    "
  >
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      @click="emit('change', tab.value)"
      class="
        px-4
        py-2
        rounded-xl
        text-[length:var(--font-body)]
        font-bold
        transition-all
        flex
        items-center
        gap-2
        cursor-pointer
        border
      "
      :class="
        modelValue === tab.value
          ? `
              bg-[var(--primary)]/10
              text-[var(--primary)]
              border-[var(--primary)]/40
              shadow-sm
            `
          : `
              bg-[var(--surface-container)]
              text-[var(--on-surface-variant)]
              border-[var(--outline)]
              hover:bg-[var(--surface-container-high)]
              hover:text-[var(--on-surface)]
            `
      "
    >
      <component
        v-if="tab.icon"
        :is="tab.icon"
        class="w-4 h-4"
      />

      <span>
        {{ tab.label }}
      </span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true,
  },

  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "change",
]);
</script>