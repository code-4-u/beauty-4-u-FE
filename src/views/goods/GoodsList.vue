<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

// 브랜드 검색과 관련된 상태 관리
const brands = ref([])
const selectedBrand = ref(null)
const showBrandDropdown = ref(false)

// 상품 검색과 관련된 상태 관리
const searchTerm = ref('')
const suggestions = ref([])
const searchResults = ref([])

// 하위 카테고리 선택 시 상품 목록을 조회하는 함수
const handleSubCategorySelect = async (subCategoryCode) => {
  try {
    const response = await axios.get(`/api/v1/goods/category/sub/${subCategoryCode}`)
    searchResults.value = response.data
  } catch (error) {
    console.error('카테고리 상품 조회 중 오류 발생:', error)
  }
}

// 선택된 브랜드의 이름을 표시하기 위한 계산된 속성
const selectedBrandName = computed(() => {
  if (!selectedBrand.value) return ''
  const brand = brands.value.find(b => b.brandCode === selectedBrand.value.brandCode)
  return brand ? brand.brandName : ''
})

// 브랜드 목록을 서버에서 가져오는 함수
const fetchBrands = async () => {
  try {
    const response = await axios.get('/api/v1/goods/brands')
    brands.value = response.data
  } catch (error) {
    console.error('브랜드 목록 조회 중 오류 발생:', error)
  }
}

// 검색어 입력 시 자동 완성 목록을 가져오는 함수
const handleSearchInput = async () => {
  if (searchTerm.value.length > 0) {
    try {
      const response = await axios.get(`/api/v1/goods/search/${searchTerm.value}`)
      suggestions.value = response.data
    } catch (error) {
      console.error('검색 제안 조회 중 오류 발생:', error)
    }
  } else {
    suggestions.value = []
  }
}

// 검색 실행 함수
const search = async () => {
  try {
    const response = await axios.get('/api/v1/goods/search', {
      params: {
        brandCode: selectedBrand.value?.brandCode || '',
        goodsName: searchTerm.value
      }
    })
    searchResults.value = response.data
  } catch (error) {
    console.error('검색 결과 조회 중 오류 발생:', error)
  }
}

// 브랜드 선택 처리 함수
const selectBrand = (brand) => {
  selectedBrand.value = brand
  showBrandDropdown.value = false
}

// 검색어 제안 선택 처리 함수
const selectSuggestion = (item) => {
  searchTerm.value = item.goodsName
  suggestions.value = []
}

// 검색 조건 초기화 함수
const clearSearch = (type) => {
  if (type === 'brand') {
    selectedBrand.value = null
  } else {
    searchTerm.value = ''
    suggestions.value = []
  }
}

// 가격을 원화 형식으로 변환하는 함수
const formatPrice = (price) => {
  return price.toLocaleString() + '원'
}

// 컴포넌트 초기화 시 실행되는 함수들
onMounted(() => {
  fetchBrands()
  search()
})
</script>

<template>
  <div class="product-search-page">
    <div class="main-content">
      <main>
        <div class="search-inputs">
          <!-- 브랜드 검색 영역 -->
          <div class="input-group">
            <label>브랜드명</label>
            <div class="dropdown-container">
              <input
                  type="text"
                  :value="selectedBrandName"
                  readonly
                  @click="showBrandDropdown = true"
                  placeholder="브랜드 선택"
              />
              <button v-if="selectedBrand" @click.stop="clearSearch('brand')">X</button>
              <div v-if="showBrandDropdown" class="dropdown-content">
                <div
                    v-for="brand in brands"
                    :key="brand.brandCode"
                    @click="selectBrand(brand)"
                    class="dropdown-item"
                >
                  {{ brand.brandName }}
                </div>
              </div>
            </div>
          </div>

          <!-- 상품명 검색 영역 -->
          <div class="input-group">
            <label>상품명</label>
            <div class="dropdown-container">
              <input
                  type="text"
                  v-model="searchTerm"
                  @input="handleSearchInput"
                  placeholder="상품명 검색"
              />
              <button v-if="searchTerm" @click.stop="clearSearch('product')">X</button>
              <div v-if="suggestions.length > 0" class="dropdown-content">
                <div
                    v-for="item in suggestions"
                    :key="item.id"
                    @click="selectSuggestion(item)"
                    class="dropdown-item"
                >
                  {{ item.goodsName }}
                </div>
              </div>
            </div>
          </div>

          <button class="search-button" @click="search">조회</button>
        </div>

        <!-- 검색 결과 테이블 -->
        <table class="results-table">
          <thead>
          <tr>
            <th>상품코드</th>
            <th>상품명</th>
            <th>브랜드</th>
            <th>피부타입</th>
            <th>가격</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="product in searchResults" :key="product.goodsCode">
            <td>{{ product.goodsCode }}</td>
            <td>{{ product.goodsName }}</td>
            <td>{{ product.brandName }}</td>
            <td>{{ product.goodsSkintype }}</td>
            <td>{{ formatPrice(product.goodsPrice) }}</td>
          </tr>
          </tbody>
        </table>
      </main>
    </div>
  </div>
</template>

<style scoped>
.main-content {
  display: flex;
  height: calc(100vh - 60px);
}

.product-search-page {
  font-family: Arial, sans-serif;
  padding: 20px;  /* 패딩 추가 */
}

main {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: white;
}

.search-inputs {
  display: flex;
  align-items: flex-start;
  padding: 0 20px;
  gap: 20px;
  margin: 20px 0;
}

.input-group {
  display: flex;
  flex-direction: column;
  margin-right: 10px;
  gap: 8px;
}

.input-group label {
  font-weight: 500;
}

.input-group input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.dropdown-container {
  position: relative;
}

.dropdown-container button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
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

.search-button {
  margin-top: 24px;
  padding: 8px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-button:hover {
  background-color: #45a049;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.results-table th,
.results-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.results-table th {
  background-color: #BBE5FB;
  font-weight: 500;
}

.results-table tr{
  background-color: white;
}

.results-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.pagination button {
  margin: 0 5px;
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button.active {
  background-color: #4CAF50;
  color: white;
}

.pagination button:hover:not(.active) {
  background-color: #ddd;
}
</style>