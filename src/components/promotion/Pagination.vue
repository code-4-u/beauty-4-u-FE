<template>
  <div class="pagination">
    <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">이전</button>
    <span v-for="page in pageRange" :key="page">
      <button @click="goToPage(page)" :class="{ active: currentPage === page }">{{ page }}</button>
    </span>
    <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">다음</button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  totalItems: {
    type: Number,
    required: true
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  maxVisibleButtons: {
    type: Number,
    default: 5
  }
});

const emit = defineEmits(['page-changed']);

const currentPage = ref(1);

const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage));

// 페이지 범위 계산
const pageRange = computed(() => {
  const range = [];
  const halfVisible = Math.floor(props.maxVisibleButtons / 2);
  let start = currentPage.value - halfVisible;
  let end = currentPage.value + halfVisible;

  if (start < 1) {
    start = 1;
    end = Math.min(props.maxVisibleButtons, totalPages.value);
  }
  if (end > totalPages.value) {
    end = totalPages.value;
    start = Math.max(1, totalPages.value - props.maxVisibleButtons + 1);
  }

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  return range;
});

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// currentPage 변경 시 이벤트 발생
watch(currentPage, (newPage) => {
  emit('page-changed', newPage);
});
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.pagination button {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 12px;
  margin: 0 5px;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
</style>