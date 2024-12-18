<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getFetch } from "@/stores/apiClient.js";
import { formatDate } from "@/stores/util.js";

const router = useRouter();

// 게시글 목록 및 페이지네이션 상태
const teamBoards = ref([]);
const totalCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);

// 필터링 상태
const startDate = ref('');
const endDate = ref('');
const teamBoardTitle = ref('');
const sort = ref('');
const order = ref('');

// API 호출 함수
const fetchTeamBoards = async () => {
  const searchParams = new URLSearchParams({
    startDate: startDate.value,
    endDate: endDate.value,
    teamBoardTitle: teamBoardTitle.value,
    publishStatus: 'PUBLISHED',
    sort: sort.value,
    order: order.value,
    page: currentPage.value,
    count: itemsPerPage.value
  });

  try {
    const response = await getFetch(`/teamspace/board/list?${searchParams}`);
    teamBoards.value = response.data.data.teamBoardList;
    totalCount.value = response.data.data.totalCount;
  } catch (error) {
    console.error("팀 게시판 목록을 가져오는 데 실패했습니다:", error);
  }
};

// 페이지네이션 관련 computed 속성
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

// 페이지 변경 함수들
const changePage = (page) => {
  currentPage.value = page;
  fetchTeamBoards();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchTeamBoards();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchTeamBoards();
  }
};

// 필터 태그 제거
const removeTag = (key) => {
  if (key === 'startDate') startDate.value = '';
  if (key === 'endDate') endDate.value = '';
  fetchTeamBoards();
};

// 게시글 상세 페이지로 이동
const goToTeamBoardDetail = (teamBoardId) => {
  router.push(`/teamspace/board/${teamBoardId}`);
};

// 게시글 작성 페이지로 이동
const goToTeamBoardWrite = () => {
  router.push('/teamspace/board/save');
};

onMounted(() => {
  fetchTeamBoards();
});
</script>

<template>
  <div class="board-section">
    <div class="header">
      <h2>팀 게시판</h2>
      <button class="add-button" @click="goToTeamBoardWrite">
        + 글쓰기
      </button>
    </div>

    <div class="search-area">
      <input
          type="text"
          placeholder="제목 검색"
          v-model="teamBoardTitle"
          @input="fetchTeamBoards"
      />
      <div class="button-group">
        <button class="search-btn" @click="fetchTeamBoards">검색</button>

        <label>
          시작 날짜
          <input type="date" v-model="startDate" @change="fetchTeamBoards"/>
        </label>

        <label>
          종료 날짜
          <input type="date" v-model="endDate" @change="fetchTeamBoards"/>
        </label>

        <select v-model="sort" class="sort-select" @change="fetchTeamBoards">
          <option value="">정렬 기준</option>
          <option value="title">제목</option>
          <option value="date">등록일</option>
        </select>

        <select v-model="order" class="order-select" @change="fetchTeamBoards">
          <option value="">정렬 방향</option>
          <option value="asc">오름차순</option>
          <option value="desc">내림차순</option>
        </select>
      </div>
    </div>

    <div class="tag-area">
      <span v-if="startDate" class="tag">
        시작 날짜: {{ startDate }}
        <i class="icon-close" @click="removeTag('startDate')">✕</i>
      </span>

      <span v-if="endDate" class="tag">
        종료 날짜: {{ endDate }}
        <i class="icon-close" @click="removeTag('endDate')">✕</i>
      </span>
    </div>

    <div class="board-table">
      <table class="table table-striped">
        <thead>
        <tr class="table-header">
          <th>등록일</th>
          <th>제목</th>
          <th>작성자</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="board in teamBoards"
            :key="board.teamBoardId"
            class="table-row"
            @click="goToTeamBoardDetail(board.teamBoardId)"
        >
          <td>{{ formatDate(board.createdDate) }}</td>
          <td>{{ board.teamBoardTitle }}</td>
          <td>{{ board.userName }}</td>
        </tr>
        </tbody>
      </table>

      <div class="pagination">
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
  </div>
</template>

<style scoped>
.board-section {
  padding: 24px;
  background-color: #ffffff;
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
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
}

.button-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-btn {
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.sort-select, .order-select {
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
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
}

.icon-close {
  font-size: 12px;
  margin-left: 4px;
  cursor: pointer;
}

.board-table {
  width: 100%;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table-header th {
  padding: 12px;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  text-align: left;
}

.table-row {
  cursor: pointer;
}

.table-row td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
}

.table-row:hover {
  background-color: #CFF7D3;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.pagination button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.pagination button:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}
</style>