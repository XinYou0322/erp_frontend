<template>
  <main class="pos-page">
    <HeadNavBar class="pos-page__nav" 
                title="總覽"
                :total="totalProducts"
                :show-total="true"
                :show-add="false"
                :show-categories="true"
                :category-options="categoryOptionsWithCount"
                :active-category="activeCategory"
                :show-sales-order-record="true"
                sales-order-record-title="近期銷售"
                :show-search="true"
                v-model:searchValue="searchValue"
                search-placeholder="搜尋商品..."
                @change-tab="changeHeadTab"
                @change-category="changeCategory"
                @open-sales-order-record="openRecentSales"/>

    <!-- POS 主內容：左側商品區 + 右側明細區 -->
    <div class="pos-layout">
      <section class="pos-layout__products">
        <div class="pos-product-grid">
        <!-- 商品 API 尚未完成時，顯示載入提示 -->
        <p
            v-if="loadingProducts"
            class="bento-card pos-product-state"
          >
            商品載入中...
        </p>
        <!--- 商品 API 發生錯誤時，顯示錯誤訊息 -->
        <p
            v-else-if="productError"
            class="bento-card pos-product-state pos-product-state--error"
          >
            {{ productError }}
        </p>
        <!-- 查無符合條件的商品時顯示提示 -->
        <p
            v-else-if="filteredProducts.length === 0"
            class="bento-card pos-product-state"
          >
            查無符合條件的商品
          </p>
        <template v-else>            
            <Card 
              v-for="product in filteredProducts"
              :key="product.id"
              :name="product.name"
              :image="product.imageUrl || ''"
              :price="product.sellingPrice"
              :quantity="productQuantities[product.id] || 0"
              @increase="increaseProduct(product)"
              @decrease="decreaseProduct(product)"/>
        </template>
        </div>
      </section>

      <AllRightCard class="pos-layout__detail" 
         :items="orderItems"
        v-model:payment-method="paymentMethod"
        :checking-out="checkoutLoading"
        :checkout-message="checkoutMessage"
        :checkout-error="checkoutError"
        @increase="increaseProduct"
        @decrease="decreaseProduct"
        @checkout="checkoutOrder"
        />
    </div>
    <RecentSalesPanel
      :is-open="showRecentSales"
      :sales-orders="recentSalesOrders"
      :server-pagination="true"
      :current-page="recentCurrentPage"
      :total-pages="recentTotalPages"
      :total-elements="recentTotalElements"
      :page-size="RECENT_SALES_PAGE_SIZE"
      :date-text="recentSalesDate"
      @close="showRecentSales = false"
      @change-page="loadRecentSales"
      @search="searchRecentSales"
      @select-order="loadRecentSalesDetail"
      @view-all="goToAllSalesOrders"
    />
  </main>
</template>
<script setup>
import { ref, computed ,onMounted } from 'vue'
import { useRouter } from 'vue-router'
import httpClient from '@/service/httpClient'
import Card from '@/component/子元件/Card.vue'
import HeadNavBar from '@/component/子元件/HeadNavbar.vue'
import AllRightCard from '@/component/子元件/AllRightCard.vue'
import RecentSalesPanel from '@/component/父元件/RecentSalesPanel.vue'

//用於「查看全部銷售單」跳轉到完整銷售單頁面
const router = useRouter()

const categories = ref([])
const activeCategory = ref(null)
const searchValue = ref('')
const totalProducts = ref(0)
//回傳的全部商品
const products = ref([])
//控制商品載入與錯誤提示
const loadingProducts = ref(false)
const productError = ref('')
//暫存每項商品目前選擇的數量；key 是 product.id
const productQuantities = ref({})

//需要的付款方式與畫面送出狀態
const paymentMethod = ref('')
const checkoutLoading = ref(false)
const checkoutMessage = ref('')
const checkoutError = ref('')

//近期銷售：視窗、API 分頁與搜尋狀態
const showRecentSales = ref(false)
const recentSalesOrders = ref([])
const recentCurrentPage = ref(1)
const recentTotalPages = ref(1)
const recentTotalElements = ref(0)
const recentSalesKeyword = ref('')
const recentSalesDate = ref('')

const RECENT_SALES_PAGE_SIZE = 5

const TEST_LOGIN_USER_ID = 1

//瀏覽器本地日期轉成後端
function getTodayText() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
//點擊 HeadNavbar 的「近期銷售」時開啟視窗並載入今日第 1 頁。
async function openRecentSales() {
  showRecentSales.value = true
  recentSalesKeyword.value = ''
  recentSalesDate.value = getTodayText()

  await loadRecentSales(1)
}
async function loadRecentSales(page = 1) {
  try {
    const response = await httpClient.get('/api/SalesOrder/page', {
      params: {
        keyword: recentSalesKeyword.value || undefined,
        startDate: recentSalesDate.value,
        endDate: recentSalesDate.value,
        page: page - 1,
        size: RECENT_SALES_PAGE_SIZE
      }
    })

    const pageData = response.data

    // content 是目前頁資料；number 是後端從 0 開始的頁碼。
    recentSalesOrders.value = pageData.content || []
    recentCurrentPage.value = Number(pageData.number ?? 0) + 1
    recentTotalPages.value = Number(pageData.totalPages ?? 0)
    recentTotalElements.value = Number(pageData.totalElements ?? 0)
  } catch (error) {
    console.error('取得近期銷售失敗', error)

    recentSalesOrders.value = []
    recentCurrentPage.value = 1
    recentTotalPages.value = 1
    recentTotalElements.value = 0
  }
}

async function searchRecentSales(keyword) {
  recentSalesKeyword.value = keyword
  await loadRecentSales(1)
}

//分頁列表 DTO 不載入 items；使用者第一次展開時才查詢完整明細。
async function loadRecentSalesDetail(order) {
  if (order.items?.length > 0) {
    return
  }

  try {
    const response = await httpClient.get(
      `/api/SalesOrder/find/${order.id}`
    )

    const orderIndex = recentSalesOrders.value.findIndex(
      (item) => item.id === order.id
    )

    if (orderIndex !== -1) {
      // splice 會保留 Vue 響應式更新，展開區會立即顯示 items。
      recentSalesOrders.value.splice(orderIndex, 1, response.data)
    }
  } catch (error) {
    console.error('取得銷售單明細失敗', error)
  }
}
function goToAllSalesOrders() {
  showRecentSales.value = false
  router.push('/SalesOrder')
}

//統計每個分類所包含的商品數量
const categoryOptionsWithCount = computed(() => {
  return categories.value.map((category) => {
    const productCount = products.value.filter((product) => {
      return String(product.categoryId) === String(category.id)
    }).length

    return {
      ...category,
      count: productCount
    }
  })
})
//新增的商品整理成陣列 > AllRightCard
const orderItems = computed(() => {
  return products.value
    .filter((product) => {
      return (productQuantities.value[product.id] || 0) > 0
    })
    .map((product) => {
      return {
        id: product.id,
        name: product.name,
        price: product.sellingPrice,
        quantity: productQuantities.value[product.id]
      }
    })
})

async function loadCategories() {
  try {
     const response = await httpClient.get(
      '/api/product-categories/active'
    )
     console.log('商品分類：', response.data)
    categories.value = response.data
  } catch (error) {
    console.error(
      '取得商品種類失敗',
      error
    )
  }
}
async function loadProducts() {
  loadingProducts.value = true
  productError.value = ''

  try {
    const response = await httpClient.get('/api/product/list')

    // 後端正常情況會直接回傳 List<ProductResponseDTO>
    products.value = Array.isArray(response.data)
      ? response.data
      : []

    // 顯示全部商品總數，不會因為分類或關鍵字篩選而改變
    totalProducts.value = products.value.length
  } catch (error) {
    console.error('取得商品資料失敗', error)
    products.value = []
    totalProducts.value = 0
    productError.value =
      error.response?.data?.message || '取得商品資料失敗，請稍後再試'
  } finally {
    loadingProducts.value = false
  }
}
//同時相容 DTO 的 categoryId 與 category.id 兩種回傳格式
function getProductCategoryId(product) {
  return product.categoryId
}
// 依目前分類及搜尋文字篩選商品，不需要另外新增後端 API (需不需要改後端)
const filteredProducts = computed(() => {
  const keyword = searchValue.value.trim().toLowerCase()

  return products.value.filter((product) => {
    const productCategoryId = getProductCategoryId(product)

    const matchesCategory =
      activeCategory.value === null ||
      String(productCategoryId) === String(activeCategory.value)

    const matchesKeyword =
      keyword === '' ||
      String(product.name || '').toLowerCase().includes(keyword) ||
      String(product.sku || '').toLowerCase().includes(keyword)

    return matchesCategory && matchesKeyword
  })
})

function changeCategory(categoryId) {
 activeCategory.value = categoryId
}

function changeHeadTab(tab) {
  if (tab === 'overview') {
    changeCategory(null)
  }
}

function increaseProduct(product) {
  const currentQuantity = productQuantities.value[product.id] || 0
  productQuantities.value[product.id] = currentQuantity + 1
}

function decreaseProduct(product) {
  const currentQuantity = productQuantities.value[product.id] || 0
  productQuantities.value[product.id] = Math.max(0, currentQuantity - 1)
}

//將後端錯誤內容整理成畫面可顯示的文字
function getCheckoutErrorMessage(error) {
  const responseData = error.response?.data

  if (typeof responseData === 'string') {
    return responseData
  }

  return responseData?.message ||
    responseData?.error ||
    '結帳失敗，請確認資料後再試一次'
}
//每次重新送出前，先清除上一次的成功或錯誤訊息。
function clearCheckoutFeedback() {
  checkoutMessage.value = ''
  checkoutError.value = ''
}
//建立銷售單
async function checkoutOrder(items) {
  if (checkoutLoading.value || items.length === 0) {
    return
  }
  //流程固定為：加入商品 → 選擇付款方式 → 結帳。
  if (!paymentMethod.value) {
    checkoutMessage.value = ''
    checkoutError.value = '請先選擇付款方式'
    return
  }

  checkoutLoading.value = true
  clearCheckoutFeedback()

  // 固定欄位名稱必須對應 SalesOrderCreDTO 與 SalesOrderItemCreDTO
  const requestBody = {
    paymentMethod: paymentMethod.value,
    note: null,
    items: items.map((item) => {
      return {
        productId: item.id,
        quantity: Number(item.quantity)
      }
    })
  }

  try {
    const response = await httpClient.post(
      '/api/SalesOrder/add',
      requestBody,
      {
        params: {
          loginUserId: TEST_LOGIN_USER_ID
        }
      } 
    )

    const orderNumber = response.data?.orderNumber

    checkoutMessage.value = orderNumber
      ? `結帳成功，銷售單號：${orderNumber}`
      : '結帳成功'
    console.log("成功")
    // 建立銷售單成功後才清空商品；失敗時保留明細供使用者重試
    productQuantities.value = {}
  } catch (error) {
    console.error('建立銷售單失敗', error)
    checkoutError.value = getCheckoutErrorMessage(error)
  } finally {
    checkoutLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadProducts()
  ])
})
</script>
<style >
.pos-product-state {
  grid-column: 1 / -1;
  margin: 0;
  padding: 24px;
  text-align: center;
}

/* API 錯誤訊息使用警示色 */
.pos-product-state--error {
  color: #ef4444;
}
</style>