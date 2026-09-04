<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001D3D]/40 backdrop-blur-md transition-all"
      @click.self="handleBackdropClick"
    >
      <div
        :id="id"
        class="w-full bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        :class="maxWidthClass"
      >
        <!-- Modal Header -->
        <div
          class="px-6 py-4 bg-gradient-to-r from-[#007BFF]/10 via-[#00D2FF]/10 to-transparent border-b border-gray-100 flex items-center justify-between shrink-0"
        >
          <div class="flex items-center space-x-2.5">
            <slot name="header-icon">
              <div
                v-if="icon"
                class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#007BFF] to-[#00D2FF] flex items-center justify-center text-white shadow-sm"
              >
                <component :is="icon" class="w-4 h-4" />
              </div>
            </slot>
            <div>
              <h3 class="font-bold text-lg text-[#181c23] leading-tight">
                {{ title }}
              </h3>
              <p v-if="subtitle" class="text-xs text-[#414754] mt-0.5">
                {{ subtitle }}
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
            title="關閉"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          <slot />
        </div>

        <!-- Modal Footer -->
        <div
          v-if="$slots.footer"
          class="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between shrink-0"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    id?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    icon?: Component;
    closeOnBackdrop?: boolean;
  }>(),
  {
    maxWidth: '2xl',
    closeOnBackdrop: true,
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const maxWidthClass = computed(() => {
  switch (props.maxWidth) {
    case 'sm':
      return 'max-w-sm';
    case 'md':
      return 'max-w-md';
    case 'lg':
      return 'max-w-lg';
    case 'xl':
      return 'max-w-xl';
    case '3xl':
      return 'max-w-3xl';
    default:
      return 'max-w-2xl';
  }
});

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit('close');
  }
};
</script>
