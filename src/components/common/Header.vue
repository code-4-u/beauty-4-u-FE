<script setup>
import { useAuthStore } from "@/stores/auth.js";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const authStore = useAuthStore();

const handleLogoutClick = () => {
  authStore.logout();
  alert('로그아웃 성공');
  window.location.reload();
};
</script>

<template>
  <header class="header">
    <router-link to="/" class="logo">BEAUTY4U</router-link>
    <div class="menu">
      <router-link to="/client" class="menu-item">고객</router-link>
      <router-link to="/goods" class="menu-item">상품</router-link>
      <router-link to="/stats" class="menu-item">분석 대시보드</router-link>
    </div>
    <div @click="handleLogoutClick" class="logout">
      <font-awesome-icon :icon="['fas', 'arrow-right-from-bracket']" />
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 4px;
  user-select: none;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  text-decoration: none;
  letter-spacing: 0.5px;
  user-select: none;
}

.menu {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.menu-item {
  text-decoration: none;
  color: #666;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  user-select: none;
}

.menu-item:hover {
  color: var(--menu-green);
  background-color: rgba(46, 125, 50, 0.1);
}

.menu-item.active {
  color: var(--menu-green);
  background-color: rgba(46, 125, 50, 0.1);
  font-weight: 500;
}

.logout {
  cursor: pointer;
}

@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }

  .menu {
    gap: 1rem;
  }

  .menu-item {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}
</style>