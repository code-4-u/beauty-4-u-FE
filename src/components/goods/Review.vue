<template>
  <div class="product-review-page">
    <header class="header"></header>
    <div class="main-content">
      <aside class="sidebar">
        <GoodsSidebar @select-subcategory="handleSubCategorySelect"/>
      </aside>
      <main>
        <table class="review-table">
          <thead>
          <tr>
            <th>리뷰 일시</th>
            <th>리뷰 번호</th>
            <th>제품명</th>
            <th>평점</th>
            <th>리뷰 내용</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="review in searchReview" :key="review.reviewCode">
            <td>{{ review.createdDate }}</td>
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

import { ref, onMounted }  from "vue";
import axios from "axios";
import GoodsSidebar from "@/components/goods/GoodsSidebar.vue";

// 리뷰데이터 저장 ref 생성
const searchReview = ref([])


// 리뷰 목록 가져오는 함수
const fetchReviews = async () => {
  try{
    const response = await axios.get('/api/v1/review/list', {
      params: {
        sort: 'created_date,DESC'
      }
    })
    searchReview.value = response.data
  } catch (error){
    console.error('리뷰 목록 조회 실패: ', error)
  }
}

onMounted(() => {
  fetchReviews()
})

</script>

<style scoped>

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