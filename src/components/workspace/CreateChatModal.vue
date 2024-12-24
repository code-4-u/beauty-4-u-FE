<script setup>
import { computed, onMounted, ref } from 'vue'
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

// 검색어와 페이징 상태 관리
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const totalItems = ref(0)

// 총 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage)
})

// 사용자 목록 가져오기
const fetchUsers = async () => {
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      count: itemsPerPage
    })

    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }

    const response = await getFetch(`/user/list?${params.toString()}`)
    users.value = response.data.data.content.map(user => ({
      userId: user.userCode,
      name: user.userName,
      email: user.userCode,
      department: user.deptName
    }))
    totalItems.value = response.data.data.totalElements
  } catch (e) {
    error.value = '사용자 목록을 불러오는데 실패했습니다.'
    console.error('Error fetching users:', e)
  }
}

// 검색 처리
const handleSearch = async () => {
  currentPage.value = 1
  await fetchUsers()
}

// 페이지 변경
const changePage = async (page) => {
  currentPage.value = page
  await fetchUsers()
}

// 검색 초기화
const resetSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
  fetchUsers()
}

// 모달 닫기
const closeModal = () => {
  emit('update:isOpen', false)
  emit('closed')
  resetForm()
}

// 폼 초기화
const resetForm = () => {
  selectedUsers.value = []
  searchQuery.value = ''
  currentPage.value = 1
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

    // 채팅방 생성 api 연결 필요
    // const response = await postFetch('/chatrooms', {
    //   participants: selectedUsers.value.map(user => user.userId)
    // })

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
              v-model="searchQuery"
              type="text"
              placeholder="이름, 사원번호로 검색"
              class="form-input search-input"
              @input="handleSearch"
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
          <div class="sub-info">{{ user.department }}</div>
          <button @click="toggleUserSelection(user)" class="remove-user-button">✕</button>
        </div>
      </div>

      <!-- 사용자 목록 테이블 -->
      <div class="table-container">
        <table>
          <thead>
          <tr>
            <th>이름</th>
            <th>부서</th>
            <th>사원번호</th>
            <th>선택</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="user in users" :key="user.userId">
            <td>{{ user.name }}</td>
            <td>{{ user.department }}</td>
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

      <!-- 페이지네이션 -->
      <div class="pagination">
        <button
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
        >
          이전
        </button>
        <button
            v-for="page in totalPages"
            :key="page"
            :class="{ active: currentPage === page }"
            @click="changePage(page)"
        >
          {{ page }}
        </button>
        <button
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
        >
          다음
        </button>
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

.search-section {
  margin-bottom: 1.5rem;
}

.search-box {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

.sub-info {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
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

/* 페이지네이션 */
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
  transition: all 0.2s;
  color: #374151;
  font-weight: 500;
}

.pagination button:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
  background-color: #eff6ff;
}

.pagination button.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 반응형 스타일 */
@media (max-width: 640px) {
  .modal-content {
    margin: 1rem;
    padding: 1rem;
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