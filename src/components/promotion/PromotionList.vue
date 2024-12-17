<template>
  <div class="content">
    <div class="page-header">
      <h2>프로모션 목록</h2>
      <button class="add-button">프로모션 등록</button>
    </div>
    <SearchForm @search="onSearch" />
    <PromotionTable :promotions="promotions" />
    <Pagination :totalItems="totalItems" :itemsPerPage="count" @page-changed="onPageChanged" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PromotionTable from './PromotionTable.vue';
import Pagination from './Pagination.vue';
import SearchForm from './SearchForm.vue';
import {getFetch} from "@/stores/apiClient.js";

const promotions = ref([]);
const totalItems = ref(0);
const count = ref(10); // 페이지당 항목 수
const searchParams = ref({}); // 검색 조건 저장

const onSearch = async (params) => {
  searchParams.value = params; // 검색 조건 업데이트
  try {
    const searchQuery = new URLSearchParams({...params, page: 1}).toString(); // 페이지는 1로 고정
    const response = await getFetch(`/promotion?${searchQuery}`);
    promotions.value = response.data.promotions;
    totalItems.value = response.data.totalCount;
  } catch (error) {
    console.error(error);
  }
};

const onPageChanged = (newPage) => {
  // 페이지 변경 시 검색 조건에 페이지 번호 추가하여 다시 검색
  onSearch({ ...searchParams.value, page: newPage });
};
</script>

<style scoped>
.content {
  flex: 1;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>