<!-- DashboardLayout.vue -->
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
          <Doughnut :data="ageChartData" :options="doughnutOptions" />
        </div>
      </div>

      <!-- Quadrant 2 -->
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">고객 특성 분석 비율</h2>
        </div>
        <div class="chart-body">
          <Bar :data="genderChartData" :options="defaultOptions" />
        </div>
      </div>

      <!-- Quadrant 3 -->
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">브랜드 구매 횟수</h2>
        </div>
        <div class="chart-body">
          <div v-show="showAdditionalCharts">
            <Bar :data="brandChartData" :options="horizontalOptions" />
          </div>
        </div>
      </div>

      <!-- Quadrant 4 -->
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">제품 구매 횟수</h2>
        </div>
        <div class="chart-body">
          <div v-show="showAdditionalCharts">
            <Bar :data="productChartData" :options="horizontalOptions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import ChartDataLabels from 'chartjs-plugin-datalabels';
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
    Legend,
    ChartDataLabels
);

const showAdditionalCharts = ref(false);

onMounted(()=>{
  setTimeout(() => {
    showAdditionalCharts.value = true;
  }, 2000); // 2초 후에 차트 표시
})

const datalabelsConfig = {
  color: '#111827',
  font: {
    weight: 'bold'
  },
  formatter: (value) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'right',
    },
    tooltip: {
      enabled: true
    },
    datalabels: {
      ...datalabelsConfig,
      color: '#444444',
      font: {
        weight: 'bold',
        size: 13
      },
      formatter: (value) => value + '%'
    }
  },
  layout: {
    padding: {
      tip: 10,
      bottom: 10
    }
  },
  cutout: '60%',
  animation: {
    duration: 1500,
    animateRotate: true,    // 회전 애니메이션
    animateScale: true,     // 크기 애니메이션
    easing: 'easeOutQuart'
  }
};

const ageChartData = {
  labels: ['10대', '20대', '30대', '40대', '50대', '60대+'],
  datasets: [{
    data: [7, 13, 14, 16, 21, 17],
    backgroundColor: [
      '#97E3D5',
      '#E8C1A0',
      '#F47560',
      '#F1E15B',
      '#E8A838',
      '#84ADFF'
    ],
    borderColor: '#ffffff',
    borderWidth: 2,
    datalabels: {
      display: true
    }
  }]
};

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    tooltip: {
      enabled: true
    },
    datalabels: {
      ...datalabelsConfig,
      anchor: 'end',
      align: 'top',
      color: '#444444',
      offset: 4
    }
  },
  layout: {
    padding: {
      top: 20,
      bottom: 10
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        padding: 5
      }
    }
  },
  animation: {
    duration: 1500,
    delay: (context) => {
      const delay = context.dataIndex * 100;
      return delay;
    },
    y: {
      from : 0
    },
    onProgress: function(animation) {
      animation.chart.data.datasets.forEach(dataset => {
        dataset.backgroundColor = dataset.backgroundColor;
      });
    }
  }
};

const horizontalOptions = {
  ...defaultOptions,
  indexAxis: 'y',
  plugins: {
    ...defaultOptions.plugins,
    datalabels: {
      ...datalabelsConfig,
      anchor: 'end',
      align: 'start',
      color: '#444444',
      offset: 0,
      font: {
        weight: 'bold',
        size: 13
      }
    },
    legend: {
      position: 'top'
    }
  },
  layout: {
    padding: {
      left: 10,
      right: 20
    }
  },
  scales: {
    x: {
      beginAtZero: true
    },
    y: {
      ticks: {
        padding: 5
      }
    }
  },
  animation: {
    duration: 1500,
    delay: (context) => {
      const delay = context.dataIndex * 50;
      return delay;
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
      borderWidth: 1,
      datalabels: {
        display: true
      }
    },
    {
      label: '여성',
      data: [85, 38, 55, 42, 82, 22],
      backgroundColor: '#FB7185',
      borderColor: '#FB7185',
      borderWidth: 1,
      datalabels: {
        display: true
      }
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
    fill: false,
    datalabels: {
      display: true
    }
  }]
};

const productChartData = {
  labels: ['제휴사', '독스', '네이처리퍼블릭', '컬쳐랜드', '베이즈랩', '블루', '롭스'],
  datasets: [{
    label: '구매 횟수',
    data: [245, 185, 156, 120, 110, 90, 85],
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
    borderWidth: 1,
    datalabels: {
      display: true
    }
  }]
};
</script>

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