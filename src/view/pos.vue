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
                :show-search="true"
                v-model:searchValue="searchValue"
                search-placeholder="搜尋商品..."
                @change-tab="changeHeadTab"
                @change-category="changeCategory"/>

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
        <!-- 【我新增】查無符合條件的商品時顯示提示 -->
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
        @increase="increaseProduct"
        @decrease="decreaseProduct"
        @checkout="checkoutOrder"/>
    </div>
  </main>
</template>
<script setup>
import { ref, computed ,onMounted } from 'vue'
import httpClient from '@/service/httpClient'
import Card from '@/component/子元件/Card.vue'
import HeadNavBar from '@/component/子元件/HeadNavBar.vue';
import AllRightCard from '@/component/子元件/AllRightCard.vue';

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

function checkoutOrder(items) {
  console.log('準備結帳的商品明細：', items)
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

/* 【我新增】API 錯誤訊息使用警示色 */
.pos-product-state--error {
  color: #ef4444;
}
</style>