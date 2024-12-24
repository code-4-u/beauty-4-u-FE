<script setup>
import { computed, onMounted, ref } from "vue";
import { getFetch, putFetch } from "@/stores/apiClient.js";
import { formatDate } from "@/stores/util.js";
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const router = useRouter();
const userStore = useAuthStore();

const works = ref([]);
const totalCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(12); // 카드 형태이므로 한 페이지당 더 많은 항목 표시
const startDate = ref('');
const endDate = ref('');
const workTitle = ref('');
const sort = ref('');
const order = ref('');

const fetchWorks = async () => {
  const searchParams = new URLSearchParams({
    startDate: startDate.value,
    endDate: endDate.value,
    teamBoardTitle: workTitle.value,
    publishStatus: 'PUBLISHED',
    sort: sort.value,
    order: order.value,
    page: currentPage.value,
    count: itemsPerPage.value
  });

  try {
    const response = await getFetch(`/teamspace/board/list?${searchParams}`);
    works.value = response.data.data.teamBoardList;
    totalCount.value = response.data.data.totalCount;

    console.log(works.value)
  } catch (error) {
    console.error("워크보드 데이터를 가져오는 데 오류가 발생했습니다:", error);
  }
};

const totalPages = computed(() => {
  return Math.ceil(totalCount.value / itemsPerPage.value);
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

const changePage = (page) => {
  currentPage.value = page;
  fetchWorks();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchWorks();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchWorks();
  }
};

const removeTag = (key) => {
  key.value = '';
  fetchWorks();
};

const goToWorkDetail = (workId) => {
  router.push({
    path: `/workspace/board/${workId}`
  });
};

const goToWorkSave = (workId) => {
  router.push({
    path: `/workspace/${workId}/save`
  });
};

onMounted(() => {
  fetchWorks();
});
</script>

<template>
  <div class="container-wrapper">
    <div class="content-container">
      <div class="work-section">
        <div class="header">
          <h2>워크보드</h2>
          <button
              v-if="userStore.userRole === 'ADMIN'"
              class="add-button"
              @click="goToWorkSave"
          >
            + 워크보드 등록
          </button>
        </div>

        <div class="search-area">
          <input
              type="text"
              placeholder="워크보드 제목 입력"
              v-model="workTitle"
              @input="fetchWorks"
          />
          <div class="button-group">
            <button class="search-btn" @click="fetchWorks">검색</button>

            <label>
              시작 날짜
              <input type="date" v-model="startDate" @change="fetchWorks"/>
            </label>

            <label>
              종료 날짜
              <input type="date" v-model="endDate" @change="fetchWorks"/>
            </label>

            <select v-model="sort" class="sort-select" @change="fetchWorks">
              <option value="" selected>정렬 기준</option>
              <option value="title">제목명</option>
              <option value="view">조회수</option>
              <option value="date">등록일</option>
            </select>

            <select v-model="order" class="order-select" @change="fetchWorks">
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

      <div class="work-grid">
        <div
            v-for="work in works"
            :key="work.workId"
            class="work-card"
            @click="goToWorkDetail(work.teamBoardId)"
        >
          <div class="work-card-content">
            <h3 class="work-title">{{ work.teamBoardTitle }}</h3>
            <div class="work-info">
              <span class="work-date">{{ formatDate(work.createdDate) }}</span>
              <span class="work-author">{{ work.userName }}</span>
              </div>
          </div>
        </div>
      </div>

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
.container-wrapper {
  padding: 24px;
  background-color: var(--background-color);
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

.work-section {
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

/* 카드 그리드 레이아웃 */
.work-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.work-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  overflow: hidden;
}

.work-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background-color: #f8fff9;
}

.work-card-content {
  padding: 16px;
}

.work-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.work-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.work-date, .work-author, .work-views {
  display: flex;
  align-items: center;
  gap: 4px;
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
</style>