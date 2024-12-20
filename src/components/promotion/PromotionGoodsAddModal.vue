<!-- ProductSearchModal.vue -->
<script setup>
import {ref, reactive, onMounted} from 'vue'
import { getFetch } from "@/stores/apiClient.js"

const props = defineProps({
  isOpen: Boolean,
  existingProductCodes: {  // 이미 선택된 상품코드 목록
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'select'])

// 상품 검색 관련 상태 (기존 promotionAdd 페이지의 코드 재사용)
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

// 상품 선택 처리
const selectProduct = (product) => {
  emit('select', {
    ...product,
    discountRate: 0
  })
}

// 이미 선택된 상품인지 확인
const isProductSelected = (productCode) => {
  return props.existingProductCodes.includes(productCode)
}

onMounted(() => {
  fetchBrands()
})
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>상품 검색</h3>
        <button @click="$emit('close')" class="close-button">×</button>
      </div>

      <!-- 검색 필터 -->
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
      <div class="products-grid">
        <div v-if="loading" class="loading-indicator">
          검색중...
        </div>
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        <div v-else-if="products.length === 0" class="empty-state">
          상품명 또는 브랜드를 검색해주세요
        </div>
        <template v-else>
          <div
              v-for="product in products"
              :key="product.goodsCode"
              :class="[
                'product-item',
                {
                  'selected': isProductSelected(product.goodsCode),
                  'disabled': isProductSelected(product.goodsCode)
                }
              ]"
              @click="!isProductSelected(product.goodsCode) && selectProduct(product)"
          >
            <div class="product-info">
              <div class="product-name">{{ product.goodsName }}</div>
              <div class="product-category">{{ product.brandName }}</div>
              <div class="product-price">{{ product.goodsPrice.toLocaleString() }}원</div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: #374151;
}

/* 필터 섹션 스타일 */
.filter-section {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.search-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.search-button,
.reset-button {
  padding: 8px 16px;
  border-radius: 4px;
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

/* 상품 그리드 스타일 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.product-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.product-item:hover {
  border-color: #4CAF50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.product-item.selected {
  background-color: #f0fdf4;
  border-color: #4CAF50;
}

.product-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 500;
  font-size: 0.875rem;
  color: #111827;
}

.product-category {
  font-size: 0.75rem;
  color: #6b7280;
}

.product-price {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-top: 4px;
}

/* 로딩 및 에러 상태 */
.loading-indicator {
  text-align: center;
  padding: 24px;
  color: #6b7280;
  grid-column: 1 / -1;
}

.error-message {
  text-align: center;
  padding: 24px;
  color: #ef4444;
  grid-column: 1 / -1;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #6b7280;
  grid-column: 1 / -1;
}

/* 스크롤바 스타일 */
.products-grid::-webkit-scrollbar {
  width: 4px;
}

.products-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.products-grid::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.products-grid::-webkit-scrollbar-thumb:hover {
  background: #cdcdcd;
}

/* 반응형 스타일 */
@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    padding: 16px;
  }

  .search-bar {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
  }

  .button-group button {
    width: 100%;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>