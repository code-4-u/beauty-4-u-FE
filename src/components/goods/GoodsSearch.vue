<script setup>
import {onMounted, ref} from 'vue'
import {getFetch} from "@/stores/apiClient.js";

// params 를 로컬 상태로 관리
const searchParams = ref({});

// 브랜드 검색과 관련된 상태 관리
const brands = ref([])
const selectedBrand = ref(null)
const showBrandDropdown = ref(false)

// 상품 검색과 관련된 상태 관리
const searchTerm = ref('')
const suggestions = ref([])
const searchResults = ref([])
const loading = ref(false)

// 검색어 입력 처리 함수 추가
const handleSearchInput = async () => {
  if (!searchTerm.value) {
    suggestions.value = []
    // await fetchProducts()
    return
  }
  try {
    const response = await getFetch(`/goods/search/${searchTerm.value}`)
    suggestions.value = response.data.data
  } catch (error) {
    console.log('검색어 제안 조회 중 오류 발생:', error)
    suggestions.value = []
  }
}

// 브랜드 목록을 서버에서 가져오는 함수
const fetchBrands = async () => {
  try {
    const response = await getFetch('/goods/brands')
    brands.value = response.data.data;
  } catch (error) {
    console.error('브랜드 목록 조회 중 오류 발생:', error)
  }
}

// 전체 상품 목록을 가져오는 함수
const fetchAllProducts = async () => {
  loading.value = true
  try {
    const response = await getFetch('/goods/search');
    if(response?.data?.data){
      searchResults.value = response.data.data;
    } else{
      searchResults.value = []
    }
  } catch (error) {
    console.log(searchResults.value)
    console.error('상품 목록 조회 중 오류 발생:', error)
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
}

// 브랜드 선택 처리 함수
const selectBrand = async (brand) => {
  selectedBrand.value = brand
  showBrandDropdown.value = false
}

// 검색 조건 초기화 함수
const clearSearch = async (type) => {
  if (type === 'brand') {
    selectedBrand.value = null
    // params.value.brandCode = undefined
    await fetchAllProducts() // 브랜드 선택 초기화 시 전체 상품 다시 로드
  } else {
    searchTerm.value = ''
    // params.value.goodsName = undefined
    suggestions.value = []
  }
}

// 검색어 제안 선택 처리 함수
const selectSuggestion = (item) => {
  searchTerm.value = item.goodsName
  suggestions.value = []
}

// 검색 처리 함수
const search = async () => {
  loading.value = true
  try {
    let response
    // searchParams.value = {}

    // 브랜드만 선택한 경우
    if (selectedBrand.value && !searchTerm.value) {
      response = await getFetch(`/goods/brands/${selectedBrand.value.brandCode}`)
      // searchParams.value.brandCode = selectedBrand.value.brandCode
    }
    // 상품명만 입력된 경우 또는 브랜드와 상품 모두 있는 경우
    else if (searchTerm.value || (selectedBrand.value && searchTerm.value)) {
      const queryParams = new URLSearchParams();
      if(selectedBrand.value) queryParams.append('brandCode',selectedBrand.value.brandCode);
      if(searchTerm.value) queryParams.append('goodsName',searchTerm.value);

      response = await getFetch(`/goods/search?${queryParams.toString()}`);
      // params.value.goodsName = searchTerm.value
    }
    // 아무 조건도 없는 경우
    else {
      await fetchAllProducts();
      // searchResults.value = []
      // loading.value = false
      return;
    }

    // 검색 결과가 있는 경우에만 데이터 설정
    if (response?.data?.data){
      if(Array.isArray(response.data.data) && response.data.data.length > 0){
        searchResults.value = response.data.data;
      } else {
        searchResults.value = [];
        alert("해당 상품이 존재하지 않습니다.");
      }
    } else {
      searchResults.value = [];
      alert('해당 상품이 존재하지 않습니다.');
    }
  } catch (error) {
    console.error('상품 검색 중 오류 발생:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
};

// 컴포넌트 초기화 시 실행되는 함수들
onMounted(async () => {
  await fetchBrands()
  await fetchAllProducts()
})
</script>

<template>
  <div class="product-search-page">
    <div class="main-content">
      <main>
        <b-container class="bv-example-row bv-example-row-flex-cols">
          <b-row>
            <!--왼쪽 사이드바-->
            <b-col cols="3" align-self="baseline">
              <b-nav vertical>
                <b-nav-item active>스킨/케어</b-nav-item>
                <b-nav-item>헤어</b-nav-item>
                <b-nav-item>샴푸</b-nav-item>
                <b-nav-item>린스</b-nav-item>
                <b-nav-item>트리트먼트</b-nav-item>
                <b-nav-item>바디</b-nav-item>
              </b-nav>
            </b-col>
            <!--오른쪽 콘텐츠-->
            <b-col cols="9" align-self="stretch">
              <div class="search-inputs">
                <!-- 브랜드 검색 영역 -->
                <div class="input-group">
                  <label>브랜드명</label>
                  <div class="dropdown-container">
                    <div class="dropdown-brand">
                      <b-dropdown split split-variant="outline-primary" variant="primary"
                                  :text="selectedBrand ? selectedBrand.brandName : '브랜드 선택'" class="m-2">
                        <b-dropdown-item
                            v-for="brand in brands"
                            :key="brand.brandCode"
                            @click="selectBrand(brand)">
                          {{ brand.brandName }}
                        </b-dropdown-item>
                      </b-dropdown>
                    </div>
                    <button v-if="selectedBrand" @click.stop="clearSearch('brand')">X</button>
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
                          :key="item.goodsCode"
                          @click="selectSuggestion(item)"
                          class="dropdown-item"
                      >
                        {{ item.goodsName }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="button-group">
                  <button class="search-button" @click="search">조회</button>
                  <button class="search-button all-products" @click="fetchAllProducts">전체조회</button>
                </div>
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
                <tr v-if="loading">
                  <td colspan="5" class="text-center">로딩 중...</td>
                </tr>
                <tr v-else-if="searchResults.length === 0">
                  <td colspan="5" class="text-center">상품을 검색해 주세요.</td>
                </tr>
                <tr v-else v-for="product in searchResults" :key="product.goodsCode">
                  <td>{{ product.goodsCode }}</td>
                  <td>{{ product.goodsName }}</td>
                  <td>{{ product.brandName }}</td>
                  <td>{{ product.goodsSkintype }}</td>
                  <td>{{ product.goodsPrice }}</td>
                </tr>
                </tbody>
              </table>
            </b-col>
          </b-row>
        </b-container>
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
  padding: 20px;
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

.results-table tr {
  background-color: white;
}

.results-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.text-center {
  text-align: center;
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