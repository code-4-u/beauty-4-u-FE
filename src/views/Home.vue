<script setup>
import {ref, reactive} from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import HomeSideBar from "@/components/Home/HomeSideBar.vue";
import CustomerNav from "@/components/common/CustomerNav.vue";
import SimpleInform from "@/components/Home/SimpleInform.vue";
import SimpleQAndA from "@/components/Home/SimpleQAndA.vue";

const calendarOptions = reactive({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay' // 월별, 주별, 일별 보기 버튼 추가
  },
  views: {
    dayGridMonth: {
      buttonText: '월별'
    },
    timeGridWeek: {
      buttonText: '주별'
    },
    timeGridDay: {
      buttonText: '일별'
    }
  },
  events: [],
  editable: true,
  displayEventTime: true,
  navLinks: true,
  dayCellClassNames: (arg) => {
    const day = arg.date.getDay();
    return day === 0 ? 'fc-sunday' : day === 6 ? 'fc-saturday' : 'fc-weekday';
  },
  dayHeaderClassNames: (arg) => {
    const day = arg.date.getDay();
    return day === 0 ? 'fc-sunday-header' : day === 6 ? 'fc-saturday-header' : 'fc-weekday-header';
  },
  locale: 'ko', // 한국어 로케일 설정
});

const isModalOpen = ref(false);
const isEditing = ref(false);
const formData = reactive({
  id: null,
  title: '',
  content: '',
  startDate: new Date(),
  endDate: new Date(),
  startDateText: '',
  endDateText: '',
  type: '',
});

// 공휴일 및 예약 관련 데이터
const holidays = ref([]);
const menuStart = ref(false);
const menuEnd = ref(false);
const childList = ref([]);
const reservationList = ref([]);
const userEvents = ref([]);
const selectedReservation = ref(null);
const selectedEvent = ref(null);
const isReservationEvent = ref(false);
const selectedChildName = ref('');
const selectedChildId = ref(null);
const selectedChild = ref(null);
const colorPalette = ref(['#FF9800', '#4CAF50', '#FFC107', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#3F51B5', '#8BC34A', '#FF5722']);
const colorIndex = ref(0);
const memberColors = reactive({});

// 이벤트 핸들러
const handleDateClick = (info) => {
  // 날짜 클릭 처리 로직
};

const handleEventClick = (info) => {
  // 이벤트 클릭 처리 ��직
};

const handleEventDrop = (info) => {
  // 이벤트 드래그 처리 로직
};

const handleDatesSet = (arg) => {
  // 날짜 세트 처리 로직
};
</script>

<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-3 sidebar">
        <HomeSideBar/>
      </div>
      <div class="col-md-9 main-content content-wrapper">
        <div class="row">
          <div class="col-md-12">
            <FullCalendar :options="calendarOptions" class="custom-calendar"/>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="notice-section">
              <h5>공지사항</h5>
              <!-- 공지사항 내용 추가 -->
            </div>
          </div>
          <div class="col-md-6">
            <div class="qa-section">
              <h5>Q&A</h5>
              <!-- Q&A 내용 추가 -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-calendar {
  max-width: 800px; /* 캘린더의 최대 너비를 설정 */
  margin: 0 auto; /* 중앙 정렬 */
}

.sidebar {
  height: 100vh;
  border-right: 1px solid #dee2e6;
  overflow-y: auto;
  position: fixed;
  left: 0;
  background-color: #fff;
  width: 300px; /* CustomerHome.vue의 사이드바 너비에 맞춰 조정 */
}

.content-wrapper {
  background-color: #fff;
  width: calc(100% - 300px); /* 사이드바 너비를 고려하여 조정 */
  max-width: 4000px;
  margin-left: 300px; /* 사이드바 너비에 맞춰 조정 */
  padding: 2rem;
  overflow-x: auto; /* 가로 스크롤 추가 */
}

.notice-section, .qa-section {
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  background-color: #f8f9fa; /* 배경색 추가 */
  margin-bottom: 1rem; /* 아래쪽 여백 추가 */
}

.notice-section h5, .qa-section h5 {
  margin-bottom: 1rem; /* 제목 아래 여백 추가 */
}
</style>
