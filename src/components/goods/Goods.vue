<template>
  <div class="product-search-page">
    <header class="header">
    </header>
    <div class="main-content">
      <aside class="sidebar">
        <GoodsSidebar @select-subcategory="handleSubCategorySelect"/>
      </aside>
      <main>
        <div class="search-inputs">
          <!-- 브랜드 검색 -->
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

          <!-- 상품명 검색 -->
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

        <div class="pagination">
          <button>이전</button>
          <button
              v-for="page in 3"
              :key="page"
              :class="{ active: page === 1 }"
          >
            {{ page }}
          </button>
          <button>다음</button>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import {computed, onMounted, ref} from 'vue'
import axios from 'axios'
import GoodsSidebar from "@/components/goods/GoodsSidebar.vue";

export default {
  name: 'GoodsSearch',
  components: {
    GoodsSidebar
  },

  setup() {
    const brands = ref([])
    const selectedBrand = ref(null)
    const showBrandDropdown = ref(false)
    const searchTerm = ref('')
    const suggestions = ref([])
    const searchResults = ref([])

    // 하위 카테고리 선택 시 처리하는 함수 추가
    const handleSubCategorySelect = async (subCategoryCode) => {
      try {
        // 선택된 하위 카테고리의 상품 목록 조회
        const response = await axios.get(`/api/v1/goods/category/sub/${subCategoryCode}`)
        searchResults.value = response.data
      } catch (error) {
        console.error('Failed to fetch category goods:', error)
      }
    }

    const selectedBrandName = computed(() => {
      if (!selectedBrand.value) return ''
      const brand = brands.value.find(b => b.brandCode === selectedBrand.value.brandCode)
      return brand ? brand.brandName : ''
    })

    const fetchBrands = async () => {
      try {
        const response = await axios.get('/api/v1/goods/brands')
        brands.value = response.data
      } catch (error) {
        console.error('Failed to fetch brands:', error)
      }
    }

    const handleSearchInput = async () => {
      if (searchTerm.value.length > 0) {
        try {
          const response = await axios.get(`/api/v1/goods/search/${searchTerm.value}`)
          suggestions.value = response.data
        } catch (error) {
          console.error('Failed to fetch suggestions:', error)
        }
      } else {
        suggestions.value = []
      }
    }

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
        console.error('Failed to fetch search results:', error)
      }
    }

    const selectBrand = (brand) => {
      selectedBrand.value = brand
      showBrandDropdown.value = false
    }

    const selectSuggestion = (item) => {
      searchTerm.value = item.goodsName
      suggestions.value = []
    }

    const clearSearch = (type) => {
      if (type === 'brand') {
        selectedBrand.value = null
      } else {
        searchTerm.value = ''
        suggestions.value = []
      }
    }

    const formatPrice = (price) => {
      return price.toLocaleString() + '원'
    }

    onMounted(() => {
      fetchBrands()
      search()
    })

    return {
      handleSubCategorySelect,
      brands,
      searchTerm,
      selectedBrand,
      selectedBrandName,
      suggestions,
      searchResults,
      showBrandDropdown,
      handleSearchInput,
      search,
      selectBrand,
      selectSuggestion,
      clearSearch,
      formatPrice
    }
  }
}
</script>

<style scoped>

.main-content {
  display: flex;
  height: calc(100vh - 60px);
}

.product-search-page {
  font-family: Arial, sans-serif;
}

main {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
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