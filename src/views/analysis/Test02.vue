<script setup>
import {computed, onMounted, onUnmounted, reactive, ref} from 'vue';
import {Bar, Doughnut} from 'vue-chartjs';
import {ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip} from 'chart.js';

import axios from "axios";

/* chart.js 등록 */
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend);

/* 통신으로 데이터를 받아오는 동안 그래프 미표현 변수 */
/* 고객 특성 분석 그래프 */
const isAnalysisCustomerLoading = ref(true);

/* 연령대 별 구매 횟수 그래프 */
const isAnalysisPurchasesByAge = ref(true);

/* 고객 연령별 특성 분석 변수 */
const analysisCustomer = reactive({
  totalAge: Number,
  totalTenAge: Number,
  tenMale: Number,
  tenFemale: Number,
  totalTwentyAge: Number,
  twentyMale: Number,
  twentyFemale: Number,
  totalThirtyAge: Number,
  thirtyMale: Number,
  thirtyFemale: Number,
  totalFortyAge: Number,
  fortyMale: Number,
  fortyFemale: Number,
  totalFiftyAge: Number,
  fiftyMale: Number,
  fiftyFeMale: Number,
  totalSixtyupAge: Number,
  sixtyupMale: Number,
  sixtyupFemale: Number,
  customerTenMaleRadio: Number,
  customerTenFemaleRadio: Number,
  customerTwentyMaleRadio: Number,
  customerTwentyFemaleRadio: Number,
  customerThirtyMaleRadio: Number,
  customerThirtyFemaleRadio: Number,
  customerFortyMaleRadio: Number,
  customerFortyFemaleRadio: Number,
  customerFiftyMaleRadio: Number,
  customerFiftyFemaleRadio: Number,
  customerSixtyupMaleRadio: Number,
  customerSixtyupFemaleRadio: Number
});

const analysisPurchasesByAge = reactive({
  ten: Number,
  twenty: Number,
  thirty: Number,
  forty: Number,
  fifty: Number,
  sixtyup: Number,
  totalAge: Number,
  tenRadio: Number,
  twentyRadio: Number,
  thirtyRadio: Number,
  fortyRadio: Number,
  fiftyRadio: Number,
  sixtyupRadio: Number
});

/* 연령대 별 구매 비율
* 1. 데이터 설정
* */
const purchasesByAge = computed(() => [
    analysisPurchasesByAge.tenRadio,
    analysisPurchasesByAge.twentyRadio,
    analysisPurchasesByAge.thirtyRadio,
    analysisPurchasesByAge.fortyRadio,
    analysisPurchasesByAge.fiftyRadio,
    analysisPurchasesByAge.sixtyupRadio
]);

const purchasesByAgeChartData = computed (() => ({
  labels: ['10대', '20대', '30대', '40대', '50대', '60대+'],
  datasets: [{
    data: purchasesByAge.value,
    backgroundColor: [
      '#97E3D5',  // indigo
      '#E8C1A0',  // amber
      '#F47560',  // pink
      '#F1E15B',  // green
      '#E8A838',  // teal
      '#84ADFF'   // violet
    ],
    hoverBackgroundColor: [
      '#5CC7B1',  // 더 진한 민트
      '#D19167',  // 더 진한 베이지
      '#D94F3A',  // 더 진한 코랄
      '#D6C632',  // 더 진한 노랑
      '#CB8616',  // 더 진한 주황
      '#4B84E8'   // 더 진한 파랑
    ],
    borderColor: '#ffffff',
    borderWidth: 2,
    hoverBorderColor: '#fff',  // 호버시 테두리 색상
    hoverBorderWidth: 3
  }]
}));

/* 원형 그래프 설정 */
const purchasesByAgeChartOption = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'right',
    },
    tooltip: {
      enabled: true
    }
  },
  layout: {
    padding: {
      tip: 10,
      bottom: 10
    }
  },
  animation: {
    duration: 1500,
    animateRotate: true,    // 회전 애니메이션
    animateScale: true,     // 크기 애니메이션
    easing: 'easeOutQuart'
  },
  cutout: '65%',
  onClick: (event, elements) => {
    if (elements.length > 0) {
      const element = elements[0];
      const dataset = event.chart.data.datasets[element.datasetIndex];

      // 원래 색상 배열 저장 (처음 클릭할 때만)
      if (!dataset.originalBackgroundColor) {
        dataset.originalBackgroundColor = [...dataset.backgroundColor];
      }

      // 모든 색상을 원래대로 복원
      dataset.backgroundColor = [...dataset.originalBackgroundColor];

      // 클릭된 섹션의 색상만 어둡게 변경
      const clickedColor = dataset.backgroundColor[element.index];
      // Color 를 RGB 로 변환하고 더 어둡게 만듦
       // 30% 더 어둡게
      dataset.backgroundColor[element.index] = adjustBrightness(clickedColor, -0.4);

      // 차트 업데이트
      event.chart.update();
    }
  }
}));

// 색상을 더 어둡게 만드는 헬퍼 함수
function adjustBrightness(color, factor) {
  // HEX 색상인 경우 RGB로 변환
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // 각 색상 채널을 어둡게
    const newR = Math.max(0, Math.round(r * (1 + factor)));
    const newG = Math.max(0, Math.round(g * (1 + factor)));
    const newB = Math.max(0, Math.round(b * (1 + factor)));

    // 다시 HEX 색상으로 변환
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  // RGB 색상인 경우
  if (color.startsWith('rgb')) {
    const [r, g, b] = color.match(/\d+/g).map(Number);

    const newR = Math.max(0, Math.round(r * (1 + factor)));
    const newG = Math.max(0, Math.round(g * (1 + factor)));
    const newB = Math.max(0, Math.round(b * (1 + factor)));

    return `rgb(${newR}, ${newG}, ${newB})`;
  }

  return color; // 다른 형식의 색상은 그대로 반환
}

/*
  고객 특성 분석 그래프 설정
  1. 데이터 설정
  2. 옵션 설정
*/
/* 1. 데이터 설정 */
const maleData = computed(() => [
   analysisCustomer.customerTenMaleRadio,
   analysisCustomer.customerTwentyMaleRadio,
   analysisCustomer.customerThirtyMaleRadio,
   analysisCustomer.customerFortyMaleRadio,
   analysisCustomer.customerFiftyMaleRadio,
   analysisCustomer.customerSixtyupMaleRadio
])

const femaleData = computed(() => [
  analysisCustomer.customerTenFemaleRadio,
  analysisCustomer.customerTwentyFemaleRadio,
  analysisCustomer.customerThirtyFemaleRadio,
  analysisCustomer.customerFortyFemaleRadio,
  analysisCustomer.customerFiftyFemaleRadio,
  analysisCustomer.customerSixtyupFemaleRadio
])

const customerChartData = computed(() => ({
  labels: ['10대', '20대', '30대', '40대', '50대', '60대+'],
  datasets: [
    {
      label: '남성',
      data: maleData.value,
      backgroundColor: '#6366F1',
      borderColor: '#6366F1',
      borderWidth: 1
    },
    {
      label: '여성',
      data: femaleData.value,
      backgroundColor: '#FB7185',
      borderColor: '#FB7185',
      borderWidth: 1
    }
  ]
}));

/* 2. 고객 특성 분석 그래프 차트 옵션 */
const customerChartOption = computed(() => {
  const maxValue = Math.max(...maleData.value, ...femaleData.value);
  const roundedMax = Math.ceil(maxValue / 10) * 10;

  return {
    animation: {
      duration: 1300,  // 애니메이션 시간을 좀 더 짧게
      easing: 'easeInOutCubic',  // 더 부드러운 이징 함수
      delay: (context) => context.dataIndex * 200,  // 각 막대가 순차적으로 나타나도록
      loop: false  // 애니메이션 반복 여부
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: roundedMax, // 동적으로 계산된 최대값
        min: 0,
        ticks: {
          stepSize: roundedMax / 10, // 눈금 간격도 동적으로 조정
          callback: function(value) {
            return value + '%';
          }
        }
      }
    },
    elements: {
      bar: {
        base: 0
      }
    }
  }
});

const brandChartData = {
  labels: ['제휴사', '독스', '네이처리퍼블릭', '컬쳐랜드', '베이즈랩', '블루', '롭스'],
  datasets: [{
    label: '구매 횟수',
    data: [245, 185, 156, 120, 110, 90, 85],
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
    tension: 0.1,
    fill: false
  }]
};

const productChartData = {
  labels: ['제휴사', '독스', '네이처리퍼블릭', '컬쳐랜드', '베이즈랩', '블루', '롭스'],
  datasets: [{
    label: '구매 횟수',
    data: [245, 185, 156, 120, 110, 90, 85],
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
    borderWidth: 1
  }]
};

/* 고객 특성 분석 데이터 통신 */
const loadCustomersChartData = async () => {
  try {
    const response = await axios.get(`http://localhost:8080/api/v1/analysis/age-group-radio`, {
      headers : {
        // 추후 토큰 추가
      }
    });
    /* 한번에 할당 */
    Object.assign(analysisCustomer, response.data.data);
  } catch (error) {
    console.log('데이터 로딩 에러 : ', error)
  } finally {
    isAnalysisCustomerLoading.value = false;
  }
}

/* 연령대 별 구매 횟수 비율 데이터 통신 */
const loadPurchasesByAgeData = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/v1/analysis/purchases-by-age', {
      headers: {
        // 추후 토큰 추가
      },
      params: {
        startDate : "2023-01-03T00:00:00",
        endDate : "2023-05-31T00:00:00"
      }
    });

    /* 한번에 할당 */
    Object.assign(analysisPurchasesByAge, response.data.data);
    console.log(analysisPurchasesByAge);
  } catch(error) {
    console.log('데이터 로딩 에러 : ', error)
  } finally {
    isAnalysisPurchasesByAge.value = false;
  }
}

onMounted(()=> {
  loadCustomersChartData();
  loadPurchasesByAgeData();
});

onUnmounted(() => {
  /* 0으로 초기화 */
  Object.keys(analysisCustomer).forEach(key => {
    analysisCustomer[key] = 0
  });
});
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="header-title">분석 대시보드</h1>
        <div class="date-picker-container">
          <input type="date" class="date-input" />
          <span>~</span>
          <input type="date" class="date-input" />
        </div>
      </div>
    </div>

    <!-- Grid Layout -->
    <div class="dashboard-grid">
      <!-- Quadrant 1 -->
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">연령대 별 구매 비율</h2>
          <div class="chart-selects">
            <select class="chart-select-buy-sales">
              <option>구매수</option>
              <option>매출액</option>
            </select>
            <select class="chart-select-age-grade">
              <option>연령대</option>
              <option>등급별</option>
            </select>
          </div>
        </div>
        <div class="chart-body">
          <template v-if="isAnalysisPurchasesByAge">
            <div class="loading....">데이터를 불러오는 중입니다.</div>
          </template>
          <template v-else>
            <div style="height: 400px">
              <Doughnut :data="purchasesByAgeChartData" :options="purchasesByAgeChartOption" />
            </div>
          </template>
        </div>
      </div>

      <!-- Quadrant 2 -->
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">고객 특성 분석</h2>
        </div>
        <div class="chart-body">
          <template v-if="isAnalysisCustomerLoading">
            <div class="loading....">데이터를 불러오는 중입니다.</div>
          </template>
          <template v-else>
            <div style="height: 400px">
              <Bar :data="customerChartData" :options="customerChartOption" />
            </div>
          </template>
        </div>
      </div>

      <!-- Quadrant 3 -->
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">브랜드 구매 횟수</h2>
        </div>
        <div class="chart-body">

        </div>
      </div>

      <!-- Quadrant 4 -->
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">제품 구매 횟수</h2>
        </div>
        <div class="chart-body">

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: #f3f4f6;
}

.dashboard-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px;
}

.header-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title {
  font-size: 24px;
  font-weight: bold;
  color: #111827;
}

.date-picker-container {
  display: flex;
  align-items: center;
  margin-left: 15px;
  gap: 8px;
  flex-wrap: wrap;
}

.date-input {
  padding: 5px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  min-width: 120px;
}

.header-content {
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 24px;
  font-weight: bold;
  color: #111827;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 600px), 1fr));
  gap: 16px;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

.chart-card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 350px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.chart-selects {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chart-select-buy-sales {
  padding: 4px 8px;
  margin-right: 5px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: #ffffff;
  min-width: 80px;
}

.chart-select-age-grade {
  padding: 4px 8px;
  margin-left: 5px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: #ffffff;
  min-width: 80px;
}

.chart-body {
  flex: 1;
  min-height: 0;
  position: relative;
  height: calc(100% - 60px); /* 헤더 높이를 제외한 나머지 공간 */
}

.chart-body > div {
  height: 100%;
  width: 100%
}

/* Reset default styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>