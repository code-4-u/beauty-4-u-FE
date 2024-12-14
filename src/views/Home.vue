<script setup>
import {reactive, ref, provide, onMounted} from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import HomeSideBar from "@/components/Home/HomeSideBar.vue";
import SimpleInform from "@/components/Home/SimpleInform.vue";
import {getFetch, postFetch} from "@/stores/apiClient.js";

const events = ref([]);
provide('events', events);

const calendarOptions = reactive({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  views: {
    dayGridMonth: { buttonText: '월별' },
    timeGridWeek: { buttonText: '주별' },
    timeGridDay: { buttonText: '일별' }
  },
  events: events,
  editable: true,
  displayEventTime: true,
  navLinks: true,
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  datesSet: handleDatesSet,
  dayCellClassNames: (arg) => {
    const day = arg.date.getDay();
    return day === 0 ? 'fc-sunday' : day === 6 ? 'fc-saturday' : 'fc-weekday';
  },
  dayHeaderClassNames: (arg) => {
    const day = arg.date.getDay();
    return day === 0 ? 'fc-sunday-header' : day === 6 ? 'fc-saturday-header' : 'fc-weekday-header';
  },
  locale: 'ko',
});

const isModalOpen = ref(false);
const eventForm = reactive({
  title: '',
  content: '',
  startDate: '',
  endDate: '',
  color: '#2196F3'
});

function handleDateClick(info) {
  eventForm.startDate = info.dateStr;
  eventForm.endDate = info.dateStr;
  isModalOpen.value = true;
}

function handleEventClick(info) {
  const event = events.value.find(e => e.id === info.event.id);
  if (event) {
    eventForm.title = event.title;
    eventForm.content = event.content;
    eventForm.startDate = event.start;
    eventForm.endDate = event.end;
    eventForm.color = event.color;
    isModalOpen.value = true;
  }
}

function handleEventDrop(info) {
  const event = events.value.find(e => e.id === info.event.id);
  if (event) {
    event.start = info.event.startStr;
    event.end = info.event.endStr;
  }
}

function handleDatesSet(arg) {
  // 날짜 범위가 변경될 때 필요한 처리
}

async function saveEvent() {
  if (!eventForm.title) {
    alert('제목을 입력해주세요.');
    return;
  }

  const formatDateTime = (dateStr) => {
    return dateStr + 'T00:00:00';
  };

  const newEvent = {
    id: Date.now().toString(),
    title: eventForm.title,
    content: eventForm.content,
    start: eventForm.startDate,
    end: eventForm.endDate,
    color: eventForm.color
  };

  try {
    await postFetch('/schedule',
        {
          scheduleTitle: eventForm.title,
          scheduleContent: eventForm.content,
          scheduleStart: formatDateTime(eventForm.startDate),
          scheduleEnd: formatDateTime(eventForm.endDate)
        }
    );
  } catch (error) {
    console.error('일정을 저장하는데 실패했습니다.', error);
  }

  events.value.push(newEvent);

  // 폼 초기화
  eventForm.title = '';
  eventForm.content = '';
  eventForm.startDate = '';
  eventForm.endDate = '';
  eventForm.color = '#2196F3';

  isModalOpen.value = false;
}

const fetchSchedules = async () => {
  try {
    const response = await getFetch('/schedule');
    events.value = response.data.data.map(schedule => ({
      title: schedule.scheduleTitle,
      content: schedule.scheduleContent,
      start: schedule.scheduleStart,
      end: schedule.scheduleEnd,
      color: '#2196F3'
    }));
  } catch (error) {
    console.error('일정을 불러오는데 실패했습니다.', error);
  }
};

onMounted(() => {
  fetchSchedules();
});
</script>

<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-3 sidebar">
        <HomeSideBar />
      </div>
      <div class="col-md-9 main-content content-wrapper">
        <div class="row">
          <div class="col-md-12">
            <FullCalendar :options="calendarOptions" class="custom-calendar" />
          </div>
        </div>
        <div class="row mt-3">
          <div class="col-md-6">
            <div class="notice-section">
              <SimpleInform />
            </div>
          </div>
          <div class="col-md-6">
            <div class="qa-section">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 일정 추가/수정 모달 -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ eventForm.id ? '일정 수정' : '새 일정 추가' }}</h3>
        <div class="form-group">
          <label>제목</label>
          <input v-model="eventForm.title" type="text" class="form-control" placeholder="일정 제목">
        </div>
        <div class="form-group">
          <label>내용</label>
          <textarea v-model="eventForm.content" class="form-control" placeholder="일정 내용"></textarea>
        </div>
        <div class="form-group">
          <label>시작일</label>
          <input v-model="eventForm.startDate" type="date" class="form-control">
        </div>
        <div class="form-group">
          <label>종료일</label>
          <input v-model="eventForm.endDate" type="date" class="form-control">
        </div>
        <div class="form-group">
          <label>색상</label>
          <input v-model="eventForm.color" type="color" class="form-control">
        </div>
        <div class="modal-buttons">
          <button @click="saveEvent" class="btn btn-primary">저장</button>
          <button @click="isModalOpen = false" class="btn btn-secondary">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-calendar {
  max-width: 800px;
  margin: 0 auto;
}

.sidebar {
  height: 100vh;
  border-right: 1px solid #dee2e6;
  overflow-y: auto;
  position: fixed;
  left: 0;
  background-color: #fff;
  width: 300px;
}

.content-wrapper {
  background-color: #fff;
  width: calc(100% - 300px);
  max-width: 4000px;
  margin-left: 300px;
  padding: 2rem;
  overflow-x: auto;
}

.notice-section, .qa-section {
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  background-color: #f8f9fa;
  margin-bottom: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
}
</style>