<!-- ParticipantListModal.vue -->
<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  participants: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close']);

// 상태 관리
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

// 검색 및 페이지네이션 적용된 참가자 목록
const filteredParticipants = computed(() => {
  if (!searchQuery.value) {
    return props.participants;
  }
  return props.participants.filter(participant =>
      (participant.userName || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (participant.email || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (participant.deptName || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 페이지네이션된 참가자 목록
const paginatedParticipants = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredParticipants.value.slice(startIndex, endIndex);
});

// 총 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(filteredParticipants.value.length / itemsPerPage);
});

// 페이지 변경
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// 모달 닫기
const closeModal = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop">
    <div class="modal-content">
      <div class="modal-header">
        <h3>채팅방 사용자 목록</h3>
        <button class="close-button" @click="closeModal">✕</button>
      </div>

      <!-- 검색 섹션 -->
      <div class="search-box">
        <input class="modal-input"
               v-model="searchQuery"
               type="text"
               placeholder="사용자 검색"
        />
      </div>

      <!-- 사용자 목록 -->
      <div class="modal-body">
        <ul class="participants-list">
          <li v-for="participant in paginatedParticipants" :key="participant.userCode">
            {{ participant.userName || "이름 없음" }}
            ({{ participant.deptName }}, {{ participant.email }})
          </li>
        </ul>
      </div>

      <!-- 페이지네이션 -->
      <div class="pagination">
        <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
        >
          이전
        </button>
        <button
            v-for="page in totalPages"
            :key="page"
            @click="changePage(page)"
            :class="{ active: currentPage === page }"
        >
          {{ page }}
        </button>
        <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
        >
          다음
        </button>
      </div>

      <div class="modal-footer">
        <button class="close-btn" @click="closeModal">닫기</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  padding: 1.5rem;
  transform: translateY(0);
  animation: modal-slide-up 0.3s ease-out;
  z-index: 1010;
  pointer-events: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-input {
  width: 100%;
  padding: 10px 15px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.modal-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}

.modal-input::placeholder {
  color: #999;
  font-style: italic;
}

.modal-body {
  max-height: 400px;
  overflow-y: auto;
}

.participants-list {
  list-style: none;
  padding: 0;
  margin: 0;
  height: 450px;
}

.participants-list li {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.participants-list li:last-child {
  border-bottom: none;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
  font-weight: 500;
}

.pagination button:hover:not(:disabled) {
  border-color: #4CAF50;
  color: #4CAF50;
  background-color: #f0fdf4;
}

.pagination button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.close-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.close-btn:hover {
  background-color: #43a047;
}

@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>