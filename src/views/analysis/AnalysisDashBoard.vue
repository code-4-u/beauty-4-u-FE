<!-- DashboardLayout.vue -->
<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <div class="flex flex-col p-4 bg-white border-b">
      <div class="flex items-center">
        <h1 class="text-2xl font-bold">분석 대시보드</h1>
      </div>
    </div>

    <!-- Grid Layout -->
    <div class="grid-container">
      <!-- Quadrant 1 -->
      <div class="chart-card">
        <div class="flex justify-between mb-4">
          <h2 class="text-lg font-semibold">연령대 별 구매 횟수</h2>
          <select class="border rounded px-2">
            <option>연령대</option>
          </select>
        </div>
        <div style="height: 300px">
          <Doughnut :data="ageChartData" :options="doughnutOptions" />
        </div>
      </div>

      <!-- Quadrant 2 -->
      <div class="chart-card">
        <div class="mb-4">
          <h2 class="text-lg font-semibold">고객 특성 분석</h2>
        </div>
        <div class="chart-container">
          <Bar
              :data="genderChartData"
              :options="defaultOptions"
          />
        </div>
      </div>

      <!-- Quadrant 3 -->
      <div class="chart-card">
        <div class="mb-4">
          <h2 class="text-lg font-semibold">브랜드 구매 횟수</h2>
        </div>
        <div class="chart-container">
          <Bar
              :data="brandChartData"
              :options="horizontalOptions"
          />
        </div>
      </div>

      <!-- Quadrant 4 -->
      <div class="chart-card">
        <div class="mb-4">
          <h2 class="text-lg font-semibold">제품 구매 횟수</h2>
        </div>
        <div class="chart-container">
          <Bar
              :data="productChartData"
              :options="horizontalOptions"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'vue-chartjs';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const doughnutOptions = {
  responsive:true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'right',
    },
  },
  cutout: '60%'
}

// 도넛 차트용 데이터 구조로 수정
const ageChartData = {
  labels: ['10대', '20대', '30대', '40대', '50대', '60대+'],
  datasets: [{
    data: [7, 13, 14, 16, 21, 17],
    backgroundColor: [
      '#6366F1',  // indigo
      '#F59E0B',  // amber
      '#EC4899',  // pink
      '#22C55E',  // green
      '#14B8A6',  // teal
      '#8B5CF6'   // violet
    ],
    borderColor: '#ffffff',
    borderWidth: 2
  }]
};

// Date range state
const startDate = ref('');
const endDate = ref('');

// Chart Options
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

const horizontalOptions = {
  ...defaultOptions,
  indexAxis: 'y',
  scales: {
    x: {
      beginAtZero: true
    }
  }
};

const genderChartData = {
  labels: ['10대', '20대', '30대', '40대', '50대', '60대+'],
  datasets: [
    {
      label: '남성',
      data: [65, 20, 40, 18, 15, 10],
      backgroundColor: '#6366F1',
      borderColor: '#6366F1',
      borderWidth: 1
    },
    {
      label: '여성',
      data: [85, 38, 55, 42, 82, 22],
      backgroundColor: '#FB7185',
      borderColor: '#FB7185',
      borderWidth: 1
    }
  ]
};

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
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

.bg-gray-100 {
  background-color: #f3f4f6;
}

/* Header styles */
.header-container {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
}

.header-title-container {
  display: flex;
  align-items: center;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 700;
}

/* Grid layout styles */
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  background: transparent;
}

/* Chart card styles */
.chart-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.chart-select {
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0 0.5rem;
}

.chart-container {
  height: 300px;
  position: relative;
  background: transparent;
}

/* Fixed height container for doughnut chart */
.doughnut-container {
  height: 300px;
}

/* Margin utilities */
.mb-4 {
  margin-bottom: 1rem;
}
</style>