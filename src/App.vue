<script setup>
import Navbar from '@/components/NavBar.vue';
import testbar from '@/components/testbar.vue';
</script>

<template>
  <!-- <Navbar></Navbar> -->
   <!-- <testbar></testbar>
  <div class="container">
    <router-view></router-view>
  </div> -->
   <div  class="erp-shell">

    <testbar />

    <main class="erp-main">
      <router-view />
    </main>

  </div>

</template>

<style scoped>


</style>