<script setup>
import {ref, onMounted, reactive, computed} from 'vue'
import {useRouter} from "vue-router";
import {delFetch, getFetch} from "@/stores/apiClient.js";

const router = useRouter();

// 상태 관리
const promotions = ref([])
const loading = ref(false)
const error = ref(null)

const openCreatePage = () => {
  router.push('/promotion/save')
}

// 필터링 조건
const filters = reactive({
  promotionTitle: '',
  promotionStartDate: '',
  promotionEndDate: '',
  promotionStatus: '',
  sort: '',
  order: 'desc',
  page: 1,
  count: 8
})

const getStatusText = (status) => {
  const statusMap = {
    'BEFORE': '예정',
    'ONGOING': '진행중',
    'ENDED': '종료'
  }
  return statusMap[status] || status
}

// API 호출 함수
const fetchPromotions = async () => {
  try {
    loading.value = true
    // QueryString 생성
    const queryParams = new URLSearchParams({
      promotionTitle: filters.promotionTitle,
      promotionStartDate: filters.promotionStartDate || '',
      promotionEndDate: filters.promotionEndDate || '',
      promotionStatus: filters.promotionStatus,
      sort: filters.sort,
      order: filters.order,
      page: 1,
      count: filters.count
    })

    const response = await getFetch(`/promotion?${queryParams}`)
    promotions.value = response.data.data
  } catch (e) {
    error.value = '프로모션 목록을 불러오는데 실패했습니다.'
    console.error('Error fetching promotions:', e)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (promotionId) => {
  if (!confirm('정말 이 프로모션을 삭제하시겠습니까?')) {
    return;
  }

  try {
    loading.value = true
    await delFetch(`/promotion/${promotionId}`);

    // 삭제 성공 후 목록 새로고침
    await fetchPromotions()
  } catch (e) {
    error.value = '프로모션 삭제에 실패했습니다.'
    console.error('Error deleting promotion:', e)
  } finally {
    loading.value = false
  }
}

// 검색 버튼 클릭
const handleSearch = () => {
  filters.page = 1 // 검색 시 첫 페이지로 이동
  fetchPromotions()
}

// 필터 초기화
const resetFilters = () => {
  Object.assign(filters, {
    promotionTitle: '',
    promotionStartDate: '',
    promotionEndDate: '',
    promotionStatus: '',
    sort: '',
    order: 'desc',
    page: 1,
    count: 8
  })
  fetchPromotions()
}

// 정렬 변경
const handleSort = (column) => {
  if (filters.sort === column) {
    filters.order = filters.order === 'asc' ? 'desc' : 'asc'
  } else {
    filters.sort = column
    filters.order = 'desc'
  }
  fetchPromotions()
}

// 페이지네이션
const totalPages = computed(() => {
  return Math.ceil(promotions.value.length / filters.count)
})

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 행 클릭 핸들러 추가
const handleRowClick = (event, promotionId) => {
  // 관리 버튼 영역 클릭 시 상세 페이지 이동 방지
  if (event.target.closest('.action-buttons')) {
    return
  }
  router.push(`/promotion/${promotionId}`)
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  fetchPromotions()
})
</script>

<template>
  <div class="container">
    <div class="promotion-management">
      <div class="header">
        <h2>프로모션 관리</h2>
        <button class="add-button" @click="openCreatePage">
          + 신규 프로모션 등록
        </button>
      </div>

      <!-- 필터링 섹션 -->
      <div class="filter-section">
        <div class="search-bar">
          <div class="form-group">
            <label>프로모션명</label>
            <input
                v-model="filters.promotionTitle"
                type="text"
                placeholder="프로모션명 입력"
            />
          </div>
          <div class="form-group">
            <label>시작일</label>
            <input
                v-model="filters.promotionStartDate"
                type="date"
            />
          </div>
          <div class="form-group">
            <label>종료일</label>
            <input
                v-model="filters.promotionEndDate"
                type="date"
            />
          </div>
          <div class="form-group">
            <label>상태</label>
            <select v-model="filters.promotionStatus">
              <option value="">전체</option>
              <option value="BEFORE">예정</option>
              <option value="ONGOING">진행중</option>
              <option value="ENDED">종료</option>
            </select>
          </div>
        </div>
        <div class="button-group">
          <button class="search-button" @click="handleSearch">
            검색
          </button>
          <button class="reset-button" @click="resetFilters">
            초기화
          </button>
        </div>
      </div>

      <!-- 프로모션 목록 테이블 -->
      <div class="table-container">
        <table>
          <thead>
          <tr>
            <th @click="handleSort('promotionTitle')" class="sortable">
              프로모션명
              <span v-if="filters.sort === 'promotionTitle'">
                  {{ filters.order === 'asc' ? '↑' : '↓' }}
                </span>
            </th>
            <th>타입</th>
            <th @click="handleSort('promotionStartDate')" class="sortable">
              시작일
              <span v-if="filters.sort === 'promotionStartDate'">
                  {{ filters.order === 'asc' ? '↑' : '↓' }}
                </span>
            </th>
            <th @click="handleSort('promotionEndDate')" class="sortable">
              종료일
              <span v-if="filters.sort === 'promotionEndDate'">
                  {{ filters.order === 'asc' ? '↑' : '↓' }}
                </span>
            </th>
            <th>상태</th>
            <th>관리</th>
          </tr>
          </thead>
          <tbody>
          <tr v-if="loading">
            <td colspan="6" class="text-center">로딩중...</td>
          </tr>
          <tr v-else-if="error">
            <td colspan="6" class="text-center text-red-500">{{ error }}</td>
          </tr>
          <tr v-else v-for="promotion in promotions"
              :key="promotion.promotionId"
              @click="handleRowClick($event, promotion.promotionId)"
              class="promotion-row">
            <td>{{ promotion.promotionTitle }}</td>
            <td>
              <span class="badge type">{{ promotion.promotionTypeName }}</span>
            </td>
            <td>{{ formatDate(promotion.promotionStartDate) }}</td>
            <td>{{ formatDate(promotion.promotionEndDate) }}</td>
            <td>
              <span :class="['badge', promotion.promotionStatus.toLowerCase()]">
                {{ getStatusText(promotion.promotionStatus) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="delete" @click="handleDelete(promotion.promotionId)">삭제</button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 -->
      <div class="pagination">
        <button
            :disabled="filters.page === 1"
            @click="filters.page--; fetchPromotions()"
        >
          이전
        </button>
        <button
            v-for="page in totalPages"
            :key="page"
            :class="{ active: filters.page === page }"
            @click="filters.page = page; fetchPromotions()"
        >
          {{ page }}
        </button>
        <button
            :disabled="filters.page === totalPages"
            @click="filters.page++; fetchPromotions()"
        >
          다음
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

.promotion-management {
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

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background-color: #f9fafb;
  padding: 0.75rem 1rem;
  font-weight: 600;
  text-align: left;
  color: #374151;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  background-color: #f3f4f6;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
}

.badge.before {
  background-color: #fef3c7;
  color: #92400e;
}

.badge.ongoing {
  background-color: #dcfce7;
  color: #15803d;
}

.badge.ended {
  background-color: #f3f4f6;
  color: #4b5563;
}

.badge.type {
  background-color: #dbeafe;
  color: #1e40af;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-buttons button {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-buttons .delete {
  background-color: white;
  border: 1px solid #ef4444;
  color: #ef4444;
}

.action-buttons .delete:hover {
  border-color: #dc2626;
  background-color: #fef2f2;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
  font-weight: 500;
}

.pagination button:hover:not(:disabled) {
  border-color: #4CAF50;
  color: #4CAF50;
  background-color: #f0fdf4;
}

.pagination button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sub-info {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
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

.add-button:active {
  transform: translateY(0);
  box-shadow: none;
}

.promotion-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.promotion-row:hover {
  background-color: #f9fafb;
}

/* 버튼 호버 시 행 배경색 변경 방지 */
.promotion-row:hover .action-buttons {
  background-color: transparent;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .promotion-management {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .search-bar {
    flex-direction: column;
  }

  .action-buttons {
    flex-direction: column;
  }

  .pagination {
    flex-wrap: wrap;
  }
}
</style>