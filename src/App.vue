<script setup>
import {RouterView} from "vue-router";
import '@/assets/css/resetcss.css';
import Header from "@/components/common/Header.vue";
import Footer from "@/components/common/Footer.vue";
</script>

<template>
  <div class="container-fluid">
    <Header/>
    <main class="main-content">
      <router-view/>
    </main>
    <Footer/>
  </div>
</template>

<style scoped>
.container-fluid {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--background-color);
}

:deep(header) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 60px;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1300px;
  margin: 60px auto 0;
  padding: 1rem 1rem 80px;
}

:deep(footer) {
  width: 100%;
  background-color: white;
  height: 60px;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}
</style>
