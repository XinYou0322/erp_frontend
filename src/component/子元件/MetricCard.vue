<template>
  <div
    :id="id"
    class="
      p-4
      rounded-2xl
      flex
      items-center
      space-x-4
      transition-all
      cursor-default
      group
      hover:-translate-y-0.5
      relative
      overflow-hidden

      bg-[var(--surface-container)]
      border
      border-[var(--outline)]
      hover:bg-[var(--surface-container-high)]
    "
    :class="[
      variant === 'danger'
        ? 'border-[var(--error)]/40'
        : ''
    ]"
  >

    <!-- danger 背景效果 -->
    <div
      v-if="variant === 'danger'"
      class="
        absolute
        inset-0
        bg-[var(--error)]/5
        jelly-pulse
        pointer-events-none
      "
    ></div>


    <!-- Icon -->
    <div
      class="
        w-12
        h-12
        rounded-2xl
        flex
        items-center
        justify-center
        shrink-0
        transition-colors
        relative
        z-10
      "
      :class="iconBgClasses"
    >
      <slot name="icon">

        <component
          :is="icon"
          v-if="icon"
          class="w-6 h-6"
          :class="iconColorClass"
        />

      </slot>
    </div>


    <!-- Content -->
    <div class="relative z-10 min-w-0 flex-1">

      <p
        class="
          text-[var(--on-surface-variant)]
          text-xs
          font-medium
          truncate
        "
      >
        {{ title }}
      </p>


      <div class="flex items-baseline space-x-2 mt-0.5 flex-wrap">

        <p
          class="text-2xl font-bold tracking-tight"
          :class="
            variant === 'danger'
              ? 'text-[var(--error)]'
              : 'text-[var(--on-surface)]'
          "
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


      <p
        v-if="subtitle"
        class="
          text-[11px]
          text-[var(--on-surface-variant)]
          mt-0.5
          truncate
        "
      >
        {{ subtitle }}
      </p>

    </div>
  </div>
</template>


<script setup lang="ts">

import { computed } from 'vue'
import type { Component } from 'vue'


const props = withDefaults(
  defineProps<{
    id?: string
    title: string
    value: string | number
    subtitle?: string
    growth?: string
    growthType?: 'up' | 'down' | 'neutral' | 'warning'
    badge?: string
    variant?: 'default' | 'cyan' | 'danger' | 'amber' | 'emerald'
    icon?: Component
  }>(),
  {
    variant: 'default',
    growthType: 'up'
  }
)


const iconBgClasses = computed(() => {

  switch (props.variant) {

    case 'danger':
      return 'bg-[var(--error)]/15'

    case 'cyan':
      return 'bg-[var(--secondary)]/15'

    case 'amber':
      return 'bg-[var(--tertiary)]/15'

    case 'emerald':
      return 'bg-[var(--primary)]/15'

    default:
      return 'bg-[var(--surface-container-high)]'
  }

})


const iconColorClass = computed(() => {

  switch (props.variant) {

    case 'danger':
      return 'text-[var(--error)]'

    case 'cyan':
      return 'text-[var(--secondary)]'

    case 'amber':
      return 'text-[var(--tertiary)]'

    case 'emerald':
      return 'text-[var(--primary)]'

    default:
      return 'text-[var(--on-surface)]'
  }

})


const growthClasses = computed(() => {

  switch (props.growthType) {

    case 'down':
      return 'text-[var(--error)]'

    case 'warning':
      return 'text-[var(--tertiary)]'

    case 'neutral':
      return 'text-[var(--on-surface-variant)]'

    default:
      return 'text-[var(--primary)]'
  }

})


const badgeClasses = computed(() => {

  if (props.variant === 'danger') {

    return `
      bg-[var(--error)]/15
      text-[var(--error)]
    `
  }

  return `
    bg-[var(--surface-container-high)]
    text-[var(--on-surface)]
  `
})

</script>