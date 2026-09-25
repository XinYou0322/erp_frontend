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
              <div v-if="isNoteOwner(note)" class="supplier-note-card__actions">
                <button
                  type="button"
                  class="supplier-note-card__action"
                  :aria-label="`修改備註 ${index + 1}`"
                  title="修改備註"
                  :disabled="isSavingEdit || deletingNoteId !== null"
                  @click="openEditModal(note)"
                >
                  <Pencil :size="18" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="supplier-note-card__action supplier-note-card__action--danger"
                  :aria-label="`刪除備註 ${index + 1}`"
                  title="刪除備註"
                  :disabled="isSavingEdit || deletingNoteId !== null"
                  @click="deleteNote(note)"
                >
                  <LoaderCircle v-if="deletingNoteId === note.id" :size="18" class="supplier-note-card__spinner" aria-hidden="true" />
                  <Trash2 v-else :size="18" aria-hidden="true" />
                </button>
              </div>
            </div>

            <!-- 後端 SuppliersNotesRespoDTO 欄位是 remark，不是 content。 -->
            <div class="supplier-note-card__content">{{ note.remark || '-' }}</div>

            <div class="supplier-note-card__footer">
              <span>{{ note.createdBy || '-' }}</span>
              <time class="supplier-note-card__time">{{ formatDate(note.createdAt) }}</time>
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

      <TextInputModal
        :is-open="editModalOpen"
        :is-saving="isSavingEdit"
        :successful="editSaved"
        :error="editError"
        :initial-value="editingNote?.remark || ''"
        title="修改供應商備註"
        :subtitle="props.supplier?.name || ''"
        label="請輸入備註"
        confirm-text="儲存修改"
        saving-text="儲存中…"
        success-title="供應商備註修改成功"
        :max-length="200"
        @close="closeEditModal"
        @confirm="saveEdit"
      />
    </section>
</template>
<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { LoaderCircle, Pencil, Trash2 } from 'lucide-vue-next'
import httpClient from '@/service/httpClient'

import Pagination from '@/component/子元件/Pagination.vue'
import TextInputModal from '@/component/子元件/TextInputModal.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  supplier: {
    type: Object,
    default: () => ({})
  },
  loginUserId: {
    type: [Number, String],
    default: null
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
const editModalOpen = ref(false)
const editingNote = ref(null)
const isSavingEdit = ref(false)
const editSaved = ref(false)
const editError = ref('')
const deletingNoteId = ref(null)
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

function isNoteOwner(note) {
  if (props.loginUserId === null || props.loginUserId === undefined ||
      note?.createdByUserId === null || note?.createdByUserId === undefined) {
    return false
  }

  return String(props.loginUserId) === String(note.createdByUserId)
}

function openEditModal(note) {
  if (!isNoteOwner(note) || isSavingEdit.value || deletingNoteId.value !== null) return
  editingNote.value = note
  editSaved.value = false
  editError.value = ''
  editModalOpen.value = true
}

function closeEditModal() {
  if (isSavingEdit.value) return
  editModalOpen.value = false
  editingNote.value = null
  editSaved.value = false
  editError.value = ''
}

async function saveEdit(value) {
  const note = editingNote.value
  if (!note || !isNoteOwner(note) || isSavingEdit.value) return

  const remark = value.trim()
  if (!remark || remark.length > 200) {
    editError.value = '備註不可為空，最多 200 個字。'
    return
  }

  isSavingEdit.value = true
  editError.value = ''
  try {
    await httpClient.patch(
      `/api/supplierNote/update/${props.supplier.id}/${note.id}`,
      { remark }
    )
    editSaved.value = true
    await fetchSupplierNotes()
  } catch (error) {
    const data = error.response?.data
    editError.value = data?.message || data?.detail ||
      (typeof data === 'string' ? data : '修改備註失敗，請稍後再試。')
  } finally {
    isSavingEdit.value = false
  }
}

async function deleteNote(note) {
  if (!isNoteOwner(note) || deletingNoteId.value !== null || isSavingEdit.value) return
  if (!window.confirm('確定要刪除這筆供應商備註嗎？')) return

  deletingNoteId.value = note.id
  notesError.value = ''
  try {
    await httpClient.delete(`/api/supplierNote/${note.id}`)
    await fetchSupplierNotes()
  } catch (error) {
    const data = error.response?.data
    notesError.value = data?.message || data?.detail ||
      (typeof data === 'string' ? data : '刪除備註失敗，請稍後再試。')
  } finally {
    deletingNoteId.value = null
  }
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
