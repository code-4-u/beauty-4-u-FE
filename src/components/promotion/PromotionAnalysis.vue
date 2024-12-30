<script setup>
import {Bar} from "vue-chartjs";
import {computed, onMounted, ref} from 'vue';
import {getFetch} from "@/stores/apiClient.js";
import {ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip} from 'chart.js';
import CaptureModal from "@/components/capture/CaptureModal.vue";


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

/* 프로모션 종류 저장 변수 */
const promotionType = ref([]);

/* 프로모션 id 저장 변수 */
const promotionIds = ref([]);

/* 프로모션 검색 결과 저장 변수 */
const promotionSearchResult = ref([]);

/* 프로모션 별 매출액 조회 저장 변수 */
const promotionByYearSales = ref([]);

/* 프로모션 별 제품 별 제품 리스트 저장 변수 */
const promotionByGoods = ref();

/* 적용 리스트를 보여줄 2개의 배열 생성 */
const promotionByGoodsList = ref([null, null]);

/* 적용 프로모션 리스트 제품 비교 */
const promotionByComparison = ref([]);

/* 통신 완료 여부 함수 */
const loadFin = ref(false);

/* 프로모션 리스트 */
const promotionList = computed(() => transformSearchData(promotionSearchResult.value));

/* 검색창 상태 저장 변수 */
const isSearchOpen = ref(false);

/* 프로모션 검색 조건 저장 변수 */
const searchKeyword = ref('');
const startDate = ref('');
const endDate = ref('');
const promotionTypeId = ref('');
const promotionStatus = ref('');

// 캡처 모달
const captureModal = ref(null);

/* 프로모션 검색 데이터 가공 */
const transformSearchData = (searchData) => {
  /* 프로모션 타입 별 번호 추출 (중복제거) */
  const typePromotion = [...new Set(searchData.map(item => item.promotionTypeId))];

  // 1. 먼저 년도별로 데이터 정렬
  const sortedData = searchData.sort((a, b) => {
    const yearA = new Date(a.promotionStartDate).getFullYear();
    const yearB = new Date(b.promotionStartDate).getFullYear();
    return yearB - yearA; // 최신년도가 먼저 오도록 내림차순 정렬
  });

  return typePromotion.map(promotionTypeId => ({
    promotionTypeId: promotionTypeId,
    promotionTypeName: promotionType.value.find(promotionType => promotionType.promotionTypeId === promotionTypeId)?.promotionTypeName || `타입 ${promotionTypeId}`,
    items: sortedData.filter(item => item.promotionTypeId === promotionTypeId)
  }));
};

/* 검색 키워드 리셋 함수 */
const resetSearchKeyword = () => {
  searchKeyword.value = '';
  startDate.value = '';
  endDate.value = '';
  promotionTypeId.value = '';
  promotionStatus.value = '';
}

/* 특정 typeId의 모든 promotionId를 배열로 반환하는 함수 */
const getPromotionIdsByType = (promotionTypeId) => {
  const promotionGroup = promotionList.value.find(item => item.promotionTypeId === promotionTypeId);
  return promotionGroup.items
      .map(item => item.promotionId)
      .sort((a, b) => a - b);
};

/* 검색창 토글 설정 */
const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
};

/* 상품 적용 리스트 관련 함수 */
const addGoodsList = (newData) => {
  // 이미 존재하는 같은 년도의 데이터 확인
  const existingIndex = promotionByGoodsList.value.findIndex(
      item => item !== null && item.promotionYear === newData.promotionYear
  );

  // 같은 년도의 데이터가 있으면 삭제
  if (existingIndex !== -1) {
    promotionByGoodsList.value[existingIndex] = null;
    return; // 함수 종료
  }

  const nullIndex = promotionByGoodsList.value.findIndex(item => item === null);
  if (nullIndex !== -1) {
    promotionByGoodsList.value[nullIndex] = newData;
  } else {
    promotionByGoodsList.value[0] = newData;
  }

  const validData = promotionByGoodsList.value.filter(item => item !== null);
  validData.sort((a,b) => a.promotionYear - b.promotionYear);

  promotionByGoodsList.value = [...validData];
  while(promotionByGoodsList.value.length < 2) {
    promotionByGoodsList.value.push(null);
  }

  // 배열의 모든 요소가 null이 아닌지 체크
  if (!promotionByGoodsList.value.some(item => item === null)) {
    loadPromotionByComparison();
  }
}

/* 화면 캡처 함수 */
const handleCapture = async () => {
  if (isSearchOpen.value) {
    isSearchOpen.value = false;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
//   캡처 모달 호출
  captureModal.value.captureScreen();
}

/* 데이터 통신 */
/* 프로모션 종류 데이터 조회 */
const loadPromotionType = async () => {
  try {
    const response = await getFetch(`/promotion-statistical/type`);
    promotionType.value = response.data.data;
  } catch(e) {
    console.log("프로모션 종류 데이터 조회 실패", e);
  }
}

/* 프로모션 검색 */
const loadSearchPromotion = async () => {
  // 날짜 유효성 검사
  if ((startDate.value && !endDate.value) || (!startDate.value && endDate.value)) {
    alert('시작일과 종료일을 모두 선택해주세요.');
    return;
  }

  // 날짜 범위 검사
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);

    if (start > end) {
      alert('종료일은 시작일보다 이후여야 합니다.');
      return;
    }
  }

  try {
    const searchParams = new URLSearchParams();

    if(searchKeyword.value) searchParams.append('searchKeyword', searchKeyword.value);
    if(startDate.value) searchParams.append('startDate', startDate.value);
    if(endDate.value) searchParams.append('endDate', endDate.value);
    if(promotionTypeId.value) searchParams.append('promotionTypeId', promotionTypeId.value);
    if(promotionStatus.value) searchParams.append('promotionStatus', promotionStatus.value);

    const response = await getFetch(`/promotion-statistical/search-promotion?${searchParams.toString()}`);
    promotionSearchResult.value = response.data.data;
  } catch(e) {
    console.log("프로모션 검색 실패", e);
  } finally {
    resetSearchKeyword();
  }
}

/* 프로모션 년도별 매출액 조회 */
const loadPromotionByYearSales = async (promotionTypeId) => {
  try {
    promotionIds.value = getPromotionIdsByType(promotionTypeId);
    console.log("promotionIds 어디서... 값이...?", promotionIds.value);
    const params = new URLSearchParams();

    promotionIds.value.forEach(id => {
      params.append("promotionIds", id);
    });

    const response = await getFetch(`/promotion-statistical/by-year-sales?${params.toString()}`);
    promotionByYearSales.value = response.data.data;
    promotionByYearSales.value.sort((a,b) => a.promoYear - b.promoYear);
  } catch(e) {
    console.log("프로모션 년도별 매출 조회중 오류가 났습니다.", e);
  } finally {
    loadFin.value = true;
  }
}

/* 프로모션 적용 상품 조회 */
const loadPromotionByGoodsSales = async (promotionId) => {
  try {
    const params = new URLSearchParams();
    params.append("promotionId", promotionId);

    const response = await getFetch(`/promotion-statistical/by-goods-sales?${params.toString()}`);
    promotionByGoods.value = response.data.data;
  } catch(e) {
    console.log("프로모션 별 상품 리스트 조회 중 오류가 났습니다.", e);
  }
}

/* 프로모션 비교 리스트 조회 */
const loadPromotionByComparison = async() => {
  try {
    const params = new URLSearchParams();

    // promotionByGoodsList에서 각 프로모션의 ID를 추출하여 params에 추가
    if (promotionByGoodsList.value[0] && promotionByGoodsList.value[1]) {
      params.append("promotionId1", promotionByGoodsList.value[0].promotionId);
      params.append("promotionId2", promotionByGoodsList.value[1].promotionId);
    }

    const response = await getFetch(`/promotion-statistical/by-comparison-promotion?${params.toString()}`);
    promotionByComparison.value = response.data.data;
  } catch(e) {
    console.log("비교 리스트를 조회하는데 오류가 발생 했습니다.", e);
  }
}


/* 데이터 차트 관련 */
const years = computed(() => promotionByYearSales.value.map(item => item.promoYear));
const sales = computed(() => promotionByYearSales.value.map(item => item.totalPromotionSales));

const chartData = computed(() => ({
  labels: years.value,
  datasets: [
    {
      data: sales.value,
      promotionIds: promotionIds.value,
      promotionYears: years.value,
      backgroundColor: '#4CAF50',
      borderColor: '#4CAF50',
      borderWidth: 1,
      hoverBackgroundColor: '#2E7D32',
      hoverBorderColor: '#2E7D32',
      hoverBorderWidth: 2
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
    barThickness: 30, // 막대 두께 조절 (더 얇게)
    maxBarThickness: 30, // 최대 막대 두께 제한
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const dataIndex = element.index;
        const promotionId = chartData.value.datasets[0].promotionIds[dataIndex];
        const promotionYear = chartData.value.datasets[0].promotionYears[dataIndex];

        loadPromotionByGoodsSales(promotionId).then(() => {
          console.log("promotionByGoodsAfter : ", promotionByGoods.value);

          const newData = {
            promotionId: promotionId,
            promotionYear:promotionYear,
            promotionGoodsList:promotionByGoods.value
          }

          console.log("newData", newData);
          addGoodsList(newData);
          console.log("promotionByGoodsList : ",promotionByGoodsList.value);
        });
      }
    }
  }
});

onMounted(()=> {
  loadPromotionType();
});

</script>

<template>
  <div class="container-wrapper">
    <!-- 검색 버튼 -->
    <button
        class="search-trigger-btn"
        @click="toggleSearch"
        :class="{ 'shifted': isSearchOpen }"
    >
      {{ isSearchOpen ? '닫기' : '검색' }}
    </button>

    <!-- 캡처 버튼 -->
    <button
        class="capture-btn"
        @click="handleCapture"
        :class="{ 'shifted': isSearchOpen }"
    >
      <span>캡처</span>
    </button>

<!--    캡처 모달창 -->
    <CaptureModal ref="captureModal" prefix="promotion-analysis"/>

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
                <template v-if="loadFin">
                  <Bar :data="chartData" :options="chartOption" />
                </template>
              </div>
            </div>
          </div>

          <!-- 리스트 블록들 -->
          <div class="list-blocks">
            <div class="list-block">
              <h3>{{ promotionByGoodsList[0] ? `${promotionByGoodsList[0].promotionYear}년도` : '' }} 상품 리스트</h3>
              <div class="list-content">
                <table class="data-table">
                  <thead>
                  <tr>
                    <th>제품명</th>
                    <th>매출액</th>
                  </tr>
                  </thead>
                  <tbody>
                   <template v-if="promotionByGoodsList[0]">
                    <tr v-for="item in promotionByGoodsList[0].promotionGoodsList"
                        :key="item.goodsId">
                      <td>{{item.goodsName}}</td>
                      <td class="text-right">{{Number(item.totalGoodsSales).toLocaleString()}}원</td>
                    </tr>
                   </template>
                   <tr v-else>
                     <td colspan="2" class="empty-message">
                       데이터 선택
                     </td>
                   </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="list-block">
              <h3>{{ promotionByGoodsList[1] ? `${promotionByGoodsList[1].promotionYear}년도` : '' }} 상품 리스트</h3>
              <div class="list-content">
                <table class="data-table">
                  <thead>
                  <tr>
                    <th>제품명</th>
                    <th>매출액</th>
                  </tr>
                  </thead>
                  <tbody>
                  <template v-if="promotionByGoodsList[1]">
                    <tr v-for="item in promotionByGoodsList[1].promotionGoodsList"
                        :key="item.goodsId">
                      <td>{{item.goodsName}}</td>
                      <td class="text-right">{{Number(item.totalGoodsSales).toLocaleString()}}원</td>
                    </tr>
                  </template>
                  <tr v-else>
                    <td colspan="2" class="empty-message">
                      데이터 선택
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽 영역 -->
        <div class="right-section">
          <div class="ranking-block">
            <h3>프로모션 비교</h3>
            <div class="ranking-content">
              <div class="table-container">
                <table class="data-table">
                  <thead>
                  <tr>
                    <th>작년</th>
                    <th>올해</th>
                    <th>작년 매출</th>
                    <th>올해 매출</th>
                  </tr>
                  </thead>
                  <tbody>
                  <template v-if="promotionByComparison && promotionByComparison.length > 0">
                    <tr v-for="item in promotionByComparison" :key="item.goodsName1">
                      <td>{{item.goodsName1}}</td>
                      <td>{{item.goodsName2}}</td>
                      <td class="text-right">{{Number(item.sales1).toLocaleString()}}원</td>
                      <td class="text-right">{{Number(item.sales2).toLocaleString()}}원</td>
                    </tr>
                  </template>
                  <tr v-else>
                    <td colspan="4" class="empty-message">두 개의 연도를 선택하면 비교 결과가 표시됩니다</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 슬라이드 패널 -->
    <div class="search-panel" :class="{ 'open': isSearchOpen }">
      <div class="search-content">
        <h3>검색 필터</h3>
        <div class="search-form">
          <div class="form-group">
            <label>프로모션명</label>
            <input v-model="searchKeyword" type="text" placeholder="프로모션명을 입력하세요" @keyup.enter="loadSearchPromotion">
          </div>

          <div class="form-group">
            <label>기간 선택</label>
            <div class="date-inputs">
              <input v-model="startDate" type="date">
              <span>~</span>
              <input v-model="endDate" type="date">
            </div>
          </div>

          <div class="form-group">
            <label>프로모션 종류</label>
            <select v-model="promotionTypeId">
              <option value="">전체</option>
              <option v-for="option in promotionType" :value="option.promotionTypeId">
                {{option.promotionTypeName}}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>상태</label>
            <select>
              <option value="">전체</option>
              <option value="ongoing">진행중</option>
              <option value="ended">종료</option>
              <option value="before">예정</option>
            </select>
          </div>

          <button class="search-btn" @click="loadSearchPromotion">검색</button>
          <div class="promotion-history">
            <h4>프로모션 내역</h4>
            <div class="promotion-scroll-container">
              <div v-for="group in promotionList"
                   :key="group.promotionTypeId"
                   class="promotion-group">
                <button class="search-promotion-result" @click="loadPromotionByYearSales(group.promotionTypeId)">
                  {{ group.promotionTypeName }}
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
  padding: 15px;
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


/* 캡처 버튼 스타일 추가 */
.capture-btn {
  position: fixed;
  left: 0;
  top: 28%;  /* 검색 버튼 아래에 위치 */
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: #4CAF50;  /* 검색 버튼과 동일한 색상 */
  border: none;
  border-radius: 0 8px 8px 0;
  color: white;
  cursor: pointer;
  z-index: 1001;
  letter-spacing: 2px;
  font-size: 14px;
  transition: left 0.3s ease;
}

.search-trigger-btn.shifted,
.capture-btn.shifted {
  left: 25%;
}

.search-trigger-btn:hover,
.capture-btn:hover {
  background: #45a049;
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

/* 추가되는 스타일 */
.layout-grid {
  display: grid;
  grid-template-columns: 1.4fr 1.3fr;
  gap: 32px;
  margin-top: 24px;
  padding-right: 24px;
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
  margin-top: 10px;
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
  font-size: 14px;
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

/* 테이블 관련 스타일 추가 */
.table-container {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 auto;  /* 테이블 중앙 정렬 */
  background: white;
}

.data-table th,
.data-table td {
  padding: 12px;
  border: 1px solid #e0e0e0;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  text-align: center;
}

.data-table td {
  text-align: left;
}

.text-right {
  text-align: right !important;
}

.empty-message {
  text-align: center !important;
  color: #666;
  padding: 20px !important;
}

/* 리스트 콘텐츠 영역 수정 */
.list-content {
  margin-top: 10px;
  min-height: 200px;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
  overflow-x: auto;  /* 가로 스크롤 필요시 추가 */
}

/* 홀수/짝수 행 배경색 구분 */
.data-table tbody tr:nth-child(odd) {
  background-color: #ffffff;
}

.data-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

/* 호버 효과 */
.data-table tbody tr:hover {
  background-color: #f5f5f5;
}

/* 랭킹 블록 스타일 */
.ranking-block {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.ranking-content {
  margin-top: 16px;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
  overflow-x: auto;
}

/* 테이블 컨테이너 스타일 */
.table-container {
  width: 100%;
  overflow-x: auto;
  margin-top: 8px;
}

/* 데이터 테이블 스타일 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 auto;
  background: white;
}

.data-table th,
.data-table td {
  padding: 12px;
  border: 1px solid #e0e0e0;
  text-align: center;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.data-table tbody tr:nth-child(odd) {
  background-color: #ffffff;
}

.data-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.data-table tbody tr:hover {
  background-color: #f5f5f5;
}

.text-right {
  text-align: right !important;
}

.empty-message {
  text-align: center !important;
  color: #666;
  padding: 20px !important;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  font-size: 12px;
  white-space: normal;
  word-wrap: break-word;
  vertical-align: middle;
}

.right-section .data-table th:nth-child(1),
.right-section .data-table td:nth-child(1),
.right-section .data-table th:nth-child(2),
.right-section .data-table td:nth-child(2) {
  width: 30%;
}

.right-section .data-table th:nth-child(3),
.right-section .data-table td:nth-child(3),
.right-section .data-table th:nth-child(4),
.right-section .data-table td:nth-child(4) {
  width: 20%;
}

.list-blocks .data-table th:first-child,
.list-blocks .data-table td:first-child {
  width: 65%;
}

.list-blocks .data-table th:last-child,
.list-blocks .data-table td:last-child {
  width: 35%;
  text-align: right;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 auto;
  background: white;
  table-layout: fixed;
}

.list-block {
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.list-content {
  flex: 1;
  overflow-y: auto;
}

.list-blocks .data-table th:first-child,
.list-blocks .data-table td:first-child {
  width: 60%;  /* 65%에서 55%로 줄임 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-blocks .data-table th:last-child,
.list-blocks .data-table td:last-child {
  width: 40%;  /* 35%에서 45%로 늘림 */
  text-align: center;  /* right에서 center로 변경 */
  white-space: nowrap;
}

/* 테이블 헤더도 가운데 정렬 */
.list-blocks .data-table th {
  text-align: center;
}
</style>