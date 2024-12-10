<script setup>
import {computed, onMounted, ref} from 'vue'
import {getFetch} from '@/stores/apiClient'
import CustomerListFilterModal from '@/components/Customer/CustomerListFilterModal.vue'
import router from "@/router/index.js";
import {formatDate} from "@/stores/util.js"
import {useCustomerStore} from "@/stores/customerPinia.js";

const cStore = useCustomerStore();

// 상태 관리
const customers = ref([])
const customerStats = ref(null)
const totalCustomers = ref(null)
const goldCustomers = ref(null)
const newCustomers = ref(null)
const inactiveCustomers = ref(null)

const totalCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10); // 한 페이지당 아이템 수

const searchTerm = ref('');
const searchCriteria = ref('name');

const sortCriteria = ref('');
const order = ref('');

// API 요청 함수들
const fetchCustomerStats = async () => {
  try {
    const response = await getFetch('/customer/list/stats');
    customerStats.value = response.data.data;

    // 응답 데이터로 통계 정보 업데이트
    totalCustomers.value = customerStats.value.customerCount; // 전체 고객 수
    goldCustomers.value = customerStats.value.customerGoldCount; // VIP 고객 수
    newCustomers.value = customerStats.value.customerNewCount; // 신규 가입 수
    inactiveCustomers.value = customerStats.value.customerDormantCount; // 휴면 고객 수

    console.log(newCustomers.value);
  } catch (error) {
    console.error('고객 통계 조회 실패:', error);
  }
};

// 이벤트 핸들러
const handlePageChange = (page) => {
  currentPage.value = page
}

const handleSearch = async () => {
  performSearch()
}

const isFilterModalOpen = ref(false)
const filter = ref({
  grade: '',
  code: '',
  gender: '',
  ageGroup: ''
})

// 필터 모달 열기
const openFilterModal = () => {
  isFilterModalOpen.value = true
}

// 필터 모달 닫기
const closeFilterModal = () => {
  isFilterModalOpen.value = false
}

// 필터 적용 후 모달 닫기
const applyFilter = (newFilter) => {
  filter.value = newFilter;
  closeFilterModal();
  performSearch();
};

const performSearch = async () => {

  // 검색 요청을 위한 데이터 준비
  const searchParams = new URLSearchParams({
    name: searchCriteria.value === 'name' ? searchTerm.value : '',
    code: searchCriteria.value === 'code' ? searchTerm.value : '',
    grade: filter.value.grade,
    gender: filter.value.gender,
    ageGroup: filter.value.ageGroup,
    sort: sortCriteria.value, // 정렬 기준 (필요에 따라 수정 가능)
    order: order.value, // 정렬 순서 (필요에 따라 수정 가능)
    page: currentPage.value, // 페이지 번호 (필요에 따라 수정 가능)
    count: itemsPerPage.value // 한 페이지당 목 수 (필요에 따라 수정 가능)
  });

  // 검색 요청을 보내는 로직 (예: API 호출)
  try {
    const response = await getFetch(`/customer/list?${searchParams}`);
    console.log('검색 결과:', response);
    customers.value = response.data.data.customerList; // 검색 결과를 customers에 저장
    totalCount.value = response.data.data.totalCount;
    console.log(customers.value);
  } catch (error) {
    console.error('검색 요청 실패:', error);
  }
}

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
  performSearch(); // 검색 실행
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    performSearch(); // 검색 실행
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    performSearch(); // 검색 실행
  }
};

const removeTag = (key) => {
  filter.value[key] = ''; // 해당 필터 조건 초기화
  performSearch(); // 필터가 변경되면 검색 수행
};

const manageCustomer = (customerCode, customerName, createdDate, customerGrade) => {
  cStore.updateCustomerDetails(customerCode, customerName, createdDate, customerGrade);

  // 고객 관리 페이지로 이동
  router.push({
        path: `/customer/${customerCode}`
      }
  );
}

// 초기 데이터 로딩
onMounted(async () => {
  await Promise.all([
    fetchCustomerStats(),
  ])
})
</script>

<template>
  <div class="customer-list">
    <h2 class="title">고객 관리</h2>

    <!-- 통계 카드 -->
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-title">
          <span>전체 고객</span>
          <i class="icon-users blue"></i>
        </div>
        <div class="stat-value">
          <strong>{{ totalCustomers }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-title">
          <span>GOLD 고객</span>
          <i class="icon-star gold"></i>
        </div>
        <div class="stat-value">
          <strong>{{ goldCustomers }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-title">
          <span>신규 가입</span>
          <i class="icon-user-plus green"></i>
        </div>
        <div class="stat-value">
          <strong>{{ newCustomers }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-title">
          <span>휴면 고객</span>
          <i class="icon-user-minus red"></i>
        </div>
        <div class="stat-value">
          <strong>{{ inactiveCustomers }}</strong>
        </div>
      </div>
    </div>

    <!-- 검색 영역 -->
    <div class="search-section">
      <div class="search-area">
        <input
            type="text"
            placeholder="이름, 고객 코드로 검색"
            v-model="searchTerm"
            @input="handleSearch"
        />
        <div class="button-group">
          <select v-model="searchCriteria" class="search-criteria-select">
            <option value="name">이름</option>
            <option value="code">코드</option>
          </select>
          <button class="search-btn" @click="handleSearch">검색</button>
          <button class="filter-btn" @click="openFilterModal">필터</button>
          <select v-model="sortCriteria" class="sort-select" @change="performSearch">
            <option value="" selected>정렬 기준</option>
            <option value="name">이름</option>
            <option value="joinDate">가입일</option>
            <option value="lastOrderDate">최근 구매일</option>
          </select>
          <select v-model="order" class="order-select" @change="performSearch">
            <option value="" selected>정렬 방향</option>
            <option value="asc">오름차순</option>
            <option value="desc">내림차순</option>
          </select>
          <button class="export-btn">내보내기</button>
        </div>
      </div>

      <div class="tag-area">
          <span v-if="filter.grade" class="tag">
            {{ filter.grade }} 등급
            <i class="icon-close" @click="removeTag('grade')">✕</i>
          </span>
        <span v-if="filter.code" class="tag">
            코드: {{ filter.code }}
            <i class="icon-close" @click="removeTag('code')">✕</i>
          </span>
        <span v-if="filter.gender" class="tag">
            성별: {{ filter.gender }}
            <i class="icon-close" @click="removeTag('gender')">✕</i>
          </span>
        <span v-if="filter.ageGroup" class="tag">
            연령대: {{ filter.ageGroup }}대
            <i class="icon-close" @click="removeTag('ageGroup')">✕</i>
          </span>
      </div>

      <!-- 필터 모달 -->
      <CustomerListFilterModal
          v-if="isFilterModalOpen"
          :filter="filter"
          @update:filter="applyFilter"
          @close="closeFilterModal"
      />
    </div>

    <!-- 고객 정보 테이블 -->
    <div class="customer-table">
      <table class="customer-t">
        <thead>
        <tr class="table-header">
          <th>고객정보</th>
          <th>등급</th>
          <th>구매정보</th>
          <th>최근 구매일</th>
          <th>가입일</th>
          <th>관리</th>
        </tr>
        </thead>
        <tbody class="table-body">
        <tr v-for="customer in customers" :key="customer.customerCode" class="table-row">
          <td>
            <div>{{ customer.customerName }}</div>
            <div>{{ customer.customerPhone }}</div>
          </td>
          <td>{{ customer.customerGrade }}</td>
          <td>
            <div>총 구매액: {{ customer.totalPurchaseAmount }}원</div>
            <div>구매 횟수: {{ customer.totalPurchaseCount }}회</div>
          </td>
          <td>{{ formatDate(customer.customerLastOrderDate) }}</td>
          <td>{{ formatDate(customer.createdDate) }}</td>
          <td>
            <button @click="manageCustomer(customer.customerCode, customer.customerName, customer.createdDate, customer.customerGrade)">관리</button>
          </td>
        </tr>
        </tbody>
      </table>
      <!-- 페이지네이션 -->
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
  </div>
</template>

<style scoped>
.customer-list {
  padding: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  border-bottom: 2px solid #000;
}

.stats-container {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
}

.stat-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #666;
}

.stat-value {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value strong {
  font-size: 24px;
  font-weight: 600;
}

.increase {
  font-size: 13px;
  color: #2e7d32;
}

.period {
  font-size: 13px;
  color: #666;
}

.search-section {
  margin-bottom: 24px;
}

.customer-t {
  width: 100%;
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

.filter-btn,
.sort-select,
.export-btn {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  color: #333;
  cursor: pointer;
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
</style>