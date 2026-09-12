<template>

  <div class="relative w-full">

    <!-- 沒有文字才顯示放大鏡 -->
    <Search
      v-if="!hasValue"
      class="
        absolute
        left-3
        top-1/2
        -translate-y-1/2
        w-4
        h-4
        text-[var(--on-surface-variant)]
        pointer-events-none
      "
    />


    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      :class="[
        'input-field w-full transition-all',
        hasValue
          ? 'pl-3 pr-9'
          : 'pl-10 pr-3'
      ]"
      @input="handleInput"
    />


    <!-- 有文字才顯示 X -->
    <button
      v-if="hasValue"
      type="button"
      @click="clearInput"
      class="
        absolute
        right-2.5
        top-1/2
        -translate-y-1/2
        p-1
        rounded-md
        text-[var(--on-surface-variant)]
        hover:text-[var(--on-surface)]
        hover:bg-[var(--surface-container-high)]
        transition-colors
        cursor-pointer
      "
    >
      <X class="w-3.5 h-3.5" />
    </button>

  </div>

</template>


<script setup lang="ts">

import { computed } from 'vue'
import { Search, X } from 'lucide-vue-next'


const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  {
    placeholder: '搜尋...'
  }
)


const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()


// 是否有輸入文字
const hasValue = computed(() => {
  return props.modelValue.trim().length > 0
})


const handleInput = (event: Event) => {

  const target =
    event.target as HTMLInputElement

  emit(
    'update:modelValue',
    target.value
  )
}


const clearInput = () => {

  emit(
    'update:modelValue',
    ''
  )
}

</script>