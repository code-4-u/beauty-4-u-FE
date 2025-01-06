<script setup>
import {ref, onMounted, watch, computed} from 'vue';
import {getFetch} from "@/stores/apiClient.js";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

const props = defineProps({
  goodsCode: {
    type: String,
    required: true
  }
});

const promotions = ref([]);
const loading = ref(false);
const showFilters = ref(false);

const year = ref('');
const month = ref('');
const promotionTitle = ref('');
const sort = ref('');
const order = ref('');
const page = ref(1);
const count = ref(10);

const sortOptions = [
  {value: 'startDate', label: '시작일'},
  {value: 'endDate', label: '종료일'},
  {value: 'title', label: '프로모션명'}
];

const yearOptions = [
  { value: '2024', label: '2024년' },
  { value: '2023', label: '2023년' },
  { value: '2022', label: '2022년' },
  { value: '2021', label: '2021년' },
  { value: '2020', label: '2020년' },
  { value: '2019', label: '2019년' },
  { value: '2018', label: '2018년' },
  { value: '2017', label: '2017년' },
  { value: '2016', label: '2016년' },
  { value: '2015', label: '2015년' },
  { value: '2014', label: '2014년' },
  { value: '2013', label: '2013년' },
  { value: '2012', label: '2012년' },
  { value: '2011', label: '2011년' },
  { value: '2010', label: '2010년' },
];

const monthOptions = Array.from({length: 12}, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: `${i + 1}월`
}));

const sortedPromotions = computed(() => {
  if (!promotions.value.length) return [];

  // 가장 높은 percent를 가진 프로모션 찾기
  const maxPercentPromotion = [...promotions.value].sort((a, b) => b.percent - a.percent)[0];

  // 나머지 프로모션들
  const otherPromotions = promotions.value.filter(p => p !== maxPercentPromotion);

  // 정렬 조건이 있는 경우 나머지 프로모션들을 정렬
  if (sort.value && order.value) {
    otherPromotions.sort((a, b) => {
      if (order.value === 'asc') {
        return a[sort.value] > b[sort.value] ? 1 : -1;
      } else {
        return a[sort.value] < b[sort.value] ? 1 : -1;
      }
    });
  }

  return [maxPercentPromotion, ...otherPromotions];
});

const isTopPerformer = (promotion) => {
  if (!promotions.value.length) return false;
  const maxPercent = Math.max(...promotions.value.map(p => p.percent));
  return promotion.percent === maxPercent;
};

const fetchPromotions = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams({
      page: page.value.toString(),
      count: count.value.toString()
    });

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

watch(() => props.goodsCode, () => {
  resetFilters();
});

const resetFilters = () => {
  year.value = '';
  month.value = '';
  promotionTitle.value = '';
  sort.value = '';
  order.value = '';
  page.value = 1;
  fetchPromotions();
};

const handleSearch = () => {
  page.value = 1;
  fetchPromotions();
};

const handleSortChange = (event) => {
  const [newSort, newOrder] = event.target.value.split('-');
  sort.value = newSort;
  order.value = newOrder;
  page.value = 1;
  fetchPromotions();
};

const getPercentColorClass = (percent) => {
  if (percent > 0) return 'text-positive';
  if (percent < 0) return 'text-negative';
  return 'text-neutral';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
};

onMounted(() => {
  fetchPromotions();
});
</script>

<template>
  <div class="promotion-dashboard">
    <button @click="showFilters = !showFilters" class="filter-toggle-btn">
      <font-awesome-icon :icon="['fas', 'fa-up-down']"></font-awesome-icon>
      필터
    </button>

    <Transition name="slide-fade">
      <div v-show="showFilters" class="filters">
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
                      :key="option.value + '-asc'"
                      :value="`${option.value}-asc`">
                {{ option.label }} 오름차순
              </option>
              <option v-for="option in sortOptions"
                      :key="option.value + '-desc'"
                      :value="`${option.value}-desc`">
                {{ option.label }} 내림차순
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
    </Transition>

    <div class="promotion-list">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>

      <div v-else-if="sortedPromotions.length > 0" class="promotion-grid">
        <div v-for="promotion in sortedPromotions"
             :key="promotion.id"
             :class="['promotion-card', { 'top-performer': isTopPerformer(promotion) }]">
          <div class="promotion-header">
            <h3 class="promotion-title">
              {{ promotion.promotionTitle }}
              <span v-if="isTopPerformer(promotion)" class="top-badge">최고 성과</span>
            </h3>
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
              <div class="info-row">
                <span class="info-label">비교</span>
                <span class="info-value" :class="[
                  getPercentColorClass(promotion.percent),
                  { 'top-percent': isTopPerformer(promotion) }
                ]">
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
  overflow: hidden;
  box-sizing: border-box;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.filter-toggle-btn:hover {
  background: #f8f9fa;
}

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

.promotion-list {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

.promotion-list::-webkit-scrollbar {
  width: 8px;
}

.promotion-list::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 4px;
}

.promotion-list::-webkit-scrollbar-thumb {
  background: #dde0e4;
  border-radius: 4px;
}

.promotion-list::-webkit-scrollbar-thumb:hover {
  background: #cbd2d9;
}

.promotion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.promotion-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.promotion-header {
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.promotion-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.promotion-body {
  padding: 8px 12px;
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
  transition: all 0.2s ease;
}

.btn-reset {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  color: #666;
}

.btn-reset:hover {
  background: #e9ecef;
}

.btn-search {
  background: #98FB98;
  border: none;
  color: #006400;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-search:hover {
  background: #90EE90;
  box-shadow: 0 0 10px rgba(152, 251, 152, 0.5);
}

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

.text-positive {
  color: #dc3545;
}

.text-negative {
  color: #0d6efd;
}

.text-neutral {
  color: #333;
}

/* Top performer styles */
@keyframes sparkle {
  0%, 100% {
    border-color: #98FB98;
    box-shadow: 0 0 10px #98FB98;
  }
  50% {
    border-color: #90EE90;
    box-shadow: 0 0 20px #90EE90;
  }
}

@keyframes backgroundSparkle {
  0%, 100% {
    background-color: rgba(152, 251, 152, 0.3);
  }
  50% {
    background-color: rgba(144, 238, 144, 0.5);
  }
}

.top-performer {
  border: 2px solid #98FB98;
  background-color: rgba(152, 251, 152, 0.2);
  transform: scale(1.02);
  animation: sparkle 2s infinite ease-in-out;
  position: relative;
  overflow: hidden;
}

.top-performer::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
      45deg,
      transparent 45%,
      rgba(152, 251, 152, 0.2) 50%,
      transparent 55%
  );
  animation: shine 3s infinite;
}

@keyframes shine {
  0% {
    transform: translate(-30%, -30%) rotate(0deg);
  }
  100% {
    transform: translate(30%, 30%) rotate(360deg);
  }
}

.top-badge {
  display: inline-block;
  padding: 2px 8px;
  margin-left: 8px;
  background-color: #98FB98;
  color: #006400;
  font-size: 11px;
  border-radius: 12px;
  font-weight: bold;
  animation: backgroundSparkle 2s infinite ease-in-out;
}

.top-percent {
  font-size: 15px;
  font-weight: 700;
  color: #2E8B57 !important;
  text-shadow: 0 0 5px rgba(152, 251, 152, 0.5);
}

.promotion-card.top-performer .promotion-header {
  background-color: #98FB98;
  animation: backgroundSparkle 2s infinite ease-in-out;
}

.promotion-card.top-performer .promotion-title {
  color: #006400;
}

.highlight {
  color: #2E8B57;
  font-weight: 600;
}

/* 슬라이드 애니메이션 */
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  transform: translateY(0);
  opacity: 1;
}

/* 필터 컨테이너 스타일 */
.filters {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transform-origin: top;
  will-change: transform, opacity;
}
</style>