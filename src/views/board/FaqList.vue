<script setup>
import {ref, computed, onMounted} from 'vue';
import {getFetch, putFetch} from "@/stores/apiClient.js";
import { useRouter } from 'vue-router';

const router = useRouter();

// 상태 관리
const faqs = ref([]);
const currentPage = ref(1);
const itemsPerPage = 10;
const totalCount = ref(0);
const searchQuery = ref('');
const sort = ref('');
const order = ref('');

// FAQ 데이터 가져오기
const performSearch = async () => {
  try {
    const searchParams = new URLSearchParams({
      faqTitle: searchQuery.value,
      sort: sort.value,
      order: order.value,
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

// FAQ 등록 페이지로 이동
const goToFaqSave = () => {
  router.push({
    path: '/faq/save'
  });
};

// 조회수 업데이트
const updateFaqViewcount = async (faqId, count) => {
  const viewCount = Number(count) + 1;
  try {
    await putFetch(
        `/inquiry/faq/${faqId}/faqViewcount`,
        { faqViewcount: viewCount }
    );
  } catch (error) {
    console.error("조회수를 수정하는데 있어 문제가 생겼습니다.", error);
  }
};

// FAQ 상세 조회 페이지로 이동
const goToFaqDetail = (faqId, faqViewcount) => {
  updateFaqViewcount(faqId, faqViewcount);
  router.push({
    path: `/faq/${faqId}`
  });
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
    await performSearch();
  }
};

const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    await performSearch();
  }
};

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    await performSearch();
  }
};

// 검색 처리
const handleSearch = async () => {
  currentPage.value = 1;
  await performSearch();
};

// 컴포넌트 마운트 시
onMounted(async () => {
  await performSearch();
});
</script>

<template>
  <div class="faq-section">
    <div class="header">
      <h2>FAQ</h2>
      <button class="add-button" @click="goToFaqSave">
        + FAQ 등록
      </button>
    </div>

    <div class="search-area">
      <input
          type="text"
          v-model="searchQuery"
          placeholder="FAQ 제목 입력"
          @keyup.enter="handleSearch"
      />
      <div class="button-group">
        <button class="search-btn" @click="handleSearch">검색</button>

        <select v-model="sort" class="sort-select" @change="handleSearch">
          <option value="" selected>정렬 기준</option>
          <option value="title">제목명</option>
          <option value="view">조회수</option>
        </select>

        <select v-model="order" class="order-select" @change="handleSearch">
          <option value="" selected>정렬 방향</option>
          <option value="asc">오름차순</option>
          <option value="desc">내림차순</option>
        </select>
      </div>
    </div>

    <div class="customer-table">
      <table class="table table-striped">
        <thead>
        <tr class="table-header">
          <th>번호</th>
          <th>제목</th>
          <th>조회수</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="(faq, index) in faqs"
            :key="faq.faqId"
            class="table-row"
            @click="goToFaqDetail(faq.faqId, faq.faqViewcount)"
        >
          <td>
            <div>{{ (currentPage - 1) * itemsPerPage + index + 1 }}</div>
          </td>
          <td>
            <div>{{ faq.faqTitle }}</div>
          </td>
          <td>
            <div>{{ faq.faqViewcount }}</div>
          </td>
        </tr>
        </tbody>
      </table>

      <div class="pagination justify-content-center">
        <button class="btn btn-light" @click="prevPage" :disabled="currentPage === 1">이전</button>
        <span v-for="page in visiblePages" :key="page">
          <button
              class="btn"
              :class="{ active: page === currentPage }"
              @click="changePage(page)"
          >{{ page }}</button>
        </span>
        <button class="btn btn-light" @click="nextPage" :disabled="currentPage === totalPages">다음</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.faq-section {
  margin-bottom: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.add-button:hover {
  background-color: #45a049;
}

.search-area {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
}

.search-area input {
  flex: 1;
  border: none;
  padding: 8px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.search-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.customer-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background-color: #f0f0f0;
  border-bottom: 1px solid #ddd;
}

.table-header th {
  text-align: left;
  padding: 12px;
}

.table-row {
  cursor: pointer;
  border-bottom: 1px solid #ddd;
}

.table-row td {
  padding: 10px;
  text-align: left;
}

.table-row td div {
  margin-bottom: 5px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
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
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  margin: 0 5px;
}

.table.table-striped tbody tr:hover {
  background-color: #CFF7D3 !important;
  cursor: pointer;
}

.table.table-striped tbody tr:hover td {
  background-color: #CFF7D3 !important;
  color: black !important;
}

/* Select 스타일링 */
.sort-select,
.order-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}
</style>