<script setup>
// script 부분에 상태 변수 추가
import {onMounted, onUnmounted, ref, watch} from "vue";
import {getFetch} from "@/stores/apiClient.js";
import PromotionList from "@/components/goods/PromotionList.vue";
import GoodsChart from "@/components/goods/GoodsChart.vue";
import GoodsCompare from "@/components/goods/GoodsCompare.vue";
import {useRoute, useRouter} from "vue-router";
import CaptureModal from "@/components/capture/CaptureModal.vue";
import AiReview from "@/components/goods/AiReview.vue";
import AprioriTable from "@/components/goods/AprioriTable.vue";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

// 캡처 모달
const captureModal = ref(null);

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
const route = useRoute();
const router = useRouter();
const suggestions = ref([]);

// 카테고리 관련 상태 추가
const selectedTopCategory = ref('');
const selectedSubCategory = ref('');
const topCategories = ref([]);
const subCategories = ref([]);
const isSearchOpen = ref(false);

// 선택된 상품 코드 관리
const selectedGoodsCode = ref('');

const showSearchFilters = ref(false);

const handleSearchInput = async () => {
  if (!searchWord.value) {
    suggestions.value = [];
    return;
  }
  try {
    const response = await getFetch(`/goods/search/${searchWord.value}`);
    suggestions.value = response.data.data;
  } catch (error) {
    console.log('검색어 제안 조회 중 오류 발생:', error);
    suggestions.value = [];
  }
};

// 검색어 하이라이트 처리 함수
const highlightText = (text) => {
  if (!searchWord.value) return { before: text, match: '', after: '' };
  const searchTerm = searchWord.value.toLowerCase();
  const index = text.toLowerCase().indexOf(searchTerm);
  if (index === -1) return { before: text, match: '', after: '' };

  const before = text.slice(0, index);
  const match = text.slice(index, index + searchTerm.length);
  const after = text.slice(index + searchTerm.length);

  return {
    before,
    match,
    after
  };
};

// 검색어 제안 선택 처리 함수
const selectSuggestion = (item) => {
  searchWord.value = item.goodsName;
  suggestions.value = [];
  handleSearch();
};

// 상품 선택 핸들러 추가
const handleGoodsSelect = (goodsCode) => {
  selectedGoodsCode.value = goodsCode;

  router.replace({
    query: {goodsCode}
  }).catch(err => {
    console.error("url 업데이트 중 오류: ", err);
  });
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

  const goodsCode = route.query.goodsCode;

  if (goodsCode) {
    // 검색 패널 열기
    isSearchOpen.value = true;
    // 해당 상품 코드로 검색 실행
    selectedGoodsCode.value = goodsCode;

    // 해당 상품의 정보를 가져와서 검색 결과에 추가
    try {
      const response = await getFetch(`/goods/${goodsCode}`);
      if (response?.data?.data) {
        searchResults.value = [response.data.data];
      }
    } catch (error) {
      console.error('상품 정보 로딩 중 오류:', error);
    }
  }
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

const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);

// 타입 변환
const handleMonthClick = ({year, month}) => {
  selectedYear.value = Number(year);  // String -> Number
  selectedMonth.value = Number(month); // String -> Number
};

/* 화면 캡처 함수 */
const handleCapture = async () => {
  if (isSearchOpen.value) {
    isSearchOpen.value = false;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
//   캡처 모달 호출
  captureModal.value.captureScreen();
}
</script>

<template>
  <div class="container-wrapper">
    <div class="content-container">
      <div class="layout-grid">
        <!-- 왼쪽 프로모션 목록 -->
        <div class="promotion-list">
          <h3 class="promotion-header">
            <template v-if="selectedGoodsCode && searchResults.length">
              <div class="header-content">
     <span class="selected-goods">
       {{ searchResults.find(item => item.goodsCode === selectedGoodsCode)?.goodsName }}
     </span>
                <div class="promotion-title">적용된 프로모션 목록</div>
              </div>
            </template>
            <template v-else>
              <div class="promotion-title">적용된 프로모션 목록</div>
            </template>
          </h3>
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
          <div class="comparison-container">
            <h3>비교</h3>
            <GoodsCompare
                :selectedYear="selectedYear"
                :selectedMonth="selectedMonth"
                :goodsCode="selectedGoodsCode"
            />
          </div>
          <div class="sales-container">
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
              <AiReview
                  v-if="selectedGoodsCode"
                  :goods-code="selectedGoodsCode"/>
            </div>
          </div>

          <!-- 추천 조합 블록 -->
          <div class="analysis-block">
            <h3>추천 조합</h3>
            <div class="block-content">
              <AprioriTable
                  v-if="selectedGoodsCode"
                  :goods-code="selectedGoodsCode"/>
            </div>
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

    <!-- 캡처 버튼 -->
    <button
        class="capture-btn"
        @click="handleCapture"
        :class="{ 'shifted': isSearchOpen }"
    >
      <span>캡처</span>
    </button>

    <!--    캡처 모달창 -->
    <CaptureModal ref="captureModal" prefix="goods-analysis"/>

    <!-- 검색 슬라이드 패널 -->
    <div class="search-panel" :class="{ 'open': isSearchOpen }">
      <div class="search-content">
        <h3>상품 검색</h3>

        <!-- 필터 토글 버튼 추가 -->
        <button @click="showSearchFilters = !showSearchFilters" class="filter-toggle-btn">
          <font-awesome-icon :icon="['fas', 'fa-up-down']"></font-awesome-icon>
          필터
        </button>

        <transition name="slide-fade">
          <div v-show="showSearchFilters" class="search-form">
            <div class="search-form">
              <div class="form-group">
                <label>상품명</label>
                <div class="dropdown-container">
                  <input
                      type="text"
                      v-model="searchWord"
                      @input="handleSearchInput"
                      placeholder="상품명을 입력하세요"
                  >
                  <!-- 연관검색어 드롭다운 -->
                  <div v-if="suggestions.length > 0" class="dropdown-content">
                    <div
                        v-for="item in suggestions"
                        :key="item.goodsCode"
                        @click="selectSuggestion(item)"
                        class="dropdown-item"
                    >
                      {{ highlightText(item.goodsName).before }}
                      <span class="highlight">{{ highlightText(item.goodsName).match }}</span>
                      {{ highlightText(item.goodsName).after }}
                    </div>
                  </div>
                </div>
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
        </transition>
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
  height: calc(100vh);
}

.list-container {
  margin-top: 16px;
  height: calc(100% - 40px);
  background: #f8f9fa;
  border-radius: 8px;
}

.chart-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: calc(100vh);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comparison-container {
  flex: 0 0 30%;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
}

.sales-container {
  flex: 0 0 70%;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
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
  grid-template-rows: auto minmax(0, 1fr);
  gap: 24px;
  height: calc(100vh);
  overflow: hidden;
}

.analysis-block {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 첫 번째 analysis-block (리뷰 요약)에만 적용 */
.analysis-block:first-child {
  height: fit-content;
}

/* 두 번째 analysis-block (추천 조합)에만 적용 */
.analysis-block:last-child {
  height: 100%;
}

.block-content {
  margin-top: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  overflow-y: auto;
}

/* 첫 번째 블록의 content에만 적용 */
.analysis-block:first-child .block-content {
  height: fit-content;
}

/* 두 번째 블록의 content에만 적용 */
.analysis-block:last-child .block-content {
  height: calc(100% - 40px);
}

/* 검색 패널 관련 스타일 */
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
  letter-spacing: 2px;
  font-size: 14px;
  transition: left 0.3s ease;
}

.capture-btn {
  position: fixed;
  left: 0;
  top: 28%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: #4CAF50;
  border: none;
  border-radius: 0 8px 8px 0;
  color: white;
  cursor: pointer;
  z-index: 1001;
  letter-spacing: 2px;
  font-size: 14px;
  transition: left 0.3s ease;
}

.search-trigger-btn.shifted,
.capture-btn.shifted {
  left: 25%;
}

.search-trigger-btn:hover,
.capture-btn:hover {
  background: #45a049;
}

.search-panel {
  position: fixed;
  left: -25%;
  top: 60px;  /* 60px 아래로 이동 */
  width: 25%;
  height: 100%;
  padding-bottom: 60px;
  background: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 999;
  -ms-overflow-style: none;  /* IE, Edge */
  scrollbar-width: none;     /* Firefox */
}

.search-panel::-webkit-scrollbar {
  display: none;  /* Chrome, Safari, Opera */
}

.filter-toggle-btn {
  width: 23%; /* 버튼 너비 100%로 */
  display: flex;
  align-items: center;
  justify-content: center; /* 중앙 정렬 */
  gap: 8px;
  padding: 8px 16px;
  margin: 0 0 12px 0; /* 마진 조정 */
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.search-content {
  padding: 24px 24px 100px 24px; /* 하단 패딩 추가 */
}

.search-content h3 {
  margin-bottom: 20px; /* 타이틀과 필터 버튼 사이 간격 */
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.promotion-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-goods {
  background-color: #e6f3ff;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
}

.promotion-title {
  font-size: 16px;
  color: #666;
  padding-left: 12px;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.dropdown-container {
  position: relative;
  width: 100%;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.highlight {
  font-weight: bold;
  color: #4CAF50;
}

/* 스크롤바 스타일링 */
.dropdown-content::-webkit-scrollbar {
  width: 6px;
}

.dropdown-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dropdown-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.dropdown-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>