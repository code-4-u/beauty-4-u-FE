<template>
  <div class="product-review-page">
    <header class="header"></header>
    <div class="main-content">
      <main>
        <table class="review-table">
          <thead>
          <tr>
            <th>
              <div class="th-content-date">
                <span>리뷰 일시</span>
                <div class="sort-arrows">
                  <span
                      class="arrow"
                      :class="{ active: sortStates.created_date.active && sortStates.created_date.direction === 'ASC' }"
                      @click="handleSort('created_date', 'ASC')">▲</span>
                  <span
                      class="arrow"
                      :class="{ active: sortStates.created_date.active && sortStates.created_date.direction === 'DESC' }"
                      @click="handleSort('created_date', 'DESC')">▼</span>
                </div>
              </div>
            </th>
            <th>리뷰 번호</th>
            <th>제품명</th>
            <th>
              <div class="th-content-score">
                <span>평점</span>
                <div class="sort-arrows">
                  <span
                      class="arrow"
                      :class="{ active: sortStates.review_score.active && sortStates.review_score.direction === 'ASC' }"
                      @click="handleSort('review_score', 'ASC')">▲</span>
                  <span
                      class="arrow"
                      :class="{ active: sortStates.review_score.active && sortStates.review_score.direction === 'DESC' }"
                      @click="handleSort('review_score', 'DESC')">▼</span>
                </div>
              </div>
            </th>
            <th>리뷰 내용</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="review in searchReview" :key="review.reviewCode">
            <td>{{ new Date(review.createdDate).toLocaleDateString() }}</td>
            <td>{{ review.reviewId }}</td>
            <td>{{ review.goodsCode }}</td>
            <td>{{ review.reviewScore }}</td>
            <td>{{ review.reviewContent }}</td>
          </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button>이전</button>
          <button v-for="page in 3" :key="page" :class="{ active: page === 1 }">
            {{ page }}
          </button>
          <button>다음</button>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup>

import {onMounted, ref} from "vue";
import axios from "axios";

// 리뷰데이터 저장 ref 생성
const searchReview = ref([])
// 정렬 상태 저장 ref
const sortDirection = ref("DESC")

const sortStates = ref({
  created_date: {
    direction: 'DESC',
    active: true
  },
  review_score: {
    direction: 'DESC',
    active: false
  }
})


// 리뷰 목록 가져오는 함수
const fetchReviews = async (field = 'created_date', direction = 'DESC') => {
  try {
    const response = await axios.get('/api/v1/review/list', {
      params: {
        sort: `${field},${direction}`
      }
    })
    searchReview.value = response.data
  } catch (error) {
    console.error('리뷰 목록 조회 실패: ', error)
  }
}
// 정렬 처리 함수
const handleSort = (field, direction) => {
  Object.keys(sortStates.value).forEach(key => {
    if (key !== field) {
      sortStates.value[key].active = false
    }
  })
  sortStates.value[field].direction = direction
  sortStates.value[field].active = true

  fetchReviews(field, direction)
}

onMounted(() => {
  fetchReviews()
})

</script>

<style scoped>

.th-content-date,
.th-content-score {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sort-arrows {
  display: flex;
  align-items: center;
  gap: 2px;
}

.arrow {
  cursor: pointer;
  font-size: 15px;
  color: #666;
  opacity: 0.5;
  user-select: none;
  padding: 0 2px;
}

.arrow.active {
  color: #2196F3;
  font-weight: bold;
}

.arrow:hover {
  color: #1976D2;
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

/* 페이징 관련 스타일 추가 */
.pagination {
  margin-top: 20px;
  text-align: center;
}

.pagination button {
  margin: 0 5px;
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button.active {
  background-color: #4CAF50;
  color: white;
}

.pagination button:hover:not(.active) {
  background-color: #ddd;
}

</style>