<script setup>
import {computed, onMounted, ref} from 'vue';
import axios from "axios";

import {ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip} from 'chart.js';
import {Bar} from "vue-chartjs";

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

const isSearchOpen = ref(false);

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
};

const salesData = ref([]);

const loadGraphData = async(typeId) => {
  try {
    const promotionIds = getPromotionIdsByType(typeId);

    const params = promotionIds.map(id => `promoId=${id}`).join('&');

    const response = await axios.get(`http://localhost:8080/api/v1/promotion-statistical/by-year-sales?${params}`, {
      headers: {

      }
    });

    // API 응답 데이터를 동적으로 객체화하여 저장
    // 처리된 데이터를 반응형 상태에 할당
    salesData.value = response.data.data.map(item => ({
      promoYear: item.promoYear,
      totalSales: item.totalSales,
      prevYearSales: item.prevYearSales,
      growthRate: item.growthRate
    }));

    console.log('그래프 데이터:', salesData.value);

  } catch (error) {
    console.log('그래프 데이터 로딩 에러', error)
  }
};

const years = computed(() => salesData.value.map(item => item.promoYear));
const sales = computed(() => salesData.value.map(item => item.totalSales));

const chartData = computed(() => ({
  labels: years.value,
  datasets: [
    {
      data: sales.value,
      backgroundColor: '#6366F1',
      borderColor: '#6366F1',
      borderWidth: 1
    }
  ]
}));

const chartOption = computed(() => {
  const maxValue = Math.max(...sales.value);

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
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxValue * 1.1,
        min: 0,
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    elements: {
      bar: {
        borderWidth: 1,
        borderRadius: 4,
        base: 0
      }
    },
    barThickness: 40, // 막대 두께 조절 (더 얇게)
    maxBarThickness: 40 // 최대 막대 두께 제한
  }
});

// 프로모션 데이터를 담을 배열 ref
const promotions = ref([]);

/* 프로모션 타입별 조회 통신 */
const loadTypeByPromotion = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/v1/promotion-statistical/type-by-promotion', {
      headers: {
        // 추후 토큰 추가
      }
    });

// promotionTypeId 기준으로 데이터 그룹화하고 정렬
    const groupedData = response.data.data.reduce((acc, promotion) => {
      const existingGroup = acc.find(group => group.typeId === promotion.promotionTypeId);

      if (existingGroup) {
        existingGroup.items.push({
          promotionId: promotion.promotionId,
          promotionTitle: promotion.promotionTitle
        });
      } else {
        acc.push({
          typeId: promotion.promotionTypeId,
          typeName: getTypeName(promotion.promotionTypeId),
          items: [{
            promotionId: promotion.promotionId,
            promotionTitle: promotion.promotionTitle
          }]
        });
      }

      return acc;
    }, []);

    // 각 그룹 내의 items를 연도 기준으로 정렬 (2024 -> 2023 -> 2022)
    groupedData.forEach(group => {
      group.items.sort((a, b) => {
        const yearA = parseInt(a.promotionTitle.match(/\d{4}/)[0]);
        const yearB = parseInt(b.promotionTitle.match(/\d{4}/)[0]);
        return yearB - yearA;
      });
    });

    // typeId 기준으로 그룹 정렬
    groupedData.sort((a, b) => a.typeId - b.typeId);

    promotions.value = groupedData;

    console.log(promotions.value);

  } catch (error) {
    console.log('데이터 로딩 에러 : ', error);
  }
};

// 특정 typeId의 모든 promotionId를 배열로 반환하는 함수
const getPromotionIdsByType = (typeId) => {
  const group = promotions.value.find(group => group.typeId === typeId);
  return group ? group.items.map(item => item.promotionId) : [];
};


// promotionTypeId에 따른 타입 이름을 반환하는 함수
const getTypeName = (typeId) => {
  const typeNames = {
    1: "봄맞이 새학기 특별전",
    2: "여름 바캉스 시즌오프",
    3: "가을 패션위크",
    4: "윈터 클리어런스",
    5: "설날 선물세트 특가전"
  };
  return typeNames[typeId] || `프로모션 타입 ${typeId}`;
};

onMounted(()=> {
  loadTypeByPromotion();
});

</script>

<template>
  <div class="container-wrapper">
    <div class="content-container">
      <div class="layout-grid">
        <!-- 왼쪽 영역 -->
        <div class="left-section">
          <!-- 그래프 영역 -->
          <div class="chart-section">
            <h3>프로모션 트렌드</h3>
            <div class="chart-container">
              <!-- 차트가 들어갈 자리 -->
              <div class="chart-placeholder">
                <Bar :data="chartData" :options="chartOption" />
              </div>
            </div>
          </div>

          <!-- 리스트 블록들 -->
          <div class="list-blocks">
            <div class="list-block">
              <h3>적용 상품 리스트1</h3>
              <div class="list-content">
                <!-- 리스트 내용 -->
                [상품 리스트1]
              </div>
            </div>
            <div class="list-block">
              <h3>적용 상품 리스트2</h3>
              <div class="list-content">
                <!-- 리스트 내용 -->
                [상품 리스트2]
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽 영역 -->
        <div class="right-section">
          <div class="ranking-block">
            <h3>순위 비교</h3>
            <div class="ranking-content">
              <!-- 순위 리스트 내용 -->
              [순위 비교 리스트]
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 버튼 -->
    <button
        class="search-trigger-btn"
        @click="toggleSearch"
        :class="{ 'shifted': isSearchOpen }"
    >
      {{ isSearchOpen ? '닫기' : '검색' }}
    </button>

    <!-- 검색 슬라이드 패널 -->
    <div class="search-panel" :class="{ 'open': isSearchOpen }">
      <div class="search-content">
        <h3>검색 필터</h3>
        <div class="search-form">
          <div class="form-group">
            <label>프로모션명</label>
            <input type="text" placeholder="프로모션명을 입력하세요">
          </div>

          <div class="form-group">
            <label>기간 선택</label>
            <div class="date-inputs">
              <input type="date">
              <span>~</span>
              <input type="date">
            </div>
          </div>

          <div class="form-group">
            <label>상태</label>
            <select>
              <option value="">전체</option>
              <option value="active">진행중</option>
              <option value="ended">종료</option>
              <option value="scheduled">예정</option>
            </select>
          </div>

          <button class="search-btn">검색</button>
          <div class="promotion-history">
            <h4>프로모션 내역</h4>
            <div class="promotion-scroll-container">
              <div v-for="group in promotions"
                   :key="group.typeId"
                   class="promotion-group">
                <button class="search-promotion-result" @click="loadGraphData(group.typeId)">
                  {{ group.typeName }}
                </button>
                <div class="promotion-items">
                  <label v-for="item in group.items"
                         :key="item.promotionId">
                    {{ item.promotionTitle }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.promotion-history {
  padding: 16px;
}

.promotion-history h4 {
  margin-bottom: 16px;
  font-weight: 500;
}

.promotion-scroll-container {
  max-height: 300px; /* 원하는 높이로 조절 가능 */
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 16px;
}

.promotion-group {
  margin-bottom: 20px;
}

.promotion-group:last-child {
  margin-bottom: 0;
}

.search-promotion-result {
  width: 100%;
  text-align: left;
  padding: 8px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 8px;
}

.promotion-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 16px;
}

.promotion-items label {
  cursor: pointer;
  padding: 4px 8px;
}

/* 스크롤바 스타일링 */
.promotion-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.promotion-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.promotion-scroll-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.promotion-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

.container-wrapper {
  position: relative;
  min-height: 100vh;
  background-color: var(--background-color);
}

.content-container {
  padding: 24px;
}

/* 검색 트리거 버튼 스타일 */
.search-trigger-btn {
  position: fixed;
  left: 0;
  top: 20%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: #4CAF50;
  border: none;
  border-radius: 0 8px 8px 0;
  color: white;
  cursor: pointer;
  z-index: 1001;
  letter-spacing: 2px;
  font-size: 14px;
  transition: left 0.3s ease;
}

.search-trigger-btn.shifted {
  left: 25%;
}

/* 검색 패널 스타일 */
.search-panel {
  position: fixed;
  left: -25%;
  top: 0;
  width: 25%;
  height: 100%;
  background: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 999;
}

.search-panel.open {
  left: 0;
}

.search-content {
  padding: 24px;
}

/* 검색 폼 스타일 */
.search-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.date-inputs input {
  width: calc(50% - 10px);
  min-width: 0;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.date-inputs span {
  flex-shrink: 0;
}

.search-btn {
  margin-top: 20px;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-promotion-result {
  margin-top: 20px;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-btn:hover {
  background: #45a049;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-container {
  height: 300px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-top: 16px;
}

.list-blocks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.list-block {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ranking-block {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.list-content, .ranking-content {
  margin-top: 16px;
  min-height: 200px;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
}

h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.chart-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%; /* 전체 높이를 부모 컨테이너에 맞춤 */
}

.chart-container {
  height: 300px; /* 더 큰 높이 값으로 조정 */
  background: #f8f9fa;
  border-radius: 4px;
  margin-top: 16px;
}

/* 차트가 들어가는 placeholder의 높이도 조정 */
.chart-placeholder {
  height: 100%;
  width: 100%;
}
</style>