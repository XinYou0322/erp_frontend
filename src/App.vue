<template>
  <h1>You did it!</h1>
  <NavBar />

  <RouterView />
  <p>
    Visit
    <a href="https://vuejs.org/" target="_blank" rel="noopener"> vuejs.org </a>
  </p>

  <MaterialTest />
</template>

<script setup>
import { RouterView } from "vue-router";

import NavBar from "@/component/NavBar.vue";
</script>
