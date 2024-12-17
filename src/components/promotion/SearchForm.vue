<template>
  <form @submit.prevent="onSearch">
    <div class="form-container">
      <div>
        <label for="promotionTitle">프로모션 제목:</label>
        <input type="text" id="promotionTitle" v-model="promotionTitle" />
      </div>
      <div>
        <label for="promotionStartDate">시작 날짜:</label>
        <input type="date" id="promotionStartDate" v-model="promotionStartDate" />
      </div>
      <div>
        <label for="promotionEndDate">종료 날짜:</label>
        <input type="date" id="promotionEndDate" v-model="promotionEndDate" />
      </div>
      <div>
        <label for="promotionStatus">진행 상태:</label>
        <select id="promotionStatus" v-model="promotionStatus">
          <option value="진행중">진행중</option>
          <option value="예정">예정</option>
          <option value="종료">종료</option>
        </select>
      </div>
      <div>
        <label for="sort">정렬 기준:</label>
        <select id="sort" v-model="sort">
          <option value="startDate">시작 날짜</option>
          <option value="endDate">종료 날짜</option>
        </select>
      </div>
      <div>
        <label for="order">정렬 방향:</label>
        <select id="order" v-model="order">
          <option value="asc">오름차순</option>
          <option value="desc">내림차순</option>
        </select>
      </div>
      <button type="submit">검색</button>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['search']);

const promotionTitle = ref('');
const promotionStartDate = ref('');
const promotionEndDate = ref('');
const promotionStatus = ref('진행중');
const sort = ref('startDate');
const order = ref('desc');

const onSearch = () => {
  emit('search', {
    promotionTitle: promotionTitle.value,
    promotionStartDate: promotionStartDate.value,
    promotionEndDate: promotionEndDate.value,
    promotionStatus: promotionStatus.value,
    sort: sort.value,
    order: order.value,
    count: 10
  });
};
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.form-container div {
  display: flex;
  align-items: center;
}

label {
  width: 100px;
  margin-right: 10px;
}

input[type="text"], input[type="date"], select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>