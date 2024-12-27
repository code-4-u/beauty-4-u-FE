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

  // Enhanced gradients
  const currentYearGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  currentYearGradient.addColorStop(0, 'rgba(74, 144, 226, 0.2)');
  currentYearGradient.addColorStop(1, 'rgba(74, 144, 226, 0.0)');

  const previousYearGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  previousYearGradient.addColorStop(0, 'rgba(252, 92, 125, 0.2)');
  previousYearGradient.addColorStop(1, 'rgba(252, 92, 125, 0.0)');

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
          borderColor: 'rgb(74, 144, 226)',
          backgroundColor: currentYearGradient,
          tension: 0.35,
          fill: true,
          borderWidth: 2.5,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: 'rgb(74, 144, 226)',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: 'rgb(74, 144, 226)',
          pointHoverBorderColor: '#FFFFFF'
        },
        {
          label: `${Number(year.value) - 1}년 ${props.label}`,
          data: previousYearData.value,
          borderColor: 'rgb(252, 92, 125)',
          backgroundColor: previousYearGradient,
          tension: 0.35,
          fill: true,
          borderWidth: 2.5,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: 'rgb(252, 92, 125)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: 'rgb(252, 92, 125)',
          pointHoverBorderColor: '#FFFFFF'
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1a202c',
          bodyColor: '#4a5568',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: { x: 12, y: 8 },
          cornerRadius: 8,
          displayColors: true,
          titleFont: {
            size: 13,
            weight: '600',
            family: "'Noto Sans KR', sans-serif"
          },
          bodyFont: {
            size: 12,
            family: "'Noto Sans KR', sans-serif"
          },
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
              size: 13,
              family: "'Noto Sans KR', sans-serif"
            },
            color: '#4a5568'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#f7fafc',
            drawBorder: false
          },
          ticks: {
            padding: 8,
            color: '#718096',
            font: {
              size: 11,
              family: "'Noto Sans KR', sans-serif"
            },
            callback: (value) => formatNumber(value) + '원'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#718096',
            font: {
              size: 11,
              family: "'Noto Sans KR', sans-serif"
            }
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
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.filter-group {
  margin-bottom: 20px;
  text-align: right;
}

.year-select {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #4a5568;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.year-select:hover {
  border-color: #a0aec0;
  background-color: #f7fafc;
}

.year-select:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
}

.chart-container {
  position: relative;
  width: 400px;
  height: 280px;
  margin: 0 auto;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  border-radius: 12px;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #edf2f7;
  border-top: 3px solid #4a90e2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #e53e3e;
  text-align: center;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .chart-container {
    width: 300px;
    height: 240px;
  }

  .chart-wrapper {
    padding: 16px;
  }
}
</style>