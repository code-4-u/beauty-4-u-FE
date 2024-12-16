<script setup>
import {ref, computed, onMounted} from 'vue';
import { getFetch } from "@/stores/apiClient.js";

// 상태 관리
const faqs = ref([]);
const currentPage = ref(1);
const itemsPerPage = 10;
const totalCount = ref(0);
const searchQuery = ref('');

// FAQ 데이터 가져오기
const performSearch = async () => {
  try {
    const searchParams = new URLSearchParams({
      faqTitle: searchQuery.value,
      page: currentPage.value,
      count: itemsPerPage
    });

    const response = await getFetch(`/inquiry/faq/list?${searchParams}`);
    faqs.value = response.data.data.faqList;
    totalCount.value = response.data.data.totalCount;
  } catch (error) {
    console.error('FAQ 목록을 불러오는 중 에러가 발생했습니다:', error);
  }
};

// 총 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / itemsPerPage);
});

const visiblePages = computed(() => {
  const pages = [];
  const startPage = Math.max(1, currentPage.value - 2);
  const endPage = Math.min(totalPages.value, currentPage.value + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
});

// 페이지 변경 함수
const changePage = async (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    await performSearch(); // 페이지 변경 시 데이터 새로 불러오기
  }
};

const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    await performSearch(); // 페이지 변경 시 데이터 새로 불러오기
  }
};

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    await performSearch(); // 페이지 변경 시 데이터 새로 불러오기
  }
};

// 검색 처리
const handleSearch = async () => {
  currentPage.value = 1; // 검색 시 첫 페이지로 이동
  await performSearch();
};

// 컴포넌트 마운트 시
onMounted(async () => {
  await performSearch();
});
</script>

<template>
  <div class="faq-container">
    <h1>FAQ</h1>

    <div class="search-box">
      <div class="search-inner">
        <input
            type="text"
            v-model="searchQuery"
            placeholder="제목으로 검색"
            class="search-input"
            @keyup.enter="handleSearch"
        />
        <button class="search-button" @click="handleSearch">검색</button>
      </div>
    </div>

    <table class="faq-table">
      <thead>
      <tr>
        <th class="number-col">번호</th>
        <th class="title-col">제목</th>
        <th class="count-col">조회수</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(faq, index) in faqs" :key="index">
        <td>{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
        <td>{{ faq.faqTitle }}</td>
        <td>{{ faq.faqViewcount }}</td>
      </tr>
      </tbody>
    </table>

    <div class="pagination justify-content-center">
      <button @click="prevPage" :disabled="currentPage === 1">이전</button>
      <span v-for="page in visiblePages" :key="page">
        <button
            :class="{ active: page === currentPage }"
            @click="changePage(page)"
        >{{ page }}</button>
      </span>
      <button @click="nextPage" :disabled="currentPage === totalPages">다음</button>
    </div>
  </div>
</template>

<style scoped>
.faq-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-box {
  margin: 20px 0;
}

.search-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.faq-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.faq-table th,
.faq-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.faq-table th {
  background-color: #f8f9fa;
}

.number-col {
  width: 100px;
}

.count-col {
  width: 100px;
}

.title-col {
  min-width: 200px;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.pagination button {
  margin: 0 5px;
  padding: 5px 10px;
  border: none;
  border-radius: 20px;
  background-color: #f0f0f0;
  color: black;
  cursor: pointer;
}

.pagination button.active {
  background-color: #4CAF50;
  color: white;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination span {
  margin: 0 5px;
}

.search-inner {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-button:hover {
  background-color: #45a049;
}
</style>