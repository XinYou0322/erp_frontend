<template>


  <nav class="supplier-tabs">
    <button class="supplier-tabs__item" 
            :class="{ 'is-active': activeTab === 'overview' }"
             @click="changeTab('overview')">
       {{ title }}
      <span class="supplier-tabs__count"> {{ total }}</span>
    </button>
    
    <button class="supplier-tabs__item" 
            :class="{ 'is-active': activeTab === 'add' }"
            @click="changeTab('add')">
       {{ title2 }}  
      <span class="supplier-tabs__count">{{ total2 }}</span>
    </button>
    
    <button class="supplier-tabs__item" :class="{ 'is-active': activeTab === 'search' }">
      查詢
      <span class="supplier-tabs__count">8</span>
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
  },
  activeTab: {
  type: String,
  default: 'overview'
}
})

const emit = defineEmits([
  'change-tab'
])

function changeTab(tab) {

  emit('change-tab', tab)

}
</script>


<style scoped>


</style>