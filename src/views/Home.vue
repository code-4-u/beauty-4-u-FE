<script setup>
import {computed, onMounted, provide, reactive, ref} from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {getFetch, postFetch, putFetch, delFetch} from "@/stores/apiClient.js";
import {useAuthStore} from "@/stores/auth.js";
import {useRouter} from "vue-router";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

const router = useRouter();
const authStore = useAuthStore();

// 로딩 상태
const isLoading = ref(false);

// 팀 리더 여부 확인하는 computed 속성 추가
const isTeamLeader = computed(() => authStore.userRole === 'LEADER');

// 매출 상승, 하락 상품
const increaseTop5 = ref([]);
const decreaseTop5 = ref([]);

// 매출 모달 상태 관리
const isIncreaseModalOpen = ref(false);
const isDecreaseModalOpen = ref(false);

// 전체 상승/하락 데이터
const allIncreaseData = ref([]);
const allDecreaseData = ref([]);

const searchQuery = ref('');

const periods = [
  {type: 'DAILY', label: '일간'},
  {type: 'WEEKLY', label: '주간'},
  {type: 'MONTHLY', label: '월간'},
  {type: 'QUARTER', label: '3개월'},
  {type: 'HALF', label: '6개월'},
  {type: 'YEARLY', label: '1년'}
];

const selectedPeriod = ref('DAILY');

// 팀 일정과 프로모션의 연도/월 선택
const teamSelectedYear = ref(new Date().getFullYear());
const teamSelectedMonth = ref(new Date().getMonth() + 1);
const promotionSelectedYear = ref(new Date().getFullYear());
const promotionSelectedMonth = ref(new Date().getMonth() + 1);

// 매출 상품 클릭 시 상품 분석 페이지 이동 함수
const handleGoodsClick = (item) => {
  router.push(`/goods/analysis?goodsCode=${item.goodsCode}`).catch((err) => {
    console.error("페이지 이동 중 오류: ", err)
  })
};

// 매출 상승률 모달
const openIncreaseModal = async () => {
  isIncreaseModalOpen.value = true;
  try {
    isLoading.value = true;
    const params = new URLSearchParams({
      periodType: selectedPeriod.value,
      limit: 100
    });
    const response = await getFetch(`goodsRate/list?${params.toString()}`);
    allIncreaseData.value = response.data.data.increase;
  } catch (error) {
    console.error("Error fetching increase data:", error);
  } finally {
    isLoading.value = false;
  }
};

const openDecreaseModal = async () => {
  isDecreaseModalOpen.value = true;
  try {
    isLoading.value = true;
    const params = new URLSearchParams({
      periodType: selectedPeriod.value,
      limit: 100
    });
    const response = await getFetch(`goodsRate/list?${params.toString()}`);
    allDecreaseData.value = response.data.data.decrease;
  } catch (error) {
    console.error("Error fetching decrease data:", error);
  } finally {
    isLoading.value = false;
  }
};

const filteredIncreaseData = computed(() => {
  if (!searchQuery.value) return allIncreaseData.value;
  return allIncreaseData.value.filter(item =>
      item.goodsName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const filteredDecreaseData = computed(() => {
  if (!searchQuery.value) return allDecreaseData.value;
  return allDecreaseData.value.filter(item =>
      item.goodsName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const closeIncreaseModal = () => {
  isIncreaseModalOpen.value = false;
};

const closeDecreaseModal = () => {
  isDecreaseModalOpen.value = false;
};

// 메인화면 매출 증감률 데이터
const visibleIncreaseData = computed(() => {
  return increaseTop5.value.slice(0, 5);
});

const visibleDecreaseData = computed(() => {
  return decreaseTop5.value.slice(0, 5);
});

// 기간 변경 함수
const changePeriod = async (periodType) => {
  selectedPeriod.value = periodType;
  isLoading.value = true;

  try {
    const params = new URLSearchParams({
      periodType: periodType,
      limit: 5
    });
    const response = await getFetch(`goodsRate/list?${params.toString()}`);
    const {increase, decrease} = response.data.data;
    increaseTop5.value = increase;
    decreaseTop5.value = decrease;
  } catch (error) {
    console.error("Error 매출 상승,하락률: ", error);
  } finally {
    isLoading.value = false;
  }
};

// 매출 데이터 조회
const fetchGoodsRate = async () => {
  await changePeriod(selectedPeriod.value);
};

// Calendar State
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
  type: 'TEAMSCHEDULE'
});

// Provide/inject
provide('events', events);

const selectedTypes = reactive({
  teamspace: true,
  promotion: true
});
provide('selectedTypes', selectedTypes);

// Calendar Computed Properties
const filteredEvents = computed(() => {
  return events.value.filter(event => {
    if (event.type === 'TEAMSCHEDULE' && !selectedTypes.teamspace) return false;
    if (event.type === 'PROMOTION' && !selectedTypes.promotion) return false;
    return true;
  });
});

const teamEvents = computed(() => {
  const filtered = events.value.filter(event => event.type === 'TEAMSCHEDULE');
  return filtered.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate.getFullYear() === teamSelectedYear.value &&
        eventDate.getMonth() + 1 === teamSelectedMonth.value;
  });
});

const promotionEvents = computed(() => {
  const filtered = events.value.filter(event => event.type === 'PROMOTION');
  return filtered.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate.getFullYear() === promotionSelectedYear.value &&
        eventDate.getMonth() + 1 === promotionSelectedMonth.value;
  });
});

// Calendar Utility Functions
const formatDateTime = (dateStr, timeStr = '00:00') => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
};

// Calendar Modal Functions
const closeModal = () => {
  isModalOpen.value = false;
  Object.assign(eventForm, {
    id: '',
    title: '',
    content: '',
    startDate: '',
    startTime: '00:00',
    endDate: '',
    endTime: '00:00',
    color: '#2196F3',
    type: 'TEAMSCHEDULE'
  });
};

// Calendar Event Handlers
const handleDateClick = (info) => {
  if (!isTeamLeader.value) {
    alert('팀 일정은 팀장만 등록할 수 있습니다.');
    return;
  }
  eventForm.startDate = info.dateStr;
  eventForm.endDate = info.dateStr;
  isModalOpen.value = true;
};

const handleEventClick = (info) => {
  const event = events.value.find(e => e.id === Number(info.event.id));
  if (!event) return;

  if (event.type === 'PROMOTION') return;

  if (!isTeamLeader.value) {
    alert('팀 일정은 팀장만 수정할 수 있습니다.');
    return;
  }

  const startDateTime = new Date(event.start);
  const endDateTime = new Date(event.end);

  Object.assign(eventForm, {
    id: event.id,
    title: event.title,
    content: event.content,
    startDate: new Date(startDateTime).toISOString().split('T')[0],
    startTime: startDateTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul'
    }),
    endDate: new Date(endDateTime).toISOString().split('T')[0],
    endTime: endDateTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul'
    }),
    color: event.color,
    type: event.type
  });

  isModalOpen.value = true;
};

const handleEventDrop = async (info) => {
  if (!isTeamLeader.value) {
    alert('팀 일정은 팀장만 수정할 수 있습니다.');
    info.revert();
    return;
  }

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
    info.revert();
  }
};

// Calendar CRUD Operations
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
    const createScheduleReqData = {
      scheduleType: 'TEAMSCHEDULE',
      scheduleUrl: `팀 일정`,
      scheduleReqDTO: {
        scheduleTitle: eventForm.title,
        scheduleContent: eventForm.content,
        scheduleStart: formatDateTime(eventForm.startDate, eventForm.startTime),
        scheduleEnd: formatDateTime(eventForm.endDate, eventForm.endTime)
      }
    }

    const response = await postFetch('/schedule', createScheduleReqData);

    events.value.push({
      id: response.data.data,
      title: eventForm.title,
      content: eventForm.content,
      start: formatDateTime(eventForm.startDate, eventForm.startTime),
      end: formatDateTime(eventForm.endDate, eventForm.endTime),
      color: eventForm.color,
      type: 'TEAMSCHEDULE'
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

const fetchSchedules = async () => {
  try {
    const response = await getFetch('/schedule');
    events.value = response.data.data.map(schedule => ({
      id: schedule.scheduleId,
      title: schedule.scheduleTitle,
      content: schedule.scheduleContent,
      start: schedule.scheduleStart,
      end: schedule.scheduleEnd,
      color: schedule.scheduleType === 'TEAMSCHEDULE' ?
          ['#2196F3', '#1976D2', '#1565C0', '#0D47A1', '#82B1FF'][Math.floor(Math.random() * 5)] :
          ['#F44336', '#E53935', '#D32F2F', '#C62828', '#FF8A80'][Math.floor(Math.random() * 5)],
      type: schedule.scheduleType,
      scheduleUrl: schedule.scheduleUrl
    }));
  } catch (error) {
    console.error('일정 로드 실패:', error);
  }
};

// Calendar Options
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
  editable: isTeamLeader.value,
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
  eventDidMount: (info) => {
    if (info.event.extendedProps.type === 'PROMOTION') {
      info.el.setAttribute('data-tooltip', '프로모션 일정은 수정할 수 없습니다');
      info.el.classList.add('has-tooltip');
    }
  },
  eventDrop: handleEventDrop,
  locale: 'ko',
  height: 'auto',
  eventClassNames: (arg) => {
    return [
      'calendar-event',
      arg.event.extendedProps.type === 'TEAMSCHEDULE' ? 'team-event' : 'promotion-event'
    ];
  },
});

onMounted(() => {
  fetchSchedules();
  fetchGoodsRate();
});
</script>

<template>
  <div class="page-container">
    <div class="main-content">
      프론트 cicd 테스트
      <!-- 기간 선택 탭 -->
      <div class="period-tabs">
        <button v-for="period in periods"
                :key="period.type"
                :class="['tab-button', { active: selectedPeriod === period.type }]"
                @click="changePeriod(period.type)">
          {{ period.label }}
        </button>
      </div>

      <!-- 매출 통계 -->
      <div class="stats-row">
        <!-- 매출 상승 카드 -->
        <div class="stats-card">
          <div class="card-header">
            <h3 class="card-title">매출 상승 TOP 5</h3>
            <button class="more-button" @click="openIncreaseModal">
              더보기 <font-awesome-icon :icon="['fas', 'right-long']" />
            </button>
          </div>
          <div class="stats-content">
            <div v-if="isLoading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>데이터를 불러오는 중입니다...</p>
            </div>
            <template v-else>
              <div v-for="(item, index) in visibleIncreaseData" :key="index" class="stats-item">
                <span class="stats-label">{{ index + 1 }}.
                  <a href="#" class="goods-link" @click.prevent="handleGoodsClick(item)">
                    {{ item.goodsName }} ({{ item.brandName }})
                  </a>
                </span>
                <span class="stats-value increase">{{ item.rateChange }}</span>
              </div>
              <div v-if="!visibleIncreaseData.length && !isLoading" class="no-data">
                표시할 데이터가 없습니다.
              </div>
            </template>
          </div>
        </div>

        <!-- 매출 하락 카드 -->
        <div class="stats-card">
          <div class="card-header">
            <h3 class="card-title">매출 하락 TOP 5</h3>
            <button class="more-button" @click="openDecreaseModal">
              더보기<font-awesome-icon :icon="['fas', 'right-long']" />
            </button>
          </div>
          <div class="stats-content">
            <div v-if="isLoading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>데이터를 불러오는 중입니다...</p>
            </div>
            <template v-else>
              <div v-for="(item, index) in visibleDecreaseData" :key="index" class="stats-item">
                <span class="stats-label">{{ index + 1 }}.
                  <a href="#" class="goods-link" @click.prevent="handleGoodsClick(item)">
                    {{ item.goodsName }} ({{ item.brandName }})
                  </a>
                </span>
                <span class="stats-value decrease">{{ item.rateChange }}</span>
              </div>
              <div v-if="!visibleDecreaseData.length && !isLoading" class="no-data">
                표시할 데이터가 없습니다.
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 캘린더 섹션 -->
      <div class="content-row">
        <div class="calendar-card">
          <div class="card-header">
            <div class="title-section">
              <h3 class="card-title">일정 캘린더</h3>
              <span v-if="!isTeamLeader" class="leader-notice">
                (팀 일정은 팀장만 등록/수정 가능)
              </span>
            </div>
            <div class="filter-group">
              <label class="filter-label">
                <input type="checkbox" v-model="selectedTypes.promotion">
                <span class="filter-text">프로모션</span>
              </label>
              <label class="filter-label">
                <input type="checkbox" v-model="selectedTypes.teamspace">
                <span class="filter-text">팀 일정</span>
              </label>
            </div>
          </div>
          <div class="calendar-wrapper">
            <FullCalendar :options="calendarOptions"/>
          </div>
        </div>

        <!-- 이벤트 리스트 -->
        <div class="events-column">
          <!-- 프로모션 일정 -->
          <div class="event-card">
            <div class="card-header">
              <h3 class="card-title">프로모션</h3>
              <div class="date-select">
                <select v-model="promotionSelectedYear" class="year-select">
                  <option v-for="year in [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018,
                   2019, 2020, 2021, 2022, 2023, 2024, 2025]" :key="year" :value="year">
                    {{ year }}년
                  </option>
                </select>
                <select v-model="promotionSelectedMonth" class="month-select">
                  <option v-for="month in 12" :key="month" :value="month">
                    {{ month }}월
                  </option>
                </select>
              </div>
            </div>
            <div class="event-list">
              <div v-for="event in promotionEvents"
                   :key="event.id"
                   class="event-item promotion-item"
                   @click="event.scheduleUrl && router.push(event.scheduleUrl)">
                <div class="event-content">
                  <h4 class="event-item-title">{{ event.title }}</h4>
                  <p class="event-date">{{ new Date(event.start).toLocaleDateString('ko-KR') }}</p>
                  <p v-if="event.content" class="event-desc">{{ event.content }}</p>
                </div>
              </div>
              <div v-if="!promotionEvents.length" class="no-events">
                선택한 월의 프로모션 일정이 없습니다
              </div>
            </div>
          </div>

          <!-- 팀 일정 -->
          <div class="event-card">
            <div class="card-header">
              <div class="title-section">
                <h3 class="card-title">팀 일정</h3>
                <span v-if="!isTeamLeader" class="leader-notice">
                  (팀장만 등록/수정 가능)
                </span>
              </div>
              <div class="date-select">
                <select v-model="teamSelectedYear" class="year-select">
                  <option v-for="year in [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018,
                   2019, 2020, 2021, 2022, 2023, 2024, 2025]" :key="year" :value="year">
                    {{ year }}년
                  </option>
                </select>
                <select v-model="teamSelectedMonth" class="month-select">
                  <option v-for="month in 12" :key="month" :value="month">
                    {{ month }}월
                  </option>
                </select>
              </div>
            </div>
            <div class="event-list">
              <div v-for="event in teamEvents"
                   :key="event.id"
                   class="event-item"
                   :class="{ 'editable': isTeamLeader }">
                <div class="event-content">
                  <h4 class="event-item-title">{{ event.title }}</h4>
                  <p class="event-date">{{ new Date(event.start).toLocaleDateString('ko-KR') }}</p>
                  <p v-if="event.content" class="event-desc">{{ event.content }}</p>
                </div>
              </div>
              <div v-if="!teamEvents.length" class="no-events">
                선택한 월의 팀 일정이 없습니다
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 일정 모달 -->
  <div v-if="isModalOpen && isTeamLeader" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ eventForm.id ? '일정 수정' : '새 일정 추가' }}</h3>
        <button class="close-button" @click="closeModal">✕</button>
      </div>
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
        <button v-if="eventForm.id" class="btn btn-danger" @click="handleDelete">삭제</button>
        <button class="btn btn-secondary" @click="closeModal">취소</button>
      </div>
    </div>
  </div>

  <!-- 매출 상승률 모달 -->
  <div v-if="isIncreaseModalOpen" class="modal-overlay" @click="closeIncreaseModal">
    <div class="modal-content sales-modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">매출 상승률 전체 보기</h3>
        <button class="close-button" @click="closeIncreaseModal">✕</button>
      </div>
      <div class="search-box">
        <input type="text"
               v-model="searchQuery"
               placeholder="제품명으로 검색..."
               class="search-input">
      </div>
      <div class="table-container">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>데이터를 불러오는 중입니다...</p>
        </div>
        <template v-else>
          <table v-if="filteredIncreaseData.length">
            <thead>
            <tr>
              <th>순위</th>
              <th>상품명</th>
              <th>브랜드</th>
              <th>변동률</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(item, index) in filteredIncreaseData" :key="index">
              <td>{{ index + 1 }}</td>
              <td>
                <a href="#" class="goods-link" @click.prevent="handleGoodsClick(item)">
                  {{ item.goodsName }}
                </a>
              </td>
              <td>{{ item.brandName }}</td>
              <td class="increase">{{ item.rateChange }}</td>
            </tr>
            </tbody>
          </table>
          <div v-else class="no-data">검색 결과가 없습니다.</div>
        </template>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" @click="closeIncreaseModal">닫기</button>
      </div>
    </div>
  </div>

  <!-- 매출 하락률 모달 -->
  <div v-if="isDecreaseModalOpen" class="modal-overlay" @click="closeDecreaseModal">
    <div class="modal-content sales-modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">매출 하락률 전체 보기</h3>
        <button class="close-button" @click="closeDecreaseModal">✕</button>
      </div>
      <div class="search-box">
        <input type="text"
               v-model="searchQuery"
               placeholder="제품명으로 검색..."
               class="search-input">
      </div>
      <div class="table-container">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>데이터를 불러오는 중입니다...</p>
        </div>
        <template v-else>
          <table v-if="filteredDecreaseData.length">
            <thead>
            <tr>
              <th>순위</th>
              <th>상품명</th>
              <th>브랜드</th>
              <th>변동률</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(item, index) in filteredDecreaseData" :key="index">
              <td>{{ index + 1 }}</td>
              <td>
                <a href="#" class="goods-link" @click.prevent="handleGoodsClick(item)">
                  {{ item.goodsName }}
                </a>
              </td>
              <td>{{ item.brandName }}</td>
              <td class="decrease">{{ item.rateChange }}</td>
            </tr>
            </tbody>
          </table>
          <div v-else class="no-data">검색 결과가 없습니다.</div>
        </template>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" @click="closeDecreaseModal">닫기</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 링크 스타일 */
.goods-link {
  color: #374151;
  text-decoration: none;
  transition: color 0.2s;
}

.goods-link:hover {
  color: #2563eb;
}

.table-container .goods-link {
  color: #374151;
  transition: color 0.2s;
}

.table-container .goods-link:hover {
  color: #2563eb;
}

/* 모달 스타일 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
}

.close-button:hover {
  color: #111827;
}

/* 기본 레이아웃 */
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

/* 연도/월 선택 스타일 */
.date-select {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.year-select,
.month-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.year-select:focus,
.month-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 캘린더 카드 스타일 */
.calendar-card {
  padding: 1.25rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  gap: 0.75rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-label:hover {
  border-color: #2563eb;
}

.filter-text {
  font-size: 0.875rem;
  color: #4b5563;
}

/* 이벤트 리스트 스타일 */
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
  transition: all 0.2s ease;
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

.promotion-item {
  cursor: pointer;
}

.promotion-item:hover {
  background: #fdf2f8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.no-events {
  text-align: center;
  padding: 1rem;
  color: #6b7280;
  font-style: italic;
  background: #f8fafc;
  border-radius: 0.5rem;
}

/* 기간 선택 탭 스타일 */
.period-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background: white;
  padding: 0.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.tab-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover {
  background: #f3f4f6;
}

.tab-button.active {
  background: #87d1d4;
  color: white;
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modal-slide-up 0.3s ease-out;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.datetime-inputs {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.5rem;
}

.datetime-inputs input {
  padding: 0.6rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: #f9fafb;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-secondary {
  background: white;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

/* FullCalendar 커스터마이징 */
.calendar-wrapper :deep(.fc) {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.calendar-wrapper :deep(.fc a) {
  color: inherit;
  text-decoration: none;
}

.calendar-wrapper :deep(.fc-daygrid-day-number) {
  color: inherit;
  text-decoration: none;
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
  padding: 0.6rem 1rem !important;
  border-radius: 0.5rem !important;
  transition: all 0.2s ease;
}

.calendar-wrapper :deep(.fc-button:hover) {
  background: #f1f5f9 !important;
  border-color: #d1d5db !important;
  transform: translateY(-1px);
}

.calendar-wrapper :deep(.fc-button-active) {
  background: #e2e8f0 !important;
  border-color: #cbd5e1 !important;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06) !important;
}

.calendar-wrapper :deep(.fc-event) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-wrapper :deep(.team-event) {
  color: white !important;
}

.calendar-wrapper :deep(.promotion-event) {
  color: white !important;
}

.calendar-wrapper :deep(.fc-event) {
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 매출 모달 스타일 */
.sales-modal {
  max-width: 800px !important;
  width: 800px !important;
  height: 600px !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.table-container {
  height: 350px !important;
  overflow-y: auto !important;
  margin-bottom: 1rem !important;
  flex: 1 !important;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.table-container table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table-container th {
  background-color: #f8fafc;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  white-space: nowrap;
}

.table-container td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.8rem;
  line-height: 1.25;
}

.table-container th:nth-child(1),
.table-container td:nth-child(1) {
  width: 5%;
  text-align: center;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}

.table-container th:nth-child(2),
.table-container td:nth-child(2) {
  width: 40%;
  padding-right: 0.25rem;
}

.table-container th:nth-child(3),
.table-container td:nth-child(3) {
  width: 25%;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}
.table-container th:nth-child(4),
.table-container td:nth-child(4) {
  width: 30%;
  text-align: right;
  padding-right: 0.5rem;
  white-space: nowrap;
}

.search-box {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 로딩 상태 스타일 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
  margin-bottom: 1rem;
}

.no-data {
  text-align: center;
  padding: 1rem;
  color: #6b7280;
  font-style: italic;
  background: #f8fafc;
  border-radius: 0.5rem;
}

/* 애니메이션 */
@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

/* 반응형 스타일 */
@media (max-width: 1024px) {
  .content-row {
    grid-template-columns: 1fr;
  }

  .events-column {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .period-tabs {
    flex-wrap: wrap;
    justify-content: center;
  }

  .date-select {
    flex-direction: column;
    align-items: stretch;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}

/* 기타 유틸리티 스타일 */
.title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.leader-notice {
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
}

.event-item.editable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.event-item.editable:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 더보기 버튼 스타일 */
.more-button {
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.more-button:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.more-button:active {
  transform: translateY(0);
  box-shadow: none;
}
</style>