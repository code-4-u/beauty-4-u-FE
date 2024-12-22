<script setup>
import {defineEmits, defineProps, onMounted, reactive, ref} from 'vue'
import {delFetch, getFetch, postFetch, putFetch} from "@/stores/apiClient.js";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:isOpen', 'closed'])

// 상태 관리
const types = ref([])
const error = ref(null)
const editingType = ref(null)
const editingTypeName = ref('') // 수정용 상태 추가
const newType = ref({
  promotionTypeName: ''
})

// 모달 닫기
const closeModal = () => {
  emit('update:isOpen', false)
  emit('closed') // 모달이 닫힐 때 새로운 이벤트 발생
  resetForm()
}

// 폼 초기화
const resetForm = () => {
  editingType.value = null
  editingTypeName.value = '' // 수정용 상태 초기화
  newType.value = {
    promotionTypeName: ''
  }
}

// 필터링 조건
const filters = reactive({
  promotionTypeName: '',
  sort: '',
  order: 'desc',
  page: 1,
  count: 8
})

// 정렬 토글 함수
const toggleSort = (field) => {
  if (filters.sort === field) {
    filters.order = filters.order === 'asc' ? 'desc' : 'asc'
  } else {
    filters.sort = field
    filters.order = 'desc'
  }
  fetchTypes()
}

// 검색 핸들러
const handleSearch = () => {
  filters.page = 1  // 검색 시 첫 페이지로 리셋
  fetchTypes()
}

// 검색 초기화
const resetSearch = () => {
  filters.promotionTypeName = ''
  filters.sort = ''
  filters.order = 'desc'
  filters.page = 1
  fetchTypes()
}

const fetchTypes = async () => {
  try {
    const queryParams = new URLSearchParams({
      promotionTypeName: filters.promotionTypeName,
      sort: filters.sort,
      order: filters.order,
      page: filters.page,
      count: filters.count
    })

    const response = await getFetch(`/promotionType?${queryParams}`);
    types.value = response.data.data

  } catch (e) {
    error.value = '프로모션 종류 목록을 불러오는데 실패했습니다.'
    console.error('Error fetching promotion types:', e)
  }
};

// 프로모션 타입 추가
const handleAdd = async () => {
  try {
    const response = await postFetch('/promotionType', {
      promotionTypeName: newType.value.promotionTypeName
    });

    if (response.status === 200 || response.status === 201) {
      await fetchTypes();
      alert('프로모션 타입이 성공적으로 추가되었습니다.');
      newType.value.promotionTypeName = ''; // 입력 필드 초기화
    }
  } catch (error) {
    console.error('프로모션 타입 추가 중 오류 발생:', error);
    alert('추가 중 오류가 발생했습니다.');
  }
}

// 프로모션 타입 수정
const handleUpdate = async () => {
  try {
    const response = await putFetch(`/promotionType/${editingType.value.promotionTypeId}`, {
      promotionTypeName: editingTypeName.value
    });

    if (response.status === 200) {
      await fetchTypes();
      alert('프로모션 타입이 성공적으로 수정되었습니다.');
      resetForm();
    }
  } catch (error) {
    console.error('프로모션 타입 수정 중 오류 발생:', error);
    alert('수정 중 오류가 발생했습니다.');
  }
}

// 수정 모드 진입
const handleEdit = (type) => {
  editingType.value = type
  editingTypeName.value = type.promotionTypeName
}

// 삭제
const handleDelete = async (promotionTypeId) => {
  if (!confirm('정말 이 프로모션 종류를 삭제하시겠습니까?')) {
    return
  }

  try {
    const response = await delFetch(`/promotionType/${promotionTypeId}`);

    if (response.status === 200) {
      await fetchTypes();
      alert('프로모션 타입이 성공적으로 삭제되었습니다.');
    }
  } catch (error) {
    console.error('프로모션 종류 삭제 중 오류 발생:', error)
    alert('삭제 중 오류가 발생했습니다.')
  }
}

onMounted(() => {
  fetchTypes();
})
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop">
    <div class="modal-content">
      <!-- 헤더 -->
      <div class="modal-header">
        <h3>프로모션 종류 관리</h3>
        <button class="close-button" @click="closeModal">✕</button>
      </div>

      <!-- 필터링 섹션 -->
      <div class="top-section">
        <div class="search-box">
          <input
              v-model="filters.promotionTypeName"
              type="text"
              placeholder="프로모션 종류명 검색"
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
        <div class="divider"></div>
        <div class="add-box">
          <input
              v-model="newType.promotionTypeName"
              type="text"
              placeholder="새로운 프로모션 종류명 입력"
              class="form-input add-input"
              @keyup.enter="handleAdd"
          />
          <button class="add-button" @click="handleAdd" :disabled="!newType.promotionTypeName">
            <font-awesome-icon :icon="['fas', 'plus']" />
          </button>
        </div>
      </div>

      <!-- 목록 -->
      <div class="table-container">
        <table>
          <thead>
          <tr>
            <th>No.</th>
            <th @click="toggleSort('promotionTypeName')" class="sortable">
              종류명
              <span v-if="filters.sort === 'promotionTypeName'" class="sort-icon">
                {{ filters.order === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>관리</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(type, index) in types" :key="type.promotionTypeId">
            <td>{{ index + 1 }}</td>
            <td>
              <div v-if="editingType?.promotionTypeId === type.promotionTypeId" class="inline-edit">
                <input
                    v-model="editingTypeName"
                    type="text"
                    class="form-input"
                    @keyup.enter="handleUpdate"
                    @keyup.esc="resetForm"
                />
                <div class="edit-actions">
                  <button class="save-button" @click="handleUpdate">수정</button>
                  <button class="cancel-button" @click="resetForm">취소</button>
                </div>
              </div>
              <div v-else class="type-name-container">
                {{ type.promotionTypeName }}
                <button class="edit-icon-button" @click="handleEdit(type)">
                  <font-awesome-icon :icon="['far', 'pen-to-square']"/>
                </button>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button class="delete-button" @click="handleDelete(type.promotionTypeId)">
                  삭제
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 모달 기본 스타일 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
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

/* 상단 섹션 (검색 + 추가) */
.top-section {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-box, .add-box {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-box {
  flex: 2;
}

.add-box {
  flex: 3;
}

.divider {
  width: 1px;
  height: 2rem;
  background-color: #e5e7eb;
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
.search-button, .reset-button, .add-button {
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

.add-button {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.add-button:hover {
  background-color: #45a049;
}

.add-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* 테이블 스타일 */
.table-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
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

/* 열 너비 설정 */
th:first-child,
td:first-child {
  width: 15%;
}

th:last-child,
td:last-child {
  width: 20%;
}

th:nth-child(2),
td:nth-child(2) {
  width: 65%;
}

/* 인라인 수정 스타일 */
.inline-edit {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  max-width: 100%;
}

.inline-edit .form-input {
  flex: 1;
  min-width: 0;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.edit-actions {
  display: flex;
  gap: 0.375rem;
}

/* 수정/삭제 버튼 */
.save-button,
.cancel-button {
  padding: 0.375rem;
  width: 3rem;
  height: 2rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-button {
  background-color: #3b82f6;
  color: white;
  border: none;
}

.save-button:hover {
  background-color: #2563eb;
}

.cancel-button {
  background-color: white;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.cancel-button:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
}

.delete-button {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  background-color: white;
  border: 1px solid #ef4444;
  color: #ef4444;
  transition: all 0.2s;
}

.delete-button:hover {
  background-color: #ef4444;
  color: white;
}

/* 수정 아이콘 스타일 */
.type-name-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  border-radius: 0.375rem;
}

.edit-icon-button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.875rem;
  opacity: 0;
  transition: all 0.2s;
  border-radius: 0.25rem;
}

.type-name-container:hover .edit-icon-button {
  opacity: 1;
  background-color: #f3f4f6;
}

.edit-icon-button:hover {
  color: #3b82f6;
  background-color: #eff6ff;
}

.sortable {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;
}

.sortable:hover {
  color: #3b82f6;
}

.sort-icon {
  font-size: 0.875rem;
  color: #3b82f6;
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

  .search-box, .add-box {
    width: 100%;
  }

  .divider {
    width: 100%;
    height: 1px;
    margin: 0.5rem 0;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>