<script setup>
import {computed, ref} from "vue";
import {getFetch} from "@/stores/apiClient.js";
import {formatDate} from "@/stores/util.js";
import CustomerOrderListFilterModal from "@/components/Customer/CustomerOrderListFilterModal.vue";

const props = defineProps({
  customerCode: {
    type: String,
    required: true
  }
});

// api 호출을 위한 변수
const searchCriteria = ref('name');
const searchTerm = ref('');
const sortCriteria = ref('')
const orderDir = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalCount = ref(0);

// 필터 모달창 변수
const filter = ref({
  startDate: '',
  endDate: '',
  minPrice: null,
  maxPrice: null,
  status: ''
});

// 필터를 열기 위한 변수
const isFilterModalOpen = ref(false);

// 모달창을 띄우는 메서드
const openFilterModal = () => {
  isFilterModalOpen.value = true;
}

// 모달창을 닫는 메서드
const closeFilterModal = () => {
  isFilterModalOpen.value = false;
}

// 고객 정보를 저장할 변수
const customerOrderInfo = ref({});

// 고객 정보를 가져오는 메서드
const fetchCustomerDetails = async () => {

  // 검색 요청을 위한 데이터 준비
  const searchParams = new URLSearchParams({
    startDate: filter.value.startDate,
    endDate: filter.value.endDate,
    orderId: searchCriteria.value === 'orderId' ? searchTerm.value : '',
    goodsName: searchCriteria.value === 'name' ? searchTerm.value : '',
    minPrice: filter.value.minPrice !== null ? filter.value.minPrice : '',
    maxPrice: filter.value.maxPrice !== null ? filter.value.maxPrice : '',
    orderStatus: filter.value.status,
    sort: sortCriteria.value,
    order: orderDir.value,
    page: currentPage.value,
    count: itemsPerPage.value
  });

  console.log(`${searchParams}`);
  console.log(props.customerCode);
  try {
    console.log(props.customerCode);
    const response = await getFetch(`/customer/${props.customerCode}/orderinfo/list?${searchParams}`)
    console.log(response);
    customerOrderInfo.value = response.data.data.customerOrderInfoList;
    totalCount.value = response.data.data.totalCount;
    console.log(customerOrderInfo.value);
  } catch (error) {
    console.error('고객 정보를 가져오는 데 실패했습니다:', error);
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
  fetchCustomerDetails();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchCustomerDetails();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchCustomerDetails();
  }
};

// 필터 조건 태그 삭제
const removeTag = (key) => {
  filter.value[key] = ''; // 해당 필터 조건 초기화
  fetchCustomerDetails();
};

const applyFilter = (newFilter) => {
  filter.value = newFilter;
  closeFilterModal();
  fetchCustomerDetails();
}

const changeEngToKor = (eng) => {
  let answer = '';
  if (eng === 'PURCHASED') answer = '구매';
  else if (eng === 'REFUND') answer = '환불';
  else answer = '취소';
  return answer;
}

</script>

<template>
  <div class="search-section">
    <div class="search-area">
      <input
          type="text"
          placeholder="제품명 또는 주문 코드로 검색"
          v-model="searchTerm"
          @input="fetchCustomerDetails"
      />
      <div class="button-group">
        <select v-model="searchCriteria" class="search-criteria-select">
          <option value="name">이름</option>
          <option value="orderId">주문번호</option>
        </select>
        <button class="search-btn" @click="fetchCustomerDetails" @keyup.enter="fetchCustomerDetails">검색</button>
        <button class="filter-btn" @click="openFilterModal">필터</button>

        <select v-model="sortCriteria" class="sort-select" @change="fetchCustomerDetails">
          <option value="" selected>정렬 기준</option>
          <option value="orderPrice">주문 가격</option>
          <option value="goodsName">제품명</option>
          <option value="createdDate">구매일</option>
        </select>

        <select v-model="orderDir" class="order-select" @change="fetchCustomerDetails">
          <option value="" selected>정렬 방향</option>
          <option value="asc">오름차순</option>
          <option value="desc">내림차순</option>
        </select>
        <button class="export-btn">내보내기</button>
      </div>
    </div>

    <div class="tag-area">
      <span v-if="filter.startDate" class="tag">
        시작 기간: {{ filter.startDate }}
        <i class="icon-close" @click="removeTag('startDate')">✕</i>
      </span>

      <span v-if="filter.endDate" class="tag">
        종료 기간: {{ filter.endDate }}
        <i class="icon-close" @click="removeTag('endDate')">✕</i>
      </span>

      <span v-if="filter.minPrice" class="tag">
        최소 금액: {{ filter.minPrice }}
        <i class="icon-close" @click="removeTag('minPrice')">✕</i>
      </span>

      <span v-if="filter.maxPrice" class="tag">
        최대 금액: {{ filter.maxPrice }}
        <i class="icon-close" @click="removeTag('maxPrice')">✕</i>
      </span>

      <span v-if="filter.status" class="tag">
        상태: {{ filter.status }}
        <i class="icon-close" @click="removeTag('status')">✕</i>
      </span>
    </div>

    <!-- 필터 모달 -->
    <CustomerOrderListFilterModal
        v-if="isFilterModalOpen"
        :filter="filter"
        @update:filter="applyFilter"
        @close="closeFilterModal"
    />
  </div>

  <!-- 고객 정보 테이블 -->
  <div class="customer-table">
    <table class="table table-striped">
      <thead>
      <tr class="table-header">
        <th>주문일시</th>
        <th>주문번호</th>
        <th>제품명</th>
        <th>수량</th>
        <th>구매금액</th>
        <th>상태</th>
      </tr>
      </thead>
      <tbody class="table-body">
      <tr v-for="orderInfo in customerOrderInfo" :key="orderInfo.orderId" class="table-row">
        <td>
          <div>{{ formatDate(orderInfo.createdDate) }}</div>
        </td>
        <td><div>{{ orderInfo.orderId }}</div></td>
        <td>{{ orderInfo.goodsName }}</td>
        <td>
          <div>{{ orderInfo.orderCount }}</div>
        </td>
        <td>{{ orderInfo.orderPrice }}</td>
        <td>{{ changeEngToKor(orderInfo.orderStatus) }}</td>
      </tr>
      </tbody>
    </table>
    <!-- 페이지네이 -->
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

</template>

<style scoped>
.stat-value strong {
  font-size: 24px;
  font-weight: 600;
}

.search-section {
  margin-bottom: 24px;
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