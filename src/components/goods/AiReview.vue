<script setup>
import { ref, watch } from 'vue';
import { getFetch } from "@/stores/apiClient.js";

const props = defineProps({
  goodsCode: {
    type: String,
    required: true
  }
});

const reviewData = ref({
  goodsCode: '',
  goodsName: '',
  geminiReview: ''
});

const loading = ref(false);
const error = ref(null);

const fetchReviewSummary = async () => {
  if (!props.goodsCode) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await getFetch(`/review/${props.goodsCode}`);
    if (response?.data?.data) {
      reviewData.value = response.data.data;
    }
  } catch (err) {
    error.value = '리뷰 데이터를 불러오는 중 오류가 발생했습니다.';
    console.error('리뷰 요약 조회 오류:', err);
  } finally {
    loading.value = false;
  }
};

watch(() => props.goodsCode, (newGoodsCode) => {
  if (newGoodsCode) {
    fetchReviewSummary();
  }
}, { immediate: true });
</script>

<template>
  <div class="review-summary">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>리뷰 분석 중...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <svg xmlns="http://www.w3.org/2000/svg" class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      {{ error }}
    </div>

    <div v-else class="summary-content">
      <div class="product-info">
        <h4>{{ reviewData.goodsName }}</h4>
      </div>

      <div class="divider"></div>

      <div class="review-content" v-html="reviewData.geminiReview.replace(/\n/g, '<br>')">
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-summary {
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.review-summary:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.product-info {
  margin-bottom: 12px;
}

.product-info h4 {
  margin: 0;
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  display: inline-block;
  padding: 6px 12px;
  background: rgba(74, 157, 79, 0.1);
  border-radius: 6px;
}

.divider {
  height: 1px;
  background: linear-gradient(to right, #e2e8f0 0%, #edf2f7 100%);
  margin: 12px 0;
}

.review-content {
  font-size: 15px;
  line-height: 1.7;
  color: #4a5568;
  letter-spacing: -0.01em;
}

.review-content :deep(strong),
.review-content :deep(b) {
  color: #2d3748;
  font-weight: 600;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #718096;
  font-size: 14px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #edf2f7;
  border-top: 3px solid #4299e1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #e53e3e;
  font-size: 14px;
  background: #fff5f5;
  border-radius: 8px;
}

.error-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .review-summary {
    padding: 20px;
  }

  .product-info h4 {
    font-size: 16px;
  }

  .review-content {
    font-size: 14px;
  }
}
</style>