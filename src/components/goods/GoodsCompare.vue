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
      <div class="comparison-data">
        <div class="stats-container">
          <div class="stat-box">
            <h4>{{ selectedYear }}년 {{ selectedMonth }}월</h4>
            <div class="amount-display">
              {{ formatCurrency(compareData.currentYearMonthlySales) }}
              <i v-if="compareData.currentYearMonthlySales > compareData.lastYearMonthlySales"
                 class="fas fa-arrow-up trend-arrow up"></i>
            </div>
          </div>

          <div class="comparison-arrows">
            <div class="percent-change"
                 :class="{ 'increase': compareData.percent > 0, 'decrease': compareData.percent < 0 }">
              {{ compareData.percent }}%
            </div>
          </div>

          <div class="stat-box">
            <h4>{{ selectedYear - 1 }}년 {{ selectedMonth }}월</h4>
            <div class="amount-display">
              {{ formatCurrency(compareData.lastYearMonthlySales) }}
              <i v-if="compareData.lastYearMonthlySales < compareData.currentYearMonthlySales"
                 class="fas fa-arrow-down trend-arrow down"></i>
            </div>
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
.comparison-data {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stats-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.stat-box {
  flex: 1;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.stat-box h4 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.amount-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.trend-arrow {
  font-size: 16px;
}

.trend-arrow.up {
  color: #dc3545;  /* 빨간색 */
}

.trend-arrow.down {
  color: #0d6efd;  /* 파란색 */
}

.comparison-arrows {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.percent-change {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 20px;
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
</style>