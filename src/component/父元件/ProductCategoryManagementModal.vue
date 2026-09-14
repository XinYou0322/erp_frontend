<template>
  <ModalWrapper
    :is-open="isOpen"
    title="商品分類管理"
    subtitle="搜尋、建立、修改與啟用停用飲品分類"
    max-width="3xl"
    :icon="Tags"
    @close="emit('close')"
  >
    <div class="space-y-5">

      <!-- 標題 / 搜尋 -->
      <div
        class="
          p-4
          rounded-xl
          bg-[var(--surface-container-high)]
          border
          border-[var(--outline)]
          space-y-3
        "
      >
        <div
          class="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <div>
            <div
              class="
                font-bold
                text-sm
                text-[var(--on-surface)]
              "
            >
              商品分類主檔
            </div>

            <p
              class="
                text-xs
                text-[var(--on-surface-variant)]
                mt-1
              "
            >
              下方顯示目前所有分類，可搜尋、修改名稱或調整啟用狀態。
            </p>
          </div>

          <button
            type="button"
            @click="startAddCategory"
            class="
              px-2.5
              py-1.5
              rounded-lg
              bg-[var(--primary)]/10
              hover:bg-[var(--primary)]/20
              text-[var(--primary)]
              border
              border-[var(--primary)]/30
              font-bold
              text-xs
              flex
              items-center
              space-x-1
              transition-colors
              cursor-pointer
              shrink-0
            "
          >
            <Plus class="w-3.5 h-3.5" />

            <span>
              新增分類
            </span>
          </button>
        </div>

        <SearchInput
          v-model="searchKeyword"
          placeholder=""
        />
      </div>


      <!-- 新增分類 -->
      <div
        v-if="addingCategory"
        class="
          p-3.5
          rounded-xl
          border
          border-[var(--primary)]/30
          bg-[var(--primary)]/10
        "
      >
        <div class="flex items-end gap-3">

          <div class="flex-1">
            <label
              class="
                block
                font-bold
                text-[var(--on-surface)]
                text-xs
                mb-1
              "
            >
              新增分類名稱
            </label>

            <input
              v-model.trim="newCategoryName"
              type="text"
              class="input-field"
              placeholder="例如：咖啡類、季節限定"
              @keyup.enter="createCategory"
            />
          </div>


          <button
            type="button"
            @click="cancelAddCategory"
            class="btn-secondary text-xs"
          >
            取消
          </button>


          <button
            type="button"
            @click="createCategory"
            class="
              btn-primary
              text-xs
              flex
              items-center
              space-x-1.5
            "
            :disabled="saving"
          >
            <Check class="w-4 h-4" />

            <span>
              {{ saving ? '新增中...' : '新增' }}
            </span>
          </button>

        </div>
      </div>


      <!-- Loading -->
      <div
        v-if="loading"
        class="
          border
          border-[var(--outline)]
          rounded-xl
          bg-[var(--surface-container)]
          p-6
          text-center
          text-xs
          text-[var(--on-surface-variant)]
        "
      >
        正在載入商品分類...
      </div>


      <!-- 分類表格 -->
      <div
        v-else
        class="
          border
          border-[var(--outline)]
          rounded-xl
          overflow-hidden
          bg-[var(--surface-container)]
        "
      >
        <table
          class="
            w-full
            text-left
            text-xs
            border-collapse
          "
        >
          <thead>
            <tr
              class="
                bg-[var(--surface-container-high)]
                border-b
                border-[var(--outline)]
                text-[11px]
                font-bold
                text-[var(--on-surface-variant)]
                uppercase
              "
            >
              <th class="py-2.5 px-3">
                分類名稱
              </th>

              <th class="py-2.5 px-3 w-28">
                狀態
              </th>

              <th class="py-2.5 px-3 w-48 text-right">
                操作
              </th>
            </tr>
          </thead>


          <tbody
            class="
              divide-y
              divide-[var(--outline-variant)]
            "
          >
            <tr
              v-for="category in filteredCategories"
              :key="category.id"
              class="
                hover:bg-[var(--surface-container-high)]
                transition-colors
              "
            >
              <!-- 分類名稱 -->
              <td class="py-3 px-3">

                <div
                  v-if="editingId === category.id"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model.trim="editingName"
                    type="text"
                    class="input-field py-1 text-xs"
                    @keyup.enter="saveEdit(category.id)"
                  />
                </div>


                <div v-else>

                  <div
                    class="font-bold text-sm"
                    :class="
                      category.active
                        ? 'text-[var(--on-surface)]'
                        : 'text-[var(--on-surface-variant)]'
                    "
                  >
                    {{ category.name }}
                  </div>

                  <div
                    class="
                      text-[10px]
                      text-[var(--on-surface-variant)]
                      font-data-mono
                      mt-0.5
                    "
                  >
                    ID：{{ category.id }}
                  </div>

                </div>

              </td>


              <!-- 狀態 -->
              <td class="py-3 px-3">

                <span
                  v-if="category.active"
                  class="
                    px-2.5
                    py-1
                    rounded-full
                    bg-[var(--primary)]/15
                    text-[var(--primary)]
                    border
                    border-[var(--primary)]/30
                    font-bold
                  "
                >
                  啟用
                </span>


                <span
                  v-else
                  class="
                    px-2.5
                    py-1
                    rounded-full
                    bg-[var(--surface-container-highest)]
                    text-[var(--on-surface-variant)]
                    border
                    border-[var(--outline)]
                    font-bold
                  "
                >
                  停用
                </span>

              </td>


              <!-- 操作 -->
              <td class="py-3 px-3 text-right">

                <!-- 編輯中 -->
                <div
                  v-if="editingId === category.id"
                  class="
                    flex
                    justify-end
                    gap-2
                  "
                >
                  <button
                    type="button"
                    @click="cancelEdit"
                    class="
                      px-2.5
                      py-1
                      rounded-lg
                      bg-[var(--surface-container-high)]
                      hover:bg-[var(--surface-container-highest)]
                      text-[var(--on-surface-variant)]
                      font-bold
                      text-[11px]
                      transition-colors
                    "
                  >
                    取消
                  </button>


                  <button
                    type="button"
                    @click="saveEdit(category.id)"
                    class="
                      px-2.5
                      py-1
                      rounded-lg
                      bg-[var(--primary)]/10
                      hover:bg-[var(--primary)]/20
                      text-[var(--primary)]
                      border
                      border-[var(--primary)]/30
                      font-bold
                      text-[11px]
                      transition-colors
                    "
                    :disabled="saving"
                  >
                    儲存
                  </button>
                </div>


                <!-- 一般狀態 -->
                <div
                  v-else
                  class="
                    flex
                    justify-end
                    gap-2
                  "
                >
                  <button
                    type="button"
                    @click="startEdit(category)"
                    class="
                      px-2.5
                      py-1
                      rounded-lg
                      bg-[var(--primary)]/10
                      hover:bg-[var(--primary)]/20
                      text-[var(--primary)]
                      border
                      border-[var(--primary)]/30
                      font-bold
                      text-[11px]
                      transition-colors
                      flex
                      items-center
                      space-x-1
                    "
                  >
                    <Pencil class="w-3.5 h-3.5" />

                    <span>
                      編輯
                    </span>
                  </button>


                  <button
                    type="button"
                    @click="toggleActive(category)"
                    class="
                      px-2.5
                      py-1
                      rounded-lg
                      font-bold
                      text-[11px]
                      transition-colors
                      border
                    "
                    :class="
                      category.active
                        ? 'bg-[var(--error)]/10 hover:bg-[var(--error)]/20 text-[var(--error)] border-[var(--error)]/30'
                        : 'bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border-[var(--primary)]/30'
                    "
                  >
                    {{ category.active ? '停用' : '啟用' }}
                  </button>

                </div>

              </td>
            </tr>


            <!-- 空資料 -->
            <tr
              v-if="filteredCategories.length === 0"
            >
              <td
                colspan="3"
                class="
                  py-8
                  text-center
                  text-[var(--on-surface-variant)]
                  text-xs
                "
              >
                沒有符合搜尋條件的商品分類
              </td>
            </tr>

          </tbody>
        </table>
      </div>


      <!-- 錯誤訊息 -->
      <div
        v-if="errorMessage"
        class="
          rounded-xl
          border
          border-[var(--error)]/30
          bg-[var(--error)]/10
          p-3
          text-xs
          text-[var(--error)]
        "
      >
        {{ errorMessage }}
      </div>


      <!-- 底部說明 -->
      <div
        class="
          p-3
          rounded-xl
          bg-[var(--surface-container-low)]
          border
          border-[var(--outline)]
          text-xs
          text-[var(--on-surface-variant)]
          flex
          items-center
          justify-between
        "
      >
        <span>
          已停用分類會保留歷史資料，但不會出現在新增商品的分類選單中。
        </span>

        <span
          class="
            font-bold
            text-[var(--primary)]
          "
        >
          分類主檔管理
        </span>
      </div>

    </div>


    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        class="btn-secondary text-xs"
      >
        關閉
      </button>
    </template>

  </ModalWrapper>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Tags, Search, Plus, Check, Pencil, Import } from 'lucide-vue-next'
import ModalWrapper from '../子元件/ModalWrapper.vue';
import httpClient from '@/service/httpClient'
import SearchInput from '@/component/子元件/SearchInput.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

type ProductCategory = {
  id: number
  name: string
  active: boolean
}

const categories = ref<ProductCategory[]>([])
const searchKeyword = ref('')
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const addingCategory = ref(false)
const newCategoryName = ref('')

const editingId = ref<number | null>(null)
const editingName = ref('')

const loadCategories = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await httpClient.get('/api/product-categories')
    categories.value = response.data
  } catch (error) {
    console.error('取得商品分類失敗：', error)
    errorMessage.value = '取得商品分類失敗'
  } finally {
    loading.value = false
  }
}

const filteredCategories = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  if (!keyword) {
    return categories.value
  }

  return categories.value.filter(category =>
    category.name.toLowerCase().includes(keyword)
  )
})

const startAddCategory = () => {
  addingCategory.value = true
  newCategoryName.value = ''
}

const cancelAddCategory = () => {
  addingCategory.value = false
  newCategoryName.value = ''
}

const createCategory = async () => {
  const name = newCategoryName.value.trim()

  if (!name) {
    errorMessage.value = '請輸入分類名稱'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    await httpClient.post('/api/product-categories', { name })
    await loadCategories()

    addingCategory.value = false
    newCategoryName.value = ''

    emit('success')
  } catch (error) {
    console.error('新增商品分類失敗：', error)
    errorMessage.value = '新增分類失敗，請確認分類名稱是否重複。'
  } finally {
    saving.value = false
  }
}

const startEdit = (category: ProductCategory) => {
  editingId.value = category.id
  editingName.value = category.name
}

const cancelEdit = () => {
  editingId.value = null
  editingName.value = ''
}

const saveEdit = async (id: number) => {
  const name = editingName.value.trim()

  if (!name) {
    errorMessage.value = '分類名稱不能空白'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    await httpClient.put(`/api/product-categories/${id}`, { name })
    await loadCategories()

    editingId.value = null
    editingName.value = ''

    emit('success')
  } catch (error) {
    console.error('修改商品分類失敗：', error)
    errorMessage.value = '修改分類失敗，請確認分類名稱是否重複。'
  } finally {
    saving.value = false
  }
}

const toggleActive = async (
  category: ProductCategory
) => {

  const nextActive = !category.active

  const confirmed = window.confirm(
    `確定要${nextActive ? '啟用' : '停用'}「${category.name}」嗎？`
  )

  if (!confirmed) {
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {

    await httpClient.patch(
      `/api/product-categories/${category.id}/active`,
      JSON.stringify(nextActive),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    await loadCategories()

    emit('success')

  } catch (error: any) {

    console.error(
      '更新分類狀態失敗：',
      error
    )

    console.error(
      '後端回應：',
      error.response?.data
    )

    errorMessage.value =
      '更新分類狀態失敗'

  } finally {

    saving.value = false
  }
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      return
    }

    searchKeyword.value = ''
    addingCategory.value = false
    editingId.value = null
    errorMessage.value = ''

    loadCategories()
  }
)
</script>
