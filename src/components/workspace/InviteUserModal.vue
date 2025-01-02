<!-- InviteUserModal.vue -->
<script setup>
import { ref, computed } from 'vue';
import { getFetch } from "@/stores/apiClient.js";

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

const emit = defineEmits(['close', 'invite']);

// 상태 관리
const selectedUsers = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const users = ref([]);
const totalItems = ref(0);
const itemsPerPage = 10;

// 총 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage);
});

// 참가자를 Set으로 변환
const invitedUserSet = computed(() => new Set(props.participants.map((user) => user.userCode)));

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

// 사용자 선택/해제
const toggleUserSelection = (user) => {
  if (isDisabled(user)) return;

  const index = selectedUsers.value.findIndex(u => u.userId === user.userId);
  if (index === -1) {
    selectedUsers.value.push(user);
  } else {
    selectedUsers.value.splice(index, 1);
  }
};

// 사용자 비활성화 체크
const isDisabled = (user) => {
  return invitedUserSet.value.has(user.userId);
};

// 초대하기
const inviteUsers = () => {
  if (selectedUsers.value.length === 0) {
    alert('초대할 사용자를 선택해주세요.');
    return;
  }
  emit('invite', selectedUsers.value);
};

// 모달 닫기
const closeModal = () => {
  selectedUsers.value = [];
  searchQuery.value = '';
  currentPage.value = 1;
  emit('close');
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

// 컴포넌트가 마운트될 때 사용자 목록 가져오기
if (props.isOpen) {
  fetchUsers();
}
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop">
    <div class="modal-content">
      <div class="modal-header">
        <h3>사용자 초대</h3>
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
      <ul class="user-list">
        <li
            v-for="user in users"
            :key="user.userId"
            @click="!isDisabled(user) ? toggleUserSelection(user) : null"
            :class="{ selected: selectedUsers.includes(user), disabled: isDisabled(user) }"
        >
          {{ user.name }} ({{ user.department }})
        </li>
      </ul>

      <!-- 페이지네이션 -->
      <div class="pagination">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
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

      <!-- 모달 푸터 -->
      <div class="modal-footer">
        <button class="cancel-btn" @click="closeModal">취소</button>
        <button class="create-btn" @click="inviteUsers">초대</button>
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

.user-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  height: 310px;
  overflow-y: auto;
}

.user-list li {
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-list li.selected {
  background-color: #4299e1;
  color: white;
}

.user-list li.disabled {
  color: gray;
  cursor: not-allowed;
  opacity: 0.6;
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

.cancel-btn, .create-btn {
  padding: 0.5rem 1.25rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: white;
  color: #374151;
  border-color: #e5e7eb;
}

.cancel-btn:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.create-btn {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
  padding: 0.5rem 2.5rem;
}

.create-btn:hover {
  background-color: #43a047;
  border-color: #388e3c;
}

.create-btn:disabled {
  background-color: #a5d6a7;
  border-color: #a5d6a7;
  cursor: not-allowed;
  opacity: 0.6;
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