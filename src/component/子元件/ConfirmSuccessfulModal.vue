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
          這筆{{ itemName }}修改成功
        </h3>


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