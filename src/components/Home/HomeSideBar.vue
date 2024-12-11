<script setup>
import { ref, computed } from 'vue';

const events = ref([
    { date: '2023-10-01', title: '이벤트 1' },
    { date: '2023-10-15', title: '이벤트 2' },
    { date: '2023-10-20', title: '이벤트 3' },
]);

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;

const searchQuery = ref('');
const showSearch = ref(false);
const selectedMonth = ref(currentMonth);

const months = [
    { value: 1, name: '1월' },
    { value: 2, name: '2월' },
    { value: 3, name: '3월' },
    { value: 4, name: '4월' },
    { value: 5, name: '5월' },
    { value: 6, name: '6월' },
    { value: 7, name: '7월' },
    { value: 8, name: '8월' },
    { value: 9, name: '9월' },
    { value: 10, name: '10월' },
    { value: 11, name: '11월' },
    { value: 12, name: '12월' },
];

const filteredEvents = computed(() => {
    return events.value.filter(event => {
        const eventMonth = new Date(event.date).getMonth() + 1;
        return eventMonth === selectedMonth.value && event.title.includes(searchQuery.value);
    });
});
</script>

<template>
  <div class="sidebar">
    <h2>선택한 달의 일정</h2>
    <div class="select-container">
      <select v-model="selectedMonth">
        <option v-for="month in months" :key="month.value" :value="month.value">{{ month.name }}</option>
      </select>
      <button @click="showSearch = !showSearch">{{ showSearch ? '검색 닫기' : '검색 열기' }}</button>
    </div>
    <input v-if="showSearch" :class="{ show: showSearch }" type="text" v-model="searchQuery" placeholder="일정 검색" />
    
    <div class="separator"></div>
    
    <h3>{{ selectedMonth }}월의 일정</h3>
    <ul>
      <li v-for="event in filteredEvents" :key="event.date">
        {{ event.date }}: {{ event.title }}
      </li>
      <li v-if="filteredEvents.length === 0">선택한 월에 일정이 없습니다.</li>
    </ul>
  </div>
</template>

<style scoped>
.sidebar {
  width: 300px;
  background-color: #f9f9f9;
  padding: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

h2 {
  color: #333;
  font-size: 1.6em;
  margin-bottom: 15px;
  font-weight: 600;
}

.select-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

select {
  width: 60%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 0.9em;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;
}

input[type="text"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 15px;
  opacity: 0;
  transition: opacity 0.5s ease, transform 0.5s ease;
  transform: translateY(-10px);
}

input[type="text"].show {
  opacity: 1;
  transform: translateY(0);
}

.separator {
  height: 1px;
  background-color: #e0e0e0;
  margin: 15px 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin: 10px 0;
  color: #555;
  padding: 10px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

li:hover {
  background-color: #e9ecef;
}
</style>