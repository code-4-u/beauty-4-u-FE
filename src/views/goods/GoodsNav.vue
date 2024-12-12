<script setup>
import {ref} from 'vue';

// Reactive references
const searchQuery = ref('');
const navItems = ref([]);

navItems.value = [
  { id: 1, name: '상품 카테고리', link: '/goods/search'},
  { id: 2, name: '리뷰 조회', link: '/goods/review'}
];

</script>


<template>
  <div class="sidebar">
    <div class="header">
      <div class="logo">WebbyFrames</div>
      <div class="user-icon">🔔</div>
    </div>
    <div class="search-bar">
      <input type="text" v-model="searchQuery" placeholder="Search for..." style="width: 80%;" />
    </div>
    <ul class="nav-list">
      <li v-for="item in navItems" :key="item.id">
        <router-link :to="item.link">
          <div>
            {{ item.name }}
          </div>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sidebar {
  width: 300px;
  background-color: #f0f0f0;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-weight: bold;
}

.search-bar {
  margin: 20px 0;
  left: 0;
}

.search-bar input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-right: 10px; /* 오른쪽 여백 추가 */
}

.nav-list {
  list-style-type: none;
  padding-left: 1em;
}

.nav-list li {
  padding: 10px 0;
  cursor: pointer;
}

.nav-list li:hover {
  background-color: #e0e0e0;
}
</style>