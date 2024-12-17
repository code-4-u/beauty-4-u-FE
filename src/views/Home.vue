<script setup>
import {computed, onMounted, provide, reactive, ref} from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import HomeSideBar from "@/components/home/HomeSideBar.vue";
import SimpleInform from "@/components/home/SimpleInform.vue";
import {getFetch, postFetch, putFetch, delFetch} from "@/stores/apiClient.js";

const events = ref([]);
provide('events', events);

const selectedTypes = reactive({
  teamspace: true,
  promotion: true
});

provide('selectedTypes', selectedTypes);

const filteredEvents = computed(() => {
  return events.value.filter(event => {
    if (event.type === 'TEAMSPACE' && !selectedTypes.teamspace) return false;
    if (event.type === 'PROMOTION' && !selectedTypes.promotion) return false;
    return true;
  });
});

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
  events: filteredEvents,
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
  color: '#2196F3',
  type: 'TEAMSPACE'
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
  eventForm.type = 'TEAMSPACE';
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
    color: eventForm.color,
    type: 'TEAMSPACE'
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
    events.value.push(newEvent);

  } catch (error) {
    console.error('일정을 저장하는데 실패했습니다.', error);
    alert('일정 저장에 실패했습니다.');
    return;
  }

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
        color: eventForm.color,
        type: 'TEAMSPACE'
      };
    }
    closeModal();
  } catch (error) {
    console.error('일정 수정에 실패했습니다.', error);
    alert('일정 수정에 실패했습니다.');
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
      start: schedule.scheduleStart,
      end: schedule.scheduleEnd,
      color: schedule.scheduleType === 'TEAMSPACE' ? '#2196F3' : '#FF4081',
      type: schedule.scheduleType
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
        <!-- 필터 체크박스 추가 -->
        <div class="schedule-filters">
          <label class="filter-label">
            <input
                type="checkbox"
                v-model="selectedTypes.teamspace"
                class="filter-checkbox"
            >
            팀 일정
          </label>
          <label class="filter-label">
            <input
                type="checkbox"
                v-model="selectedTypes.promotion"
                class="filter-checkbox"
            >
            프로모션
          </label>
        </div>

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
/* Base layout styles */
.custom-calendar {
  max-width: 1200px;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 20px;
  background: #fff;
}

.sidebar {
  height: 100vh;
  border-right: 1px solid #eaeaea;
  overflow-y: auto;
  position: fixed;
  left: 0;
  background-color: #f8fafc;
  width: 300px;
  padding: 24px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.content-wrapper {
  background-color: #fff;
  width: calc(100% - 300px);
  max-width: 4000px;
  margin-left: 300px;
  padding: 2.5rem;
  overflow-x: auto;
}

/* Filter styles */
.schedule-filters {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  align-items: center;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  color: #4b5563;
  transition: color 0.2s ease;
}

.filter-label:hover {
  color: #1e40af;
}

.filter-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2563eb;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: white;
  padding: 2.5rem;
  border-radius: 16px;
  width: 90%;
  max-width: 550px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Form styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.form-control:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Button styles */
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
  transform: translateY(-1px);
}

.btn-danger {
  background-color: #dc2626;
  color: white;
}

.btn-danger:hover {
  background-color: #b91c1c;
  transform: translateY(-1px);
}

.datetime-group {
  display: flex;
  gap: 1rem;
}

.datetime-group .form-control {
  width: 50%;
}

/* Calendar customization */
:deep(.fc) {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --fc-border-color: #e5e7eb;
  --fc-today-bg-color: #f0f9ff;
  --fc-neutral-bg-color: #ffffff;
  --fc-list-event-hover-bg-color: #f8fafc;
}

:deep(.fc-toolbar-title) {
  font-size: 1.75rem !important;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

:deep(.fc-header-toolbar) {
  margin-bottom: 2em !important;
}

:deep(.fc-button-primary) {
  background-color: #fff !important;
  border-color: #e5e7eb !important;
  color: #4b5563 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 0.5rem 1rem !important;
  font-weight: 500;
  transition: all 0.2s ease;
}

:deep(.fc-button-primary:hover) {
  background-color: #f8fafc !important;
  border-color: #d1d5db !important;
  color: #1e293b !important;
}

:deep(.fc-button-primary:not(:disabled).fc-button-active) {
  background-color: #2563eb !important;
  border-color: #2563eb !important;
  color: #ffffff !important;
}

:deep(.fc-button-primary:not(:disabled):active) {
  background-color: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
  color: #ffffff !important;
}

:deep(.fc-daygrid-day-number) {
  font-size: 0.95rem;
  color: #4b5563;
  padding: 0.5rem !important;
}

:deep(.fc-daygrid-day-top) {
  justify-content: center;
}

:deep(.fc-day-past) {
  background-color: #fafafa;
}

:deep(.fc-day-today) {
  background-color: #f0f9ff !important;
}

:deep(.fc-day-future) {
  background-color: #ffffff;
}

:deep(.fc-day-sat) {
  color: #2563eb !important;
}

:deep(.fc-day-sun) {
  color: #dc2626 !important;
}

:deep(.fc-col-header-cell) {
  padding: 0.75rem 0 !important;
  background-color: #f8fafc;
  font-weight: 600;
}

:deep(.fc-event) {
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.875rem;
  border: none;
  margin: 2px 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(45deg, var(--event-color1), var(--event-color2));
}

:deep(.fc-event.teamspace-event) {
  --event-color1: #2563eb;
  --event-color2: #3b82f6;
}

:deep(.fc-event.promotion-event) {
  --event-color1: #db2777;
  --event-color2: #ec4899;
}

:deep(.fc-event:hover) {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:deep(.fc-event-title) {
  font-weight: 500;
  padding: 2px 0;
}

:deep(.fc-day-grid-event) {
  margin: 4px 8px;
}

:deep(.fc-timegrid-slot) {
  height: 3rem !important;
}

:deep(.fc-timegrid-slot-label) {
  font-size: 0.875rem;
  color: #6b7280;
}

:deep(.fc-scrollgrid) {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb !important;
}

:deep(.fc-scrollgrid-section-header) {
  background-color: #f8fafc;
}

/* Notice and QA section styles */
.notice-section,
.qa-section {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: #f8fafc;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.schedule-filters {
  background: linear-gradient(to right, #f8fafc, #f1f5f9);
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-label {
  position: relative;
  padding: 0.5rem 1rem;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-label:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.filter-checkbox {
  margin-right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

/* Modal enhancements */
.modal-content {
  background: linear-gradient(145deg, #ffffff, #f8fafc);
}

.modal-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}
</style>