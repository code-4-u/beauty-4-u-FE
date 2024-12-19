<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getFetch } from "@/stores/apiClient.js"

// 상태 관리
const products = ref([])
const loading = ref(false)
const error = ref(null)

// 브랜드 관련 상태
const brands = ref([])
const selectedBrand = ref(null)

// 필터링 조건
const filters = reactive({
  goodsName: '',
  brandCode: '',
  skinType: '',
  priceRange: '',
  sort: '',
  order: 'desc',
  page: 1,
  count: 8
})

// 스킨타입 옵션
const skinTypes = [
  { value: '', label: '전체' },
  { value: 'DRY', label: '건성' },
  { value: 'OILY', label: '지성' },
  { value: 'NORMAL', label: '중성' },
  { value: 'COMBINATION', label: '복합성' },
  { value: 'SENSITIVE', label: '민감성' }
]

// API 호출 함수
const fetchProducts = async () => {
  try {
    loading.value = true
    const queryParams = new URLSearchParams({
      goodsName: filters.goodsName,
      brandCode: filters.brandCode,
      skinType: filters.skinType,
      sort: filters.sort,
      order: filters.order,
      page: filters.page - 1,
      count: filters.count
    })

    const response = await getFetch(`/goods/search?${queryParams.toString()}`)
    if (response?.data?.data) {
      products.value = response.data.data
    } else {
      products.value = []
    }
  } catch (e) {
    error.value = '상품 목록을 불러오는데 실패했습니다.'
    console.error('Error fetching products:', e)
  } finally {
    loading.value = false
  }
}

// 브랜드 목록 가져오기
const fetchBrands = async () => {
  try {
    const response = await getFetch('/goods/brands')
    brands.value = response.data.data
  } catch (error) {
    console.error('브랜드 목록 조회 중 오류 발생:', error)
  }
}

// 검색 처리
const handleSearch = () => {
  filters.page = 1
  fetchProducts()
}

// 필터 초기화
const resetFilters = () => {
  Object.assign(filters, {
    goodsName: '',
    brandCode: '',
    skinType: '',
    priceRange: '',
    sort: '',
    order: 'desc',
    page: 1,
    count: 8
  })
  selectedBrand.value = null
  fetchProducts()
}

// 정렬 처리
const handleSort = (column) => {
  if (filters.sort === column) {
    filters.order = filters.order === 'asc' ? 'desc' : 'asc'
  } else {
    filters.sort = column
    filters.order = 'desc'
  }
  fetchProducts()
}

// 가격 포맷팅
const formatPrice = (price) => {
  return new Intl.NumberFormat('ko-KR').format(price)
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  fetchBrands()
  fetchProducts()
})
</script>

<template>
  <div class="container">
    <div class="product-management">
      <div class="header">
        <h2>상품 관리</h2>
        <button class="add-button">
          + 신규 상품 등록
        </button>
      </div>

      <!-- 필터링 섹션 -->
      <div class="filter-section">
        <div class="search-bar">
          <div class="form-group">
            <label>상품명</label>
            <input
                v-model="filters.goodsName"
                type="text"
                placeholder="상품명 입력"
            />
          </div>
          <div class="form-group">
            <label>브랜드</label>
            <select v-model="filters.brandCode">
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
          <div class="form-group">
            <label>피부타입</label>
            <select v-model="filters.skinType">
              <option
                  v-for="type in skinTypes"
                  :key="type.value"
                  :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="button-group">
          <button class="search-button" @click="handleSearch">
            검색
          </button>
          <button class="reset-button" @click="resetFilters">
            초기화
          </button>
        </div>
      </div>

      <!-- 상품 목록 테이블 -->
      <div class="table-container">
        <table>
          <thead>
          <tr>
            <th @click="handleSort('goodsCode')" class="sortable">
              상품코드
              <span v-if="filters.sort === 'goodsCode'">
                  {{ filters.order === 'asc' ? '↑' : '↓' }}
                </span>
            </th>
            <th @click="handleSort('goodsName')" class="sortable">
              상품명
              <span v-if="filters.sort === 'goodsName'">
                  {{ filters.order === 'asc' ? '↑' : '↓' }}
                </span>
            </th>
            <th>브랜드</th>
            <th>피부타입</th>
            <th @click="handleSort('goodsPrice')" class="sortable">
              가격
              <span v-if="filters.sort === 'goodsPrice'">
                  {{ filters.order === 'asc' ? '↑' : '↓' }}
                </span>
            </th>
            <th>관리</th>
          </tr>
          </thead>
          <tbody>
          <tr v-if="loading">
            <td colspan="6" class="text-center">로딩중...</td>
          </tr>
          <tr v-else-if="error">
            <td colspan="6" class="text-center text-red-500">{{ error }}</td>
          </tr>
          <tr v-else v-for="product in products" :key="product.goodsCode">
            <td>{{ product.goodsCode }}</td>
            <td>{{ product.goodsName }}</td>
            <td>
              <span class="badge brand">{{ product.brandName }}</span>
            </td>
            <td>
              <span class="badge skin-type">{{ product.goodsSkintype }}</span>
            </td>
            <td>{{ formatPrice(product.goodsPrice) }}원</td>
            <td>
              <div class="action-buttons">
                <button class="edit">수정</button>
                <button class="delete">삭제</button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 2rem;
}

.product-management {
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
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

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
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

.reset-button {
  background-color: #9ca3af;
  color: white;
  border: none;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background-color: #f9fafb;
  padding: 0.75rem 1rem;
  font-weight: 600;
  text-align: left;
  color: #374151;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  background-color: #f3f4f6;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
}

.badge.brand {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge.skin-type {
  background-color: #fef3c7;
  color: #92400e;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-buttons button {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-buttons .edit {
  background-color: white;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.action-buttons .delete {
  background-color: white;
  border: 1px solid #ef4444;
  color: #ef4444;
}

.action-buttons .edit:hover {
  border-color: #4CAF50;
  background-color: #f0fdf4;
}

.action-buttons .delete:hover {
  border-color: #dc2626;
  background-color: #fef2f2;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-button:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.add-button:active {
  transform: translateY(0);
  box-shadow: none;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .product-management {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .search-bar {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>