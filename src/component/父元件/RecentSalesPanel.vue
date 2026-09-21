<template>

  <ModalWrapper
    :is-open="isOpen"
    title="近期銷售"
    subtitle="今日的銷售單紀錄，點選可查看明細"
    max-width="sm"
    :confirm-close="false"
    @close="emit('close')"
  >
    <section class="recent-sales-panel" aria-label="近期銷售清單">
      <!-- 【搜尋框】輸入訂單編號或商品名稱。 -->
      <label class="recent-sales-panel__search">
        <svg
          class="recent-sales-panel__search-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>

        <input
          v-model="searchKeyword"
          type="search"
          placeholder="搜尋訂單編號或商品..."
          aria-label="搜尋銷售單"
        />
      </label>

      <!-- 【日期與筆數】筆數是搜尋後全部結果，不只是目前頁。 -->
      <div class="recent-sales-panel__summary">
        <p>
          今日 <span>（{{ displayDate }}）</span>
        </p>
        <p>共 {{ displayTotalElements }} 筆</p>
      </div>

      <!-- 【畫面 E】API 模式只顯示後端 Page.content 的當頁資料。 -->
      <div class="recent-sales-panel__list">
        <article
          v-for="order in displayedOrders"
          :key="getOrderKey(order)"
          class="sales-order-card bento-card"
          :class="{
            'sales-order-card--expanded':
              expandedOrderKey === getOrderKey(order)
          }"
        >
          <!-- 【訂單摘要】單號、時間、商品項數、總金額、箭頭。 -->
          <button
            type="button"
            class="sales-order-card__summary"
            :aria-expanded="expandedOrderKey === getOrderKey(order)"
            @click="toggleOrder(order)"
          >
            <span class="sales-order-card__identity">
              <strong class="font-data-mono">#{{ order.orderNumber }}</strong>
              <small>{{ formatTime(order.createdAt ?? order.createTime) }}</small>
            </span>

            <span class="sales-order-card__amount">
              <!-- 列表 API 不回 items；載入明細前先提示可以點擊查看。 -->
              <small v-if="order.itemCount != null || getItems(order).length > 0">
                {{ getItemTypeCount(order) }} 項商品
              </small>
              <small v-else>點選查看明細</small>
              <strong class="font-data-mono">
                {{ currencyText }} {{ formatMoney(getOrderTotal(order)) }}
              </strong>
            </span>

            <svg
              class="sales-order-card__chevron"
              :class="{
                'sales-order-card__chevron--open':
                  expandedOrderKey === getOrderKey(order)
              }"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <!-- 【展開明細】數量、商品名稱、商品小計與訂單合計。 -->
          <Transition name="order-detail">
            <div
              v-if="expandedOrderKey === getOrderKey(order)"
              class="sales-order-card__details"
            >
              <div
                v-for="(item, itemIndex) in getItems(order)"
                :key="item.id ?? item.productId ?? itemIndex"
                class="sales-order-card__item"
              >
                <span class="sales-order-card__quantity">
                  {{ item.quantity }}
                </span>
                <span class="sales-order-card__product-name">
                  {{ item.productName ?? item.name }}
                </span>
                <span class="sales-order-card__item-price font-data-mono">
                  {{ currencyText }} {{ formatMoney(getItemSubtotal(item)) }}
                </span>
              </div>

              <div class="sales-order-card__total">
                <span>合計</span>
                <strong class="font-data-mono">
                  {{ currencyText }} {{ formatMoney(getOrderTotal(order)) }}
                </strong>
              </div>
            </div>
          </Transition>
        </article>

        <!-- 【空資料提示】搜尋不到或今天尚無銷售單時顯示。 -->
        <div v-if="displayedOrders.length === 0" class="recent-sales-panel__empty">
          <span>⌕</span>
          <p>找不到符合條件的銷售單</p>
        </div>
      </div>

      <!--
        【畫面 I】數字分頁。
        Pagination 只有 totalPages > 1 時才會自己顯示。
      -->
      <div class="recent-sales-panel__pagination">
        <Pagination
          :current-page="displayCurrentPage"
          :total-pages="displayTotalPages"
          @change-page="handlePageChange"
        />
      </div>
    </section>

    <!-- 【ModalWrapper footer】完整銷售單頁面的入口。 -->
    <template #footer>
      <button
        type="button"
        class="recent-sales-panel__view-all"
        @click="emit('view-all')"
      >
        <span aria-hidden="true">☷</span>
        查看全部銷售單
        <span aria-hidden="true">→</span>
      </button>
    </template>
  </ModalWrapper>
</template>
<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ModalWrapper from '@/component/子元件//ModalWrapper.vue'
import Pagination from '@/component/子元件//Pagination.vue'

//父層資料傳入
const props = defineProps({
  // 交給 ModalWrapper 控制彈窗顯示或隱藏。
  isOpen: {
    type: Boolean,
    default: false
  },

  // 銷售單陣列，由 POS 頁面呼叫 API 後傳進來。
  salesOrders: {
    type: Array,
    default: () => []
  },

  // 畫面上的日期；不傳時會優先讀第一筆銷售單日期。
  dateText: {
    type: String,
    default: ''
  },

  // 金額前綴，可改成「$」、「NT$」等。
  currencyText: {
    type: String,
    default: 'NT$'
  },

  // 每一頁顯示幾張銷售單，父層可以自行調整。
  pageSize: {
    type: Number,
    default: 5
  },

  // true 時不在元件內 slice，由後端決定當頁資料。
  serverPagination: {
    type: Boolean,
    default: false
  },

  // Spring Page.number 是從 0 開始；父層傳入時請加 1。
  currentPage: {
    type: Number,
    default: 1
  },

  // 對應 Spring Page.totalPages。
  totalPages: {
    type: Number,
    default: 1
  },

  // 對應 Spring Page.totalElements。
  totalElements: {
    type: Number,
    default: 0
  }
})

// 把操作通知父層
const emit = defineEmits([
  'close',
  'select-order',
  'view-all',
  'change-page',
  'search'
])

// 搜尋文字、目前展開的銷售單、目前頁碼。
const searchKeyword = ref('')
const expandedOrderKey = ref(null)
const localCurrentPage = ref(1) // 非 API 模式使用的前端頁碼。

// 可搜尋訂單編號或商品名稱。
const filteredOrders = computed(() => {
  // API 模式的 keyword 已由後端處理，不能只搜尋目前這一頁。
  if (props.serverPagination) {
    return props.salesOrders
  }

  const keyword = searchKeyword.value.trim().toLowerCase()

  if (!keyword) {
    return props.salesOrders
  }

  return props.salesOrders.filter((order) => {
    const orderNumber = String(order.orderNumber ?? '').toLowerCase()
    const hasMatchedProduct = getItems(order).some((item) =>
      String(item.productName ?? item.name ?? '')
        .toLowerCase()
        .includes(keyword)
    )

    return orderNumber.includes(keyword) || hasMatchedProduct
  })
})

// 搜尋後的總筆數 ÷ 每頁筆數，無資料時仍維持第 1 頁。
const localTotalPages = computed(() => {
  const safePageSize = Math.max(1, props.pageSize)
  return Math.max(1, Math.ceil(filteredOrders.value.length / safePageSize))
})

// 畫面目前頁碼：API 模式讀 props，前端模式讀 localCurrentPage。
const displayCurrentPage = computed(() =>
  props.serverPagination ? props.currentPage : localCurrentPage.value
)

// 畫面總頁數：API 模式使用後端回傳值。
const displayTotalPages = computed(() =>
  props.serverPagination
    ? Math.max(1, props.totalPages)
    : localTotalPages.value
)

// 畫面總筆數：API 模式不能只計算當頁 salesOrders.length。
const displayTotalElements = computed(() =>
  props.serverPagination
    ? props.totalElements
    : filteredOrders.value.length
)

// API 模式直接顯示後端 content；前端模式才自行 slice。
const displayedOrders = computed(() => {
  if (props.serverPagination) {
    return props.salesOrders
  }

  const safePageSize = Math.max(1, props.pageSize)
  const startIndex = (localCurrentPage.value - 1) * safePageSize
  const endIndex = startIndex + safePageSize

  return filteredOrders.value.slice(startIndex, endIndex)
})

// 畫面「今日（日期）」使用。
const displayDate = computed(() => {
  if (props.dateText) {
    return props.dateText
  }

  const firstOrderDate =
    props.salesOrders[0]?.createdAt ?? props.salesOrders[0]?.createTime
  if (firstOrderDate) {
    return formatDate(firstOrderDate)
  }

  return formatDate(new Date())
})

// 非 API 模式的資料或每頁筆數改變時，才重設前端頁碼。
watch([() => props.salesOrders, () => props.pageSize], () => {
  if (props.serverPagination) {
    return
  }

  localCurrentPage.value = 1
  expandedOrderKey.value = null
})

// API 搜尋防抖：停止輸入 350ms 後才通知父層，避免每打一個字就呼叫 API。
let searchTimer = null

watch(searchKeyword, (keyword) => {
  localCurrentPage.value = 1
  expandedOrderKey.value = null
  clearTimeout(searchTimer)

  if (!props.serverPagination || !props.isOpen) {
    return
  }

  searchTimer = setTimeout(() => {
    emit('search', keyword.trim())
  }, 350)
})

// 元件卸載前清除計時器，避免元件消失後仍觸發搜尋事件。
onBeforeUnmount(() => {
  clearTimeout(searchTimer)
})

// 彈窗關閉後清除搜尋與頁碼，下次打開從乾淨狀態開始。
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      searchKeyword.value = ''
      localCurrentPage.value = 1
      expandedOrderKey.value = null
    }
  }
)

// 接收 Pagination 傳回來的新頁碼。
function handlePageChange(page) {
  expandedOrderKey.value = null

  // API 模式只通知父層；真正的新資料由父層呼叫 API 後傳回。
  if (props.serverPagination) {
    emit('change-page', page)
    return
  }

  localCurrentPage.value = page
}

// 同一時間只展開一張銷售單。
function toggleOrder(order) {
  const orderKey = getOrderKey(order)
  const willOpen = expandedOrderKey.value !== orderKey

  expandedOrderKey.value = willOpen ? orderKey : null

  // 列表 API 不回傳 items；第一次展開時才通知父層查明細 API。
  if (willOpen && getItems(order).length === 0) {
    emit('select-order', order)
  }
}

// 優先用資料庫 id，其次用訂單編號。
function getOrderKey(order) {
  return order.id ?? order.orderNumber
}

// 可接 items 或 salesOrderItems。
function getItems(order) {
  return order.items ?? order.salesOrderItems ?? []
}

// 計算有幾種商品，不是把 quantity 全部相加。
function getItemTypeCount(order) {
  return order.itemCount ?? getItems(order).length
}

// 後端有 subtotal 就直接使用，沒有才自行計算。
function getItemSubtotal(item) {
  if (item.subtotal != null) {
    return Number(item.subtotal)
  }

  return Number(item.unitPrice ?? item.price ?? 0) * Number(item.quantity ?? 0)
}

// 後端有 totalAmount 就直接使用，沒有才加總明細。
function getOrderTotal(order) {
  if (order.totalAmount != null) {
    return Number(order.totalAmount)
  }

  return getItems(order).reduce(
    (total, item) => total + getItemSubtotal(item),
    0
  )
}

// 如 1200 會顯示成 1,200。
function formatMoney(amount) {
  return Number(amount ?? 0).toLocaleString('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

// 如 2024-06-06T15:37:00 轉成 15:37。
function formatTime(dateTime) {
  if (!dateTime) {
    return '--:--'
  }

  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime())) {
    return String(dateTime).slice(0, 5)
  }

  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 如 2024-06-06 轉成 2024/06/06。
function formatDate(dateTime) {
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime)

  if (Number.isNaN(date.getTime())) {
    return String(dateTime).slice(0, 10).replaceAll('-', '/')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}/${month}/${day}`
}
</script>
<style >
</style>