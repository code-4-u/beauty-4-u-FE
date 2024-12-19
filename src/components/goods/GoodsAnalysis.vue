<script setup>
import { ref } from 'vue';

const isSearchOpen = ref(false);

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
};
</script>

<template>
  <div class="container-wrapper">
    <div class="content-container">
      <div class="layout-grid">
        <!-- 왼쪽 프로모션 목록 -->
        <div class="promotion-list">
          <h3>적용된 프로모션 목록</h3>
          <div class="list-container"></div>
        </div>

        <!-- 가운데 차트 영역 -->
        <div class="chart-section">
          <h3>매출 차트</h3>
          <div class="chart-container"></div>
        </div>

        <!-- 오른쪽 분석 영역 -->
        <div class="analysis-section">
          <!-- 리뷰 요약 블록 -->
          <div class="analysis-block">
            <h3>리뷰 요약</h3>
            <div class="block-content"></div>
          </div>

          <!-- 추천 조합 블록 -->
          <div class="analysis-block">
            <h3>추천 조합</h3>
            <div class="block-content"></div>
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
        <h3>상품 검색</h3>
        <div class="search-form">
          <div class="form-group">
            <label>상품명</label>
            <input type="text" placeholder="상품명을 입력하세요">
          </div>

          <div class="form-group">
            <label>카테고리</label>
            <select>
              <option value="">전체</option>
              <option value="category1">카테고리1</option>
              <option value="category2">카테고리2</option>
            </select>
          </div>

          <div class="form-group">
            <label>가격대</label>
            <div class="price-range">
              <input type="number" placeholder="최소">
              <span>~</span>
              <input type="number" placeholder="최대">
            </div>
          </div>

          <div class="form-group">
            <label>상태</label>
            <select>
              <option value="">전체</option>
              <option value="sale">판매중</option>
              <option value="soldout">품절</option>
              <option value="hidden">숨김</option>
            </select>
          </div>

          <button class="search-btn">검색</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container-wrapper {
  position: relative;
  min-height: 100vh;
  background-color: var(--background-color);
}

.content-container {
  padding: 24px;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

/* 왼쪽 프로모션 목록 스타일 */
.promotion-list {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: calc(100vh - 72px);
}

.list-container {
  margin-top: 16px;
  height: calc(100% - 40px);
  background: #f8f9fa;
  border-radius: 8px;
}

/* 가운데 차트 섹션 스타일 */
.chart-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: calc(100vh - 72px);
}

.chart-container {
  height: calc(100% - 40px);
  background: #f8f9fa;
  border-radius: 4px;
  margin-top: 16px;
}

/* 오른쪽 분석 섹션 스타일 */
.analysis-section {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 24px;
  height: calc(100vh - 72px);
}

.analysis-block {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.block-content {
  margin-top: 16px;
  height: calc(100% - 40px);
  background: #f8f9fa;
  border-radius: 8px;
}

/* 검색 패널 스타일 */
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
  transition: left 0.3s ease;
}

.search-trigger-btn.shifted {
  left: 25%;
}

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

.price-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-range input {
  width: calc(50% - 10px);
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

.search-btn:hover {
  background: #45a049;
}

h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}
</style>