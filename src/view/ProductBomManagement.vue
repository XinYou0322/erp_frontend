<template>
  <div class="space-y-6 pb-12">

    <!-- Top KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        id="recipe-metric-total"
        title="已建檔飲品品項"
        :value="`${products.length} 項`"
        growth="即時資料"
        subtitle="目前系統已建立的飲品品項"
        :icon="FlaskConical"
      />

      <MetricCard
        id="recipe-metric-cost"
        title="全品項單杯平均物料成本"
        :value="`NT$ ${avgCost.toFixed(1)}`"
        growth="依目前產品計算"
        variant="cyan"
        subtitle="目前產品的平均單杯成本"
        :icon="DollarSign"
      />

      <MetricCard
        id="recipe-metric-margin"
        title="門市標準配方平均毛利率"
        :value="`${avgMargin}%`"
        growth="依售價與成本計算"
        variant="emerald"
        subtitle="目前產品平均毛利率"
        :icon="Layers"
      />

      <MetricCard
        id="recipe-metric-binding"
        title="原料扣庫連動狀態"
        value="待串接"
        growth="下一階段"
        variant="default"
        subtitle="BOM 與即時扣庫尚未接入前端"
        :icon="CheckCircle2"
      />
    </div>


    <!-- Controls & Filter Bar -->
    <div
      class="
        p-4
        rounded-2xl
        flex
        flex-col
        sm:flex-row
        sm:items-center
        justify-between
        gap-3
        bg-[var(--surface-container)]
        border
        border-[var(--outline)]
      "
    >
      <div
        class="
          flex
          items-center
          space-x-2
          overflow-x-auto
          pb-1
          sm:pb-0
          scrollbar-none
        "
      >

        <!-- 全部 -->
        <button
          type="button"
          @click="selectedCategory = '全部'"
          class="
            px-3.5
            py-1.5
            rounded-xl
            text-xs
            font-bold
            transition-all
            shrink-0
            cursor-pointer
            border
          "
          :class="
            selectedCategory === '全部'
              ? 'bg-[var(--primary)] text-[var(--surface)] border-[var(--primary)]'
              : 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)] border-[var(--outline)]'
          "
        >
          全部

          <span
            class="
              ml-1.5
              px-1.5
              py-0.5
              rounded-full
              text-[10px]
            "
            :class="
              selectedCategory === '全部'
                ? 'bg-[var(--surface)]/15 text-[var(--surface)]'
                : 'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)]'
            "
          >
            {{ products.length }}
          </span>
        </button>


        <!-- 資料庫分類 -->
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          @click="selectedCategory = cat.name"
          class="
            px-3.5
            py-1.5
            rounded-xl
            text-xs
            font-bold
            transition-all
            shrink-0
            cursor-pointer
            border
          "
          :class="
            selectedCategory === cat.name
              ? 'bg-[var(--primary)] text-[var(--surface)] border-[var(--primary)]'
              : 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)] border-[var(--outline)]'
          "
        >
          {{ cat.name }}

          <span
            class="
              ml-1.5
              px-1.5
              py-0.5
              rounded-full
              text-[10px]
            "
            :class="
              selectedCategory === cat.name
                ? 'bg-[var(--surface)]/15 text-[var(--surface)]'
                : 'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)]'
            "
          >
            {{ getCategoryCount(cat.name) }}
          </span>
        </button>

      </div>


      <div class="flex items-center space-x-2 shrink-0">

        <button
          type="button"
          @click="showCategoryModal = true"
          class="
            btn-primary
            text-xs
            px-3
            py-1.5
            flex
            items-center
            space-x-1.5
          "
        >
          ▢
          <span>管理分類</span>
        </button>

        <button
          type="button"
          @click="addProductModalOpen = true"
          class="
            btn-primary
            text-xs
            px-3
            py-1.5
            flex
            items-center
            space-x-1.5
          "
        >
          <Plus class="w-4 h-4" />
          <span>新增飲品</span>
        </button>

      </div>
    </div>


    <!-- Loading -->
    <div
      v-if="loading"
      class="
        rounded-2xl
        p-8
        text-center
        text-sm
        bg-[var(--surface-container)]
        border
        border-[var(--outline)]
        text-[var(--on-surface-variant)]
      "
    >
      正在讀取產品資料...
    </div>


    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="
        rounded-2xl
        border
        border-[var(--error)]/30
        bg-[var(--error)]/10
        p-4
        text-sm
        text-[var(--error)]
      "
    >
      {{ errorMessage }}
    </div>


    <!-- Recipe Cards Grid -->
    <div
      v-else
      class="
        grid
        grid-cols-1
        md:grid-cols-2
        lg:grid-cols-3
        gap-5
      "
    >

      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="
          p-5
          rounded-2xl
          bg-[var(--surface-container)]
          border
          border-[var(--outline)]
          hover:border-[var(--primary)]/40
          hover:bg-[var(--surface-container-high)]
          transition-all
          shadow-sm
          flex
          flex-col
          justify-between
          space-y-4
          group
        "
      >

        <!-- Card Header -->
        <div>

          <div class="flex items-start justify-between">

            <div class="flex items-center space-x-3">

              <div
                class="
                  w-10
                  h-10
                  rounded-xl
                  bg-[var(--primary)]/10
                  border
                  border-[var(--primary)]/25
                  flex
                  items-center
                  justify-center
                  text-[var(--primary)]
                  font-bold
                  shrink-0
                "
              >
                <Coffee class="w-5 h-5" />
              </div>


              <div>

                <h3
                  class="
                    font-bold
                    text-sm
                    text-[var(--on-surface)]
                    group-hover:text-[var(--primary)]
                    transition-colors
                  "
                >
                  {{ product.name }}
                </h3>


                <div
                  class="
                    text-[11px]
                    text-[var(--on-surface-variant)]
                    font-data-mono
                    mt-0.5
                    flex
                    items-center
                    space-x-1.5
                  "
                >
                  <span
                    class="
                      text-[var(--primary)]
                      font-semibold
                    "
                  >
                    {{ product.sku }}
                  </span>

                  <span>•</span>

                  <span>
                    {{ product.categoryName }}
                  </span>
                </div>

              </div>

            </div>


            <button
              type="button"
              @click="handleOpenEditRecipe(product)"
              class="
                px-2.5
                py-1
                rounded-lg
                bg-[var(--primary)]/10
                hover:bg-[var(--primary)]/20
                text-[var(--primary)]
                border
                border-[var(--primary)]/25
                text-xs
                font-bold
                transition-colors
                cursor-pointer
                flex
                items-center
                space-x-1
              "
            >
              <Edit3 class="w-3.5 h-3.5" />
              <span>編輯配方</span>
            </button>

          </div>


          <!-- Price & Cost Comparison Banner -->
          <div
            class="
              mt-4
              p-3
              rounded-xl
              bg-[var(--surface-container-low)]
              border
              border-[var(--outline)]
              grid
              grid-cols-3
              gap-2
              text-center
              text-xs
              font-data-mono
            "
          >

            <div>

              <span
                class="
                  text-[10px]
                  text-[var(--on-surface-variant)]
                  block
                  font-sans
                "
              >
                定價
              </span>

              <span
                class="
                  font-bold
                  text-[var(--on-surface)]
                "
              >
                NT$ {{ product.sellingPrice }}
              </span>

            </div>


            <div
              class="
                border-x
                border-[var(--outline)]
              "
            >

              <span
                class="
                  text-[10px]
                  text-[var(--on-surface-variant)]
                  block
                  font-sans
                "
              >
                單杯物料成本
              </span>

              <span
                class="
                  font-bold
                  text-[var(--primary)]
                "
              >
                NT$ {{ product.costPrice ?? 0 }}
              </span>

            </div>


            <div>

              <span
                class="
                  text-[10px]
                  text-[var(--on-surface-variant)]
                  block
                  font-sans
                "
              >
                毛利率
              </span>

              <span
                class="font-bold"
                :class="
                  getMargin(product) >= 65
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--tertiary)]'
                "
              >
                {{ getMargin(product) }}%
              </span>

            </div>

          </div>


          <!-- BOM -->
          <div class="mt-4 space-y-2">

            <span
              class="
                text-[11px]
                font-bold
                text-[var(--on-surface-variant)]
                uppercase
                tracking-wider
                block
              "
            >
              單杯原物料配比 (BOM 組成)
            </span>


            <div
              v-if="
                bomMap[product.id] &&
                bomMap[product.id].length > 0
              "
              class="
                space-y-1.5
                text-xs
              "
            >

              <div
                v-for="bom in bomMap[product.id]"
                :key="bom.id"
                class="
                  flex
                  items-center
                  justify-between
                  p-1.5
                  px-2.5
                  rounded-lg
                  bg-[var(--surface-container-low)]
                  border
                  border-[var(--outline-variant)]
                "
              >

                <div>

                  <span
                    class="
                      text-[var(--on-surface)]
                      font-medium
                    "
                  >
                    {{ bom.materialName }}
                  </span>

                  <span
                    class="
                      ml-2
                      text-[10px]
                      text-[var(--on-surface-variant)]
                      font-data-mono
                    "
                  >
                    {{ bom.materialCode }}
                  </span>

                </div>


                <span
                  class="
                    font-data-mono
                    text-[var(--on-surface-variant)]
                    font-bold
                  "
                >
                  {{ bom.quantity }}
                  {{ bom.unit }}
                </span>

              </div>

            </div>


            <div
              v-else
              class="
                text-[var(--on-surface-variant)]
                text-[11px]
                py-2
                text-center
              "
            >
              尚未建立標準配方
            </div>

          </div>

        </div>


        <!-- Footer -->
        <div
          class="
            pt-3
            border-t
            border-[var(--outline-variant)]
            text-[11px]
            text-[var(--on-surface-variant)]
            flex
            items-center
            justify-between
          "
        >

          <span class="truncate">
            {{ product.status === 'ACTIVE' ? '販售中' : '未啟用' }}
          </span>

          <span
            class="
              px-2
              py-0.5
              rounded
              bg-[var(--primary)]/10
              text-[var(--primary)]
              border
              border-[var(--primary)]/20
              text-[10px]
              font-bold
              shrink-0
              ml-2
            "
          >
            {{ product.unit || '杯' }}
          </span>

        </div>

      </div>
    </div>


    <EditRecipeModal
      :is-open="editRecipeModalOpen"
      :product="selectedProduct"
      @close="editRecipeModalOpen = false"
      @success="handleRecipeSuccess"
    />


    <AddProductModal
      :is-open="addProductModalOpen"
      @close="addProductModalOpen = false"
      @success="handleProductSuccess"
    />


    <ProductCategoryManagementModal
      :is-open="showCategoryModal"
      @close="showCategoryModal = false"
      @success="handleCategorySuccess"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FlaskConical, DollarSign, Layers, CheckCircle2, Coffee, Edit3, Plus, Import } from 'lucide-vue-next'
import MetricCard from '@/component/子元件/MetricCard.vue'
import httpClient from '@/service/httpClient'
import EditRecipeModal from '@/component/父元件/EditRecipeModal.vue'
import AddProductModal from '@/component/父元件/AddProductModal.vue'
import ProductCategoryManagementModal from '@/component/父元件/ProductCategoryManagementModal.vue'



const editRecipeModalOpen = ref(false)
const addProductModalOpen = ref(false)
const selectedProduct = ref(null)
const showCategoryModal = ref(false)
const handleProductSuccess = async () => {
  await loadProducts()
}

const handleCategorySuccess = async () => {
  await loadCategories()
}

const handleOpenEditRecipe = (product) => {

  selectedProduct.value = product

  editRecipeModalOpen.value = true

}
const handleRecipeSuccess = () => {

  loadProducts()

  selectedProduct.value = null

}

const emit = defineEmits([
  'openEditRecipe',
  'openAddProduct'
])
const bomMap = ref({})
const products = ref([])
const loading = ref(false)
const errorMessage = ref('')
const categories = ref([])
const selectedCategory = ref('全部')

const loadProducts = () => {
  loading.value = true
  errorMessage.value = ''

  httpClient
    .get('/api/product/list')
    .then((response) => {

      products.value =
        response.data

      products.value.forEach(
        (product) => {

          loadBom(product.id)

        }
      )

    })
    .catch((error) => {
      console.error('取得產品失敗：', error)
      errorMessage.value = '取得產品資料失敗'
    })
    .finally(() => {
      loading.value = false
    })
}
const loadBom = (productId) => {

  httpClient
    .get(`/api/bom/product/${productId}`)

    .then((response) => {

      bomMap.value[productId] =
        response.data

      console.log(
        `產品 ${productId} 的 BOM：`,
        response.data
      )

    })

    .catch((error) => {

      console.error(
        `取得產品 ${productId} BOM 失敗：`,
        error
      )

      bomMap.value[productId] = []

    })
}
const filteredProducts = computed(() => {

  if (selectedCategory.value === '全部') {
    return products.value
  }

  return products.value.filter(
    product =>
      product.categoryName === selectedCategory.value
  )
})

const getCategoryCount = (cat) => {

  if (cat === '全部') {
    return products.value.length
  }

  return products.value.filter(
    product =>
      product.categoryName === cat
  ).length
}

const avgCost = computed(() => {
  if (products.value.length === 0) {
    return 0
  }

  const totalCost = products.value.reduce(
    (sum, product) => sum + Number(product.costPrice || 0),
    0
  )

  return totalCost / products.value.length
})

const avgMargin = computed(() => {
  if (products.value.length === 0) {
    return 0
  }

  const validProducts = products.value.filter(
    product => Number(product.sellingPrice || 0) > 0
  )

  if (validProducts.length === 0) {
    return 0
  }

  const totalMargin = validProducts.reduce((sum, product) => {
    return sum + getMargin(product)
  }, 0)

  return Math.round(totalMargin / validProducts.length)
})

const getMargin = (product) => {
  const sellingPrice = Number(product.sellingPrice || 0)
  const costPrice = Number(product.costPrice || 0)

  if (sellingPrice <= 0) {
    return 0
  }

  return Math.round(
    ((sellingPrice - costPrice) / sellingPrice) * 100
  )
}
const loadCategories = () => {

  httpClient
    .get('/api/product-categories/active')

    .then((response) => {

      categories.value = response.data

    })

    .catch((error) => {

      console.error(
        '取得商品分類失敗：',
        error
      )

    })
}
onMounted(() => {

  loadProducts()

  loadCategories()

})
</script>
