<!-- Dashboard.vue -->
<script setup>
import { ref } from 'vue';
import { Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'vue-chartjs';

// Register ChartJS components
ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const startDate = ref('');
const endDate = ref('');

// 연령대 별 구매 횟수 데이터
const ageDistributionData = {
  labels: ['10대', '20대', '30대', '40대', '50대', '60대 이상'],
  datasets: [{
    data: [7, 13, 14, 16, 21, 17],
    backgroundColor: ['#94A3B8', '#F59E0B', '#EC4899', '#6366F1', '#22C55E', '#14B8A6'],
    borderWidth: 1
  }]
};

// 고객 특성 분석 데이터
const genderAgeData = {
  labels: ['10대', '20대', '30대', '40대', '50대', '60대 이상'],
  datasets: [
    {
      label: '남성',
      backgroundColor: '#6366F1',
      data: [65, 20, 40, 18, 15, 10]
    },
    {
      label: '여성',
      backgroundColor: '#FB7185',
      data: [85, 38, 55, 42, 82, 22]
    }
  ]
};

// 브랜드 구매 횟수 데이터
const brandData = {
  labels: ['제휴사', '독스', '네이처리퍼블릭', '컬쳐랜드', '베이즈랩', '블루', '롭스'],
  datasets: [{
    backgroundColor: '#6366F1',
    data: [245, 185, 156, 120, 110, 90, 85]
  }]
};

// 브랜드 제품 구매 횟수 데이터
const brandProductData = {
  labels: ['제휴사', '독스', '네이처리퍼블릭', '컬쳐랜드', '베이즈랩', '블루', '롭스'],
  datasets: [{
    backgroundColor: '#F59E0B',
    data: [245, 185, 156, 120, 110, 90, 85]
  }]
};

// 차트 옵션
const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

const horizontalBarOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      beginAtZero: true
    }
  }
};
</script>

<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">분석 대시 보드</h1>
      <div class="flex gap-4">
        <input
            type="date"
            v-model="startDate"
            class="border rounded px-3 py-2"
        />
        <span class="self-center">~</span>
        <input
            type="date"
            v-model="endDate"
            class="border rounded px-3 py-2"
        />
      </div>
    </div>

    <!-- Dashboard Grid -->
    <div class="grid grid-cols-2 gap-6">
      <!-- Age Distribution -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">연령대 별 구매 횟수</h2>
        <div class="h-64">
          <Pie
              :data="ageDistributionData"
              :options="pieOptions"
          />
        </div>
      </div>

      <!-- Gender Analysis -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">고객 특성 분석</h2>
        <div class="h-64">
          <Bar
              :data="genderAgeData"
              :options="barOptions"
          />
        </div>
      </div>

      <!-- Brand Distribution -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">브랜드 구매 횟수</h2>
        <div class="h-64">
          <Bar
              :data="brandData"
              :options="horizontalBarOptions"
          />
        </div>
      </div>

      <!-- Brand Product Distribution -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">해당 브랜드의 제품 구매 횟수</h2>
        <div class="h-64">
          <Bar
              :data="brandProductData"
              :options="horizontalBarOptions"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  @apply bg-gray-50 min-h-screen;
}
</style>