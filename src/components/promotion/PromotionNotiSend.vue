<script setup>
import {ref, onMounted, computed} from 'vue'
import {getFetch, postFetch} from "@/stores/apiClient.js";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import PromotionNotiModal from "@/components/promotion/PromotionNotiModal.vue";

const isTypeModalOpen = ref(false);

// 상태 관리
const loading = ref(false);
const error = ref(null);

const openTypeModal = () => {
  isTypeModalOpen.value = true;
}

const pageNum = ref(1);
const viewCount = ref(10);
const totalCount = ref(0);  // 추가
const targetingCustomer = ref([]);
const selectedPromotion = ref('');
const currAnalysisNumber = ref(0);
const isLoadingModalOpen = ref(false);  // 로딩 모달 상태 추가

const handlePromotionSelect = (promotion) => {
  selectedPromotion.value = promotion;
}

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

// API 호출 함수
const fetchCustomer = async () => {
  try {
    const params = new URLSearchParams();
    params.append("promotionId", selectedPromotion.value.promotionId);
    params.append("page", pageNum.value);
    params.append("count", viewCount.value);

    const response = await getFetch(`/promotionNoti/by-customer-goods?${params.toString()}`);

    targetingCustomer.value = response.data.data.findPromotionByCustomerGoodsResList;
    totalCount.value = response.data.data.customerCount;
  } catch (e) {
    console.error('프로모션 대상 목록을 불러오는데 실패했습니다.', e);
  } finally {
    loading.value = false;
  }
}

const sendNotiCustomer = async () => {
  try {
    const result = confirm("정말 알림을 발송하시겠습니까?");
    if(result) {
      const response = await postFetch(`/promotionNoti/noti/${selectedPromotion.value.promotionId}`);
      if(response.data.success === 'true' || response.data.success === true){
        alert("프로모션 알림 발송에 성공하였습니다.");
      }
    }
  } catch (e) {
    console.log("알림 발송에 실패했습니다.", e);
  }
}

/* 최근의 분석 번호 조회 */
const findCurrentAnalysisNumber = async () => {
  try {
    const response = await getFetch(`/promotionNoti/number`);
    currAnalysisNumber.value = response.data;
  } catch (e) {
    console.log("최근 분석 번호를 조회하는데 실패하였습니다.", e)
  }
}

/* 고갹별 맞춤 추천 재실행 */
const runningRecommend = async () => {
  try {
    isLoadingModalOpen.value = true;
    const response = await getFetch(`/collaboFilter/goods`);
    currAnalysisNumber.value = response.data.analysisId;
  } catch (e) {
    console.log("고객별 맞춤 추천 하는데 실패하였습니다.", e);
  } finally {
    isLoadingModalOpen.value = false;
  }
}

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  findCurrentAnalysisNumber();
})
</script>

<template>
  <div class="container">
    <div class="promotion-management">
      <div class="header">
        <h2>프로모션 알림 발송</h2>
        <div class="header-buttons">
          <button class="manage-button" @click="openTypeModal">
            <font-awesome-icon :icon="['fas', 'cog']"/>
            프로모션 선택
          </button>
        </div>
      </div>

      <PromotionNotiModal
          v-model:isOpen="isTypeModalOpen"
          @selectPromotion="handlePromotionSelect"
          @closed="fetchCustomer"
      />

      <!-- 로딩 모달 추가 -->
      <div v-if="isLoadingModalOpen" class="modal-overlay">
        <div class="loading-modal">
          <div class="spinner"></div>
          <p>재추천 실행중...</p>
        </div>
      </div>

      <!-- 선택한 프로모션 띄우는 곳 -->
      <div v-if="selectedPromotion" class="selected-promotion-box">
        <div class="promotion-info">
          <div class="main-info">
            <h3>{{ selectedPromotion.promotionTitle }}</h3>
            <span>{{ selectedPromotion.promotionTypeName }}</span>
          </div>
          <div class="detail-info">
            <div class="info-group">
              <label>시작일:</label>
              <span>{{ formatDate(selectedPromotion.promotionStartDate) }}</span>
            </div>
            <div class="info-group">
              <label>종료일:</label>
              <span>{{ formatDate(selectedPromotion.promotionEndDate) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 프로모션 목록 테이블 -->
      <div class="table-container">
        <div class="header">
          <h5>프로모션 알림 대상자 목록</h5>
          <div class="button-group">
            <button
                class="search-button"
                @click="runningRecommend">
              고객별 재추천 실행
            </button>
            <button
                class="search-button"
                @click="sendNotiCustomer"
                :disabled="!selectedPromotion || targetingCustomer.length === 0">
              알림발송
            </button>
          </div>
        </div>
        <table>
          <thead>
          <tr>
            <th class="sortable">
              고객코드
            </th>
            <th>성별</th>
            <th class="sortable">
              나이
            </th>
            <th class="sortable">
              피부 타입
            </th>
            <th>등급</th>
          </tr>
          </thead>
          <tbody>
          <tr v-if="loading">
            <td colspan="6" class="text-center">로딩중...</td>
          </tr>
          <tr v-else-if="error">
            <td colspan="6" class="text-center text-red-500">{{ error }}</td>
          </tr>
          <tr v-else v-for="customer in targetingCustomer" class="promotion-row">
            <td>{{ customer.customerCode }}</td>
            <td>
              <span class="badge type">{{ customer.customerGender }}</span>
            </td>
            <td>{{ customer.customerAge }}</td>
            <td>{{ customer.customerSkintype }}</td>
            <td>
              {{ customer.customerGrade}}
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
            @click="pageNum = 1; fetchCustomer()"
            class="page-button">
          &lt;&lt;
        </button>

        <!-- 이전 페이지 그룹으로 -->
        <button
            :disabled="pageNum === 1"
            @click="pageNum = Math.max(1, pageNumbers[0] - 5); fetchCustomer()"
            class="page-button"
        >
          &lt;
        </button>

        <!-- 페이지 번호들 -->
        <button
            v-for="page in pageNumbers"
            :key="page"
            :class="['page-button', { active: pageNum === page }]"
            @click="pageNum = page; fetchCustomer()"
        >
          {{ page }}
        </button>

        <!-- 다음 페이지 그룹으로 -->
        <button
            :disabled="pageNum >= totalPages"
            @click="pageNum = Math.min(totalPages, pageNumbers[pageNumbers.length - 1] + 1); fetchCustomer()"
            class="page-button"
        >
          &gt;
        </button>

        <!-- 마지막 페이지로 -->
        <button
            :disabled="pageNum >= totalPages"
            @click="pageNum = totalPages; fetchCustomer()"
            class="page-button"
        >
          &gt;&gt;
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 2rem;
}

.promotion-management {
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background-color: #f9fafb;
  padding: 0.75rem 1rem;
  font-weight: 600;
  text-align: left;
  color: #374151;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  background-color: #f3f4f6;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
}

.badge.type {
  background-color: #dbeafe;
  color: #1e40af;
}

.action-buttons button {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
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

.search-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.search-button {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.promotion-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.promotion-row:hover {
  background-color: #f9fafb;
}

.header-buttons {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.manage-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  color: #4CAF50;
  border: 1px solid #4CAF50;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.manage-button:hover {
  background-color: #f0fdf4;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.manage-button:active {
  transform: translateY(0);
  box-shadow: none;
}

@media (max-width: 768px) {
  .header-buttons {
    width: 100%;
    flex-direction: column;
  }

  .manage-button {
    width: 100%;
    justify-content: center;
  }

  .container {
    padding: 1rem;
  }

  .promotion-management {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .pagination {
    gap: 0.25rem;
  }

  .page-button {
    min-width: 2rem;
    height: 2rem;
    padding: 0.25rem;
    font-size: 0.875rem;
  }
}

.promotion-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selected-promotion-box {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.main-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.detail-info {
  display: flex;
  gap: 2rem;
}

.info-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-group label {
  color: #6b7280;
  font-size: 0.875rem;
}

.info-group span {
  color: #374151;
  font-weight: 500;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.header .search-button {
  min-width: 120px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-modal {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>