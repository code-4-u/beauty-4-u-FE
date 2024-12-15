<template>
  <div class="product-review-page">
    <header class="header">
      <div class="search-controls">
        <div class="date-inputs">
          <input type="date" v-model="startDate" class="date-input" :max="endDate || today">
          <span> ~ </span>
          <input type="date" v-model="endDate" class="date-input" :min="startDate || today">
        </div>
        <button @click="searchByDate" class="search-button">날짜 조회</button>
        <button @click="resetSearch" class="reset-button">초기화</button>
        <div class="score-search">
          <input type="number" v-model="searchScore" class="score-input" min="1" max="5" placeholder="평점 입력(1-5)">
          <button @click="searchByScore" class="search-button">평점 조회</button>
          <button @click="resetSearch" class="reset-button">초기화</button>
        </div>
      </div>
    </header>
    <div class="main-content">
      <main>
        <table class="review-table">
          <thead>
          <tr>
            <th class="sortable-header">리뷰 일시
              <div class="sort-arrows">
                <button @click="handleSort('created_date', 'ASC')"
                        :class="{ active: isCurrentSort('created_date', 'ASC') }">▲</button>
                <button @click="handleSort('created_date', 'DESC')"
                        :class="{ active: isCurrentSort('created_date', 'DESC') }">▼</button>
              </div>
            </th>
            <th>리뷰 번호</th>
            <th>제품명</th>
            <th class="sortable-header">평점
              <div class="sort-arrows">
                <button @click="handleSort('review_score', 'ASC')"
                        :class="{ active: isCurrentSort('review_score', 'ASC') }">▲</button>
                <button @click="handleSort('review_score', 'DESC')"
                        :class="{ active: isCurrentSort('review_score', 'DESC') }">▼</button>
              </div>
            </th>
            <th>리뷰 내용</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="review in searchReview" :key="review.reviewCode">
            <td>{{ review.createdDate }}</td>
            <td>{{ review.reviewId }}</td>
            <td>{{ review.goodsName }}</td>
            <td>{{ review.reviewScore }}</td>
            <td>{{ review.reviewContent }}</td>
          </tr>
          </tbody>
        </table>
      </main>
    </div>
  </div>
</template>

<script setup>
import {computed, ref, watchEffect} from "vue";
import { getFetch } from '@/stores/apiClient.js';
import {useRoute} from "vue-router";

// 리뷰데이터 저장 ref 생성
const route = useRoute();
const searchReview = ref([])

const startDate = ref('');
const endDate = ref('');

const searchScore = ref('');

// 평점 검색 함수 추가
const searchByScore = async () => {
  try {
    if (!searchScore.value) {
      alert('평점을 입력해주세요.');
      return;
    }

    const score = parseInt(searchScore.value);
    if (score < 1 || score > 5) {
      alert('평점은 1-5 사이의 숫자를 입력해주세요.');
      return;
    }

    const response = await getFetch(`/review/list/score?searchScore=${score}`);

    if (response && response.data) {
      searchReview.value = response.data;
    }
  } catch (error) {
    console.error('평점 검색 실패:', error);
  }
};

// 정렬
const currentSort = ref({
  primarySort: 'created_date',
  primaryOrder: 'DESC',
  secondarySort: null,
  secondaryOrder: null

});

// 정렬 처리 함수
const handleSort = async (column, order) => {

  currentSort.value = {
    primarySort: column,
    primaryOrder: order,
    secondarySort: '',
    secondaryOrder: ''
  };
  try{
    const queryParams = new URLSearchParams({
      primarySort: currentSort.value.primarySort,
      primaryOrder: currentSort.value.primaryOrder
    });

    const response = await getFetch(`/review/list/sort?${queryParams}`);

    if(response && response.data) {
      console.log("정렬 응답: ",response.data)
      searchReview.value = response.data;
    }
  } catch (error){
    console.error("정렬 실패");
  }
};


// 현재 정렬 상태 확인 함수
const isCurrentSort = (column, order) => {
  return currentSort.value.primarySort === column && currentSort.value.primaryOrder === order;
};

// 날짜 형식 변환 함수
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};


//오늘 날짜 계산
const today = computed(() => {
  const date = new Date();
  return date.toISOString().split('T')[0];
})

// 날짜 기반 검색 함수
const searchByDate = async () => {
  try{
    let url = '/review/list/date';
    const params = new URLSearchParams();

    if(startDate.value){
      params.append('startDate', startDate.value)
    }
    if(endDate.value){
      params.append('endDate', endDate.value)
    }

    // URL 쿼리스트링 생성
    const queryString = params.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await getFetch(fullUrl);
    if(response && response.data) {
      searchReview.value = response.data;
    }

  } catch (error){
    console.log("날짜 검색 실패: ", error)
  }
};

// 검색 초기화 함수
const resetSearch = () => {
  startDate.value = '';    // 시작일 초기화
  endDate.value = '';      // 종료일 초기화
  searchScore.value = '';  // 평점 초기화
  fetchReviews();          // 전체 리뷰 목록 다시 조회
};


// 리뷰 목록 가져오는 함수
const fetchReviews = async () => {
  try {
    const response = await getFetch('/review/list')

    if(response && response.data) {
      console.log("받은 데이터:" , response.data);
      console.log("데이터 길이: ", response.data.length)
    }else{
      console.log("응답 데이터 없음")
    }

    searchReview.value = response.data
  } catch (error) {
    console.error('리뷰 목록 조회 실패: ', error)
  }
};

// route가 변경될 때마다 실행
watchEffect(() => {
  console.log('현재 경로:', route.path);
  if (route.path === '/goods/review/list') {
    console.log('리뷰 목록 조회 시작');
    fetchReviews();
  }
});

</script>

<style scoped>
.sortable-header {
  position: relative;
  padding-right: 25px !important; /* 화살표 버튼 공간 확보 */
}

.sort-arrows {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sort-arrows button {
  padding: 0;
  background: none;
  border: none;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sort-arrows button:hover {
  color: #000;
}

.sort-arrows button.active {
  color: #004999;
  font-weight: bold;
}

.search-controls {
  display: flex;
  gap: 10px;
  padding: 20px;
  align-items: center;
  background-color: white;
  border-bottom: 1px solid #ddd;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-button, .reset-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}


.product-review-page {
  font-family: Arial, sans-serif;
}

.main-content {
  display: flex;
  height: calc(100vh - 60px);
}

main {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
}

.review-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.review-table th,
.review-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.review-table th {
  background-color: #BBE5FB;
  font-weight: 500;
  transition: background-color 0.2s;
}

.review-table tr {
  background-color: white;
}

.review-table tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style>