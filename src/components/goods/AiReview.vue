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

// goodsCode prop이 변경될 때마다 데이터를 다시 가져오는 watch 추가
watch(() => props.goodsCode, (newGoodsCode) => {
  if (newGoodsCode) {
    fetchReviewSummary();
  }
}, { immediate: true }); // immediate: true로 설정하여 컴포넌트 마운트 시에도 실행

</script>

<template>
  <div class="review-summary">
    <div v-if="loading" class="loading">
      데이터를 불러오는 중...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else class="summary-content">
      <div class="product-info">
        <h4>{{ reviewData.goodsName }}</h4>
      </div>

      <div class="review-content" v-html="reviewData.geminiReview.replace(/\n/g, '<br>')">
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-summary {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-info {
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.product-info h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.review-content {
  font-size: 14px;
  line-height: 1.6;
  color: #444;
}

.review-content :deep(strong),
.review-content :deep(b) {
  color: #333;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>