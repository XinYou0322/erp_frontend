<template>
  <div
    v-if="totalPages > 1"
    class="
      flex
      flex-wrap
      items-center
      justify-center
      gap-2
      mt-6
    "
  >
    <!-- 【本次修改：分頁顯示規則】第一頁時直接隱藏「上一頁」。 -->
    <button
      v-if="currentPage > 1"
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
      "
      @click="changePage(currentPage - 1)"
    >
      上一頁
    </button>

    <!-- 【本次修改：前五頁＋後五頁】
         10 頁以內顯示全部頁碼，不需要額外的頁碼輸入框。 -->
    <template v-if="totalPages <= 10">
      <button
        v-for="page in allPageNumbers"
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
        :class="pageButtonClass(page)"
        :aria-current="currentPage === page ? 'page' : undefined"
      >
        {{ page }}
      </button>
    </template>

    <!-- 【本次修改：前五頁＋數字輸入＋後五頁】
         超過 10 頁時，中間使用可自由輸入的頁碼欄位，預設同步目前頁碼。 -->
    <template v-else>
      <button
        v-for="page in firstPageNumbers"
        :key="`first-${page}`"
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
        :class="pageButtonClass(page)"
        :aria-current="currentPage === page ? 'page' : undefined"
      >
        {{ page }}
      </button>

      <span
        class="px-1 text-xs font-bold text-[var(--on-surface-variant)]"
        aria-hidden="true"
      >
        ...
      </span>

      <!-- 【本次修改：自由選擇頁碼外觀】
           白底、淡灰字及文字游標用來明確表示這是可編輯欄位；數字預設為目前頁碼。
           【本次修改：輸入框文字顏色】文字由 slate-600 調淡為 slate-400。 -->
      <input
        v-model="pageInput"
        type="number"
        inputmode="numeric"
        step="1"
        min="1"
        :max="totalPages"
        class="
          pagination-page-input
          w-14
          rounded-lg
          border
          border-slate-300
          bg-white
          px-2
          py-2
          text-center
          text-xs
          font-bold
          text-slate-400
          shadow-inner
          outline-none
          cursor-text
          transition
          hover:border-slate-400
          focus:border-[var(--primary)]
          focus:ring-2
          focus:ring-[var(--primary)]
          focus:ring-offset-1
          focus:ring-offset-[var(--surface)]
        "
        aria-label="輸入要前往的頁碼"
        title="可輸入頁碼，按 Enter 前往"
        @focus="$event.target.select()"
        @keydown.enter.prevent="submitInputPage"
        @blur="submitInputPage"
        @wheel="$event.currentTarget.blur()"
      />

      <span
        class="px-1 text-xs font-bold text-[var(--on-surface-variant)]"
        aria-hidden="true"
      >
        ...
      </span>

      <button
        v-for="page in lastPageNumbers"
        :key="`last-${page}`"
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
        :class="pageButtonClass(page)"
        :aria-current="currentPage === page ? 'page' : undefined"
      >
        {{ page }}
      </button>
    </template>

    <!-- 【本次修改：分頁顯示規則】最後一頁時直接隱藏「下一頁」。 -->
    <button
      v-if="currentPage < totalPages"
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
      "
      @click="changePage(currentPage + 1)"
    >
      下一頁
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

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

const emit = defineEmits(['change-page'])

// 【本次新增：前五頁＋後五頁】建立三組固定頁碼資料。
const allPageNumbers = computed(() => {
  return Array.from(
    { length: Math.max(0, Math.trunc(props.totalPages)) },
    (_, index) => index + 1
  )
})

const firstPageNumbers = computed(() => {
  return Array.from({ length: 5 }, (_, index) => index + 1)
})

const lastPageNumbers = computed(() => {
  const total = Math.max(1, Math.trunc(props.totalPages))
  return Array.from({ length: 5 }, (_, index) => total - 4 + index)
})

// 【本次新增：自由選擇頁碼】輸入框預設及切頁後都顯示目前頁碼。
const pageInput = ref(String(props.currentPage))

watch(
  () => props.currentPage,
  (page) => {
    pageInput.value = String(page)
  }
)

watch(
  () => props.totalPages,
  () => {
    pageInput.value = String(
      Math.min(Math.max(Math.trunc(props.currentPage), 1), props.totalPages)
    )
  }
)

const pageButtonClass = (page) => {
  return props.currentPage === page
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
}

const changePage = (page) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return
  }

  emit('change-page', page)
}

// 【本次新增：自由選擇頁碼】
// 僅接受整數；超出範圍時自動限制在第 1 頁或最後一頁。
const submitInputPage = () => {
  const inputNumber = Number(pageInput.value)

  if (!Number.isFinite(inputNumber)) {
    pageInput.value = String(props.currentPage)
    return
  }

  const targetPage = Math.min(
    Math.max(Math.trunc(inputNumber), 1),
    Math.max(1, Math.trunc(props.totalPages))
  )

  pageInput.value = String(targetPage)
  changePage(targetPage)
}
</script>

<style scoped>
/* 【本次新增：自由選擇頁碼】移除 Firefox 的 number 輸入框上下箭頭。 */
.pagination-page-input {
  appearance: textfield;
  -moz-appearance: textfield;
}

/* 【本次新增：自由選擇頁碼】移除 Chrome、Edge、Safari 的上下箭頭。 */
.pagination-page-input::-webkit-inner-spin-button,
.pagination-page-input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
}
</style>




