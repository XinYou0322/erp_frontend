<template>
<section class="supplier-detail-section">
      <div class="supplier-detail-section__header">
        <span>供應商備註</span>
        <!-- 顯示後端分頁回傳的備註總筆數，而不是只有目前這一頁的筆數。 -->
        <span class="supplier-count-badge">{{ noteTotalElements }} 筆</span>
      </div>

      <div v-if="isLoadingNotes" class="supplier-empty-state" aria-live="polite">
        備註載入中…
      </div>

      <div v-else-if="notesError" class="supplier-empty-state" role="alert">
        <p>{{ notesError }}</p>
        <button type="button" class="supplier-btn supplier-btn--secondary mt-3" @click="fetchSupplierNotes">
          重新載入
        </button>
      </div>

      <template v-else-if="supplierNotes.length > 0">
        <div class="supplier-note-list">
          <article
            v-for="(note, index) in supplierNotes"
            :key="note.id ?? index"
            class="supplier-note-card"
          >
            <div class="supplier-note-card__header">
              <!-- 分頁後仍使用連續序號，避免每頁都從備註 1 開始。 -->
              <div class="supplier-note-card__number">
                備註 {{ (noteCurrentPage - 1) * notePageSize + index + 1 }}
              </div>
              <div class="supplier-note-card__time">{{ formatDate(note.createdAt) }}</div>
            </div>

            <!-- 後端 SuppliersNotesRespoDTO 欄位是 remark，不是 content。 -->
            <div class="supplier-note-card__content">{{ note.remark || '-' }}</div>

            <div class="supplier-note-card__footer">
              <span class="supplier-note-card__label">建立人</span>
              <span>{{ note.createdBy || '-' }}</span>
            </div>
          </article>
        </div>

        <!-- 供應商備註分頁統一使用既有 Pagination.vue。 -->
        <Pagination
          :current-page="noteCurrentPage"
          :total-pages="noteTotalPages"
          @change-page="changeNotePage"
        />
      </template>

      <div v-else class="supplier-empty-state">此供應商目前沒有備註</div>
    </section>
</template>
<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import httpClient from '@/service/httpClient'

import Pagination from '@/component/子元件/Pagination.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  supplier: {
    type: Object,
    default: () => ({})
  }
})



// 備註分頁狀態；畫面頁碼從 1 開始，呼叫 Spring Page API 時再減 1。
const supplierNotes = ref([])
const noteCurrentPage = ref(1)
const notePageSize = 4
const noteTotalPages = ref(0)
const noteTotalElements = ref(0)
const isLoadingNotes = ref(false)
const notesError = ref('')
let latestNoteRequest = 0
onBeforeUnmount(() => { latestNoteRequest += 1 })

//視窗開啟或切換供應商時，重設頁碼並向後端查詢該供應商的 remark。
watch(
  () => [props.visible, props.supplier?.id],
  ([visible, supplierId]) => {
    latestNoteRequest += 1
    supplierNotes.value = []
    noteTotalPages.value = 0
    noteTotalElements.value = 0
    notesError.value = ''
    isLoadingNotes.value = false
    if (!visible || !supplierId) {
      return
    }

    noteCurrentPage.value = 1
    fetchSupplierNotes()
  },
  { immediate: true }
)

async function fetchSupplierNotes() {
  const supplierId = props.supplier?.id

  if (!supplierId) {
    supplierNotes.value = []
    noteTotalPages.value = 0
    noteTotalElements.value = 0
    return
  }

  const requestId = ++latestNoteRequest
  isLoadingNotes.value = true
  notesError.value = ''

  try {
    // 呼叫後端新增的備註分頁 API。
    const response = await httpClient.get(
      `/api/supplierNote/supplier/${supplierId}`,
      {
        params: {
          page: noteCurrentPage.value - 1,
          size: notePageSize
        }
      }
    )

    // 使用 requestId 避免快速切換供應商時，較舊的回應覆蓋新資料。
    if (requestId !== latestNoteRequest) {
      return
    }

    supplierNotes.value = Array.isArray(response.data?.content)
      ? response.data.content
      : []
    noteTotalPages.value = Number(response.data?.totalPages ?? 0)
    noteTotalElements.value = Number(response.data?.totalElements ?? 0)

    // 刪除最後一頁資料後若頁碼超出範圍，自動回到仍存在的最後一頁。
    if (noteTotalPages.value > 0 && noteCurrentPage.value > noteTotalPages.value) {
      noteCurrentPage.value = noteTotalPages.value
      await fetchSupplierNotes()
    }
  } catch (error) {
    if (requestId !== latestNoteRequest) {
      return
    }

    console.error('查詢供應商備註失敗：', error)
    supplierNotes.value = []
    noteTotalPages.value = 0
    noteTotalElements.value = 0
    notesError.value =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      '供應商備註載入失敗'
  } finally {
    if (requestId === latestNoteRequest) {
      isLoadingNotes.value = false
    }
  }
}

function changeNotePage(page) {
  if (isLoadingNotes.value || page < 1 || page > noteTotalPages.value) return
  noteCurrentPage.value = page
  fetchSupplierNotes()
}

function formatDate(date) {
  if (!date) {
    return '-'
  }

  const dateObject = new Date(date)
  if (Number.isNaN(dateObject.getTime())) {
    return date
  }

  return dateObject.toLocaleString('zh-TW')
}
</script>
