<template>
  <div
    class="flex w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--outline)] bg-[var(--surface-container-low)]"
  >
    <img
      v-if="resolvedSrc && !loadFailed"
      :src="resolvedSrc"
      :alt="alt"
      class="w-full h-full object-contain"
      @error="loadFailed = true"
    />

    <div
      v-else
      class="flex flex-col items-center gap-1 text-xs text-[var(--on-surface-variant)]"
      role="img"
      :aria-label="alt || '尚無商品圖片'"
    >
      <ImageOff class="w-8 h-8" />
      <span>{{ loadFailed ? '圖片載入失敗' : '尚無圖片' }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ImageOff } from 'lucide-vue-next'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  }
})

const loadFailed = ref(false)

const resolvedSrc = computed(() => {
  const src = props.src?.trim()
  if (!src) return ''

  // 選檔預覽是 blob URL；既有資料也可能是完整網址。
  if (/^(blob:|data:|https?:\/\/)/i.test(src)) return src

  const baseUrl = (import.meta.env.VITE_AXIOS_HTTP_BASEURL || '').replace(/\/+$/, '')
  const path = src.startsWith('/') ? src : `/${src}`
  return `${baseUrl}${path}`
})

watch(resolvedSrc, () => {
  loadFailed.value = false
})
</script>
