<script setup>
import { Chart, LineController, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { ref, onMounted, watch, defineProps } from 'vue';
import {getFetch} from "@/stores/apiClient.js";

Chart.register(LineController, CategoryScale, LinearScale, PointElement, LineElement);

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
  },
  borderColor: {
    type: String,
    default: 'rgb(75, 192, 192)'
  },
  tension: {
    type: Number,
    default: 0.4
  }
});

const emit = defineEmits(['monthClick']);



// 연도 옵션
const yearOptions = [
  { value: '2024', label: '2024년' },
  { value: '2023', label: '2023년' },
  { value: '2022', label: '2022년' }
];

const chart = ref(null);
const chartLabels = ref(['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']); // 월별 레이블
const chartData = ref([]);
const year = ref(2024);

onMounted(() => {
  fetchData()

});

const loading = ref(false); // 로딩 상태
const error = ref(null); // 에러 메시지

watch(() => props.goodsCode, async (newGoodsCode) => {
  if (newGoodsCode) {
    loading.value = true; // 로딩 시작
    error.value = null; // 에러 초기화
    try {
      await fetchData();
      createChart();
    } catch (err) {
      error.value = '데이터를 불러오는 중 오류가 발생했습니다.'; // 에러 메시지 설정
      console.error(err);
    } finally {
      loading.value = false; // 로딩 종료
    }
  }
});

watch(() => year.value, async () => {
  loading.value = true;
  error.value = null;
  try {
    await fetchData();
    createChart();
  } catch (err) {
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.';
    console.error(err);
  } finally {
    loading.value = false;
  }
});

const fetchData = async () => {
  try {
    const response = await getFetch(`/goods/sales/list/${props.goodsCode}?year=${year.value}`); // API 호출, /your-api-endpoint/{goodsCode} 부분을 실제 API 엔드포인트로 바꿔야 합니다.
    if (response?.data) {
      const apiData = response.data.data;
      // 데이터 가공 (월별 매출액 데이터로 변환)
      console.log(apiData)
      const monthlySales = processMonthlySales(apiData);
      chartData.value = monthlySales;
    }
  } catch (error) {
    console.error('API 호출 오류:', error);
  }
};

const processMonthlySales = (apiData) => {
  // API 데이터를 월별 매출액 데이터로 가공하는 로직
  // 예:
  const monthlySales = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 1월부터 12월까지 매출액을 0으로 초기화

  apiData.forEach(item => {
    const month = item.month
    if (item.sales != null){
      monthlySales[month] += item.sales; // 해당 월의 매출액 누적
    }
  });

  return monthlySales;
};

const handleChartClick = (event) => {
  const points = chart.value.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);

  if (points.length) {
    const firstPoint = points[0];
    const month = firstPoint.index;
    emit('monthClick', { year: year.value, month });
  }
};


const createChart = () => {
  const ctx = document.getElementById(props.chartId).getContext('2d');
  if (chart.value) {
    chart.value.destroy(); // 기존 차트 제거
  }
  chart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels.value,
      datasets: [{
        label: props.label,
        data: chartData.value,
        borderColor: props.borderColor,
        tension: props.tension,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `${props.goodsCode} 월별 매출액`,
          font: {
            size: 20
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      },
      onClick: (event, elements) => {
        if (elements && elements.length > 0) {
          const clickedElement = elements[0];
          const month = clickedElement.index;
          emit('monthClick', { year: year.value, month });
        }
      }
    }
  });
};
</script>

<template>
  <div class="filter-group">
    <select v-model="year">
      <option value="">연도 선택</option>
      <option v-for="option in yearOptions"
              :key="option.value"
              :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
  <div class="chart-container">
    <canvas :id="chartId"></canvas>
  </div>
</template>

<style scoped>
.chart-container {
  /* width: 800px;  원래 크기 */
  /* height: 400px; 원래 크기 */
  width: 400px; /* 원래 크기의 절반 */
  height: 200px; /* 원래 크기의 절반 */
  margin: 0 auto;
}
</style>