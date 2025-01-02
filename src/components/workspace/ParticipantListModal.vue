<script setup>
import {ref, computed, watch} from 'vue';
import { getFetch } from "@/stores/apiClient.js";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close']);

// 상태 관리
const users = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const totalItems = ref(0);
const itemsPerPage = 10;

// 총 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage);
});

// 사용자 목록 가져오기
const fetchUsers = async () => {
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      count: itemsPerPage
    });

    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }

    const response = await getFetch(`/user/list?${params.toString()}`);
    users.value = response.data.data.content.map(user => ({
      userId: user.userCode,
      name: user.userName,
      department: user.deptName
    }));
    totalItems.value = response.data.data.totalElements;
  } catch (e) {
    console.error('Error fetching users:', e);
  }
};

// 페이지 변경
const changePage = async (page) => {
  currentPage.value = page;
  await fetchUsers();
};

// 검색
const handleSearch = async () => {
  currentPage.value = 1;
  await fetchUsers();
};

// 모달 닫기
const closeModal = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  emit('close');
};

watch(() => props.isOpen, async (newValue) => {
  if (newValue) {  // 모달이 열릴 때
    currentPage.value = 1;  // 페이지 초기화
    searchQuery.value = '';  // 검색어 초기화
    await fetchUsers();  // 사용자 목록 가져오기
  }
});
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
               @input="handleSearch"
        />
      </div>

      <!-- 사용자 목록 -->
      <div class="modal-body">
        <ul class="participants-list">
          <li v-for="user in users" :key="user.userId">
            {{ user.name || "이름 없음" }}
            ({{ user.department }})
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
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  transform: translateY(0);
  animation: modal-slide-up 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.modal-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
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

.close-button:hover {
  color: #111827;
}

.search-box {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.modal-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
  font-size: 0.875rem;
}

.modal-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.modal-body {
  max-height: 400px;
  overflow-y: auto;
}

.participants-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.participants-list li {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  transition: background-color 0.2s;
}

.participants-list li:hover {
  background-color: #f9fafb;
}

.participants-list li:last-child {
  border-bottom: none;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination button {
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
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
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.close-btn {
  padding: 0.75rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.close-btn:active {
  transform: translateY(0);
  box-shadow: none;
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

@media (max-width: 640px) {
  .modal-content {
    margin: 1rem;
    padding: 1rem;
  }

  .modal-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .pagination {
    gap: 0.25rem;
  }

  .pagination button {
    min-width: 2rem;
    height: 2rem;
    padding: 0.25rem;
    font-size: 0.875rem;
  }
}
</style>