<script setup>
import { ref } from 'vue';

import { Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'vue-chartjs';

// Register ChartJS components
ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const isSearchOpen = ref(false);

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
};




</script>

<template>
  <div class="container-wrapper">
    <div class="content-container">
      <div class="layout-grid">
        <!-- 왼쪽 영역 -->
        <div class="left-section">
          <!-- 그래프 영역 -->
          <div class="chart-section">
            <h3>프로모션 트렌드</h3>
            <div class="chart-container">
              <!-- 차트가 들어갈 자리 -->
              <div class="chart-placeholder">
                [차트 영역]
              </div>
            </div>
          </div>

          <!-- 리스트 블록들 -->
          <div class="list-blocks">
            <div class="list-block">
              <h3>적용 상품 리스트1</h3>
              <div class="list-content">
                <!-- 리스트 내용 -->
                [상품 리스트1]
              </div>
            </div>
            <div class="list-block">
              <h3>적용 상품 리스트2</h3>
              <div class="list-content">
                <!-- 리스트 내용 -->
                [상품 리스트2]
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽 영역 -->
        <div class="right-section">
          <div class="ranking-block">
            <h3>순위 비교</h3>
            <div class="ranking-content">
              <!-- 순위 리스트 내용 -->
              [순위 비교 리스트]
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 버튼 -->
    <button
        class="search-trigger-btn"
        @click="toggleSearch"
        :class="{ 'shifted': isSearchOpen }"
    >
      {{ isSearchOpen ? '닫기' : '검색' }}
    </button>

    <!-- 검색 슬라이드 패널 -->
    <div class="search-panel" :class="{ 'open': isSearchOpen }">
      <div class="search-content">
        <h3>검색 필터</h3>
        <div class="search-form">
          <div class="form-group">
            <label>프로모션명</label>
            <input type="text" placeholder="프로모션명을 입력하세요">
          </div>

          <div class="form-group">
            <label>기간 선택</label>
            <div class="date-inputs">
              <input type="date">
              <span>~</span>
              <input type="date">
            </div>
          </div>

          <div class="form-group">
            <label>상태</label>
            <select>
              <option value="">전체</option>
              <option value="active">진행중</option>
              <option value="ended">종료</option>
              <option value="scheduled">예정</option>
            </select>
          </div>

          <button class="search-btn">검색</button>
          <div class="promotion-history">
            <h4>프로모션 내역</h4>
            <div class="promotion-scroll-container">
              <div class="promotion-group">
                <button class="search-promotion-result">봄학기 할인 프로모션</button>
                <div class="promotion-items">
                  <label>2022 봄학기 새내기 할민 프로모션</label>
                  <label>2023 봄학기 새내기 할인 프로모션</label>
                  <label>2024 봄학기 새내기 할인 프로모션</label>
                </div>
              </div>

              <div class="promotion-group">
                <button class="search-promotion-result">봄학기 할인 프로모션</button>
                <div class="promotion-items">
                  <label>2022 봄학기 새내기 할민 프로모션</label>
                  <label>2023 봄학기 새내기 할인 프로모션</label>
                  <label>2024 봄학기 새내기 할인 프로모션</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.promotion-history {
  padding: 16px;
}

.promotion-history h4 {
  margin-bottom: 16px;
  font-weight: 500;
}

.promotion-scroll-container {
  max-height: 300px; /* 원하는 높이로 조절 가능 */
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 16px;
}

.promotion-group {
  margin-bottom: 20px;
}

.promotion-group:last-child {
  margin-bottom: 0;
}

.search-promotion-result {
  width: 100%;
  text-align: left;
  padding: 8px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 8px;
}

.promotion-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 16px;
}

.promotion-items label {
  cursor: pointer;
  padding: 4px 8px;
}

.promotion-items label:hover {
  background-color: #f8f8f8;
  border-radius: 4px;
}

/* 스크롤바 스타일링 */
.promotion-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.promotion-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.promotion-scroll-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.promotion-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

.container-wrapper {
  position: relative;
  min-height: 100vh;
  background-color: var(--background-color);
}

.content-container {
  padding: 24px;
}

/* 검색 트리거 버튼 스타일 */
.search-trigger-btn {
  position: fixed;
  left: 0;
  top: 20%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: #4CAF50;
  border: none;
  border-radius: 0 8px 8px 0;
  color: white;
  cursor: pointer;
  z-index: 1001;
  letter-spacing: 2px;
  font-size: 14px;
  transition: left 0.3s ease;
}

.search-trigger-btn.shifted {
  left: 25%;
}

/* 검색 패널 스타일 */
.search-panel {
  position: fixed;
  left: -25%;
  top: 0;
  width: 25%;
  height: 100%;
  background: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 999;
}

.search-panel.open {
  left: 0;
}

.search-content {
  padding: 24px;
}

/* 검색 폼 스타일 */
.search-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.date-inputs input {
  width: calc(50% - 10px);
  min-width: 0;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.date-inputs span {
  flex-shrink: 0;
}

.search-btn {
  margin-top: 20px;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-promotion-result {
  margin-top: 20px;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-btn:hover {
  background: #45a049;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-container {
  height: 300px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-top: 16px;
}

.list-blocks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.list-block {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ranking-block {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.list-content, .ranking-content {
  margin-top: 16px;
  min-height: 200px;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
}

h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}
</style>