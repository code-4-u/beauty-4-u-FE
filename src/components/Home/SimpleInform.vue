<script setup>
import { ref, onMounted } from 'vue';
import { getFetch } from '@/stores/apiClient.js'
import {formatDate} from "@/stores/util.js";
import {useRouter} from 'vue-router';

const router = useRouter();

const informs = ref([]);

const currentPage = ref(1);
const itemsPerPage = ref(3);

const fetchNotices = async () => {

  // 검색 요청을 위한 데이터 준비
  const searchParams = new URLSearchParams({
    page: currentPage.value,
    count: itemsPerPage.value
  });

  try {
    const response = await getFetch(`/inform/list?${searchParams}`);
    informs.value = response.data.data.informList;
    console.log(informs.value)
  } catch (error) {
    console.error("공지사항을 가져오는 데 오류가 발생했습니다:", error);
  }
};

const goToDetail = (informId) => {
  router.push({
    path: `/board/inform/${informId}`
  });
};

const toInformList = () => {
  router.push({
    path: `/board/inform`
  });
};

onMounted(() => {
  fetchNotices();
});
</script>

<template>
  <div class="notice-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h2>공지사항</h2>
      <div class="more-button" @click="toInformList">더보기</div>
    </div>
    <ul style="margin-top: 16px;">
      <li v-for="inform in informs" :key="inform.informId" @click="goToDetail(inform.informId)">
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
  margin-bottom: 16px;
  cursor: pointer;
}

.notice-container .more-button {
  background-color: transparent;
  border: none;
  border-bottom: 1px solid rgba(204, 204, 204, 0.5);
  border-radius: 0;
  padding: 4px 8px;
  display: inline-block;
}

/* 호버 스타일 제거 */
.notice-container .more-button:hover {
  background-color: transparent;
}
</style>