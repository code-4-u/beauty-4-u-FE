<template>
  <table>
    <thead>
    <tr>
      <th>번호</th>
      <th>제목</th>
      <th>시작 날짜</th>
      <th>종료 날짜</th>
      <th>진행 상태</th>
      <th>관리</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="(promotion, index) in promotions" :key="promotion.id">
      <td>{{ index + 1 }}</td>
      <td>{{ promotion.title }}</td>
      <td>{{ promotion.startDate }}</td>
      <td>{{ promotion.endDate }}</td>
      <td>{{ promotion.status }}</td>
      <td>
        <button>수정</button>
        <button>삭제</button>
      </td>
    </tr>
    </tbody>
  </table>
</template>

<script setup>
defineProps({
  promotions: {
    type: Array,
    required: true
  }
});
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

th {
  background-color: #f5f5f5;
}
</style>