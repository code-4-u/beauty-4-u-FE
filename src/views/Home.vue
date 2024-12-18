<script setup>
import {computed, onMounted, provide, reactive, ref} from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {getFetch, postFetch, putFetch, delFetch} from "@/stores/apiClient.js";

// State
const events = ref([]);
const isModalOpen = ref(false);
const eventForm = reactive({
  id: '',
  title: '',
  content: '',
  startDate: '',
  startTime: '00:00',
  endDate: '',
  endTime: '00:00',
  color: '#2196F3',
  type: 'TEAMSPACE'
});

// Provide/inject
provide('events', events);

const selectedTypes = reactive({
  teamspace: true,
  promotion: true
});
provide('selectedTypes', selectedTypes);

// Computed
const filteredEvents = computed(() => {
  return events.value.filter(event => {
    if (event.type === 'TEAMSPACE' && !selectedTypes.teamspace) return false;
    if (event.type === 'PROMOTION' && !selectedTypes.promotion) return false;
    return true;
  });
});

const teamEvents = computed(() => {
  return events.value.filter(event => event.type === 'TEAMSPACE');
});

const promotionEvents = computed(() => {
  return events.value.filter(event => event.type === 'PROMOTION');
});

// Utility functions
const formatDate = (date) => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul'
  }).split('. ').join('-').replace('.', '');
};

const formatTime = (date) => {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul'
  });
};

const formatDateTime = (dateStr, timeStr = '00:00') => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
};

// Form handlers
const resetEventForm = () => {
  Object.assign(eventForm, {
    id: '',
    title: '',
    content: '',
    startDate: '',
    startTime: '00:00',
    endDate: '',
    endTime: '00:00',
    color: '#2196F3',
    type: 'TEAMSPACE'
  });
};

const closeModal = () => {
  isModalOpen.value = false;
  resetEventForm();
};

// Event handlers
const handleDateClick = (info) => {
  eventForm.startDate = info.dateStr;
  eventForm.endDate = info.dateStr;
  isModalOpen.value = true;
};

const handleEventClick = (info) => {
  const event = events.value.find(e => e.id === Number(info.event.id));
  if (!event) return;

  const startDateTime = new Date(event.start);
  const endDateTime = new Date(event.end);

  Object.assign(eventForm, {
    id: event.id,
    title: event.title,
    content: event.content,
    startDate: formatDate(startDateTime),
    startTime: formatTime(startDateTime),
    endDate: formatDate(endDateTime),
    endTime: formatTime(endDateTime),
    color: event.color
  });

  isModalOpen.value = true;
};

const handleEventDrop = async (info) => {
  const event = events.value.find(e => e.id === Number(info.event.id));
  if (!event) return;

  try {
    await putFetch(`/schedule/${event.id}`, {
      scheduleTitle: event.title,
      scheduleContent: event.content,
      scheduleStart: info.event.startStr,
      scheduleEnd: info.event.endStr
    });

    event.start = info.event.startStr;
    event.end = info.event.endStr;
  } catch (error) {
    console.error('일정 업데이트 실패:', error);
    alert('일정 변경에 실패했습니다.');
  }
};

// CRUD operations
const handleDelete = async () => {
  if (!confirm('이 일정을 삭제하시겠습니까?')) return;

  try {
    await delFetch(`/schedule/${eventForm.id}`);
    events.value = events.value.filter(e => e.id !== eventForm.id);
    closeModal();
  } catch (error) {
    console.error('일정 삭제 실패:', error);
    alert('일정 삭제에 실패했습니다.');
  }
};

const saveEvent = async () => {
  if (!eventForm.title) {
    alert('제목을 입력해주세요.');
    return;
  }

  try {
    const response = await postFetch('/schedule', {
      scheduleTitle: eventForm.title,
      scheduleContent: eventForm.content,
      scheduleStart: formatDateTime(eventForm.startDate, eventForm.startTime),
      scheduleEnd: formatDateTime(eventForm.endDate, eventForm.endTime)
    });

    events.value.push({
      id: response.data.data,
      title: eventForm.title,
      content: eventForm.content,
      start: formatDateTime(eventForm.startDate, eventForm.startTime),
      end: formatDateTime(eventForm.endDate, eventForm.endTime),
      color: eventForm.color,
      type: 'TEAMSPACE'
    });

    closeModal();
  } catch (error) {
    console.error('일정 저장 실패:', error);
    alert('일정 저장에 실패했습니다.');
  }
};

const updateEvent = async () => {
  try {
    await putFetch(`/schedule/${eventForm.id}`, {
      scheduleTitle: eventForm.title,
      scheduleContent: eventForm.content,
      scheduleStart: formatDateTime(eventForm.startDate, eventForm.startTime),
      scheduleEnd: formatDateTime(eventForm.endDate, eventForm.endTime)
    });

    const index = events.value.findIndex(e => e.id === eventForm.id);
    if (index !== -1) {
      events.value[index] = {
        ...events.value[index],
        title: eventForm.title,
        content: eventForm.content,
        start: formatDateTime(eventForm.startDate, eventForm.startTime),
        end: formatDateTime(eventForm.endDate, eventForm.endTime)
      };
    }
    closeModal();
  } catch (error) {
    console.error('일정 수정 실패:', error);
    alert('일정 수정에 실패했습니다.');
  }
};

const handleSubmit = () => {
  if (!eventForm.title) {
    alert('제목을 입력해주세요.');
    return;
  }
  eventForm.id ? updateEvent() : saveEvent();
};

// calendarOptions 수정
const calendarOptions = reactive({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  views: {
    dayGridMonth: {
      buttonText: '월별',
      dayMaxEventRows: 4,
      moreLinkContent: count => `+${count}개 더보기`
    },
    timeGridWeek: {
      buttonText: '주별',
      slotMinTime: '07:00:00',
      slotMaxTime: '22:00:00'
    },
    timeGridDay: {
      buttonText: '일별',
      slotMinTime: '07:00:00',
      slotMaxTime: '22:00:00'
    }
  },
  events: filteredEvents,
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  displayEventTime: true,
  navLinks: true,
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  locale: 'ko',
  height: 'auto',
  eventClassNames: (arg) => {
    return [
      'calendar-event',
      arg.event.extendedProps.type === 'TEAMSPACE' ? 'team-event' : 'promotion-event'
    ];
  }
});

const fetchSchedules = async () => {
  try {
    const response = await getFetch('/schedule');
    events.value = response.data.data.map(schedule => ({
      id: schedule.scheduleId,
      title: schedule.scheduleTitle,
      content: schedule.scheduleContent,
      start: schedule.scheduleStart,
      end: schedule.scheduleEnd,
      color: schedule.scheduleType === 'TEAMSPACE' ? '#2196F3' : '#FF4081',
      type: schedule.scheduleType
    }));
  } catch (error) {
    console.error('일정 로드 실패:', error);
  }
};

onMounted(() => {
  fetchSchedules();
});
</script>

<template>
  <div class="page-container">
    <div class="main-content">
      <!-- 상단 통계 카드 -->
      <div class="stats-row">
        <div class="stats-card">
          <h3 class="card-title">매출 상승 TOP 3</h3>
          <div class="stats-content">
            <div class="stats-item">
              <span class="stats-label">1. 수분 크림</span>
              <span class="stats-value increase">+32.5%</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">2. 썬크림</span>
              <span class="stats-value increase">+28.7%</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">3. 립밤</span>
              <span class="stats-value increase">+25.2%</span>
            </div>
          </div>
        </div>

        <div class="stats-card">
          <h3 class="card-title">매출 하락 TOP 3</h3>
          <div class="stats-content">
            <div class="stats-item">
              <span class="stats-label">1. 회색 마스크팩</span>
              <span class="stats-value decrease">-15.8%</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">2. 노란색 틴트</span>
              <span class="stats-value decrease">-12.4%</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">3. 반짝 아이브로우</span>
              <span class="stats-value decrease">-8.9%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 캘린더 섹션 -->
      <div class="content-row">
        <div class="calendar-card">
          <div class="card-header">
            <h3 class="card-title">일정 캘린더</h3>
            <div class="filter-group">
              <label class="filter-label">
                <input type="checkbox" v-model="selectedTypes.teamspace">
                <span class="filter-text">팀 일정</span>
              </label>
              <label class="filter-label">
                <input type="checkbox" v-model="selectedTypes.promotion">
                <span class="filter-text">프로모션</span>
              </label>
            </div>
          </div>
          <div class="calendar-wrapper">
            <FullCalendar :options="calendarOptions" />
          </div>
        </div>

        <!-- 일정 카드들 -->
        <div class="events-column">
          <!-- 팀 일정 카드 -->
          <div class="event-card">
            <h3 class="card-title">팀 일정</h3>
            <div class="event-list">
              <div v-for="event in teamEvents" :key="event.id" class="event-item">
                <div class="event-content">
                  <h4 class="event-item-title">{{ event.title }}</h4>
                  <p class="event-date">{{ formatDate(new Date(event.start)) }}</p>
                  <p v-if="event.content" class="event-desc">{{ event.content }}</p>
                </div>
              </div>
              <div v-if="!teamEvents.length" class="no-events">
                팀 일정이 없습니다
              </div>
            </div>
          </div>

          <!-- 프로모션 카드 -->
          <div class="event-card">
            <h3 class="card-title">프로모션</h3>
            <div class="event-list">
              <div v-for="event in promotionEvents" :key="event.id" class="event-item">
                <div class="event-content">
                  <h4 class="event-item-title">{{ event.title }}</h4>
                  <p class="event-date">{{ formatDate(new Date(event.start)) }}</p>
                  <p v-if="event.content" class="event-desc">{{ event.content }}</p>
                </div>
              </div>
              <div v-if="!promotionEvents.length" class="no-events">
                프로모션 일정이 없습니다
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h3 class="modal-title">{{ eventForm.id ? '일정 수정' : '새 일정 추가' }}</h3>
      <div class="form-group">
        <label>제목</label>
        <input v-model="eventForm.title" type="text" placeholder="일정 제목">
      </div>
      <div class="form-group">
        <label>내용</label>
        <textarea v-model="eventForm.content" placeholder="일정 내용"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>시작</label>
          <div class="datetime-inputs">
            <input v-model="eventForm.startDate" type="date">
            <input v-model="eventForm.startTime" type="time">
          </div>
        </div>
        <div class="form-group">
          <label>종료</label>
          <div class="datetime-inputs">
            <input v-model="eventForm.endDate" type="date">
            <input v-model="eventForm.endTime" type="time">
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" @click="handleSubmit">
          {{ eventForm.id ? '수정' : '저장' }}
        </button>
        <button v-if="eventForm.id" class="btn btn-danger" @click="handleDelete">
          삭제
        </button>
        <button class="btn btn-secondary" @click="closeModal">취소</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 1.5rem;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 통계 카드 스타일 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.content-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1rem;
  min-height: 600px;
}

/* 카드 공통 스타일 */
.stats-card, .calendar-card, .event-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

/* 통계 카드 내부 스타일 */
.stats-card {
  padding: 1.25rem;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-label {
  font-size: 0.95rem;
  color: #4b5563;
}

.stats-value {
  font-weight: 600;
  font-size: 0.95rem;
}

.increase {
  color: #059669;
}

.decrease {
  color: #dc2626;
}

/* 캘린더 카드 스타일 */
.calendar-card {
  padding: 1.25rem;
}

.card-header {
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375em 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-label:hover {
  border-color: #2563eb;
}

/* 일정 카드 스타일 */
.events-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  padding: 1.25rem;
  flex: 1;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 250px;
  overflow-y: auto;
}

.event-item {
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.event-item-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.event-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.event-desc {
  font-size: 0.875rem;
  color: #4b5563;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

.no-events {
  text-align: center;
  padding: 1rem;
  color: #6b7280;
  font-style: italic;
  background: #f8fafc;
  border-radius: 0.5rem;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* calendar-card 내부에 추가 */
.calendar-wrapper :deep(.fc) {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.calendar-wrapper :deep(.fc-toolbar-title) {
  font-size: 1.25rem !important;
  font-weight: 600;
  color: #1f2937;
}

.calendar-wrapper :deep(.fc-button) {
  background: #f8fafc !important;
  border: 1px solid #e5e7eb !important;
  color: #4b5563 !important;
  font-weight: 500;
  text-transform: none !important;
  padding: 0.5rem 1rem !important;
  transition: all 0.2s ease;
}

.calendar-wrapper :deep(.fc-button:hover) {
  background: #f1f5f9 !important;
  border-color: #d1d5db !important;
}

.calendar-wrapper :deep(.fc-button-active) {
  background: #e2e8f0 !important;
  border-color: #cbd5e1 !important;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06) !important;
}

.calendar-wrapper :deep(.fc-day-today) {
  background-color: #f8fafc !important;
}

.calendar-wrapper :deep(.calendar-event) {
  margin: 1px 0;
  padding: 2px 4px;
  border-radius: 4px;
  border: none !important;
  font-size: 0.875rem;
}

.calendar-wrapper :deep(.team-event) {
  background-color: #3b82f6 !important;
  color: white !important;
}

.calendar-wrapper :deep(.promotion-event) {
  background-color: #f43f5e !important;
  color: white !important;
}

.calendar-wrapper :deep(.fc-day) {
  transition: background-color 0.2s ease;
}

.calendar-wrapper :deep(.fc-day:hover) {
  background-color: #f8fafc;
}

@media (max-width: 640px) {
  .calendar-wrapper :deep(.fc-toolbar) {
    flex-direction: column;
    gap: 1rem;
  }

  .calendar-wrapper :deep(.fc-toolbar-chunk) {
    display: flex;
    justify-content: center;
  }
}

/* 반응형 스타일 */
@media (max-width: 1024px) {
  .content-row {
    grid-template-columns: 1fr;
  }

  .events-column {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .events-column {
    grid-template-columns: 1fr;
  }
}
</style>