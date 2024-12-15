<script setup>
import {onMounted, provide, reactive, ref} from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import HomeSideBar from "@/components/Home/HomeSideBar.vue";
import SimpleInform from "@/components/Home/SimpleInform.vue";
import {getFetch, postFetch, putFetch, delFetch} from "@/stores/apiClient.js";

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
  id: '',
  title: '',
  content: '',
  startDate: '',
  startTime: '00:00',
  endDate: '',
  endTime: '00:00',
  color: '#2196F3'
});

const resetEventForm = () => {
  eventForm.id = '';
  eventForm.title = '';
  eventForm.content = '';
  eventForm.startDate = '';
  eventForm.startTime = '00:00';
  eventForm.endDate = '';
  eventForm.endTime = '00:00';
  eventForm.color = '#2196F3';
};

const handleDelete = async () => {
  if (!confirm('이 일정을 삭제하시겠습니까?')) {
    return;
  }

  try {
    await delFetch(`/schedule/${eventForm.id}`);

    // 로컬 events 배열에서 제거
    const index = events.value.findIndex(e => e.id === eventForm.id);
    if (index !== -1) {
      events.value.splice(index, 1);
    }

    closeModal();
  } catch (error) {
    console.error('일정 삭제에 실패했습니다.', error);
    alert('일정 삭제에 실패했습니다.');
  }
};

function closeModal() {
  isModalOpen.value = false;
  resetEventForm();
}

function handleDateClick(info) {
  eventForm.startDate = info.dateStr;
  eventForm.endDate = info.dateStr;
  isModalOpen.value = true;
}

function handleEventClick(info) {
  const event = events.value.find(e => e.id === Number(info.event.id));
  if (event) {
    // 한국 시간대 옵션 설정
    const koreaOptions = { timeZone: 'Asia/Seoul' };

    // 날짜 객체 생성 및 한국 시간대로 변환
    const startDateTime = new Date(event.start);
    const endDateTime = new Date(event.end);

    // 날짜를 YYYY-MM-DD 형식으로 변환 (한국 시간 기준)
    const startDate = startDateTime.toLocaleDateString('ko-KR', {
      ...koreaOptions,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('. ').join('-').replace('.', '');

    const endDate = endDateTime.toLocaleDateString('ko-KR', {
      ...koreaOptions,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('. ').join('-').replace('.', '');

    // 시간을 HH:mm 형식으로 변환 (한국 시간 기준)
    const startTime = startDateTime.toLocaleTimeString('ko-KR', {
      ...koreaOptions,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const endTime = endDateTime.toLocaleTimeString('ko-KR', {
      ...koreaOptions,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    eventForm.id = event.id;
    eventForm.title = event.title;
    eventForm.content = event.content;
    eventForm.startDate = startDate;
    eventForm.startTime = startTime;
    eventForm.endDate = endDate;
    eventForm.endTime = endTime;
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

const formatDateTime = (dateStr, timeStr = '00:00') => {
  if (!dateStr) return '';
  // LocalDateTime 형식(YYYY-MM-DDTHH:mm:ss)으로 변환
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');

  // 각 부분이 2자리 수가 되도록 보장
  const formattedMonth = month.padStart(2, '0');
  const formattedDay = day.padStart(2, '0');
  const formattedHours = hours.padStart(2, '0');
  const formattedMinutes = minutes.padStart(2, '0');

  return `${year}-${formattedMonth}-${formattedDay}T${formattedHours}:${formattedMinutes}:00`;
};

async function saveEvent() {
  if (!eventForm.title) {
    alert('제목을 입력해주세요.');
    return;
  }

  const newEvent = {
    id: '',
    title: eventForm.title,
    content: eventForm.content,
    start: formatDateTime(eventForm.startDate, eventForm.startTime),
    end: formatDateTime(eventForm.endDate, eventForm.endTime),
    color: eventForm.color
  };

  try {
    const response = await postFetch('/schedule',
        {
          scheduleTitle: eventForm.title,
          scheduleContent: eventForm.content,
          scheduleStart: newEvent.start,
          scheduleEnd: newEvent.end
        }
    );

    newEvent.id = response.data.data;

  } catch (error) {
    console.error('일정을 저장하는데 실패했습니다.', error);
  }

  events.value.push(newEvent);
  closeModal();
}

async function updateEvent() {
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
        id: eventForm.id,
        title: eventForm.title,
        content: eventForm.content,
        start: formatDateTime(eventForm.startDate, eventForm.startTime),
        end: formatDateTime(eventForm.endDate, eventForm.endTime),
        color: eventForm.color
      };
    }
    closeModal();
  } catch (error) {
    console.error('일정 수정에 실패했습니다.', error);
  }
}

async function handleSubmit() {
  if (!eventForm.title) {
    alert('제목을 입력해주세요.');
    return;
  }

  if (eventForm.id) {
    await updateEvent();
  } else {
    await saveEvent();
  }
}

const fetchSchedules = async () => {
  try {
    const response = await getFetch('/schedule');
    events.value = response.data.data.map(schedule => ({
      id: schedule.scheduleId,
      title: schedule.scheduleTitle,
      content: schedule.scheduleContent,
      start: schedule.scheduleStart, // 이미 LocalDateTime 형식
      end: schedule.scheduleEnd,     // 이미 LocalDateTime 형식
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
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
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
          <label>시작</label>
          <div class="datetime-group">
            <input v-model="eventForm.startDate" type="date" class="form-control">
            <input v-model="eventForm.startTime" type="time" class="form-control">
          </div>
        </div>
        <div class="form-group">
          <label>종료</label>
          <div class="datetime-group">
            <input v-model="eventForm.endDate" type="date" class="form-control">
            <input v-model="eventForm.endTime" type="time" class="form-control">
          </div>
        </div>
        <div class="form-group">
          <label>색상</label>
          <input v-model="eventForm.color" type="color" class="form-control">
        </div>
        <div class="modal-buttons">
          <button @click="handleSubmit" class="btn btn-primary">
            {{ eventForm.id ? '수정' : '저장' }}
          </button>
          <!-- 수정 모드일 때만 삭제 버튼 표시 -->
          <button v-if="eventForm.id" @click="handleDelete" class="btn btn-danger">
            삭제
          </button>
          <button @click="closeModal" class="btn btn-secondary">취소</button>
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

.datetime-group {
  display: flex;
  gap: 1rem;
}

.datetime-group .form-control {
  width: 50%;
}
</style>