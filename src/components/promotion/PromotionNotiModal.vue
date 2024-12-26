<script setup>
import {onMounted, reactive, ref} from 'vue'
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
const editingType = ref(null)
const editingTypeName = ref('') // 수정용 상태 추가
const newType = ref({
  promotionTypeName: ''
})

// 검색한 프로모션
const promotions = ref([]);

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

// 검색 초기화
const resetSearch = () => {
  promotionKeyword.value = '';
  promotions.value = [];
}

/* 검색어 담는 변수 */
const promotionKeyword = ref('');

const searchPromotion = async() => {
  try {
    const queryParams = new URLSearchParams({
      promotionName: promotionKeyword.value
    });

    const response = await getFetch(`/promotionNoti/searchPromotion?${queryParams}`);
    promotions.value = response.data.data;
  } catch(e) {
    console.log("프로모션을 검색하는데 실패했습니다.", e);
  }
}

// 선택
const handleSelect = async (promotionId) => {
  const selected = promotions.value.find(p => p.promotionId === promotionId);
  emit('selectPromotion', selected);
  closeModal();
}

onMounted(() => {

})
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop">
    <div class="modal-content">
      <!-- 헤더 -->
      <div class="modal-header">
        <h3>프로모션 검색</h3>
        <button class="close-button" @click="closeModal">✕</button>
      </div>

      <!-- 필터링 섹션 -->
      <div class="top-section">
        <div class="search-box">
          <input
              v-model="promotionKeyword"
              type="text"
              placeholder="프로모션 검색"
              class="form-input search-input"
              @keyup.enter="searchPromotion"
          />
          <button @click="searchPromotion" class="search-button">
            <font-awesome-icon :icon="['fas', 'search']"/>
          </button>
          <button @click="resetSearch" class="reset-button">
            <font-awesome-icon :icon="['fas', 'rotate']"/>
          </button>
        </div>
        <div class="divider"></div>
      </div>

      <!-- 목록 -->
      <div class="table-container">
        <table>
          <thead>
          <tr>
            <th>No.</th>
            <th class="sortable">종류명</th>
            <th>관리</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(type, index) in promotions" :key="type.promotionTypeId">
            <td>{{ index + 1 }}</td>
            <td>
              <div class="inline-edit">
                {{ type.promotionTitle }}
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button class="delete-button" @click="handleSelect(type.promotionId)">
                  선택
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
  table-layout: auto;
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