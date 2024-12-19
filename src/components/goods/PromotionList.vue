<script setup>
import {ref, onMounted, watch} from 'vue';
import { getFetch } from "@/stores/apiClient.js";

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
  { value: 'startDate', label: '시작일' },
  { value: 'endDate', label: '종료일' },
  { value: 'title', label: '프로모션명' }
];

// 연도 옵션
const yearOptions = [
  { value: '2024', label: '2024년' },
  { value: '2023', label: '2023년' },
  { value: '2022', label: '2022년' }
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

// 컴포넌트 마운트 시 프로모션 목록 조회
onMounted(() => {
  fetchPromotions();
});
</script>

<template>
    <!-- 검색 필터 영역 추가 -->
    <div class="filters">
      <div class="filter-row">
        <div class="filter-group">
          <select v-model="year">
            <option value="">연도 선택</option>
            <option v-for="option in yearOptions"
                    :key="option.value"
                    :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <select v-model="month">
            <option value="">월 선택</option>
            <option v-for="option in monthOptions"
                    :key="option.value"
                    :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <input type="text"
                 v-model="promotionTitle"
                 placeholder="프로모션명 검색">
        </div>

        <div class="filter-group">
          <select @change="handleSortChange">
            <option value="">정렬 방식</option>
            <option v-for="option in sortOptions"
                    :key="option.value"
                    :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="button-row">
        <button class="search-btn" @click="handleSearch">검색</button>
        <button class="reset-btn" @click="resetFilters">초기화</button>
      </div>
    </div>

  <div class="list-container">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
    <ul v-else-if="promotions.length > 0">
      <li v-for="promotion in promotions" :key="promotion.id">
        <h3>{{ promotion.promotionTitle }}</h3>
        <p>시작일: {{ promotion.promotionStartDate }}</p>
        <p>종료일: {{ promotion.promotionEndDate }}</p>
        <p>할인율: {{ promotion.discountRate }}%</p>
        <p>매출액: {{ promotion.sales}}</p>
        <p>{{ promotion.percent }}%</p>
      </li>
    </ul>
    <p v-else>검색 결과가 없습니다.</p>
  </div>
</template>

<style scoped>
/* 기존 스타일 유지하고 필터 관련 스타일 추가 */
.filters {
  padding: 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.filter-group {
  flex: 1;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.button-row {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.search-btn,
.reset-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.search-btn {
  background: #4CAF50;
  color: white;
  border: none;
}

.reset-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.search-btn:hover {
  background: #45a049;
}

.reset-btn:hover {
  background: #e8e8e8;
}

/* 기존 스타일 유지 */
</style>