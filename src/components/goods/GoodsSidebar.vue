<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = ref('category')

// 현재 라우트 경로를 감시하여 activeMenu 업데이트
watch(() => route.path, (newPath) => {
  if (newPath === '/review') {
    activeMenu.value = 'review'
  } else if (newPath === '/goods') {
    activeMenu.value = 'category'
  }
}, { immediate: true })

const setActiveMenu = (menuType) => {
  activeMenu.value = menuType
}
</script>

<template>
  <aside class="sidebar full-height">
    <div class="webby-frames">
      <div class="search-box">
        <input type="text" placeholder="Search for..."/>
      </div>
    </div>

    <nav class="side-menu">
      <router-link
          to="/goods"
          class="menu-item"
          :class="{ active: activeMenu === 'category' }"
          @click="setActiveMenu('category')"
      >
        <span class="icon">📁</span>
        <span>상품 카테고리</span>
      </router-link>

      <router-link
          to="/review"
          class="menu-item"
          :class="{ active: activeMenu === 'review' }"
          @click="setActiveMenu('review')"
      >
        <span class="icon">📝</span>
        <span>상품 리뷰</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  background: white;
  border-right: 1px solid #e0e0e0;
  padding: 16px;
  height: 100%;
  min-height: 100vh;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
  background: white;  /* 기본 배경색을 흰색으로 설정 */
}

.menu-item.active {
  background: #e8f5e9;
}

.search-box {
  padding: 8px;
}

</style>