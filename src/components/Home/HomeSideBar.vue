<script setup>
import { ref, computed, inject } from 'vue';
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { delFetch } from "@/stores/apiClient.js";

const events = inject('events');

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

const formatDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (start === end) {
    return new Date(start).toLocaleDateString();
  }

  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
};

const handleDeleteEvent = async (eventId) => {
  if (!confirm('이 일정을 삭제하시겠습니까?')) {
    return;
  }

  try {
    await delFetch(`/schedule/${eventId}`);
    // 성공적으로 삭제되면 로컬 events 배열에서도 제거
    const index = events.value.findIndex(e => e.id === eventId);
    if (index !== -1) {
      events.value.splice(index, 1);
    }
  } catch (error) {
    console.error('일정 삭제에 실패했습니다.', error);
    alert('일정 삭제에 실패했습니다.');
  }
};

const filteredEvents = computed(() => {
  return events.value.filter(event => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end || event.start);
    const startMonth = startDate.getMonth() + 1;
    const endMonth = endDate.getMonth() + 1;

    const isInSelectedMonth =
        (startMonth <= selectedMonth.value && endMonth >= selectedMonth.value) ||
        startMonth === selectedMonth.value ||
        endMonth === selectedMonth.value;

    const matchesSearch = !searchQuery.value ||
        event.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (event.content && event.content.toLowerCase().includes(searchQuery.value.toLowerCase()));

    return isInSelectedMonth && matchesSearch;
  }).sort((a, b) => new Date(a.start) - new Date(b.start));
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
      <li v-for="event in filteredEvents" :key="event.id" :style="{ borderLeft: `4px solid ${event.color || '#2196F3'}` }">
        <div class="event-header">
          <div class="event-title">{{ event.title }}</div>
          <font-awesome-icon
              :icon="['far', 'trash-can']"
              class="delete-icon"
              @click="handleDeleteEvent(event.id)"
          />
        </div>
        <div class="event-date">
          {{ formatDateRange(event.start, event.end || event.start) }}
        </div>
        <p v-if="event.content" class="event-content">{{ event.content }}</p>
      </li>
      <li v-if="filteredEvents.length === 0" class="no-events">선택한 월에 일정이 없습니다.</li>
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
  padding: 10px 10px 10px 15px;
  border-radius: 5px;
  transition: background-color 0.3s;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

li:hover {
  background-color: #f8f9fa;
}

.event-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.event-date {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.event-content {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
  margin-bottom: 0;
  white-space: pre-wrap;
}

.no-events {
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.event-title {
  font-weight: 600;
  color: #333;
  flex-grow: 1;
}

.delete-icon {
  color: #666;
  cursor: pointer;
  padding: 4px;
  transition: color 0.3s;
}

.delete-icon:hover {
  color: #dc3545;
}

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
  padding: 10px 10px 10px 15px;
  border-radius: 5px;
  transition: background-color 0.3s;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

li:hover {
  background-color: #f8f9fa;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.event-title {
  font-weight: 600;
  color: #333;
  flex-grow: 1;
}

.delete-icon {
  color: #666;
  cursor: pointer;
  padding: 4px;
  transition: color 0.3s;
}

.delete-icon:hover {
  color: #dc3545;
}

.event-date {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.event-content {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
  margin-bottom: 0;
  white-space: pre-wrap;
}

.no-events {
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}
</style>