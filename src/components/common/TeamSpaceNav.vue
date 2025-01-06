<script setup>
import {ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js'; // 사용자 인증 정보 스토어
import { useRoute } from 'vue-router';
import axios from 'axios';

// Reactive references
const searchQuery = ref('');
const navItems = ref([]);
const route = useRoute();
const useAuth = useAuthStore();

// 사용자의 팀스페이스 ID와 부서 코드
const deptCode = useAuth.deptCode;
const teamspaceId = ref(null); // 팀스페이스 ID

// API 호출로 팀스페이스 ID 조회
const fetchTeamSpaceId = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/v1/teamspace', {
      params: { deptCode: deptCode },
      headers: {
        Authorization: `Bearer ${useAuth.accessToken}`
      }
    });
    // console.log(response.data);
    teamspaceId.value = response.data; // 서버에서 반환한 팀스페이스 ID
  } catch (error) {
    console.error('팀스페이스 ID 조회 실패:', error);
    alert('팀스페이스 정보를 불러오는 데 실패했습니다.');
  }
};

const updateNavItems = () => {
  navItems.value = [
    { id: 1, name: '채팅방', link: `/teamspace/${teamspaceId.value}/chat` },
    { id: 2, name: '스크랩', link: '/teamspace/scrap' }
  ];
};


onMounted(async () => {
  await fetchTeamSpaceId(); // 팀스페이스 ID 조회
  updateNavItems();
});

</script>

<template>
  <div class="sidebar">
    <div class="header">
      <div class="logo">사이드 메뉴</div>
      <div class="user-icon">🔔</div>
    </div>
    <div class="search-bar">
      <input type="text" v-model="searchQuery" placeholder="Search for..." style="width: 80%;" />
    </div>
    <ul class="nav-list">
      <li v-for="item in navItems" :key="item.id">
        <router-link :to="item.link">
          <div>
            {{ item.name }}
          </div>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sidebar {
  width: 300px;
  background-color: #f0f0f0;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-weight: bold;
}

.search-bar {
  margin: 20px 0;
  left: 0;
}

.search-bar input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-right: 10px; /* 오른쪽 여백 추가 */
}

.nav-list {
  list-style-type: none;
  padding-left: 1em;
}

.nav-list li {
  padding: 10px 0;
  cursor: pointer;
}

.nav-list li:hover {
  background-color: #e0e0e0;
}
</style>