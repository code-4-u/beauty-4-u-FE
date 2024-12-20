<script setup>
import {ref, onMounted, watch} from 'vue';
import {getFetch} from "@/stores/apiClient.js";

// props 정의
const props = defineProps({
  goodsCode: {
    type: String,
    required: true
  }
});

const promotions = ref([]);
const loading = ref(false);

// 검색 조건 ref 추가
const year = ref('');
const month = ref('');
const promotionTitle = ref('');
const sort = ref('');
const order = ref('');
const page = ref(1);
const count = ref(10);

// 정렬 옵션
const sortOptions = [
  {value: 'startDate', label: '시작일'},
  {value: 'endDate', label: '종료일'},
  {value: 'title', label: '프로모션명'}
];

// 연도 옵션
const yearOptions = [
  {value: '2024', label: '2024년'},
  {value: '2023', label: '2023년'},
  {value: '2022', label: '2022년'}
];

// 월 옵션
const monthOptions = Array.from({length: 12}, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: `${i + 1}월`
}));

// 프로모션 목록 조회
const fetchPromotions = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams({
      page: page.value.toString(),
      count: count.value.toString()
    });

    // 선택된 검색 조건들만 쿼리에 추가
    console.log(promotionTitle.value);
    if (year.value) queryParams.append('year', year.value);
    if (month.value) queryParams.append('month', month.value);
    if (promotionTitle.value) queryParams.append('promotionTitle', promotionTitle.value);
    if (sort.value) queryParams.append('sort', sort.value);
    if (order.value) queryParams.append('order', order.value);

    const response = await getFetch(`/promotionGoods/stats/${props.goodsCode}?${queryParams.toString()}`);
    if (response?.data?.data) {
      promotions.value = response.data.data;
    }
  } catch (error) {
    console.error('프로모션 목록 조회 중 오류:', error);
  } finally {
    loading.value = false;
  }
};

// watch를 사용하여 goodsCode가 변경될 때마다 프로모션 목록 다시 조회
watch(() => props.goodsCode, () => {
  resetFilters();
});

// 필터 초기화
const resetFilters = () => {
  year.value = '';
  month.value = '';
  promotionTitle.value = '';
  sort.value = '';
  order.value = '';
  page.value = 1;
  fetchPromotions();
};

// 검색 버튼 클릭
const handleSearch = () => {
  page.value = 1; // 페이지 초기화
  fetchPromotions();
};

// 정렬 변경 핸들러
const handleSortChange = (event) => {
  const [newSort, newOrder] = event.target.value.split('-');
  sort.value = newSort;
  order.value = newOrder;
  page.value = 1;
  fetchPromotions();
};

// percent 값에 따른 색상 클래스 반환 함수
const getPercentColorClass = (percent) => {
  if (percent > 0) return 'text-positive';
  if (percent < 0) return 'text-negative';
  return 'text-neutral';
};

// 날짜 포맷 함수 추가
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}년 ${month}월 ${day}일`;
};

// 컴포넌트 마운트 시 프로모션 목록 조회
onMounted(() => {
  fetchPromotions();
});
</script>

/* script 부분은 동일하게 유지 */

<template>
  <div class="promotion-dashboard">
    <!-- 검색 필터 영역 -->
    <div class="filters">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">연도</label>
          <select v-model="year" class="filter-select">
            <option value="">전체</option>
            <option v-for="option in yearOptions"
                    :key="option.value"
                    :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">월</label>
          <select v-model="month" class="filter-select">
            <option value="">전체</option>
            <option v-for="option in monthOptions"
                    :key="option.value"
                    :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">프로모션명</label>
          <input type="text"
                 v-model="promotionTitle"
                 placeholder="검색어를 입력하세요"
                 @keyup.enter="handleSearch"
                 class="filter-input">
        </div>

        <div class="filter-group">
          <label class="filter-label">정렬</label>
          <select @change="handleSortChange" class="filter-select">
            <option value="">기본 정렬</option>
            <option v-for="option in sortOptions"
                    :key="option.value"
                    :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="button-row">
        <button class="btn btn-reset" @click="resetFilters">
          <i class="fas fa-undo"></i> 초기화
        </button>
        <button class="btn btn-search" @click="handleSearch">
          <i class="fas fa-search"></i> 검색
        </button>
      </div>
    </div>

    <!-- 프로모션 목록 -->
    <div class="promotion-list">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>

      <div v-else-if="promotions.length > 0" class="promotion-grid">
        <div v-for="promotion in promotions"
             :key="promotion.id"
             class="promotion-card">
          <div class="promotion-header">
            <h3 class="promotion-title">{{ promotion.promotionTitle }}</h3>
          </div>
          <div class="promotion-body">
            <div class="promotion-info">
              <div class="info-row">
                <span class="info-label">시작일</span>
                <span class="info-value">{{ formatDate(promotion.promotionStartDate) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">종료일</span>
                <span class="info-value">{{ formatDate(promotion.promotionEndDate) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">할인율</span>
                <span class="info-value highlight">{{ promotion.discountRate }}%</span>
              </div>
              <div class="info-row">
                <span class="info-label">매출액</span>
                <span class="info-value">{{ promotion.sales.toLocaleString() }}원</span>
              </div>
              <!-- percent 부분 수정 -->
              <div class="info-row">
                <span class="info-label">비교</span>
                <span class="info-value" :class="getPercentColorClass(promotion.percent)">
                  {{ promotion.percent }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-results">
        <i class="fas fa-search"></i>
        <p>검색 결과가 없습니다</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.promotion-dashboard {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
  box-sizing: border-box;
}

/* 필터 영역 스타일 */
.filters {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.filter-group {
  position: relative;
}

.filter-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.filter-select,
.filter-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  background-color: #fff;
}

/* 프로모션 목록 스타일 */
.promotion-list {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.promotion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.promotion-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.promotion-header {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.promotion-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.promotion-body {
  padding: 12px 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.info-label {
  color: #666;
}

.info-value {
  font-weight: 500;
  color: #333;
}

/* 버튼 스타일 */
.button-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-reset {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  color: #666;
}

.btn-search {
  background: #4299e1;
  border: none;
  color: white;
}

/* 로딩 및 결과 없음 상태 */
.loading,
.no-results {
  padding: 24px;
  text-align: center;
  color: #666;
  font-size: 13px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f0f0f0;
  border-top-color: #4299e1;
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 스크롤바 스타일 */
.promotion-dashboard::-webkit-scrollbar {
  width: 8px;
}

.promotion-dashboard::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.promotion-dashboard::-webkit-scrollbar-thumb {
  background: #dde0e4;
  border-radius: 4px;
}

.promotion-dashboard::-webkit-scrollbar-thumb:hover {
  background: #cbd2d9;
}

/* percent 색상 클래스 */
.text-positive {
  color: #dc3545;  /* 빨간색 */
}

.text-negative {
  color: #0d6efd;  /* 파란색 */
}

.text-neutral {
  color: #333;     /* 검정색 */
}
</style>