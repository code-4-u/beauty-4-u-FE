<script setup>
import {ref, computed, watch} from 'vue';
import {getFetch, postFetch} from "@/stores/apiClient.js";

const props = defineProps({
  goodsCode: {
    type: String,
    required: true
  }
});

const recommendations = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 5;

// 검색 결과 필터링
const filteredRecommendations = computed(() => {
  return recommendations.value.filter(item =>
      item.associatedGoodsName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 페이지네이션된 데이터
const paginatedRecommendations = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredRecommendations.value.slice(startIndex, endIndex);
});

// 총 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(filteredRecommendations.value.length / itemsPerPage);
});

const fetchRecommendations = async () => {
  if (!props.goodsCode) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await postFetch('/apriori/analyze',
        {
          goodsCode: props.goodsCode,
          analysisKind: "ASSOCIATION",
          analysisTitle: "연관 상품 분석",
          analysisDescription: "현재 상품과 함께 구매되는 연관 상품 분석"
        }
    );

    if (response?.data?.data) {
      recommendations.value = response.data.data;
    }
  } catch (err) {
    error.value = '연관 상품을 불러오는 중 오류가 발생했습니다.';
    console.error('연관 상품 조회 오류:', err);
  } finally {
    loading.value = false;
  }
};
// goodsCode prop이 변경될 때마다 데이터를 다시 가져오는 watch 추가
watch(() => props.goodsCode, (newGoodsCode) => {
  if (newGoodsCode) {
    // 페이지와 검색어 초기화
    currentPage.value = 1;
    searchQuery.value = '';
    // 새로운 데이터 가져오기
    fetchRecommendations();
  }
}, {immediate: true});

const formatPercentage = (value) => {
  if (value <= 0.01) {
    return (value * 10000).toFixed(2);
  }
  return (value * 100).toFixed(1) + '%';
};

const handleSearch = () => {
  currentPage.value = 1;  // 검색 시 첫 페이지로 이동
};

const changePage = (page) => {
  currentPage.value = page;
};
</script>

<template>
  <div class="recommendations">
    <div v-if="loading" class="loading">
      데이터를 불러오는 중...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="recommendations.length" class="recommendations-content">
      <!-- 검색 영역 -->
      <div class="search-container">
        <input
            type="text"
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="상품명으로 검색..."
            class="search-input"
        >
      </div>

      <!-- 상품 목록 -->
      <div class="recommendations-grid">
        <div v-for="item in paginatedRecommendations"
             :key="item.associatedGoodsCode"
             class="recommendation-card">
          <div class="product-info">
            <h4>{{ item.associatedGoodsName }}</h4>
            <div class="metrics">
              <div class="metric">
                <span class="label">연관성</span>
                <span class="value">{{ formatPercentage(item.support) }}</span>
              </div>
              <div class="metric">
                <span class="label">신뢰도</span>
                <span class="value">{{ formatPercentage(item.confidence) }}</span>
              </div>
              <div class="metric">
                <span class="label">향상도</span>
                <span class="value">{{ item.lift.toFixed(2) }}</span>
              </div>
            </div>
            <div class="score-bar">
              <div class="bar" :style="{ width: `${item.totalScore * 100}%` }"></div>
              <span class="score-label">총점: {{ (item.totalScore * 100).toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="page-button"
        >
          이전
        </button>

        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>

        <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="page-button"
        >
          다음
        </button>
      </div>
    </div>

    <div v-else class="no-data">
      추천 상품이 없습니다.
    </div>
  </div>
</template>

<style scoped>
.recommendations {
  width: 100%;
}

.recommendations-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-container {
  position: sticky;
  top: 0;
  background: white;
  padding: 16px 0;
  margin-bottom: 16px;
  z-index: 10;
}

.search-input {
  width: 100%;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #4299e1;
}

.recommendations-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-info h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric .label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.metric .value {
  font-size: 14px;
  font-weight: 600;
  color: #2c5282;
}

.score-bar {
  position: relative;
  height: 24px;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
}

.bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(to right, #4299e1, #2b6cb0);
  transition: width 0.3s ease;
}

.score-label {
  position: absolute;
  width: 100%;
  text-align: center;
  line-height: 24px;
  font-size: 12px;
  font-weight: 500;
  mix-blend-mode: difference;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.page-button {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  color: #4a5568;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-button:hover:not(:disabled) {
  background: #f7fafc;
  border-color: #4299e1;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #4a5568;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>