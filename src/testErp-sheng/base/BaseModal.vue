<script setup lang="ts">
interface Props {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  icon?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

withDefaults(defineProps<Props>(), {
  isOpen: false,
  subtitle: '',
  icon: 'info',
  maxWidth: 'md',
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 transition-all"
    @click.self="emit('close')"
  >
    <div
      class="bg-slate-900 rounded-3xl w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]"
      :class="[
        maxWidth === 'sm' ? 'max-w-sm' : '',
        maxWidth === 'md' ? 'max-w-md' : '',
        maxWidth === 'lg' ? 'max-w-lg' : '',
        maxWidth === 'xl' ? 'max-w-2xl' : '',
        maxWidth === '2xl' ? 'max-w-4xl' : '',
        maxWidth === '3xl' ? 'max-w-5xl' : '',
        maxWidth === '4xl' ? 'max-w-6xl' : '',
      ]"
    >
      <!-- Modal Header -->
      <div class="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-400 text-[22px]">
              {{ icon }}
            </span>
            {{ title }}
          </h3>
          <p v-if="subtitle" class="text-xs text-slate-400 mt-0.5">
            {{ subtitle }}
          </p>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="flex-1 overflow-y-auto pr-1 text-xs">
        <slot />
      </div>

      <!-- Modal Footer -->
      <div v-if="$slots.footer" class="mt-4 pt-3 border-t border-slate-800">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
