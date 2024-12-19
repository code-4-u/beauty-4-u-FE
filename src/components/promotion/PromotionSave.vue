<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const promotionData = ref({
  promotionTitle: '',
  promotionTypeId: '',
  promotionStartDate: '',
  promotionEndDate: '',
  promotionStatus: 'UPCOMING',
  selectedProducts: [] // [{...product, discountRate: number}]
})

const promotionTypes = [
  { id: 1, name: '신년' },
  { id: 2, name: '크리스마스' },
  { id: 3, name: '새학기' }
]

// 상품 검색 필터
const searchQuery = ref('')
const selectedCategory = ref('')

// 상품 목록 (실제로는 API에서 받아올 예정)
const products = ref([
  { id: 1, name: '상품 A', price: 10000, category: '의류' },
  { id: 2, name: '상품 B', price: 20000, category: '신발' },
  { id: 3, name: '상품 C', price: 15000, category: '의류' },
  { id: 4, name: '상품 D', price: 30000, category: '가방' }
])

// 카테고리 목록
const categories = computed(() => {
  return [...new Set(products.value.map(p => p.category))]
})

// 필터링된 상품 목록
const filteredProducts = computed(() => {
  return products.value.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || product.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const toggleProduct = (product) => {
  const index = promotionData.value.selectedProducts.findIndex(p => p.id === product.id)
  if (index === -1) {
    promotionData.value.selectedProducts.push({
      ...product,
      discountRate: 0 // 기본 할인율 0%
    })
  } else {
    promotionData.value.selectedProducts.splice(index, 1)
  }
}

const updateDiscountRate = (productId, value) => {
  const product = promotionData.value.selectedProducts.find(p => p.id === productId)
  if (product) {
    // 입력값이 빈 문자열이면 0으로 처리
    const rate = value === '' ? 0 : Math.min(Math.max(Number(value), 0), 100)
    product.discountRate = rate
  }
}

const calculateDiscountedPrice = (price, discountRate) => {
  return Math.round(price * (100 - discountRate) / 100)
}

const isProductSelected = (productId) => {
  return promotionData.value.selectedProducts.some(p => p.id === productId)
}

const getSelectedProductDiscountRate = (productId) => {
  const product = promotionData.value.selectedProducts.find(p => p.id === productId)
  return product ? product.discountRate : 0
}

const handleSubmit = () => {
  console.log('Submit promotion:', promotionData.value)
  router.push('/promotions')
}

const handleCancel = () => {
  router.back()
}
</script>

<template>
  <!-- 이전 코드와 동일한 부분 생략 -->
  <div class="page-container">
    <div class="page-header">
      <h2>신규 프로모션 등록</h2>
    </div>

    <div class="content-wrapper">
      <form @submit.prevent="handleSubmit" class="form-container">
        <div class="split-layout">
          <!-- 왼쪽: 기본 정보 -->
          <div class="left-section">
            <div class="section-title">기본 정보</div>
            <div class="form-content">
              <div class="form-group">
                <label>프로모션명</label>
                <input
                    v-model="promotionData.promotionTitle"
                    type="text"
                    placeholder="프로모션명을 입력하세요"
                    class="form-input"
                />
              </div>

              <div class="form-group">
                <label>프로모션 타입</label>
                <select v-model="promotionData.promotionTypeId" class="form-input">
                  <option value="">타입 선택</option>
                  <option
                      v-for="type in promotionTypes"
                      :key="type.id"
                      :value="type.id"
                  >
                    {{ type.name }}
                  </option>
                </select>
              </div>

              <div class="date-inputs">
                <div class="form-group">
                  <label>시작일</label>
                  <input
                      v-model="promotionData.promotionStartDate"
                      type="datetime-local"
                      class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label>종료일</label>
                  <input
                      v-model="promotionData.promotionEndDate"
                      type="datetime-local"
                      class="form-input"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>상태</label>
                <select v-model="promotionData.promotionStatus" class="form-input">
                  <option value="BEFORE">예정</option>
                  <option value="ONGOING">진행중</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 오른쪽: 상품 선택 -->
          <div class="right-section">
            <div class="section-title">프로모션 적용 상품</div>
            <div class="form-content">
              <!-- 상품 필터 -->
              <div class="product-filters">
                <div class="form-group">
                  <input
                      v-model="searchQuery"
                      type="text"
                      placeholder="상품명으로 검색"
                      class="form-input"
                  />
                </div>
                <div class="form-group">
                  <select v-model="selectedCategory" class="form-input">
                    <option value="">전체 카테고리</option>
                    <option
                        v-for="category in categories"
                        :key="category"
                        :value="category"
                    >
                      {{ category }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- 상품 목록 -->
              <div class="products-section">
                <div class="products-grid">
                  <div
                      v-for="product in filteredProducts"
                      :key="product.id"
                      :class="['product-item', { selected: isProductSelected(product.id) }]"
                      @click="toggleProduct(product)"
                  >
                    <div class="product-info">
                      <div class="product-name">{{ product.name }}</div>
                      <div class="product-category">{{ product.category }}</div>
                      <div class="product-price">{{ product.price.toLocaleString() }}원</div>
                      <div v-if="isProductSelected(product.id)" class="discount-info">
                        {{ getSelectedProductDiscountRate(product.id) }}% 할인 적용
                      </div>
                    </div>
                    <div class="product-select-indicator">
                      <span v-if="isProductSelected(product.id)">✓</span>
                    </div>
                  </div>
                </div>

                <!-- 선택된 상품 요약 - 할인율 입력 추가 -->
                <div class="selected-products-summary">
                  <div class="summary-header">
                    선택된 상품 ({{ promotionData.selectedProducts.length }}개)
                  </div>
                  <div class="selected-products-list">
                    <div
                        v-for="product in promotionData.selectedProducts"
                        :key="product.id"
                        class="selected-product-item"
                    >
                      <div class="selected-product-info">
                        <div class="selected-product-name">{{ product.name }}</div>
                        <div class="selected-product-price">
                          <span class="original-price">{{ product.price.toLocaleString() }}원</span>
                          <span class="arrow">→</span>
                          <span class="discounted-price">
                            {{ calculateDiscountedPrice(product.price, product.discountRate).toLocaleString() }}원
                          </span>
                        </div>
                      </div>
                      <div class="discount-input-wrapper">
                        <input
                            type="number"
                            v-model="product.discountRate"
                            @input="e => updateDiscountRate(product.id, e.target.value)"
                            class="discount-input"
                            min="0"
                            max="100"
                        />
                        <span class="discount-symbol">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <button type="button" class="cancel-button" @click="handleCancel">취소</button>
          <button type="submit" class="submit-button">등록</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* 기본 레이아웃 스타일 */
.page-container {
  padding: 24px;
  background-color: #f9fafb;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.content-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 좌우 분할 레이아웃 */
.split-layout {
  display: flex;
  gap: 2rem;
  min-height: 600px;
}

.left-section,
.right-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.left-section {
  border-right: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  padding: 24px 32px 0;
}

.form-content {
  padding: 24px 32px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 폼 요소 스타일 */
.form-group {
  margin-bottom: 1.5rem;
  width: 100%;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.form-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.date-inputs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.date-inputs .form-group {
  margin-bottom: 0;
  flex: 1;
}

/* 상품 선택 영역 스타일 */
.product-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.products-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  overflow-y: auto;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
  max-height: 400px;
}

.product-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  background: white;
}

.product-item:hover {
  border-color: #4CAF50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-item.selected {
  background-color: #f0fdf4;
  border-color: #4CAF50;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.product-category {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.product-price {
  color: #374151;
  font-weight: 500;
}

/* 선택된 상품 영역 */
.selected-products-summary {
  background-color: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
  margin-top: auto;
  min-height: 200px;
  max-height: 200px;
  display: flex;
  flex-direction: column;
}

.summary-header {
  font-weight: 500;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.selected-products-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selected-product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: white;
  border-radius: 4px;
  font-size: 0.875rem;
}

.selected-product-info {
  flex: 1;
  min-width: 0;
}

.selected-product-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.selected-product-price {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.original-price {
  text-decoration: line-through;
  color: #9ca3af;
}

.arrow {
  color: #9ca3af;
}

.discounted-price {
  color: #4CAF50;
  font-weight: 500;
}

.discount-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 80px;
}

.discount-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: right;
}

.discount-symbol {
  color: #6b7280;
}

.discount-info {
  font-size: 0.75rem;
  color: #4CAF50;
  margin-top: 0.25rem;
}

/* 하단 버튼 영역 */
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 16px 32px;
  background-color: #f9fafb;
  border-top: 1px solid #eee;
}

.cancel-button,
.submit-button {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #ddd;
  background-color: white;
  color: #374151;
}

.submit-button {
  border: none;
  background-color: #4CAF50;
  color: white;
}

.cancel-button:hover {
  background-color: #f5f5f5;
}

.submit-button:hover {
  background-color: #45a049;
}

/* 숫자 입력 화살표 제거 */
.discount-input::-webkit-inner-spin-button,
.discount-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.discount-input[type=number] {
  -moz-appearance: textfield;
}

/* 스크롤바 스타일링 */
.products-grid::-webkit-scrollbar,
.selected-products-list::-webkit-scrollbar {
  width: 4px;
}

.products-grid::-webkit-scrollbar-track,
.selected-products-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.products-grid::-webkit-scrollbar-thumb,
.selected-products-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.products-grid::-webkit-scrollbar-thumb:hover,
.selected-products-list::-webkit-scrollbar-thumb:hover {
  background: #cdcdcd;
}
</style>