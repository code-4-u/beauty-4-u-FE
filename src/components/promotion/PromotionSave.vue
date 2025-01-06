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
const totalItems = ref(0)
const totalPages = ref(0)

const isLoading = ref(false)
const hasMore = ref(true)


// 상품 검색 관련 상태
const searchFilters = reactive({
  goodsName: '',
  brandCode: '',
  page: 0,  // 0부터 시작
  count: 12,  // 한 번에 가져올 개수
  sort: '',
  order: 'desc'
})
const currentPage = ref(1)
const itemsPerPage = 10
const displayedProducts = ref([])

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
      count: 4000
    })
    const response = await getFetch(`/promotionType?${queryParams}`)
    promotionTypes.value = response.data.data.promotionTypeList
  } catch (error) {
    console.error('프로모션 타입 목록 조회 중 오류 발생:', error)
  }
}

const handleSearchInput = async () => {
  if (!searchFilters.goodsName) {
    suggestions.value = []
    return
  }
  try {
    const response = await getFetch(`/goods/search/${searchFilters.goodsName}`)
    suggestions.value = response.data.data
  } catch (error) {
    suggestions.value = []
  }
}


// highlightText 함수 추가
const highlightText = (text) => {
  if (!searchFilters.goodsName) return { before: text, match: '', after: '' }
  const searchTerm = searchFilters.goodsName.toLowerCase()
  const index = text.toLowerCase().indexOf(searchTerm)
  if (index === -1) return { before: text, match: '', after: '' }

  return {
    before: text.slice(0, index),
    match: text.slice(index, index + searchTerm.length),
    after: text.slice(index + searchTerm.length)
  }
}

const search = async (isInitialSearch = true) => {
  if (isInitialSearch) {
    loading.value = true
    searchFilters.page = 0
    products.value = []
  }

  try {
    const queryParams = new URLSearchParams({
      goodsName: searchFilters.goodsName,
      brandCode: searchFilters.brandCode,
      page: searchFilters.page,
      count: searchFilters.count,
      sort: searchFilters.sort,
      order: searchFilters.order
    })

    const response = await getFetch(`/goods/search?${queryParams.toString()}`)
    if (response?.data?.data) {
      const newProducts = response.data.data.goodsList
      products.value = isInitialSearch ? newProducts : [...products.value, ...newProducts]
      totalItems.value = response.data.data.totalCount
      displayedProducts.value = products.value
      hasMore.value = products.value.length < totalItems.value
    }
  } catch (e) {
    error.value = '상품 검색 중 오류가 발생했습니다.'
    console.error('Error searching products:', e)
  } finally {
    loading.value = false
  }
}


const handleScroll = async (e) => {
  const element = e.target
  if (!loading.value && hasMore.value && element.scrollHeight - element.scrollTop <= element.clientHeight * 1.5) {
    searchFilters.page += 1
    await search(false)
  }
}

const updateDisplayedProducts = () => {
  const start = 0
  const end = currentPage.value * itemsPerPage
  displayedProducts.value = products.value.slice(start, end)
}

onMounted(async () => {
  await Promise.all([
    fetchBrands(),
    fetchPromotionTypes()
  ])
})

// 브랜드 선택 처리
const selectBrand = async (brand) => {
  selectedBrand.value = brand
  await search()
}

// selectSuggestion도 수정
const selectSuggestion = (item) => {
  searchFilters.goodsName = item.goodsName
  suggestions.value = []
  search()
}

// 페이지 변경 핸들러
const handlePageChange = (newPage) => {
  searchFilters.page = newPage
  search()
}

// 검색 초기화
const resetSearch = () => {
  Object.assign(searchFilters, {
    goodsName: '',
    brandCode: '',
    page: 1,
    count: 12,
    sort: '',
    order: 'desc'
  })
  products.value = []
  error.value = null
  totalItems.value = 0
  totalPages.value = 0
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
      promotionType: Number(promotionData.value.promotionTypeId),
      promotionTitle: promotionData.value.promotionTitle,
      promotionContent: promotionData.value.promotionContent,
      promotionStartDate: promotionData.value.promotionStartDate,
      promotionEndDate: promotionData.value.promotionEndDate,
      promotionStatus: promotionData.value.promotionStatus
    }

    const promotionResponse = await postFetch('/promotion', promotionReqData)

    if (promotionResponse.status === 200 || promotionResponse.status === 201) {
      promotionId = promotionResponse.data.data

      // console.log('promotionId: ', promotionId);

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

      await postFetch('/schedule', createScheduleReqData)

      const goodsResponse = await postFetch(`/promotionGoods`, promotionGoodsData)

      if (goodsResponse.status === 200 || goodsResponse.status === 201) {
        alert('프로모션이 등록되었습니다.')
        await router.push('/promotion/manage')
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
                    <div class="dropdown-container">
                      <input
                          v-model="searchFilters.goodsName"
                          @input="handleSearchInput"
                          type="text"
                          placeholder="상품명 입력"
                          class="form-input"
                      />
                      <div v-if="suggestions.length > 0" class="dropdown-content">
                        <div
                            v-for="item in suggestions"
                            :key="item.goodsCode"
                            @click="selectSuggestion(item)"
                            class="dropdown-item"
                        >
                          {{ highlightText(item.goodsName).before }}
                          <span class="highlight">{{ highlightText(item.goodsName).match }}</span>
                          {{ highlightText(item.goodsName).after }}
                        </div>
                      </div>
                    </div>
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
                <div class="products-grid" @scroll="handleScroll">
                  <div v-if="loading && products.length === 0" class="loading-indicator">
                    검색중...
                  </div>
                  <div v-else-if="products.length === 0 && !error" class="empty-state">
                    상품명 또는 브랜드를 검색해주세요
                  </div>
                  <template v-else>
                    <div
                        v-for="product in displayedProducts"
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

                <!-- 페이지네이션 -->
                <div v-if="totalPages > 0" class="pagination">
                  <button
                      :disabled="searchFilters.page === 1"
                      @click="handlePageChange(searchFilters.page - 1)"
                      class="pagination-button"
                  >
                    이전
                  </button>
                  <div class="page-numbers">
                    <button
                        v-for="pageNum in totalPages"
                        :key="pageNum"
                        @click="handlePageChange(pageNum)"
                        :class="['page-number', { active: pageNum === searchFilters.page }]"
                    >
                      {{ pageNum }}
                    </button>
                  </div>
                  <button
                      :disabled="searchFilters.page === totalPages"
                      @click="handlePageChange(searchFilters.page + 1)"
                      class="pagination-button"
                  >
                    다음
                  </button>
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
                          <span class="remove-icon">×</span>
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

.date-inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  min-width: 0;
}

.date-inputs .form-group {
  margin-bottom: 0;
  min-width: 0;
}

.date-inputs input {
  width: 100%;
  min-width: 0;
}

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
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
  height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  color: #374151;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  color: #374151;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.page-number.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.selected-products-summary {
  background-color: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
  margin-top: auto;
  min-height: 200px;
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
  width: 28px;
  height: 28px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #9ca3af;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.remove-button:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
  transform: scale(1.05);
}

.remove-button:active {
  transform: scale(0.95);
}

.remove-icon {
  font-size: 18px;
  line-height: 1;
  font-weight: 500;
  margin-bottom: 4px;
}

@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .split-layout {
    flex-direction: column;
  }

  .left-section {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-content {
    padding: 16px;
  }

  .search-bar {
    grid-template-columns: 1fr;
  }
}

.loading-indicator,
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: #6b7280;
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

.discount-input-wrapper {
  position: relative;
  width: 65px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 16px;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.discount-input-wrapper:hover {
  background: #e5e7eb;
}

.discount-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  padding: 0 24px 0 12px;
  font-size: 0.875rem;
  color: #374151;
  text-align: right;
  font-weight: 500;
}

.discount-input:focus {
  outline: none;
}

.discount-input-wrapper:focus-within {
  background: white;
  box-shadow: 0 0 0 2px #4CAF50;
}

.discount-symbol {
  position: absolute;
  right: 12px;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  pointer-events: none;
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

.dropdown-container {
  position: relative;
  width: 100%;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.highlight {
  font-weight: bold;
  color: #4CAF50;
}
</style>