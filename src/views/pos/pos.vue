<template >
    <div class="erp-catalog-layout erp-catalog-layout--nav-top">

        <head-nav-bar class="erp-catalog-layout__nav"/>
        <div class="erp-catalog-layout__products">
        <card />
        </div>
        <AllRightCard  class="erp-catalog-layout__detail"/>
    </div>
   
</template>
<script setup>
import card from '@/components/Card.vue'
import HeadNavBar from '@/components/HeadNavBar.vue';
import AllRightCard from '@/components/AllRightCard.vue';
</script>
<style >

</style>