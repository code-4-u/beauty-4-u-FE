<script setup>
import {computed, onMounted, ref} from 'vue'
import {getFetch} from "@/stores/apiClient.js";
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
const pageNum = ref(1);
const viewCount = ref(10);
const totalCount = ref(0);  // 추가

// totalPages computed 속성 수정
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / viewCount.value)
});

// 페이지 그룹 관련 computed 속성 추가
const currentPageGroup = computed(() => {
  return Math.ceil(pageNum.value / 5)
});

const pageNumbers = computed(() => {
  const start = (currentPageGroup.value - 1) * 5 + 1
  const end = Math.min(currentPageGroup.value * 5, totalPages.value)
  return Array.from({length: end - start + 1}, (_, i) => start + i)
});

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

// 검색 초기화
const resetSearch = () => {
  promotionKeyword.value = '';
  promotions.value = [];
}

/* 검색어 담는 변수 */
const promotionKeyword = ref('');

const searchPromotion = async() => {
  try {
    promotions.value = [];  // 여기에 추가
    const offset = (pageNum.value - 1) * viewCount.value; // 오프셋 계산 추가
    const queryParams = new URLSearchParams({
      promotionName: promotionKeyword.value,
      page: offset,
      count: viewCount.value
    });

    const response = await getFetch(`/promotionNoti/searchPromotion?${queryParams}`);
    promotions.value = response.data.data.findPromotionResList;
    totalCount.value = response.data.data.promotionCount;
  } catch(e) {
    // console.log("프로모션을 검색하는데 실패했습니다.", e);
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
            <td>{{ ((pageNum - 1) * viewCount) + index + 1}}</td>
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

      <!-- 페이지네이션 -->
      <div class="pagination">
        <!-- 첫 페이지로 -->
        <button
            :disabled="pageNum === 1"
            @click="pageNum = 1; searchPromotion()"
            class="page-button">
          &lt;&lt;
        </button>

        <!-- 이전 페이지 그룹으로 -->
        <button
            :disabled="pageNum === 1"
            @click="pageNum = Math.max(1, pageNumbers[0] - 5); searchPromotion()"
            class="page-button"
        >
          &lt;
        </button>

        <!-- 페이지 번호들 -->
        <button
            v-for="page in pageNumbers"
            :key="page"
            :class="['page-button', { active: pageNum === page }]"
            @click="pageNum = page; searchPromotion()"
        >
          {{ page }}
        </button>

        <!-- 다음 페이지 그룹으로 -->
        <button
            :disabled="pageNum >= totalPages"
            @click="pageNum = Math.min(totalPages, pageNumbers[pageNumbers.length - 1] + 1); searchPromotion()"
            class="page-button"
        >
          &gt;
        </button>

        <!-- 마지막 페이지로 -->
        <button
            :disabled="pageNum >= totalPages"
            @click="pageNum = totalPages; searchPromotion()"
            class="page-button"
        >
          &gt;&gt;
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 모달 백드롭 스타일 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

/* 모달 컨텐츠 스타일 */
.modal-content {
  background: white;
  border-radius: 0.75rem;
  padding: 1.0rem;
  width: 90%;
  max-width: 700px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modal-slide-up 0.3s ease-out;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 모달 헤더 스타일 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

/* 상단 섹션 스타일 */
.top-section {
  padding: 0.25rem 0;
}

/* 검색 박스 스타일 */
.search-box {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.search-button, .reset-button {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-button:hover, .reset-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* 테이블 컨테이너 스타일 수정 */
.table-container {
  height: 450px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin: 0.25rem 0;
  position: relative;
}

.table-container table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table-container th {
  background-color: #f8fafc;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.table-container td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

/* 인라인 에딧 스타일 */
.inline-edit {
  padding: 0.25rem 0;
}

/* 액션 버튼 스타일 */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.delete-button {
  padding: 0.25rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
  color: #4b5563;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* 구분선 스타일 */
.divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 0.25rem 0;
}

/* 닫기 버튼 스타일 */
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

/* 애니메이션 */
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

/* 테이블 컨테이너 스타일 수정 */
.table-container {
  height: 450px; /* 고정 높이 설정 */
  overflow-y: auto; /* 세로 스크롤 활성화 */
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin: 0.25rem 0;
}

/* 테이블 스타일 수정 */
.table-container table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

/* 테이블 헤더 고정을 위한 스타일 수정 */
.table-container thead {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #f8fafc;
}

.table-container th {
  background-color: #f8fafc;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap; /* 추가: 헤더 텍스트 줄바꿈 방지 */
}

/* th 각각의 너비 지정 */
.table-container th:nth-child(1) {
  width: 15%;
}

.table-container th:nth-child(2) {
  width: 60%;
}

.table-container th:nth-child(3) {
  width: 25%;
}

/* td 스타일 */
.table-container td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  background-color: white; /* 추가: td 배경색 지정 */
}

/* 전체 모달 컨텐츠의 최대 높이 설정 */
.modal-content {
  max-height: 90vh; /* 뷰포트 높이의 90% */
  height: auto;
  display: flex;
  flex-direction: column;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.page-button {
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

.page-button:hover:not(:disabled) {
  border-color: #4CAF50;
  color: #4CAF50;
  background-color: #f0fdf4;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>