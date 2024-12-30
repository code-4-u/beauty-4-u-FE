<script setup>
import { ref, watch } from 'vue';
import { getFetch } from "@/stores/apiClient.js";

const props = defineProps({
  selectedYear: {
    type: Number,
    required: true
  },
  selectedMonth: {
    type: Number,
    required: true
  },
  goodsCode: {
    type: String,
    required: true
  }
});

const compareData = ref({});
const loading = ref(false);
const error = ref(null);

const fetchCompareData = async () => {
  if (!props.selectedYear || !props.selectedMonth || !props.goodsCode) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const queryParams = new URLSearchParams({
      year: props.selectedYear,
      month: props.selectedMonth
    });

    const response = await getFetch(`/goods/sales/${props.goodsCode}?${queryParams.toString()}`);

    if (response?.data?.data) {
      compareData.value = response.data.data;
    }
  } catch (error) {
    error.value = '데이터 조회 중 오류가 발생했습니다.';
    console.error('비교 데이터 조회 오류:', error);
  } finally {
    loading.value = false;
  }
};

watch(
    [() => props.selectedYear, () => props.selectedMonth, () => props.goodsCode],
    async (newValues, oldValues) => {
      if (newValues.every(value => value != null)) {
        await fetchCompareData();
      }
    },
    { immediate: true }
);

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(value);
};
</script>

<template>
  <div class="compare-container">
    <div v-if="loading">데이터를 불러오는 중...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="compareData">
      <div class="comparison-section">
        <!-- 2021년 데이터 -->
        <div class="year-box">
          <h4>{{ selectedYear - 1 }}년 {{ selectedMonth }}월</h4>
          <div class="amount-display">
            {{ formatCurrency(compareData.lastYearMonthlySales) }}
          </div>
        </div>

        <!-- 퍼센트 변화 표시 -->
        <div class="percent-change-box">
          <div class="percent-change"
               :class="{ 'increase': compareData.percent > 0, 'decrease': compareData.percent < 0 }">
            {{ compareData.percent }}%
          </div>
        </div>

        <!-- 2022년 데이터 -->
        <div class="year-box">
          <h4>{{ selectedYear }}년 {{ selectedMonth }}월</h4>
          <div class="amount-display">
            {{ formatCurrency(compareData.currentYearMonthlySales) }}
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-data">
      선택된 기간의 데이터가 없습니다.
    </div>
  </div>
</template>

<style scoped>
.compare-container {
  width: 100%;
  max-width: 700px;
  padding: 16px;
  box-sizing: border-box;
  margin: 0 auto;
}

.comparison-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.year-box {
  background-color: #f8f9fa;
  padding: 12px 14px;
  border-radius: 8px;
  flex: 1;
  text-align: center;
  min-width: 130px;
  max-width: 180px;
}

.year-box h4 {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 13px;
  font-weight: 500;
}

.amount-display {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.percent-change-box {
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.percent-change {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 20px;
  white-space: nowrap;
}

.increase {
  color: #2e7d32;
  background-color: #e8f5e9;
}

.decrease {
  color: #c62828;
  background-color: #fde8e8;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}

@media (max-width: 768px) {
  .comparison-section {
    flex-direction: column;
  }

  .year-box {
    width: 100%;
    max-width: none;
  }

  .percent-change-box {
    padding: 10px 0;
  }
}
</style>