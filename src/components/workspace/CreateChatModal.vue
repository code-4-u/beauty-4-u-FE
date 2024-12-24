<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getFetch, postFetch } from "@/stores/apiClient.js"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:isOpen', 'closed'])

// 상태 관리
const users = ref([])
const selectedUsers = ref([])
const error = ref(null)

// 필터링 조건
const filters = reactive({
  searchTerm: '',
  sort: '',
  order: 'desc',
  page: 1,
  count: 8
})

// 모달 닫기
const closeModal = () => {
  emit('update:isOpen', false)
  emit('closed')
  resetForm()
}

// 폼 초기화
const resetForm = () => {
  selectedUsers.value = []
  filters.searchTerm = ''
}

// 사용자 목록 가져오기
const fetchUsers = async () => {
  try {
    const queryParams = new URLSearchParams({
      searchTerm: filters.searchTerm,
      page: filters.page,
      count: filters.count
    })

    const response = await getFetch(`/users?${queryParams}`)
    users.value = response.data.data
  } catch (e) {
    error.value = '사용자 목록을 불러오는데 실패했습니다.'
    console.error('Error fetching users:', e)
  }
}

// 사용자 검색
const handleSearch = () => {
  filters.page = 1
  fetchUsers()
}

// 검색 초기화
const resetSearch = () => {
  filters.searchTerm = ''
  filters.sort = ''
  filters.order = 'desc'
  filters.page = 1
  fetchUsers()
}

// 사용자 선택/해제
const toggleUserSelection = (user) => {
  const index = selectedUsers.value.findIndex(u => u.userId === user.userId)
  if (index === -1) {
    selectedUsers.value.push(user)
  } else {
    selectedUsers.value.splice(index, 1)
  }
}

// 채팅방 생성
const handleCreateRoom = async () => {
  if (selectedUsers.value.length === 0) {
    alert('최소 1명 이상의 참가자를 선택해주세요.')
    return
  }

  try {
    const response = await postFetch('/chatrooms', {
      participants: selectedUsers.value.map(user => user.userId)
    })

    if (response.status === 200 || response.status === 201) {
      alert('채팅방이 성공적으로 생성되었습니다.')
      closeModal()
    }
  } catch (error) {
    console.error('채팅방 생성 중 오류 발생:', error)
    alert('채팅방 생성 중 오류가 발생했습니다.')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop">
    <div class="modal-content">
      <!-- 헤더 -->
      <div class="modal-header">
        <h3>새 채팅방 추가</h3>
        <button class="close-button" @click="closeModal">✕</button>
      </div>

      <!-- 참가자 검색 섹션 -->
      <div class="search-section">
        <div class="search-box">
          <input
              v-model="filters.searchTerm"
              type="text"
              placeholder="사용자 검색"
              class="form-input search-input"
              @keyup.enter="handleSearch"
          />
          <button @click="handleSearch" class="search-button">
            <font-awesome-icon :icon="['fas', 'search']" />
          </button>
          <button @click="resetSearch" class="reset-button">
            <font-awesome-icon :icon="['fas', 'rotate']" />
          </button>
        </div>
      </div>

      <!-- 선택된 참가자 목록 -->
      <div v-if="selectedUsers.length > 0" class="selected-users">
        <div v-for="user in selectedUsers" :key="user.userId" class="selected-user-tag">
          {{ user.name }}
          <button @click="toggleUserSelection(user)" class="remove-user-button">✕</button>
        </div>
      </div>

      <!-- 사용자 목록 테이블 -->
      <div class="table-container">
        <table>
          <thead>
          <tr>
            <th>No.</th>
            <th>이름</th>
            <th>이메일</th>
            <th>선택</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(user, index) in users" :key="user.userId">
            <td>{{ index + 1 }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <button
                  class="select-button"
                  :class="{ 'selected': selectedUsers.some(u => u.userId === user.userId) }"
                  @click="toggleUserSelection(user)"
              >
                {{ selectedUsers.some(u => u.userId === user.userId) ? '선택됨' : '선택' }}
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- 하단 버튼 -->
      <div class="modal-footer">
        <button class="cancel-button" @click="closeModal">취소</button>
        <button
            class="create-button"
            @click="handleCreateRoom"
            :disabled="selectedUsers.length === 0"
        >
          채팅방 생성
        </button>
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
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  padding: 1.5rem;
  max-height: 90vh;
  overflow-y: auto;
  transform: translateY(0);
  animation: modal-slide-up 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
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

/* 상단 섹션 스타일 */
.top-section {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.divider {
  width: 100%;
  height: 1px;
  background-color: #e5e7eb;
  margin: 1rem 0;
}

/* 검색 섹션 */
.search-section {
  margin-bottom: 1.5rem;
}

.search-box {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* 입력 필드 공통 스타일 */
.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 버튼 스타일 */
.search-button, .reset-button {
  padding: 0.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  transition: all 0.2s;
  cursor: pointer;
}

.search-button {
  background-color: #3b82f6;
  color: white;
  border: none;
}

.search-button:hover {
  background-color: #2563eb;
}

.reset-button {
  background-color: white;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.reset-button:hover {
  background-color: #f3f4f6;
}

/* 선택된 사용자 태그 스타일 */
.selected-users {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.selected-user-tag {
  background-color: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.remove-user-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.remove-user-button:hover {
  transform: scale(1.2);
}

/* 테이블 스타일 */
.table-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background-color: #f8fafc;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: white;
  transition: background-color 0.2s;
}

tr:hover td {
  background-color: #f8fafc;
}

tr:last-child td {
  border-bottom: none;
}

/* 선택 버튼 스타일 */
.select-button {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  background-color: white;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  transition: all 0.2s;
}

.select-button:hover {
  background-color: #eff6ff;
}

.select-button.selected {
  background-color: #3b82f6;
  color: white;
}

.select-button.selected:hover {
  background-color: #2563eb;
}

/* 하단 버튼 영역 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  background-color: white;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  transition: all 0.2s;
}

.cancel-button:hover {
  background-color: #f3f4f6;
}

.create-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  background-color: #3b82f6;
  color: white;
  border: none;
  transition: all 0.2s;
}

.create-button:hover {
  background-color: #2563eb;
}

.create-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* 반응형 스타일 */
@media (max-width: 640px) {
  .modal-content {
    margin: 1rem;
    padding: 1rem;
  }

  .top-section {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .selected-users {
    padding: 0.5rem;
  }

  .table-container {
    margin-bottom: 1rem;
  }
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