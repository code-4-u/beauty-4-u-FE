<script setup>
import {onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {delFetch, getFetch, postFetch} from "@/stores/apiClient.js"

const router = useRouter()

const promotionData = ref({
  promotionTitle: '',
  promotionTypeId: '',
  promotionStartDate: '',
  promotionEndDate: '',
  promotionStatus: 'BEFORE',
  promotionContent: '',
  selectedProducts: []
})

const promotionTypes = ref([])

// 상품 검색 관련 상태
const searchTerm = ref('')
const suggestions = ref([])
const selectedBrand = ref(null)

// 상품 검색 관련 상태
const searchFilters = reactive({
  goodsName: '',
  brandCode: '',
  page: 1,
  count: 8,
  sort: '',
  order: 'desc'
})

const products = ref([])
const loading = ref(false)
const error = ref(null)
const brands = ref([])

// API 호출 함수들
const fetchBrands = async () => {
  try {
    const response = await getFetch('/goods/brands')
    brands.value = response.data.data
  } catch (error) {
    console.error('브랜드 목록 조회 중 오류 발생:', error)
  }
}

const fetchPromotionTypes = async () => {
  try {
    const queryParams = new URLSearchParams({
      promotionTypeName: '',
      sort: '',
      order: '',
      page: 1,
      count: 10
    })
    const response = await getFetch(`/promotionType?${queryParams}`)
    promotionTypes.value = response.data.data
  } catch (error) {
    console.error('프로모션 타입 목록 조회 중 오류 발생:', error)
  }
}

const handleSearchInput = async () => {
  if (!searchTerm.value) {
    suggestions.value = []
    return
  }a
  try {
    const response = await getFetch(`/goods/search/${searchTerm.value}`)
    suggestions.value = response.data.data
  } catch (error) {
    suggestions.value = []
  }
}

const search = async () => {
  loading.value = true
  error.value = null

  try {
    const queryParams = new URLSearchParams({
      goodsName: searchFilters.goodsName,
      brandCode: searchFilters.brandCode,
      page: searchFilters.page - 1,
      count: searchFilters.count,
      sort: searchFilters.sort,
      order: searchFilters.order
    })

    const response = await getFetch(`/goods/search?${queryParams.toString()}`)
    if (response?.data?.data) {
      products.value = response.data.data
    } else {
      products.value = []
    }
  } catch (e) {
    error.value = '상품 검색 중 오류가 발생했습니다.'
    console.error('Error searching products:', e)
  } finally {
    loading.value = false
  }
}

// 브랜드 선택 처리
const selectBrand = async (brand) => {
  selectedBrand.value = brand
  await search()
}

// 검색어 제안 선택 처리
const selectSuggestion = (item) => {
  searchTerm.value = item.goodsName
  suggestions.value = []
  search()
}

// 검색 초기화
const resetSearch = () => {
  Object.assign(searchFilters, {
    goodsName: '',
    brandCode: '',
    page: 1,
    count: 8,
    sort: '',
    order: 'desc'
  })
  products.value = []
  error.value = null 
}

// 정렬 처리
const handleSort = (column) => {
  if (searchFilters.sort === column) {
    searchFilters.order = searchFilters.order === 'asc' ? 'desc' : 'asc'
  } else {
    searchFilters.sort = column
    searchFilters.order = 'desc'
  }
  search()
}

// 상품 선택 관련 함수들
const toggleProduct = (product) => {
  const index = promotionData.value.selectedProducts.findIndex(p => p.goodsCode === product.goodsCode)
  if (index === -1) {
    promotionData.value.selectedProducts.push({
      ...product,
      discountRate: 0
    })
  } else {
    promotionData.value.selectedProducts.splice(index, 1)
  }
}

const updateDiscountRate = (productId, value) => {
  const product = promotionData.value.selectedProducts.find(p => p.goodsCode === productId)
  if (product) {
    const rate = value === '' ? 0 : Math.min(Math.max(Number(value), 0), 100)
    product.discountRate = rate
  }
}

const calculateDiscountedPrice = (price, discountRate) => {
  return Math.round(price * (100 - discountRate) / 100)
}

const isProductSelected = (productId) => {
  return promotionData.value.selectedProducts.some(p => p.goodsCode === productId)
}

const getSelectedProductDiscountRate = (productId) => {
  const product = promotionData.value.selectedProducts.find(p => p.goodsCode === productId)
  return product ? product.discountRate : 0
}

// 폼 제출 처리
const handleSubmit = async () => {
  // 필수값 검증
  if (!promotionData.value.promotionTitle) {
    alert('프로모션명을 입력해주세요.')
    return
  }

  const promotionTypeId = Number(promotionData.value.promotionTypeId)
  if (!promotionTypeId || isNaN(promotionTypeId)) {
    alert('프로모션 타입을 선택해주세요.')
    return
  }

  if (!promotionData.value.promotionStartDate || !promotionData.value.promotionEndDate) {
    alert('프로모션 기간을 설정해주세요.')
    return
  }

  if (promotionData.value.selectedProducts.length === 0) {
    alert('프로모션 적용 상품을 선택해주세요.')
    return
  }

  let promotionId = null

  try {

    // 1. 프로모션 기본 정보 등록
    const promotionReqData = {
      promotionTypeId: Number(promotionData.value.promotionTypeId),
      promotionTitle: promotionData.value.promotionTitle,
      promotionContent: promotionData.value.promotionContent,
      promotionStartDate: promotionData.value.promotionStartDate,
      promotionEndDate: promotionData.value.promotionEndDate,
      promotionStatus: promotionData.value.promotionStatus
    }

    // 프로모션 등록 API 호출
    const promotionResponse = await postFetch('/promotion', promotionReqData)

    if (promotionResponse.status === 200 || promotionResponse.status === 201) {
      // 2. 프로모션 상품 등록

      promotionId = promotionResponse.data.data  // 응답에서 받은 프로모션 ID

      const promotionGoodsData = {
        promotionId: promotionId,
        saveGoodsDiscountDTOS: promotionData.value.selectedProducts.map(product => ({
          goodsCode: product.goodsCode,
          discountRate: product.discountRate
        }))
      }

      const createScheduleReqData = {
        scheduleType: 'PROMOTION',
        scheduleUrl: `/promotion/${promotionId}`,
        scheduleReqDTO: {
          scheduleTitle: promotionData.value.promotionTitle,
          scheduleContent: promotionData.value.promotionContent,
          scheduleStart: promotionData.value.promotionStartDate,
          scheduleEnd: promotionData.value.promotionEndDate
        }
      }

      await postFetch('/schedule', createScheduleReqData);

      // 프로모션 상품 등록 API 호출
      const goodsResponse = await postFetch(`/promotionGoods`, promotionGoodsData)

      if (goodsResponse.status === 200 || goodsResponse.status === 201) {
        alert('프로모션이 등록되었습니다.')
        router.push('/promotion/manage')
      } else {
        if (promotionId) {
          await delFetch(`/promotion/${promotionId}`)
        }
        alert('프로모션 상품 등록에 실패했습니다.')
      }
    }
  } catch (error) {
    if (promotionId) {
      await delFetch(`/promotion/${promotionId}`)
    }
    console.error('프로모션 등록 중 오류 발생:', error)
    alert('프로모션 등록에 실패했습니다.')
  }
}

const handleCancel = () => {
  router.back()
}

// 컴포넌트 마운트 시 초기 데이터 로드
onMounted(async () => {
  await Promise.all([
    fetchBrands(),
    fetchPromotionTypes()
  ])
})
</script>

<template>
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
                      :key="type.promotionTypeId"
                      :value="type.promotionTypeId"
                  >
                    {{ type.promotionTypeName }}
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
                <label>프로모션 내용</label>
                <textarea
                    v-model="promotionData.promotionContent"
                    class="form-input content-textarea"
                    placeholder="프로모션 상세 내용을 입력하세요"
                    rows="4"
                ></textarea>
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
              <!-- 상품 검색 필터 -->
              <div class="filter-section">
                <div class="search-bar">
                  <div class="form-group">
                    <label>상품명</label>
                    <input
                        v-model="searchFilters.goodsName"
                        type="text"
                        placeholder="상품명 입력"
                        class="form-input"
                        @keypress.enter.prevent="search"
                    />
                  </div>

                  <div class="form-group">
                    <label>브랜드</label>
                    <select v-model="searchFilters.brandCode" class="form-input">
                      <option value="">전체</option>
                      <option
                          v-for="brand in brands"
                          :key="brand.brandCode"
                          :value="brand.brandCode"
                      >
                        {{ brand.brandName }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="button-group">
                  <button
                      type="button"
                      class="search-button"
                      @click.prevent="search">
                    검색
                  </button>
                  <button
                      type="button"
                      class="reset-button"
                      @click.prevent="resetSearch">
                    초기화
                  </button>
                </div>
              </div>

              <!-- 상품 목록 -->
              <div class="products-section">
                <div class="products-grid">
                  <div v-if="loading" class="loading-indicator">
                    검색중...
                  </div>
                  <div v-else-if="products.length === 0 && !error" class="empty-state">
                    상품명 또는 브랜드를 검색해주세요
                  </div>
                  <template v-else>
                    <div
                        v-for="product in products"
                        :key="product.goodsCode"
                        :class="['product-item', { selected: isProductSelected(product.goodsCode) }]"
                        @click="toggleProduct(product)"
                    >
                      <div class="product-info">
                        <div class="product-name">{{ product.goodsName }}</div>
                        <div class="product-category">{{ product.brandName }}</div>
                        <div class="product-price">{{ product.goodsPrice.toLocaleString() }}원</div>
                        <div v-if="isProductSelected(product.goodsCode)" class="discount-info">
                          {{ getSelectedProductDiscountRate(product.goodsCode) }}% 할인 적용
                        </div>
                      </div>
                      <div class="product-select-indicator">
                        <span v-if="isProductSelected(product.goodsCode)">✓</span>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- 선택된 상품 요약 -->
                <div class="selected-products-summary">
                  <div class="summary-header">
                    선택된 상품 ({{ promotionData.selectedProducts.length }}개)
                  </div>
                  <div class="selected-products-list">
                    <div
                        v-for="product in promotionData.selectedProducts"
                        :key="product.goodsCode"
                        class="selected-product-item"
                    >
                      <div class="selected-product-info">
                        <div class="selected-product-name">{{ product.goodsName }}</div>
                        <div class="selected-product-price">
                          <span class="original-price">{{ product.goodsPrice.toLocaleString() }}원</span>
                          <span class="arrow">→</span>
                          <span class="discounted-price">
                {{ calculateDiscountedPrice(product.goodsPrice, product.discountRate).toLocaleString() }}원
            </span>
                        </div>
                      </div>
                      <div class="selected-product-actions">
                        <div class="discount-input-wrapper">
                          <input
                              type="number"
                              v-model="product.discountRate"
                              @input="e => updateDiscountRate(product.goodsCode, e.target.value)"
                              class="discount-input"
                              min="0"
                              max="100"
                          />
                          <span class="discount-symbol">%</span>
                        </div>
                        <button
                            class="remove-button"
                            @click.stop="toggleProduct(product)"
                            title="상품 제거"
                        >
                          ×
                        </button>
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
  position: relative;
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

.content-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.5;
  font-family: inherit;
}

.content-textarea:focus {
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

/* 상품 검색 영역 스타일 */
.product-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

/* 검색 필터 영역 스타일 */
.filter-section {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.search-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.search-input-wrapper {
  position: relative;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.search-button,
.reset-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.search-button {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.search-button:hover {
  background-color: #45a049;
}

.reset-button {
  background-color: #9ca3af;
  color: white;
  border: none;
}

.reset-button:hover {
  background-color: #6b7280;
}

/* 드롭다운 스타일 수정 */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 0.25rem;
}

.suggestion-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
}

.suggestion-item:hover {
  background-color: #f3f4f6;
}

/* 상품 목록 영역 */
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
  gap: 1rem;
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

/* 버튼 스타일 */
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

.selected-product-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background-color: #fee2e2;
  color: #ef4444;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  transition: all 0.2s;
}

.remove-button:hover {
  background-color: #fecaca;
  color: #dc2626;
}

.clear-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  font-size: 1.2rem;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

/* 로딩 인디케이터 */
.loading-indicator {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

/* 스크롤바 스타일링 */
.products-grid::-webkit-scrollbar,
.selected-products-list::-webkit-scrollbar,
.suggestions-dropdown::-webkit-scrollbar {
  width: 4px;
}

.products-grid::-webkit-scrollbar-track,
.selected-products-list::-webkit-scrollbar-track,
.suggestions-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.products-grid::-webkit-scrollbar-thumb,
.selected-products-list::-webkit-scrollbar-thumb,
.suggestions-dropdown::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.products-grid::-webkit-scrollbar-thumb:hover,
.selected-products-list::-webkit-scrollbar-thumb:hover,
.suggestions-dropdown::-webkit-scrollbar-thumb:hover {
  background: #cdcdcd;
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
</style>