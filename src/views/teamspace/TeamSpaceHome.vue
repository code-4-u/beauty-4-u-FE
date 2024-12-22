<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js'; // 사용자 인증 정보 스토어

const router = useRouter();
const useAuth = useAuthStore();

// 사용자의 팀스페이스 ID와 부서 코드
const deptCode = useAuth.deptCode;
// 팀스페이스 ID를 전역 상태에서 가져옴
const teamspaceId = computed(() => useAuth.teamspaceId);

// 현재 활성화된 섹션 계산
const activeSection = computed(() => {
  const path = router.currentRoute.value.path;
  if (path.includes(`/teamspace/chat/${teamspaceId.value}`)) return 'chat';
  if (path.includes(`/teamspace/board`)) return 'board';
  return 'chat'; // 기본값
});

// 섹션 전환 함수
const switchSection = (section) => {
  if (section === 'chat') {
    // 팀 채팅 경로에 teamspaceId 포함
    router.push(`/teamspace/chat/${teamspaceId.value}`);
  } else if (section === 'board') {
    // 팀 게시판 경로는 teamspaceId 제외
    router.push(`/teamspace/board`);
  }
};
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
      <router-view />
    </div>
  </div>
</template>

<style scoped>
:root {
  --background-color: #f7f7f7;
}

.teamspace {
  display: flex;
  background-color: #ffffff;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 새로운 컴포넌트로 인한 스크롤 방지 */
}

.sidebar {
  width: 200px; /* 고정 너비 */
  background-color: var(--background-color);
  padding: 1rem;
  border-right: 1px solid #e0e0e0;
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