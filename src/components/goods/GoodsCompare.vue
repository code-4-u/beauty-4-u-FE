<script setup>
import { ref, watch } from 'vue';
import {getFetch} from "@/stores/apiClient.js";

const props = defineProps({
  selectedYear: {
    type: Number,
    required: true
  },
  selectedMonth: {
    type: Number,
    required: true
  },
  goodsCode: {
    type: String,
    required: true
  }
});

const compareData = ref(null);

const fetchCompareData = async () => {
  try {

    const queryParams = new URLSearchParams({
      year: props.selectedYear,
      month: props.selectedMonth
    });

    const response = await getFetch(`/api/goods/sales/${props.goodsCode}?${queryParams.toString()}`);

    compareData.value = response.data.data;
  } catch (err) {
    console.error('API 호출 오류:', err);
  }
};

// props가 변경될 때마다 API 호출
watch(
    [() => props.selectedYear, () => props.selectedMonth, () => props.goodsCode],
    () => {
      if (props.selectedYear && props.selectedMonth) {
        fetchCompareData();
      }
    },
    { immediate: true }
);
</script>

<template>
  <div>
    <p>현재 매출액: {{ compareData.currentYearMonthlySales }}</p>
    <p>과거 매출액: {{ compareData.lastYearMonthlySales }}</p>
    <p>비교: {{ compareData.percent }}</p>
  </div>
</template>

<style scoped>

</style>