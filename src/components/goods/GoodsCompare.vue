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
          <div class="stat-box current-year">
            <h4>{{ selectedYear }}년 {{ selectedMonth }}월</h4>
            <div class="amount">{{ formatCurrency(compareData.currentYearMonthlySales) }}</div>
          </div>

          <div class="comparison-arrows">
            <div class="percent-change" :class="compareData.percent > 0 ? 'increase' : 'decrease'">
              {{ compareData.percent }}%
            </div>
          </div>

          <div class="stat-box previous-year">
            <h4>{{ selectedYear - 1 }}년 {{ selectedMonth }}월</h4>
            <div class="amount">{{ formatCurrency(compareData.lastYearMonthlySales) }}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-data">
      선택된 기간의 데이터가 없습니다.
    </div>
  </div>
</template>

<style>
.comparison-data {
  padding: 20px;
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
}

.amount {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.comparison-arrows {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.percent-change {
  font-size: 18px;
  font-weight: bold;
  padding: 8px 16px;
  border-radius: 20px;
}

.increase {
  color: #28a745;
  background-color: #e8f5e9;
}

.decrease {
  color: #dc3545;
  background-color: #fde8e8;
}
</style>