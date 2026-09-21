<template>


  <nav class="head-navbar">
    <div class="head-navbar__left">

      <button class="head-navbar__button" 
      :class="{ 'is-active': activeTab === 'overview' }"
      @click="changeTab('overview')">
      {{ title }}
      <span v-if="showTotal" class="head-navbar__count"> {{ total }}</span>
    </button>
    
      <!-- 【新增】POS 商品種類 -->
    <button
      v-if="showCategories"
      v-for="category in categoryOptions"
      :key="category.id"
      class="head-navbar__button"
      :class="{
      'is-active': activeCategory === category.id
    }"
     @click="changeCategory(category.id)"
    >
    {{ category.name }}

    <span class="head-navbar__count">
      {{ category.count }}
    </span>
    </button>

    <button 
    v-if="showAdd"
    class="supplier-tabs__item" 
    :class="{ 'is-active': activeTab === 'add' }"
    @click="changeTab('add')">
    + {{ addTitle }}
  </button>
  
     
  
  </div>
  <div class="head-navbar__right">

     <button
      v-if="showSalesOrderRecord"
      type="button"
      class="head-navbar__button"
      @click="openSalesOrderRecord"
    >
      {{ salesOrderRecordTitle }}
    </button>

    <!-- 搜尋 -->
    <div
    v-if="showSearch"
    class="head-navbar__search"
    >

    <span class="head-navbar__search-icon">
      🔍
    </span>
    
    <input
    type="text"
    :value="searchValue"
    :placeholder="searchPlaceholder"
    @input="changeSearch"
    class="head-navbar__search-input"
    >
    
  </div>
  <!-- 狀態篩選 -->
  <select
  v-if="showStatus"
  class="head-navbar__select"
  :value="statusValue"
  @change="changeStatus"
  >
  
  <option value="">
    {{ statusDefaultText }}
  </option>
  
        <option
          v-for="status in statusOptions"
          :key="status.value"
          :value="status.value"
        >
          {{ status.label }}
        </option>

      </select>
    
  <select
  v-if="showPageSize"
  class="head-navbar__page-size"
  :value="pageSize"
  @change="changePageSize"
>
  <option
    v-for="size in pageSizeOptions"
    :key="size"
    :value="size"
  >
 {{ size }} 筆
  </option>
  </select>

      <!-- 更新 -->
      <button
        v-if="showRefresh"
        type="button"
        class="supplier-tabs__refresh"
        @click="refresh"
      >
        ↻ 
      </button>

    </div>
</nav>


</template>


<script setup>
defineProps({
  //左一按鈕 
  title: {
    type: String,
    default: '總覽'
  },
  total: {
    type: Number,
    default: 0
  },
    showTotal: {
    type: Boolean,
    default: true
  },
  //商品種類
  // 是否顯示種類按鈕
  showCategories: {
  type: Boolean,
  default: false
  },
  // 後端取得的商品種類
  categoryOptions: {
    type: Array,
    default: () => []
  },
  // 目前選擇的種類 id
  // null = 總覽
  activeCategory: {
    type: [Number, String, null],
    default: null
  },

  //新增
  //是否顯示
  showAdd: {
    type: Boolean,
    default: true
  },
   addTitle: {
    type: String,
    default: '新增'
  },
  //是否顯示「銷售單紀錄」按鈕
  showSalesOrderRecord: {
    type: Boolean,
    default: false
  },
  salesOrderRecordTitle: {
    type: String,
    default: '銷售單紀錄'
  },
  //Tab
  activeTab: {
  type: String,
  default: 'overview'
},
//------搜尋
// 是否顯示搜尋框
  showSearch: {
    type: Boolean,
    default: false
  },
 // 搜尋框目前的值
  searchValue: {
    type: String,
    default: ''
  },
// 搜尋框提示文字
  searchPlaceholder: {
    type: String,
    default: '搜尋...'
  },

//-------狀態
// 是否顯示狀態篩選
  showStatus: {
    type: Boolean,
    default: false
  },
 // 目前選擇的狀態
  statusValue: {
    type: String,
    default: ''
  },
// 狀態選項
  statusOptions: {
    type: Array,
    default: () => []
  },
// 預設選項文字
  statusDefaultText: {
    type: String,
    default: '全部狀態'
  },

  showPageSize: {
  type: Boolean,
  default: false
},
// 目前一頁幾筆
pageSize: {
  type: Number,
  default: 10
},
// 可以選擇的筆數
pageSizeOptions: {
  type: Array,
  default: () => [10, 30, 50]
},
 // 是否顯示更新按鈕
  showRefresh: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  // 切換總覽 / 新增
  'change-tab',
  //切換商品種類
  'change-category',
  // 搜尋文字改變
  'update:searchValue',

  // 狀態改變
  'update:statusValue',

  'update:pageSize',

  // 按下更新
  'refresh',

  'open-sales-order-record'

])
// 切換頁面
function changeTab(tab) {

  emit('change-tab', tab)
}
// 點擊總覽
function clickOverview() {

  // POS 有啟用種類功能
  if (props.showCategories) {

    // null 代表全部商品
    emit('change-category', null)

    return
  }

  // 其他頁面維持原本 HeadNavbar 行為
  emit('change-tab', 'overview')
}


// 點擊某一個商品種類
function changeCategory(categoryId) {

  emit('change-category', categoryId)

}
// 搜尋框輸入
function changeSearch(event) {

  emit(
    'update:searchValue',
    event.target.value
  )

}
// 狀態改變
function changeStatus(event) {

  emit(
    'update:statusValue',
    event.target.value
  )

}
function changePageSize(event) {

  emit(
    'update:pageSize',
    Number(event.target.value)
  )

}
// 更新
function refresh() {
console.log('有按到刷新按鈕')
  emit('refresh')

}
//HeadNavbar 只負責發出事件，由 pos.vue 決定要開哪個視窗。
function openSalesOrderRecord() {
  emit('open-sales-order-record')
}

</script>


<style scoped>


</style>