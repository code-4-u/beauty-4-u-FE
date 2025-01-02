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
  <div class="container">
    <div class="inform-management">
      <div class="header">
        <h2>Q&A</h2>
        <button class="add-button" @click="goToQnaSave">
          + 질문 등록
        </button>
      </div>

      <!-- 필터링 섹션 -->
      <div class="filter-section">
        <div class="search-bar">
          <div class="form-group">
            <label>질문명</label>
            <input
                type="text"
                placeholder="질문 제목 입력"
                v-model="qnaTitle"
                @input="fetchQnas"
            />
          </div>
          <div class="form-group">
            <label>시작일</label>
            <input
                type="date"
                v-model="startDate"
                @change="fetchQnas"
            />
          </div>
          <div class="form-group">
            <label>종료일</label>
            <input
                type="date"
                v-model="endDate"
                @change="fetchQnas"
            />
          </div>
          <div class="form-group">
            <label>정렬 기준</label>
            <select v-model="sort" @change="fetchQnas">
              <option value="">선택</option>
              <option value="title">제목명</option>
              <option value="view">조회수</option>
              <option value="date">등록일</option>
            </select>
          </div>
          <div class="form-group">
            <label>정렬 방향</label>
            <select v-model="order" @change="fetchQnas">
              <option value="">선택</option>
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </div>
        </div>
        <div class="button-group">
          <button class="search-button" @click="fetchQnas">검색</button>
          <button class="reset-button" @click="resetFilters">초기화</button>
        </div>
      </div>

      <!-- 선택된 필터 태그 -->
      <div class="tag-area" v-if="startDate || endDate">
        <span v-if="startDate" class="badge">
          시작 기간: {{ startDate }}
          <i class="icon-close" @click="removeTag('startDate')">✕</i>
        </span>
        <span v-if="endDate" class="badge">
          종료 기간: {{ endDate }}
          <i class="icon-close" @click="removeTag('endDate')">✕</i>
        </span>
      </div>

      <!-- 테이블 섹션 -->
      <div class="table-container">
        <table class="custom-table">
          <thead>
          <tr>
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
              @click="goToQnaDetail(qna.inquiryId, qna.inquiryViewcount)"
          >
            <td>{{ formatDate(qna.createdDate) }}</td>
            <td>{{ qna.inquiryTitle }}</td>
            <td>{{ qna.userName }}</td>
            <td>
              <div :class="['status-badge', qna.inquiryReplyYn === 'Y' ? 'answered' : 'waiting']">
                {{ qna.inquiryReplyYn === 'Y' ? '답변완료' : '답변대기' }}
              </div>
            </td>
            <td>{{ qna.inquiryViewcount }}</td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 -->
      <div class="pagination">
        <button
            class="page-button"
            @click="changePage(1)"
            :disabled="currentPage === 1"
        >
          &lt;&lt;
        </button>
        <button
            class="page-button"
            @click="prevPage"
            :disabled="currentPage === 1"
        >
          &lt;
        </button>
        <button
            v-for="page in visiblePages"
            :key="page"
            :class="['page-button', { active: page === currentPage }]"
            @click="changePage(page)"
        >
          {{ page }}
        </button>
        <button
            class="page-button"
            @click="nextPage"
            :disabled="currentPage === totalPages"
        >
          &gt;
        </button>
        <button
            class="page-button"
            @click="changePage(totalPages)"
            :disabled="currentPage === totalPages"
        >
          &gt;&gt;
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 2rem;
}

.inform-management {
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.filter-section {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.search-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.search-button,
.reset-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.search-button {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.search-button:hover {
  background-color: #45a049;
}

.reset-button {
  background-color: #9ca3af;
  color: white;
  border: none;
}

.reset-button:hover {
  background-color: #6b7280;
}

.tag-area {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #dbeafe;
  color: #1e40af;
}

.icon-close {
  cursor: pointer;
  font-size: 0.75rem;
}

.icon-close:hover {
  opacity: 0.7;
}

/* 상태 배지 스타일 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
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

.table-container {
  margin: 2rem 0;
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.custom-table th,
.custom-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.custom-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.custom-table tbody tr {
  cursor: pointer;
  transition: all 0.2s;
}

.custom-table tbody tr:hover {
  background-color: #f0fdf4;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.page-button {
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-button:hover:not(:disabled) {
  border-color: #4CAF50;
  color: #4CAF50;
  background-color: #f0fdf4;
}

.page-button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-button:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .inform-management {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .search-bar {
    grid-template-columns: 1fr;
  }

  .add-button {
    width: 100%;
    justify-content: center;
  }

  .button-group {
    flex-direction: column;
    width: 100%;
  }

  .search-button,
  .reset-button {
    width: 100%;
  }

  .custom-table {
    font-size: 0.875rem;
  }

  .custom-table th,
  .custom-table td {
    padding: 0.75rem;
  }
}
</style>