<script setup>
import {useAuthStore} from "@/stores/auth.js";
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome';
import {computed, ref, inject, onMounted, onUnmounted} from "vue";
import {getFetch, putFetch} from "@/stores/apiClient.js";
import userProfile from '@/assets/icons/profile.svg';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.isAuthorized('ADMIN'));
const headerItems = ref([]);
const showNotis = ref(false);
const notis = ref([]);

headerItems.value = [
  {
    id: 1,
    name: '상품',
    link: '',
    subItems: [
      {id: 11, name: '상품 관리', link: '/goods/manage'},
      {id: 12, name: '상품 분석', link: '/goods/analysis'},
    ]
  },
  {
    id: 2,
    name: '프로모션',
    link: '',
    subItems: [
      {id: 21, name: '프로모션 관리', link: '/promotion/manage'},
      {id: 22, name: '프로모션 분석', link: '/promotion/analysis'},
    ]
  },
  {id: 3, name: '팀 스페이스', link: '/teamspace'},
  {
    id: 4,
    name: '고객센터',
    link: '',
    subItems: [
      {id: 41, name: '공지사항', link: '/inform'},
      {id: 42, name: '자주 묻는 질문', link: '/faq'},
      {id: 43, name: 'Q&A', link: '/qna'},
    ]
  },
];

const fetchMyNotReadNotiList = async () => {
  try {
    const response = await getFetch('/noti');
    notis.value = response.data.data.filter(noti => noti.notiReadYn === 'N');
  } catch (error) {
    console.error('알림 목록을 불러오는 중 에러가 발생했습니다.', error);
  }
};

const handleNotiClick = async (noti) => {
  try {
    await putFetch(`/noti/${noti.notiId}`,
        {
          notiId: noti.notiId
        });
    await fetchMyNotReadNotiList();
  } catch (error) {
    console.error('알림 읽음 상태 변경 중 에러가 발생했습니다.', error);
  }
};

const toggleNotis = async () => {
  showNotis.value = !showNotis.value;
  if (showNotis.value) {
    await fetchMyNotReadNotiList();
  }
};

const closeNotis = (event) => {
  const dropdown = document.querySelector('.notifications-dropdown');
  const notiBtn = document.querySelector('.notification');

  if (dropdown && !dropdown.contains(event.target) && !notiBtn.contains(event.target)) {
    showNotis.value = false;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const handleLogoutClick = () => {
  authStore.logout();
  alert('로그아웃 성공');
  window.location.reload();
};

onMounted(() => {
  fetchMyNotReadNotiList();
  document.addEventListener('click', closeNotis);
});

onUnmounted(() => {
  document.removeEventListener('click', closeNotis);
});
</script>

<template>
  <header class="header">
    <router-link to="/" class="logo">BEAUTY4U</router-link>
    <ul class="menu">
      <li v-for="item in headerItems" :key="item.id" class="menu-li">
        <router-link
            v-if="!item.subItems"
            :to="item.link"
            class="menu-item"
        >
          {{ item.name }}
        </router-link>
        <div v-else class="menu-dropdown">
          <span class="menu-item">{{ item.name }}</span>
          <ul class="submenu">
            <li v-for="subItem in item.subItems" :key="subItem.id">
              <router-link :to="subItem.link" class="submenu-item">
                {{ subItem.name }}
              </router-link>
            </li>
          </ul>
        </div>
      </li>
    </ul>
    <div class="user-section">
      <router-link to="/mypage" class="user-info">
        <img :src="userProfile" alt="프로필" class="profile-image"/>
        <span class="user-name">{{ authStore.userName }} 님</span>
      </router-link>
      <router-link
          v-if="isAdmin"
          to="/admin"
          class="admin-link"
      >
        <font-awesome-icon :icon="['fas', 'cog']"/>
      </router-link>
      <div class="notification" @click="toggleNotis">
        <font-awesome-icon :icon="['fas', 'bell']"/>
        <div v-if="showNotis" class="notifications-dropdown">
          <div v-if="notis.length" class="notifications-list">
            <div v-for="noti in notis"
                 :key="noti.notiId"
                 class="notification-item"
                 @click="handleNotiClick(noti)">
              <span class="notification-message">{{ noti.notiContent }}</span>
              <span class="notification-date">{{ formatDate(noti.createdDate) }}</span>
            </div>
          </div>
          <div v-else class="no-notifications">
            새로운 알림이 없습니다.
          </div>
        </div>
      </div>
      <div @click="handleLogoutClick" class="logout">
        <font-awesome-icon :icon="['fas', 'arrow-right-from-bracket']"/>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  user-select: none;
  height: 60px;
  width: 100%;
  box-sizing: border-box;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  text-decoration: none;
  letter-spacing: 0.5px;
  user-select: none;
  height: 100%;
  display: flex;
  align-items: center;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-name {
  color: #333;
  font-size: 0.9rem;
  white-space: nowrap;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.user-info:hover {
  background-color: rgba(46, 125, 50, 0.1);
}

.user-info:hover .user-name {
  color: var(--menu-green);
}

.user-info:active {
  background-color: rgba(46, 125, 50, 0.2);
}

.profile-image {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.notification {
  cursor: pointer;
  color: #666;
  transition: color 0.3s ease;
  position: relative;
}

.notification:hover {
  color: var(--menu-green);
}

.menu {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu-item {
  text-decoration: none;
  color: #666;
  font-size: 1rem;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  user-select: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  height: auto;
  min-height: 36px;
  min-width: fit-content;
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
  height: 100%;
  display: flex;
  align-items: center;
}

.menu-li {
  position: relative;
  height: 100%;
  align-items: center;
  display: inline-flex;
  justify-content: center;
}

.menu-dropdown {
  height: 100%;
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
}

.menu-dropdown:hover .submenu {
  display: block;
}

.submenu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  min-width: 160px;
  z-index: 1000;
}

.submenu li {
  display: block;
}

.submenu-item {
  display: block;
  padding: 0.5rem 1rem;
  color: #666;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: rgba(46, 125, 50, 0.1);
  color: var(--menu-green);
}

.admin-link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 4px;
}

.admin-link:hover {
  color: var(--menu-green);
  background-color: rgba(46, 125, 50, 0.1);
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 4px;
  width: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.notifications-list {
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: rgba(46, 125, 50, 0.1);
}

.notification-message {
  color: #333;
  font-size: 0.875rem;
}

.notification-date {
  color: #666;
  font-size: 0.75rem;
}

.no-notifications {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .header {
    padding: 0 1rem;
  }

  .menu {
    gap: 1rem;
  }

  .menu-item {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }

  .submenu-item {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }

  .user-section {
    gap: 1rem;
  }

  .profile-image {
    width: 28px;
    height: 28px;
  }
}
</style>