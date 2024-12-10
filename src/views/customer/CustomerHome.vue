<script setup>
import CustomerNav from "@/components/common/CustomerNav.vue";
</script>
<template>
  <div>
    <div class="row">
      <div class="col-md-2 sidebar">
        <customer-nav/>
      </div>
      <div class="col-md-9 pl-1 main-content">
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
}

.sidebar {
  height: 100vh;
  border-right: 1px solid #dee2e6;
  overflow-y: auto;
  position: fixed;
  left: 0;
  background-color: #fff;
}

.main-content {
  flex: 1;
  min-height: 100vh;
  overflow-y: auto;
  margin-left: 350px;
  padding-left: 2px;
  display: flex;
}

.content-wrapper {
  background-color: #fff;
  padding: 2rem;
  width: 100%;
  max-width: 4000px;
  margin: 1%;
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
    margin-left: 0;
    width: 100%;
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