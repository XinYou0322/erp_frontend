<template>
  <Teleport to="body">

    <div
      v-if="isOpen"
      class="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/50
      "
      @click.self="emit('cancel')"
      @keydown.esc.stop.prevent="emit('cancel')"
    >

      <div
        role="alertdialog"
        aria-modal="true"
        :aria-label="title"
        class="
          w-[90%]
          max-w-sm
          rounded-2xl
          p-5
          bg-[var(--surface-container)]
          border border-[var(--outline)]
          shadow-xl
        "
      >

        <h3
          class="
            font-bold
            text-[length:var(--font-title)]
            text-[var(--on-surface)]
          "
        >
          {{ title }}
        </h3>

        <p
          class="
            mt-2
            whitespace-pre-line
            text-[length:var(--font-body)]
            text-[var(--on-surface-variant)]
          "
        >
          {{ message }}
        </p>


        <div class="flex justify-end gap-2 mt-5">

          <button
            type="button"
            ref="cancelButton"
            @keydown.shift.tab.prevent="confirmButton?.focus()"
            class="btn-secondary"
            @click="emit('cancel')"
          >
            繼續編輯
          </button>

          <button
            type="button"
            ref="confirmButton"
            @keydown.tab.exact.prevent="cancelButton?.focus()"
            class="btn-primary"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </button>

        </div>

      </div>

    </div>

  </Teleport>
</template>


<script setup>

// Codex 修改：沿用關閉確認視窗外觀，允許薪資確認自訂內容及按鈕。
import { ref, watch, nextTick } from 'vue';
const props = defineProps({
  title: { type: String, default: '確定要關閉嗎？' },
  message: { type: String, default: '尚未儲存的資料將會遺失。' },
  confirmLabel: { type: String, default: '確定關閉' },
  isOpen: {
    type: Boolean,
    default: false
  }
})

// Codex 修改：開啟時聚焦繼續編輯，關閉後還原焦點，支援鍵盤操作。
const cancelButton = ref(null);
const confirmButton = ref(null);
let previousFocus = null;
watch(() => props.isOpen, async (open) => {
  if (open) {
    previousFocus = document.activeElement;
    await nextTick();
    cancelButton.value?.focus();
  } else {
    previousFocus?.focus?.();
  }
});

const emit = defineEmits([
  'cancel',
  'confirm'
])

</script>
