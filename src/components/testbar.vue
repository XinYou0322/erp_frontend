<template >
    <aside class="erp-sidebar erp-sidebar--botanical">
        <RouterLink to="/mate   rial" class="erp-nav__item">原物料管理</RouterLink>
        <RouterLink to="/product" class="erp-nav__item">商品管理</RouterLink>
        <RouterLink to="/bom" class="erp-nav__item">BOM管理</RouterLink>
        <RouterLink to="/supplier" class="erp-nav__item">供應商管理</RouterLink>
        <!-- <RouterLink to="/addsupplier" class="erp-nav__item">新增供應商</RouterLink> -->
        <RouterLink to="/pos" class="erp-nav__item">POS系統</RouterLink>
        <RouterLink to="/workflows" class="erp-nav__item">簽核中心</RouterLink>

    </aside>
</template>
<script setup>

import { RouterLink } from 'vue-router'
import '@/style/total.css'
import '@/testErp-sheng/index.css'

</script>
<style >


</style>