<template>

  <div class="erp-shell">

    <Sidebar />

   <main class="erp-main ml-64 min-h-screen">
  <RouterView />
</main>


  </div>

</template>


<script setup lang="ts">

import { RouterView } from 'vue-router'
import Sidebar from './component/父元件/Sidebar.vue'

</script>