<script setup>
import CustomerNav from "@/components/common/CustomerNav.vue";

</script>
<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-3 sidebar">
        <customer-nav/>
      </div>
      <div class="col-md-9 main-content">
        <div class="content-wrapper">
          <router-view/>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container-fluid {
  width: 100%;
  min-height: 100vh;
  padding: 0;
}

.row {
  margin: 0;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
}

.sidebar {
  height: 100vh;
  border-right: 1px solid #dee2e6;
  overflow-y: auto;
  position: fixed;
  left: 0;
  width: 25%;
  max-width: 300px;
  background-color: #fff;
  z-index: 1000;
}

.main-content {
  flex: 1;
  min-height: 100vh;
  overflow-y: auto;
  width: 100%;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  background-color: #fff;
  padding: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 1rem;
}

@media (max-width: 768px) {
  .row {
    flex-direction: column;
  }

  .sidebar {
    position: relative;
    width: 100%;
    max-width: 100%;
    height: auto;
    min-height: auto;
    border-right: none;
    border-bottom: 1px solid #dee2e6;
  }
  
  .main-content {
    position: relative;
    margin-left: 20%;
    width: 80%;
    height: auto;
    min-height: 50vh;
    margin-top: 1rem;
    padding-top: 60px;
  }

  .content-wrapper {
    margin: 1rem;
    padding: 1rem;
  }
}
</style>