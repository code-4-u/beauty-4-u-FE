<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js'; // 사용자 인증 정보 스토어
import axios from 'axios';

const router = useRouter();
const useAuth = useAuthStore();

// 사용자의 팀스페이스 ID와 부서 코드
const deptCode = useAuth.deptCode;
const teamspaceId = ref(null); // 팀스페이스 ID

// API 호출로 팀스페이스 ID 조회
const fetchTeamSpaceId = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/v1/teamspace', {
      params: {deptCode: deptCode},
      headers: {
        Authorization: `Bearer ${useAuth.accessToken}`
      }
    });
    console.log(response.data);
    teamspaceId.value = response.data; // 서버에서 반환한 팀스페이스 ID
  } catch (error) {
    console.error('팀스페이스 ID 조회 실패:', error);
    alert('팀스페이스 정보를 불러오는 데 실패했습니다.');
  }
};

// 현재 활성화된 섹션 계산
const activeSection = computed(() => {
  const path = router.currentRoute.value.path;
  if (path.includes(`${teamspaceId.value}/chat`)) return 'chat';
  if (path.includes(`${teamspaceId.value}/board`)) return 'board';
  return 'chat'; // 기본값
});

// 섹션 전환 함수
const switchSection = (section) => {
  router.push(`/teamspace/${teamspaceId.value}/${section}`);
};

onMounted(async () => {
  await fetchTeamSpaceId(); // 팀스페이스 ID 조회
});
</script>

<template>
  <div class="teamspace">
    <div class="sidebar">
      <div class="section-buttons">
        <button
            :class="{ active: activeSection === 'chat' }"
            @click="switchSection('chat')"
        >
          팀 채팅
        </button>
        <button
            :class="{ active: activeSection === 'board' }"
            @click="switchSection('board')"
        >
          팀 게시판
        </button>
      </div>
    </div>

    <div class="main-content">
      <router-view/>
    </div>
  </div>
</template>

<style scoped>
:root {
  --background-color: #f7f7f7;
}

.teamspace {
  display: flex;
  min-height: 100vh;
  background-color: #ffffff;
}

.sidebar {
  width: 200px;
  background-color: var(--background-color);
  padding: 1rem;
  border-right: 1px solid #e0e0e0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-buttons button {
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #ffffff;
  color: #333333;
  cursor: pointer;
  transition: all 0.2s;
}

.section-buttons button.active {
  background-color: #4a90e2;
  color: #ffffff;
  border-color: #4a90e2;
}
</style>
