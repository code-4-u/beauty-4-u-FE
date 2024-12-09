<script setup>
import { RouterView } from "vue-router";
import '@/assets/css/resetcss.css';
import Header from "@/components/common/Header.vue";
import Footer from "@/components/common/Footer.vue";
</script>

<template>
  <div class="container">
    <Header/>
    <main class="main-content">
      <router-view/>
    </main>
    <Footer/>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-color);
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 1rem;
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
}
</style>
