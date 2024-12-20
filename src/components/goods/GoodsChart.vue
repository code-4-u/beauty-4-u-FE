<script setup>
import {
  Chart,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { ref, onMounted, watch, nextTick } from 'vue';
import { getFetch } from "@/stores/apiClient.js";

Chart.register(
    LineController,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
);

const props = defineProps({
  chartId: {
    type: String,
    default: 'line-chart'
  },
  goodsCode: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: '매출액'
  }
});

const emit = defineEmits(['monthClick']);

const yearOptions = [
  { value: '2024', label: '2024년' },
  { value: '2023', label: '2023년' },
  { value: '2022', label: '2022년' }
];

const chart = ref(null);
const currentYearData = ref([]);
const previousYearData = ref([]);
const year = ref('2024');
const loading = ref(false);
const error = ref(null);

const formatNumber = (value) => {
  return new Intl.NumberFormat('ko-KR').format(value);
};

const processMonthlySales = (apiData) => {
  const monthlySales = Array(12).fill(0);
  apiData.forEach(item => {
    if (item.sales != null) {
      monthlySales[item.month] = item.sales;
    }
  });
  return monthlySales;
};

const createChart = async () => {
  await nextTick();

  const canvas = document.getElementById(props.chartId);
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Canvas context not found');
    return;
  }

  // 그라데이션 설정
  const currentYearGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  currentYearGradient.addColorStop(0, 'rgba(53, 162, 235, 0.3)');
  currentYearGradient.addColorStop(1, 'rgba(53, 162, 235, 0)');

  const previousYearGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  previousYearGradient.addColorStop(0, 'rgba(255, 99, 132, 0.3)');
  previousYearGradient.addColorStop(1, 'rgba(255, 99, 132, 0)');

  if (chart.value) {
    chart.value.destroy();
  }

  chart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
      datasets: [
        {
          label: `${year.value}년 ${props.label}`,
          data: currentYearData.value,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: currentYearGradient,
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointBackgroundColor: 'white',
          pointBorderColor: 'rgb(53, 162, 235)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: `${Number(year.value) - 1}년 ${props.label}`,
          data: previousYearData.value,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: previousYearGradient,
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointBackgroundColor: 'white',
          pointBorderColor: 'rgb(255, 99, 132)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        tooltip: {
          backgroundColor: 'white',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#ddd',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${formatNumber(context.raw)}원`;
            }
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: "'Noto Sans KR', sans-serif"
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatNumber(value) + '원'
          }
        }
      },
      onClick: (event, elements) => {
        if (elements && elements.length > 0) {
          const clickedElement = elements[0];
          emit('monthClick', {
            year: year.value,
            month: clickedElement.index
          });
        }
      }
    }
  });
};

const fetchData = async () => {
  if (!props.goodsCode || !year.value) return;

  loading.value = true;
  error.value = null;

  try {
    const [currentYearRes, previousYearRes] = await Promise.all([
      getFetch(`/goods/sales/list/${props.goodsCode}?year=${year.value}`),
      getFetch(`/goods/sales/list/${props.goodsCode}?year=${Number(year.value) - 1}`)
    ]);

    if (currentYearRes?.data?.data) {
      currentYearData.value = processMonthlySales(currentYearRes.data.data);
    }
    if (previousYearRes?.data?.data) {
      previousYearData.value = processMonthlySales(previousYearRes.data.data);
    }

    await createChart();
  } catch (err) {
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

watch(() => props.goodsCode, fetchData);
watch(() => year.value, fetchData);

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="chart-wrapper">
    <div class="filter-group">
      <select v-model="year" class="year-select">
        <option v-for="option in yearOptions"
                :key="option.value"
                :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <div class="chart-container">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <canvas :id="chartId"></canvas>
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: fit-content;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.filter-group {
  margin-bottom: 16px;
  text-align: right;
}

.year-select {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #4a5568;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.year-select:hover {
  border-color: #cbd5e0;
}

.year-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.chart-container {
  position: relative;
  width: 400px;
  height: 300px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #e53e3e;
  text-align: center;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 4px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .chart-container {
    width: 300px;
    height: 250px;
  }
}
</style>