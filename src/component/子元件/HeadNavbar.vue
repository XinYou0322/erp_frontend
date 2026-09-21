<template>


  <nav class="erp-category-nav erp-category-nav--pills">
    <button class="erp-category-nav__item " 
            :class="{ active: activeTab === 'overview' }"
             @click="changeTab('overview')">
       {{ title }}
      <span class="erp-category-nav__count"> {{ total }}</span>
    </button>
    
    <button class="erp-category-nav__item" 
            :class="{ active: activeTab === 'add' }"
            @click="changeTab('add')">
       {{ title2 }}  
      <span class="erp-category-nav__count">{{ total2 }}</span>
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
  title: {
    type: String,
    default: '列表'
  },
  title2: {
    type: String,
    default: '列表'
  },

  total: {
    type: Number,
    default: 0
  },
  total2: {
    type: Number,
    default: 0
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