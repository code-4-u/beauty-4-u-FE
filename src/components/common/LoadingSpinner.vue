<script setup>

</script>

<template>
  <div class="loading-overlay">
    <div class="loading-spinner"></div>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--loading-overlay-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1010;
  border-radius: 8px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--spinner);
  border-top: 3px solid var(--main-green);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>