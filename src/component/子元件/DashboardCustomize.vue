<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const widgets = computed(() => props.modelValue);

function toggle(key) {
  const next = {
    ...props.modelValue,
    [key]: !props.modelValue[key],
  };

  localStorage.setItem("dashboardWidgets", JSON.stringify(next));
  emit("update:modelValue", next);
}
</script>

<template>
  <details class="customize-panel">
    <summary>
      <span class="material-symbols-outlined">tune</span>
      自訂儀表板
    </summary>

    <div class="options">
      <label>
        <input
          type="checkbox"
          :checked="widgets.stats"
          @change="toggle('stats')"
        />
        統計卡片
      </label>

      <label>
        <input
          type="checkbox"
          :checked="widgets.revenueChart"
          @change="toggle('revenueChart')"
        />
        七天營收
      </label>

      <label>
        <input
          type="checkbox"
          :checked="widgets.topProducts"
          @change="toggle('topProducts')"
        />
        熱門商品
      </label>

    </div>
  </details>
</template>

<style scoped>
.customize-panel {
  background: var(--surface-container);
  border: 1px solid var(--outline);
  border-radius: 16px;
  overflow: hidden;
  min-width: 220px;
}

summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  cursor: pointer;
  font-weight: 600;
  list-style: none;
  color: var(--on-surface);
}

summary::-webkit-details-marker {
  display: none;
}

summary:hover {
  background: rgba(255,255,255,.03);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--outline);
}

label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--on-surface);
}

input[type="checkbox"] {
  accent-color: var(--primary);
}
</style>