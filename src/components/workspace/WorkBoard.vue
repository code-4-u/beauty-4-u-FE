<script setup>
import { computed, onMounted, ref } from "vue";
import { getFetch } from "@/stores/apiClient.js";
import { formatDate } from "@/stores/util.js";
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const router = useRouter();
const userStore = useAuthStore();

const works = ref([]);
const totalCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(12);
const startDate = ref('');
const endDate = ref('');
const workTitle = ref('');
const sort = ref('');
const order = ref('');

// 게시글의 첫 번째 이미지 파일 ID를 찾는 함수
const findFirstImageFileId = (fileList) => {
  if (!fileList || fileList.length === 0) return null;
  return fileList[0];
};

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
    const boardList = response.data.data.teamBoardList;

    // 각 게시글의 파일 목록을 가져옴
    const worksWithThumbnails = await Promise.all(
        boardList.map(async (work) => {
          try {
            // 게시글에 연결된 파일 목록 조회
            const fileResponse = await getFetch(`/file/list?fileType=TEAMBOARD&fileUrl=${work.teamBoardId}`);
            const fileList = fileResponse.data.data.fileList;

            // S3 URL을 직접 썸네일로 사용
            const thumbnailUrl = findFirstImageFileId(fileList);

            return {
              ...work,
              thumbnailUrl
            };
          } catch (error) {
            console.error(`파일 목록을 가져오는데 실패했습니다: ${work.teamBoardId}`, error);
            return {
              ...work,
              thumbnailUrl: null
            };
          }
        })
    );

    works.value = worksWithThumbnails;
    totalCount.value = response.data.data.totalCount;
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
  if (key === 'startDate') {
    startDate.value = '';
  } else if (key === 'endDate') {
    endDate.value = '';
  }
  fetchWorks();
};

const resetFilters = () => {
  startDate.value = '';
  endDate.value = '';
  workTitle.value = '';
  sort.value = '';
  order.value = '';
  fetchWorks();
};

const goToWorkDetail = (teamBoardId) => {
  router.push({
    path: `/workspace/board/${teamBoardId}`
  });
};

const goToWorkSave = () => {
  router.push({
    path: `/workspace/board/save`
  });
};

onMounted(() => {
  fetchWorks();
});
</script>

<template>
  <div class="container">
    <div class="workboard-management">
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

      <!-- 필터링 섹션 -->
      <div class="filter-section">
        <div class="search-bar">
          <div class="form-group">
            <label>워크보드명</label>
            <input
                type="text"
                placeholder="워크보드 제목 입력"
                v-model="workTitle"
                @input="fetchWorks"
            />
          </div>
          <div class="form-group">
            <label>시작일</label>
            <input
                type="date"
                v-model="startDate"
                @change="fetchWorks"
            />
          </div>
          <div class="form-group">
            <label>종료일</label>
            <input
                type="date"
                v-model="endDate"
                @change="fetchWorks"
            />
          </div>
          <div class="form-group">
            <label>정렬 기준</label>
            <select v-model="sort" @change="fetchWorks">
              <option value="">선택</option>
              <option value="title">제목명</option>
              <option value="view">조회수</option>
              <option value="date">등록일</option>
            </select>
          </div>
          <div class="form-group">
            <label>정렬 방향</label>
            <select v-model="order" @change="fetchWorks">
              <option value="">선택</option>
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </div>
        </div>
        <div class="button-group">
          <button class="search-button" @click="fetchWorks">검색</button>
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

      <!-- 카드 그리드 -->
      <div class="work-grid">
        <div
            v-for="work in works"
            :key="work.teamBoardId"
            class="work-card"
            @click="goToWorkDetail(work.teamBoardId)"
        >
          <div class="thumbnail-container">
            <img
                v-if="work.thumbnailUrl"
                :src="work.thumbnailUrl"
                :alt="work.teamBoardTitle"
                class="thumbnail-image"
            />
            <div v-else class="thumbnail-placeholder">
              <span>No Image</span>
            </div>
          </div>
          <div class="work-card-content">
            <h3 class="work-title">{{ work.teamBoardTitle }}</h3>
            <div class="work-info">
              <span class="work-date">{{ formatDate(work.createdDate) }}</span>
              <span class="work-author">{{ work.userName }}</span>
            </div>
          </div>
        </div>
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

.workboard-management {
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

.reset-button {
  background-color: #9ca3af;
  color: white;
  border: none;
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

/* 카드 그리드 스타일 */
.work-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.work-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.work-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #4CAF50;
}

.thumbnail-container {
  width: 100%;
  height: 160px;
  background-color: #f3f4f6;
  position: relative;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  color: #9ca3af;
  font-size: 0.875rem;
}

.work-card-content {
  padding: 1rem;
}

.work-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.work-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
}

/* 페이지네이션 스타일 */
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

/* 반응형 스타일 */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .workboard-management {
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

  .work-grid {
    grid-template-columns: 1fr;
  }

  .thumbnail-container {
    height: 140px;  /* 모바일에서는 썸네일 높이 조정 */
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
}
</style>