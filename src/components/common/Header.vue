<script setup>
import {useAuthStore} from "@/stores/auth.js";
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome';
import {ref} from "vue";

const authStore = useAuthStore();

const headerItems = ref([]);

headerItems.value = [
  {id: 1, name: '고객', link: '/customer/list'},
  {id: 2, name: '상품', link: '/goods'},
  {id: 3, name: '분석 대시보드', link: '/stats'},
  {id: 4, name: '프로모션', link: '/promotion'},
  {id: 5, name: '게시판', link: '/board/inform'},
  {id: 6, name: '팀 스페이스', link: '/teamspace'}
];

const handleLogoutClick = () => {
  authStore.logout();
  alert('로그아웃 성공');
  window.location.reload();
};
</script>

<template>
  <header class="header">
    <router-link to="/" class="logo">BEAUTY4U</router-link>
    <ul class="menu">
      <li v-for="item in headerItems" :key="item.id">
        <router-link :to="item.link" class="menu-item">
          {{ item.name }}
        </router-link>
      </li>
    </ul>

    <div @click="handleLogoutClick" class="logout">
      <font-awesome-icon :icon="['fas', 'arrow-right-from-bracket']"/>
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