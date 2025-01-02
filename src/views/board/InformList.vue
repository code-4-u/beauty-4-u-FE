<script setup>
import {computed, onMounted, ref} from "vue";
import {getFetch, putFetch} from "@/stores/apiClient.js";
import {formatDate} from "@/stores/util.js";
import {useRouter} from 'vue-router';
import {useAuthStore} from '@/stores/auth.js'; // userStore import 추가

const router = useRouter();
const userStore = useAuthStore(); // userStore 사용

const informs = ref([]);

const totalCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const startDate = ref('');
const endDate = ref('');
const informTitle = ref('');
const sort = ref('');
const order = ref('');

const fetchInforms = async () => {

  // 검색 요청을 위한 데이터 준비
  const searchParams = new URLSearchParams({
    startDate: startDate.value,
    endDate: endDate.value,
    informTitle: informTitle.value,
    publishStatus: 'PUBLISHED',
    sort: sort.value,
    order: order.value,
    page: currentPage.value,
    count: itemsPerPage.value
  });

  try {
    const response = await getFetch(`/inform/list?${searchParams}`);
    informs.value = response.data.data.informList;
    totalCount.value = response.data.data.totalCount;
  } catch (error) {
    console.error("공지사항을 가져오는 데 오류가 발생했습니다:", error);
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

// 페이지 변경 함수
const changePage = (page) => {
  currentPage.value = page;
  fetchInforms();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchInforms();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchInforms();
  }
};

// 필터 조건 태그 삭제
const removeTag = (key) => {
  key.value = ''; // 해당 필터 조건 초기화
  fetchInforms();
};

const updateInformViewcount = async (informId, count) => {
  const viewCount = Number(count) + 1;
  try {
    const response = await putFetch(
        `/inform/${informId}/informViewcount`, {
          informViewcount: viewCount
        }
    )
  } catch (error) {
    console.error("조회수를 수정하는데 있어 문제가 생겼습니다.", error);
  }

}

// 공지사항 상세 조회 페이지로 이동
const goToInformDetail = (informId, informViewcount) => {
  updateInformViewcount(informId, informViewcount);
  router.push({
    path: `/inform/${informId}`
  });
};

// 공지사항 등록 페이지로 이동
const goToInformSave = () => {
  router.push({
    path: '/inform/save'
  });
};

onMounted(() => {
  fetchInforms();
});
</script>

<template>
  <div class="container">
    <div class="inform-management">
      <div class="header">
        <h2>공지사항</h2>
        <button
            v-if="userStore.userRole === 'ADMIN'"
            class="add-button"
            @click="goToInformSave"
        >
          + 공지사항 등록
        </button>
      </div>

      <div class="filter-section">
        <div class="search-bar">
          <div class="form-group">
            <label>공지사항명</label>
            <input
                type="text"
                placeholder="공지사항 제목 입력"
                v-model="informTitle"
                @input="fetchInforms"
            />
          </div>
          <div class="form-group">
            <label>시작일</label>
            <input
                type="date"
                v-model="startDate"
                @change="fetchInforms"
            />
          </div>
          <div class="form-group">
            <label>종료일</label>
            <input
                type="date"
                v-model="endDate"
                @change="fetchInforms"
            />
          </div>
          <div class="form-group">
            <label>정렬 기준</label>
            <select v-model="sort" @change="fetchInforms">
              <option value="">선택</option>
              <option value="title">제목명</option>
              <option value="view">조회수</option>
              <option value="date">등록일</option>
            </select>
          </div>
          <div class="form-group">
            <label>정렬 방향</label>
            <select v-model="order" @change="fetchInforms">
              <option value="">선택</option>
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </div>
        </div>
        <div class="button-group">
          <button class="search-button" @click="fetchInforms">검색</button>
          <button class="reset-button" @click="resetFilters">초기화</button>
        </div>
      </div>

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

      <div class="table-container">
        <table class="custom-table">
          <thead>
          <tr>
            <th>등록일</th>
            <th>공지사항</th>
            <th>작성자</th>
            <th>조회수</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="inform in informs"
              :key="inform.informId"
              @click="goToInformDetail(inform.informId, inform.informViewcount)"
          >
            <td>{{ formatDate(inform.createdDate) }}</td>
            <td>{{ inform.informTitle }}</td>
            <td>{{ inform.userName }}</td>
            <td>{{ inform.informViewcount }}</td>
          </tr>
          </tbody>
        </table>
      </div>

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