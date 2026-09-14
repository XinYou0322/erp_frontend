<template>
  <div
    v-if="totalPages > 1"
    class="
      flex
      items-center
      justify-center
      gap-2
      mt-6
    "
  >
    <!-- 上一頁 -->
    <button
      type="button"
      class="
        px-3
        py-2
        rounded-lg
        text-xs
        font-bold
        transition
        bg-[var(--surface-container)]
        border
        border-[var(--outline)]
        text-[var(--on-surface)]
        hover:bg-[var(--surface-container-high)]
        disabled:opacity-40
        disabled:cursor-not-allowed
      "
      :disabled="currentPage === 1"
      @click="changePage(currentPage - 1)"
    >
      上一頁
    </button>

    <!-- 頁碼 -->
    <button
      v-for="page in totalPages"
      :key="page"
      type="button"
      @click="changePage(page)"
      class="
        px-3
        py-2
        rounded-lg
        text-xs
        font-bold
        border
        transition
      "
      :class="
        currentPage === page
          ? `
              bg-[var(--primary)]
              border-[var(--primary)]
              text-[var(--on-primary)]
            `
          : `
              bg-[var(--surface-container)]
              border-[var(--outline)]
              text-[var(--on-surface)]
              hover:bg-[var(--surface-container-high)]
            `
      "
    >
      {{ page }}
    </button>

    <!-- 下一頁 -->
    <button
      type="button"
      class="
        px-3
        py-2
        rounded-lg
        text-xs
        font-bold
        transition
        bg-[var(--surface-container)]
        border
        border-[var(--outline)]
        text-[var(--on-surface)]
        hover:bg-[var(--surface-container-high)]
        disabled:opacity-40
        disabled:cursor-not-allowed
      "
      :disabled="currentPage === totalPages"
      @click="changePage(currentPage + 1)"
    >
      下一頁
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },

  totalPages: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(["change-page"])

const changePage = (page) => {
  if (page < 1 || page > props.totalPages) {
    return
  }

  emit("change-page", page)
}
</script>