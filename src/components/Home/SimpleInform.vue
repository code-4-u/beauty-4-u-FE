<script setup>
import { ref, onMounted } from 'vue';
import { getFetch } from '@/stores/apiClient.js'
import {formatDate} from "@/stores/util.js";

const informs = ref([]);

const currentPage = ref(1);
const itemsPerPage = ref(3);

const fetchNotices = async () => {

  // 검색 요청을 위한 데이터 준비
  const searchParams = new URLSearchParams({
    publishStatus: 'PUBLISHED',
    page: currentPage.value,
    count: itemsPerPage.value
  });

  try {
    const response = await getFetch(`/inform/list?${searchParams}`); // 여기에 API URL을 입력하세요
    informs.value = response.data.data; // API 응답 데이터로 notices 업데이트
  } catch (error) {
    console.error("공지사항을 가져오는 데 오류가 발생했습니다:", error);
  }
};

onMounted(() => {
  fetchNotices(); // 컴포넌트가 마운트될 때 API 호출
});

const handleMoreClick = () => {
  // 더보기 클릭 시 동작할 코드
  console.log("더보기 클릭됨");
};
</script>

<template>
  <div class="notice-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h2>공지사항</h2>
      <div class="more-button" @click="handleMoreClick">더보기</div>
    </div>
    <ul style="margin-top: 16px;">
      <li v-for="inform in informs" :key="inform.informId">
        <span>{{ inform.informTitle }}</span>
        <span>{{ formatDate(inform.createdDate) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.notice-container {
  border: 1px solid #ccc;
  padding: 16px;
  border-radius: 8px;
}

.notice-container h2 {
  margin-bottom: 12px;
}

.notice-container ul {
  list-style-type: none;
  padding: 0;
}

.notice-container li {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px; /* 간격을 넓히기 위해 값 증가 */
}

.notice-container .more-button {
  background-color: transparent; /* 배경 투명 */
  border: none; /* 기본 테두리 제거 */
  border-bottom: 1px solid rgba(204, 204, 204, 0.5); /* 아래쪽 테두리만 흐리게 */
  border-radius: 0; /* 모서리 둥글게 제거 */
  padding: 4px 8px; /* 패딩을 줄여서 크기 축소 */
  cursor: pointer; /* 커서 모양 변경 */
  display: inline-block; /* 인라인 블록으로 설정 */
}

/* 호버 스타일 제거 */
.notice-container .more-button:hover {
  background-color: transparent; /* 호버 시 배경색 없음 */
}
</style>