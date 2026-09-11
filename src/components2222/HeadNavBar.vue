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
    
    <button class="erp-category-nav__item" :class="{ active: activeTab === 'search' }">
      查詢
      <span class="erp-category-nav__count">8</span>
    </button>
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
  }
})

</script>


<style scoped>


</style>