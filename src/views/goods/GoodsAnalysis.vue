<script setup>
// script 부분에 상태 변수 추가
import {onMounted, onUnmounted, ref, watch} from "vue";
import {getFetch} from "@/stores/apiClient.js";
import PromotionList from "@/components/goods/PromotionList.vue";
import Review from "@/views/goods/Review.vue";
import GoodsChart from "@/components/goods/GoodsChart.vue";
import GoodsCompare from "@/components/goods/GoodsCompare.vue";

const searchWord = ref('');
const minPrice = ref('');
const maxPrice = ref('');
const sort = ref('');
const order = ref('');
const page = ref(1);
const count = ref(10);
const loading = ref(false);
const hasMore = ref(true);
const searchResults = ref([]);

// 카테고리 관련 상태 추가
const selectedTopCategory = ref('');
const selectedSubCategory = ref('');
const topCategories = ref([]);
const subCategories = ref([]);
const isSearchOpen = ref(false);

// 선택된 상품 코드 관리
const selectedGoodsCode = ref('');

// 상품 선택 핸들러 추가
const handleGoodsSelect = (goodsCode) => {
  selectedGoodsCode.value = goodsCode;
};


// 상위 카테고리 변경 핸들러
const handleTopCategoryChange = async () => {
  selectedSubCategory.value = ''; // 상위 카테고리 변경 시 하위 카테고리 초기화
  if (!selectedTopCategory.value) {
    subCategories.value = [];
    return;
  }

  try {
    const response = await getFetch(`/goods/category/top?topCategoryCode=${selectedTopCategory.value}`);
    if (response?.data) {
      subCategories.value = response.data.data;
    }
  } catch (error) {
    console.error('하위 카테고리 로딩 중 오류:', error);
    subCategories.value = [];
  }
};

// 하위 카테고리 변경 핸들러
const handleSubCategoryChange = () => {
  resetSearch();
  searchGoods();
};

// 검색 패널 토글
const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
};

// 컴포넌트 마운트 시 상위 카테고리 로딩
onMounted(async () => {
  try {
    const response = await getFetch('/goods/topCategory');
    if (response?.data) {
      topCategories.value = response.data.data;
    }
  } catch (error) {
    console.error('상위 카테고리 로딩 중 오류:', error);
    topCategories.value = [];
  }
});

// 검색 함수 수정
const searchGoods = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const queryParams = new URLSearchParams({
      page: page.value.toString(),
      count: count.value.toString()
    });

    // 선택된 검색 조건들만 쿼리에 추가
    if (searchWord.value) queryParams.append('searchWord', searchWord.value);
    if (selectedTopCategory.value) queryParams.append('topCategoryCode', selectedTopCategory.value);
    if (selectedSubCategory.value) queryParams.append('subCategoryCode', selectedSubCategory.value);
    if (minPrice.value) queryParams.append('minPrice', minPrice.value);
    if (maxPrice.value) queryParams.append('maxPrice', maxPrice.value);
    if (sort.value) queryParams.append('sort', sort.value);
    if (order.value) queryParams.append('order', order.value);

    const response = await getFetch(`/goods?${queryParams.toString()}`);

    if (response?.data?.data) {
      const newItems = response.data.data;
      searchResults.value = [...searchResults.value, ...newItems];
      hasMore.value = newItems.length > 0; // 서버 응답에 따라 동적으로 hasMore 설정
      page.value += 1;
    }
  } catch (error) {
    console.error('상품 검색 중 오류 발생:', error);
  } finally {
    loading.value = false;
  }
};

// 검색 조건 변경 시 초기화하는 함수
const resetSearch = () => {
  page.value = 1;
  searchResults.value = [];
  hasMore.value = true;
  loading.value = false;
};

// 정렬 조건 변경 핸들러 추가
const handleSortChange = (event) => {
  const [newSort, newOrder] = event.target.value.split('-');
  sort.value = newSort;
  order.value = newOrder;
  resetSearch();
  searchGoods();
};

// Intersection Observer를 위한 ref 추가
const loadingRef = ref(null);
const observer = ref(null);

// Intersection Observer 설정
onMounted(() => {
  observer.value = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      searchGoods();
    }
  }, {
    threshold: 1.0
  });

  if (loadingRef.value) {
    observer.value.observe(loadingRef.value);
  }
});

// Intersection Observer 설정 수정
watch(loadingRef, (newRef) => {
  if (newRef) {
    observer.value = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        searchGoods();
      }
    }, {
      threshold: 0.5 // 50% 정도 보일 때 로딩 시작
    });
    observer.value.observe(newRef);
  }
});

// 컴포넌트 언마운트 시 observer 해제
onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});

// 검색 버튼 클릭 핸들러
const handleSearch = () => {
  resetSearch();
  searchGoods();
};

const selectedYear = ref(null);
const selectedMonth = ref(null);

const handleMonthClick = ({ year, month }) => {
  selectedYear.value = year;
  selectedMonth.value = month;
};
</script>

<template>
  <div class="container-wrapper">
    <div class="content-container">
      <div class="layout-grid">
        <!-- 왼쪽 프로모션 목록 -->
        <div class="promotion-list">
          <h3>적용된 프로모션 목록</h3>
          <PromotionList
              v-if="selectedGoodsCode"
              :goodsCode="selectedGoodsCode"
          />
          <div v-else class="no-selection">
            검색 목록에서 상품을 선택해주세요.
          </div>
        </div>

        <!-- 가운데 차트 영역 -->
        <div class="chart-section">
          <div class="chart-container">
            <h3>비교</h3>
            <GoodsCompare
                :selectedYear="selectedYear"
                :selectedMonth="selectedMonth"
                :goodsCode="selectedGoodsCode"
            />

            <h3>매출 차트</h3>
            <GoodsChart
                v-if="selectedGoodsCode"
                :goodsCode="selectedGoodsCode"
                @monthClick="handleMonthClick"
            />
          </div>
        </div>

        <!-- 오른쪽 분석 영역 -->
        <div class="analysis-section">
          <!-- 리뷰 요약 블록 -->
          <div class="analysis-block">
            <h3>리뷰 요약</h3>
            <div class="block-content">
<!--              <Review/>-->
            </div>
          </div>

          <!-- 추천 조합 블록 -->
          <div class="analysis-block">
            <h3>추천 조합</h3>
            <div class="block-content"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 버튼 -->
    <button
        class="search-trigger-btn"
        @click="toggleSearch"
        :class="{ 'shifted': isSearchOpen }"
    >
      {{ isSearchOpen ? '닫기' : '검색' }}
    </button>

    <!-- 검색 슬라이드 패널 -->
    <div class="search-panel" :class="{ 'open': isSearchOpen }">
      <div class="search-content">
        <h3>상품 검색</h3>
        <div class="search-form">
          <div class="form-group">
            <label>상품명</label>
            <input
                type="text"
                v-model="searchWord"
                placeholder="상품명을 입력하세요"
            >
          </div>

          <div class="form-group">
            <label>상위 카테고리</label>
            <select @change="handleTopCategoryChange" v-model="selectedTopCategory">
              <option value="">전체</option>
              <option
                  v-for="category in topCategories"
                  :key="category.topCategoryCode"
                  :value="category.topCategoryCode"
              >
                {{ category.topCategoryName }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>하위 카테고리</label>
            <select
                v-model="selectedSubCategory"
                @change="handleSubCategoryChange"
                :disabled="!selectedTopCategory"
            >
              <option value="">전체</option>
              <option
                  v-for="category in subCategories"
                  :key="category.subCategoryCode"
                  :value="category.subCategoryCode"
              >
                {{ category.subCategoryName }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>가격대</label>
            <div class="price-range">
              <input
                  type="number"
                  v-model="minPrice"
                  placeholder="최소"
                  min="0"
              >
              <span>~</span>
              <input
                  type="number"
                  v-model="maxPrice"
                  placeholder="최대"
                  min="0"
              >
            </div>
          </div>

          <button class="search-btn" @click="handleSearch">검색</button>
        </div>
      </div>

      <!-- 검색 결과 영역 -->
      <div class="search-results" v-if="searchResults.length > 0">
        <div
            v-for="item in searchResults"
            :key="item.goodsCode"
            class="result-item"
            :class="{ 'selected': selectedGoodsCode === item.goodsCode }"
            @click="handleGoodsSelect(item.goodsCode)"
        >
          <div class="item-info">
            <h4>{{ item.goodsName }}</h4>
            <p class="price">{{ item.goodsPrice.toLocaleString() }}원</p>
          </div>
        </div>

        <!-- 로딩 표시기 -->
        <div ref="loadingRef" class="loading-indicator" v-if="hasMore">
          <div v-if="loading" class="loading-spinner"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container-wrapper {
  position: relative;
  min-height: 100vh;
  background-color: var(--background-color);
}

.content-container {
  padding: 24px;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

/* 왼쪽 프로모션 목록 스타일 */
.promotion-list {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: calc(100vh - 72px);
}

.list-container {
  margin-top: 16px;
  height: calc(100% - 40px);
  background: #f8f9fa;
  border-radius: 8px;
}

/* 가운데 차트 섹션 스타일 */
.chart-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: calc(100vh - 72px);
}

.chart-container {
  height: calc(100% - 40px);
  background: #f8f9fa;
  border-radius: 4px;
  margin-top: 16px;
}

/* 오른쪽 분석 섹션 스타일 */
.analysis-section {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 24px;
  height: calc(100vh - 72px);
}

.analysis-block {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.block-content {
  margin-top: 16px;
  height: calc(100% - 40px);
  background: #f8f9fa;
  border-radius: 8px;
}

/* 검색 패널 스타일 */
.search-trigger-btn {
  position: fixed;
  left: 0;
  top: 20%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: #4CAF50;
  border: none;
  border-radius: 0 8px 8px 0;
  color: white;
  cursor: pointer;
  z-index: 1001;
  transition: left 0.3s ease;
}

.search-trigger-btn.shifted {
  left: 25%;
}

.search-panel {
  position: fixed;
  left: -25%;
  top: 0;
  width: 25%;
  height: 100%;
  padding-bottom: 60px; /* 하단 여백 추가 */
  background: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 999;
  overflow-y: auto;
}

.search-panel.open {
  left: 0;
}

.search-content {
  padding: 24px;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-range input {
  width: calc(50% - 10px);
}

.search-btn {
  margin-top: 20px;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-btn:hover {
  background: #45a049;
}

h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.form-group select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-group select option {
  padding: 8px;
}

/* 검색 결과 영역 스타일 */
.search-results {
  padding: 24px;
  margin-top: 24px;
  max-height: calc(100vh - 400px);
  overflow-y: auto;
}

.result-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
  cursor: pointer;
}

.result-item:hover {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.result-item.selected {
  border: 2px solid #4CAF50;
  background-color: #f1f8f1;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-info h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.price {
  margin: 0;
  font-weight: 500;
  color: #4CAF50;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>