<script setup>
import {computed, onMounted, ref} from "vue";
import {getFetch, putFetch} from "@/stores/apiClient.js";
import {formatDate} from "@/stores/util.js";
import {useRouter} from 'vue-router';

const router = useRouter();

const qnas = ref([]);
const totalCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const startDate = ref('');
const endDate = ref('');
const qnaTitle = ref('');
const sort = ref('');
const order = ref('');

const fetchQnas = async () => {
  const searchParams = new URLSearchParams({
    qnaTitle: qnaTitle.value,
    publishStatus: 'PUBLISHED',
    sort: sort.value,
    order: order.value,
    page: currentPage.value,
    count: itemsPerPage.value
  });

  try {
    const response = await getFetch(`/inquiry/list?${searchParams}`);
    qnas.value = response.data.data.qnaList;
    totalCount.value = response.data.data.totalCount;
  } catch (error) {
    console.error("Q&A 목록을 가져오는 데 오류가 발생했습니다:", error);
  }
};

// 총 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / itemsPerPage.value);
});

// 표시할 페이지 번호 계산
const visiblePages = computed(() => {
  const pages = [];
  const startPage = Math.max(1, currentPage.value - 2);
  const endPage = Math.min(totalPages.value, currentPage.value + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  return pages;
});

const changePage = (page) => {
  currentPage.value = page;
  fetchQnas();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchQnas();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchQnas();
  }
};

const removeTag = (key) => {
  key.value = '';
  fetchQnas();
};

const updateQnaViewcount = async (qnaId, count) => {
  const viewCount = Number(count) + 1;
  try {
    const response = await putFetch(
        `/inquiry/${qnaId}/qnaViewcount`, {
          qnaViewcount: viewCount
        }
    )
  } catch (error) {
    console.error("조회수를 수정하는데 있어 문제가 생겼습니다.", error);
  }
}

const goToQnaDetail = (qnaId, qnaViewcount) => {
  updateQnaViewcount(qnaId, qnaViewcount);
  router.push({
    path: `/qna/${qnaId}`
  });
};

const goToQnaSave = () => {
  router.push({
    path: '/qna/save'
  });
};

onMounted(() => {
  fetchQnas();
});
</script>

<template>
  <div class="container-wrapper">
    <div class="content-container">
      <div class="qna-section">
        <div class="header">
          <h2>Q&A</h2>
          <button class="add-button" @click="goToQnaSave">
            + 질문 등록
          </button>
        </div>

        <div class="search-area">
          <input
              type="text"
              placeholder="질문 제목 입력"
              v-model="qnaTitle"
              @input="fetchQnas"
          />
          <div class="button-group">
            <button class="search-btn" @click="fetchQnas" @keyup.enter="fetchQnas">검색</button>

            <label>
              시작 날짜
              <input type="date" v-model="startDate" @click="fetchQnas"/>
            </label>

            <label>
              종료 날짜
              <input type="date" v-model="endDate" @click="fetchQnas"/>
            </label>

            <select v-model="sort" class="sort-select" @change="fetchQnas">
              <option value="" selected>정렬 기준</option>
              <option value="title">제목명</option>
              <option value="view">조회수</option>
              <option value="date">등록일</option>
            </select>

            <select v-model="order" class="order-select" @change="fetchQnas">
              <option value="" selected>정렬 방향</option>
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </div>
        </div>

        <div class="tag-area">
      <span v-if="startDate" class="tag">
        시작 기간: {{ startDate }}
        <i class="icon-close" @click="removeTag('startDate')">✕</i>
      </span>

          <span v-if="endDate" class="tag">
        종료 기간: {{ endDate }}
        <i class="icon-close" @click="removeTag('endDate')">✕</i>
      </span>
        </div>
      </div>

      <div class="customer-table">
        <table class="table table-striped">
          <thead>
          <tr class="table-header">
            <th>등록일</th>
            <th>질문</th>
            <th>작성자</th>
            <th>상태</th>
            <th>조회수</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="qna in qnas"
              :key="qna.inquiryId"
              class="table-row"
              @click="goToQnaDetail(qna.inquiryId, qna.inquiryViewcount)"
          >
            <td>
              <div>{{ formatDate(qna.createdDate) }}</div>
            </td>
            <td>
              <div>{{ qna.inquiryTitle }}</div>
            </td>
            <td>
              <div>{{ qna.userName }}</div>
            </td>
            <td>
              <div :class="['status-badge', qna.inquiryReplyYn === 'Y' ? 'answered' : 'waiting']">
                {{ qna.inquiryReplyYn === 'Y' ? '답변완료' : '답변대기' }}
              </div>
            </td>
            <td>
              <div>{{ qna.inquiryViewcount }}</div>
            </td>
          </tr>
          </tbody>
        </table>

        <div class="pagination justify-content-center">
          <button class="btn btn-light" @click="prevPage" :disabled="currentPage === 1">이전</button>
          <span v-for="page in visiblePages" :key="page">
        <button
            class="btn" :class="{ active: page === currentPage }"
            @click="changePage(page)"
        >{{ page }}</button>
      </span>
          <button class="btn btn-light" @click="nextPage" :disabled="currentPage === totalPages">다음</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container-wrapper {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.stat-value strong {
  font-size: 24px;
  font-weight: 600;
}

.qna-section {
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

.tag-area {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 13px;
  background: #f0f9ff;
  color: #0288d1;
  cursor: pointer;
}

.icon-close {
  font-size: 12px;
  margin-left: 4px;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.waiting {
  background-color: #fff3e0;
  color: #e65100;
}

.status-badge.answered {
  background-color: #e8f5e9;
  color: #2e7d32;
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

.pagination span {
  margin: 0 5px;
  padding: 5px 10px;
  border-radius: 20px;
  background-color: #f0f0f0;
}

.table.table-striped tbody tr:hover {
  background-color: #CFF7D3 !important;
  color: white !important;
  cursor: pointer;
}

.table.table-striped tbody tr:hover td {
  background-color: #CFF7D3 !important;
  color: black !important;
}
</style>