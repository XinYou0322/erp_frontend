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
    >

      <div
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
          <!-- 【本次修改：ECPay 成功視窗】有傳 title 時顯示自訂交易標題；既有頁面仍沿用原本文字。 -->
          {{ title || `這筆${itemName}修改成功` }}
        </h3>

        <!-- 【本次新增：ECPay 成功視窗】可顯示銷售單號等補充資訊。 -->
        <p
          v-if="message"
          class="mt-3 leading-6 text-[length:var(--font-body)] text-[var(--on-surface-variant)]"
        >
          {{ message }}
        </p>

        <div class="flex justify-end gap-2 mt-5">

          <button
            type="button"
            class="btn-primary"
            @click="emit('confirm')"
          >
            關閉
          </button>

        </div>

      </div>

    </div>

  </Teleport>
</template>


<script setup>

defineProps({
  // 【本次新增：ECPay 成功視窗】不傳入時完全保留元件原本顯示方式。
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  itemName: {
    type: String,
    default: '資料'
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'cancel',
  'confirm'
])

</script>

