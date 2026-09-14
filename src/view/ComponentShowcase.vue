<template>
  <div class="min-h-screen bg-[var(--surface)] text-[var(--on-surface)] p-6 md:p-8">
    <!-- WaveBackground 實際元件：需要時才顯示，避免影響平常瀏覽 -->
    <WaveBackground v-if="showWaveBackground" />

    <div class="relative z-10 mx-auto max-w-7xl space-y-8">
      <!-- Header -->
      <header
        class="
          rounded-2xl border border-[var(--outline)]
          bg-[var(--surface-container)] p-6
        "
      >
        <p class="text-xs font-bold tracking-widest text-[var(--primary)]">
          ERP COMPONENT LIBRARY
        </p>

        <h1 class="mt-2 text-2xl font-black">
          共用元件展示頁
        </h1>

        <p class="mt-2 text-sm text-[var(--on-surface-variant)]">
          組員可以直接在這裡查看元件外觀、檔案名稱與基本使用方式。
          Modal 與 Sidebar 類元件請點擊按鈕查看實際效果。
        </p>
      </header>

      <!-- 基礎元件 -->
      <section class="space-y-4">
        <SectionTitle
          title="基礎顯示元件"
          description="可以直接嵌入頁面使用的共用元件"
        />

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <!-- MetricCard -->
          <ShowcaseCard
            title="MetricCard"
            filename="MetricCard.vue"
            description="儀表板 KPI / 數字摘要卡片"
          >
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetricCard
                title="今日營業額"
                value="NT$ 18,520"
                subtitle="較昨日成長"
                growth="+12.5%"
                growth-type="up"
                variant="emerald"
                :icon="DollarSign"
              />

              <MetricCard
                title="低庫存品項"
                :value="3"
                subtitle="需要安排補貨"
                growth="需注意"
                growth-type="warning"
                variant="amber"
                :icon="PackageSearch"
              />

              <MetricCard
                title="缺貨品項"
                :value="1"
                subtitle="目前無法供應"
                badge="URGENT"
                variant="danger"
                :icon="TriangleAlert"
              />

              <MetricCard
                title="今日訂單"
                :value="126"
                subtitle="門市即時訂單"
                variant="cyan"
                :icon="Receipt"
              />
            </div>
          </ShowcaseCard>

          <!-- StatusBadge -->
          <ShowcaseCard
            title="StatusBadge"
            filename="StatusBadge.vue"
            description="商品、庫存與訂單狀態標籤"
          >
            <div class="flex flex-wrap gap-2">
              <StatusBadge status="active" />
              <StatusBadge status="normal" />
              <StatusBadge status="low_stock" />
              <StatusBadge status="low" />
              <StatusBadge status="out_of_stock" />
              <StatusBadge status="urgent" />
              <StatusBadge status="pending" />
              <StatusBadge status="preparing" />
              <StatusBadge status="completed" />
              <StatusBadge status="archived" />
            </div>
          </ShowcaseCard>

          <!-- SearchInput -->
          <ShowcaseCard
            title="SearchInput"
            filename="SearchInput.vue"
            description="共用搜尋輸入框，支援 v-model 與一鍵清除"
          >
            <div class="max-w-lg">
              <SearchInput
                v-model="searchKeyword"
                placeholder="搜尋原物料、商品或單號..."
              />

              <p class="mt-3 text-xs text-[var(--on-surface-variant)]">
                目前輸入：{{ searchKeyword || '尚未輸入' }}
              </p>
            </div>
          </ShowcaseCard>

          <!-- Sparkline -->
          <ShowcaseCard
            title="Sparkline"
            filename="Sparkline.vue"
            description="迷你趨勢折線圖，可指定不同語意顏色"
          >
            <div class="flex flex-wrap items-end gap-8">
              <div>
                <p class="mb-2 text-xs text-[var(--on-surface-variant)]">Primary</p>
                <Sparkline
                  id="showcase-primary"
                  :data="[12, 18, 14, 25, 22, 31, 38]"
                  :width="150"
                  :height="50"
                />
              </div>

              <div>
                <p class="mb-2 text-xs text-[var(--on-surface-variant)]">Warning</p>
                <Sparkline
                  id="showcase-warning"
                  :data="[30, 27, 32, 24, 20, 18, 15]"
                  color="var(--tertiary)"
                  :width="150"
                  :height="50"
                />
              </div>

              <div>
                <p class="mb-2 text-xs text-[var(--on-surface-variant)]">Danger</p>
                <Sparkline
                  id="showcase-danger"
                  :data="[10, 14, 13, 21, 18, 30, 26]"
                  color="var(--error)"
                  :width="150"
                  :height="50"
                />
              </div>
            </div>
          </ShowcaseCard>
        </div>
      </section>

      <!-- Layout -->
      <section class="space-y-4">
        <SectionTitle
          title="版面元件"
          description="會影響整體畫面的 Layout / Background 元件"
        />

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ShowcaseCard
            title="WaveBackground"
            filename="WaveBackground.vue"
            description="ERP 頁面的波浪背景。開啟後會直接顯示實際背景元件。"
          >
            <button
              type="button"
              class="btn-secondary text-xs"
              @click="showWaveBackground = !showWaveBackground"
            >
              {{ showWaveBackground ? '隱藏 WaveBackground' : '顯示 WaveBackground' }}
            </button>
          </ShowcaseCard>

          <ShowcaseCard
            title="Sidebar"
            filename="Sidebar.vue"
            description="系統主要側邊導覽列。因元件本身使用 fixed，開啟後會固定在畫面左側。"
          >
            <button
              type="button"
              class="btn-secondary text-xs"
              @click="showSidebar = !showSidebar"
            >
              {{ showSidebar ? '隱藏 Sidebar' : '顯示 Sidebar' }}
            </button>
          </ShowcaseCard>
        </div>
      </section>

      <!-- Modal -->
      <section class="space-y-4">
        <SectionTitle
          title="Modal 元件"
          description="點擊「查看元件」即可看到實際 Modal；一次只會開啟一個"
        />

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ModalLauncher
            title="ModalWrapper"
            filename="ModalWrapper.vue"
            description="所有共用 Modal 的基礎外框"
            @open="activeModal = 'wrapper'"
          />

          <ModalLauncher
            title="AddMaterialModal"
            filename="AddMaterialModal.vue"
            description="新增原物料"
            @open="activeModal = 'addMaterial'"
          />

          <ModalLauncher
            title="EditMaterialModal"
            filename="EditMaterialModal.vue"
            description="目前檔案內顯示的原物料表單元件"
            @open="activeModal = 'editMaterial'"
          />

          <ModalLauncher
            title="AddProductModal"
            filename="AddProductModal.vue"
            description="新增飲品商品"
            @open="activeModal = 'addProduct'"
          />

          <ModalLauncher
            title="EditRecipeModal"
            filename="EditRecipeModal.vue"
            description="商品 BOM 配方設定"
            @open="activeModal = 'editRecipe'"
          />

          <ModalLauncher
            title="InventoryIntakeModal"
            filename="InventoryIntakeModal.vue"
            description="新增進貨批次"
            @open="activeModal = 'inventoryIntake'"
          />

          <ModalLauncher
            title="InventoryAdjustmentModal"
            filename="InventoryAdjustmentModal.vue"
            description="庫存批次異動作業"
            @open="activeModal = 'inventoryAdjustment'"
          />

          <ModalLauncher
            title="ProductCategoryManagementModal"
            filename="ProductCategoryManagementModal.vue"
            description="商品分類主檔管理"
            @open="activeModal = 'categoryManagement'"
          />
        </div>
      </section>
    </div>

    <!-- Sidebar -->
    <Sidebar
      v-if="showSidebar"
      @open-pos="noop"
      @open-report="noop"
      @open-profile="noop"
    />

    <!-- ModalWrapper -->
    <ModalWrapper
      :is-open="activeModal === 'wrapper'"
      title="ModalWrapper 範例"
      subtitle="這是共用 Modal 外框的展示內容"
      max-width="lg"
      :icon="PanelsTopLeft"
      @close="closeModal"
    >
      <div
        class="
          rounded-xl border border-[var(--outline)]
          bg-[var(--surface-container-high)] p-4
        "
      >
        <p class="font-bold">Modal Body</p>
        <p class="mt-1 text-xs text-[var(--on-surface-variant)]">
          其他表單 Modal 都可以使用 ModalWrapper 統一 Header、Body、Footer。
        </p>
      </div>

      <template #footer>
        <button
          type="button"
          class="btn-secondary text-xs"
          @click="closeModal"
        >
          取消
        </button>

        <button
          type="button"
          class="btn-primary text-xs"
          @click="closeModal"
        >
          確認
        </button>
      </template>
    </ModalWrapper>

    <!-- 功能 Modal -->
    <AddMaterialModal
      :is-open="activeModal === 'addMaterial'"
      @close="closeModal"
      @success="closeModal"
    />

    <EditMaterialModal
      :is-open="activeModal === 'editMaterial'"
      @close="closeModal"
      @success="closeModal"
    />

    <AddProductModal
      :is-open="activeModal === 'addProduct'"
      @close="closeModal"
      @success="closeModal"
    />

    <EditRecipeModal
      :is-open="activeModal === 'editRecipe'"
      :product="demoProduct"
      @close="closeModal"
      @success="closeModal"
    />

    <InventoryIntakeModal
      :is-open="activeModal === 'inventoryIntake'"
      @close="closeModal"
      @success="closeModal"
    />

    <InventoryAdjustmentModal
      :is-open="activeModal === 'inventoryAdjustment'"
      @close="closeModal"
      @success="closeModal"
    />

    <ProductCategoryManagementModal
      :is-open="activeModal === 'categoryManagement'"
      @close="closeModal"
      @success="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import {
  DollarSign,
  PackageSearch,
  PanelsTopLeft,
  Receipt,
  TriangleAlert
} from 'lucide-vue-next'

/*
 * 如果你們共同資料夾不是：
 *   src/component/common/
 *
 * 只要統一修改下面這些 import 路徑即可。
 */
import MetricCard from '@/component/子元件/MetricCard.vue'

import StatusBadge from '@/component/子元件/StatusBadge.vue'

import Sparkline from '@/component/子元件/Sparkline.vue'

import SearchInput from '@/component/子元件/SearchInput.vue'

import ModalWrapper from '@/component/子元件/ModalWrapper.vue'

import WaveBackground from '@/component/子元件/WaveBackground.vue'

import Sidebar from '@/component/父元件/Sidebar.vue'

import AddMaterialModal from '@/component/父元件//AddMaterialModal.vue'

import EditMaterialModal from '@/component/父元件//EditMaterialModal.vue'

import AddProductModal from '@/component/父元件//AddProductModal.vue'

import EditRecipeModal from '@/component/父元件//EditRecipeModal.vue'

import InventoryIntakeModal from '@/component/父元件//InventoryIntakeModal.vue'

import InventoryAdjustmentModal from '@/component/父元件/InventoryAdjustmentModal.vue'

import ProductCategoryManagementModal from '@/component/父元件//ProductCategoryManagementModal.vue'

type ModalName =
  | ''
  | 'wrapper'
  | 'addMaterial'
  | 'editMaterial'
  | 'addProduct'
  | 'editRecipe'
  | 'inventoryIntake'
  | 'inventoryAdjustment'
  | 'categoryManagement'

const searchKeyword = ref('')
const showWaveBackground = ref(false)
const showSidebar = ref(false)
const activeModal = ref<ModalName>('')

const demoProduct = {
  id: 1,
  sku: 'DRINK-001',
  name: '招牌紅茶',
  category: '茶類',
  unit: '杯',
  sellingPrice: 55
}

const closeModal = () => {
  activeModal.value = ''
}

const noop = () => {}

/*
 * 這兩個小元件只服務「展示頁本身」，
 * 不需要另外建立 .vue 檔。
 */
const SectionTitle = defineComponent({
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  },

  setup(props) {
    return () =>
      h('div', {}, [
        h(
          'h2',
          {
            class: 'text-lg font-black text-[var(--on-surface)]'
          },
          props.title
        ),
        props.description
          ? h(
              'p',
              {
                class:
                  'mt-1 text-xs text-[var(--on-surface-variant)]'
              },
              props.description
            )
          : null
      ])
  }
})

const ShowcaseCard = defineComponent({
  props: {
    title: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  },

  setup(props, { slots }) {
    return () =>
      h(
        'article',
        {
          class:
            'rounded-2xl border border-[var(--outline)] bg-[var(--surface-container)] overflow-hidden'
        },
        [
          h(
            'div',
            {
              class:
                'flex flex-wrap items-start justify-between gap-3 border-b border-[var(--outline)] bg-[var(--surface-container-high)] px-4 py-3'
            },
            [
              h('div', {}, [
                h(
                  'h3',
                  {
                    class:
                      'text-sm font-bold text-[var(--on-surface)]'
                  },
                  props.title
                ),
                props.description
                  ? h(
                      'p',
                      {
                        class:
                          'mt-1 text-xs text-[var(--on-surface-variant)]'
                      },
                      props.description
                    )
                  : null
              ]),

              h(
                'code',
                {
                  class:
                    'rounded-lg border border-[var(--outline)] bg-[var(--surface-container-low)] px-2.5 py-1 text-[11px] font-data-mono text-[var(--primary)]'
                },
                props.filename
              )
            ]
          ),

          h(
            'div',
            {
              class: 'p-4'
            },
            slots.default?.()
          )
        ]
      )
  }
})

const ModalLauncher = defineComponent({
  emits: ['open'],

  props: {
    title: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  },

  setup(props, { emit }) {
    return () =>
      h(
        'article',
        {
          class:
            'rounded-2xl border border-[var(--outline)] bg-[var(--surface-container)] p-4'
        },
        [
          h(
            'div',
            {
              class: 'flex items-start justify-between gap-3'
            },
            [
              h('div', {}, [
                h(
                  'h3',
                  {
                    class:
                      'text-sm font-bold text-[var(--on-surface)]'
                  },
                  props.title
                ),
                h(
                  'p',
                  {
                    class:
                      'mt-1 text-xs text-[var(--on-surface-variant)]'
                  },
                  props.description
                )
              ]),

              h(
                'code',
                {
                  class:
                    'shrink-0 rounded-lg bg-[var(--surface-container-high)] px-2 py-1 text-[10px] font-data-mono text-[var(--primary)]'
                },
                props.filename
              )
            ]
          ),

          h(
            'button',
            {
              type: 'button',
              class: 'btn-secondary mt-4 text-xs',
              onClick: () => emit('open')
            },
            '查看元件'
          )
        ]
      )
  }
})
</script>
