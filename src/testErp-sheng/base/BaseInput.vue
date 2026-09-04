<script setup lang="ts">
interface Props {
  modelValue?: string | number;
  placeholder?: string;
  type?: string;
  label?: string;
  icon?: string;
  required?: boolean;
  disabled?: boolean;
  mono?: boolean;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  type: 'text',
  label: '',
  icon: '',
  required: false,
  disabled: false,
  mono: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-xs font-semibold text-slate-400 mb-1.5">
      {{ label }}
      <span v-if="required" class="text-rose-400">*</span>
    </label>
    <div class="relative flex items-center">
      <span
        v-if="icon"
        class="material-symbols-outlined absolute left-3 text-slate-500 text-[18px] pointer-events-none"
      >
        {{ icon }}
      </span>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        @input="handleInput"
        class="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          icon ? 'pl-9 pr-3.5' : 'px-3.5',
          mono ? 'font-data-mono' : '',
        ]"
      />
    </div>
  </div>
</template>
