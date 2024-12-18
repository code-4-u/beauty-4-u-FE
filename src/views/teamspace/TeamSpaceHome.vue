<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()

// 현재 활성화된 섹션 계산
const activeSection = computed(() => {
  const path = router.currentRoute.value.path
  if (path.includes('/chat')) return 'chat'
  if (path.includes('/board')) return 'board'
  return 'chat' // 기본값
})

// 섹션 전환 함수
const switchSection = (section) => {
  router.push(`/teamspace/${section}`)
}
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
.teamspace {
  display: flex;
  height: 100vh;
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