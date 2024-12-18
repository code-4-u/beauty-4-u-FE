<script setup>
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {delFetch, getFetch} from "@/stores/apiClient.js";
import {formatDate} from "@/stores/util.js";

const router = useRouter();
const route = useRoute();

const faqId = route.params['faqId'];
const faqDetail = ref({});

const fetchFaqDetail = async () => {
  try {
    const response = await getFetch(`/inquiry/faq/${faqId}`);
    faqDetail.value = response.data.data;
  } catch (error) {
    console.error("FAQ 세부 정보를 가져오는 데 오류가 발생했습니다:", error);
  }
}

// 목록으로 돌아가기
const goBack = () => {
  router.push('/faq');
};

// 수정 페이지로 이동
const editFaq = () => {
  router.push({
    path: `/faq/${faqId}/update`
  });
};

// 삭제 api 호출
const deleteFetchFaq = async () => {
  try {
    await delFetch(`/inquiry/faq/${faqId}`);
  } catch (error) {
    console.error('삭제에 실패했습니다.', error);
  }
}

// 삭제 기능 (확인 대화상자 포함)
const deleteFaq = () => {
  if (confirm('정말로 삭제하시겠습니까?')) {
    deleteFetchFaq();
    alert('삭제되었습니다.');
    router.push('/faq');
  }
};

onMounted(() => {
  fetchFaqDetail();
})
</script>

<template>
  <div class="faq-detail-container">
    <div class="faq-header">
      <h3 class="title">{{ faqDetail.faqTitle }}</h3>
      <div class="info-section">
        <div class="info-item">
          <span class="info-label">조회수</span>
          <span class="info-value">{{ faqDetail.faqViewcount }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">등록일</span>
          <span class="info-value">{{ formatDate(faqDetail.createdDate) }}</span>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div v-html="faqDetail.faqContent" class="post-content"></div>
    </div>

    <div class="footer-section">
      <div class="left-buttons">
        <button class="btn btn-secondary" @click="goBack">
          <span class="btn-text">목록으로</span>
        </button>
      </div>
      <div class="right-buttons">
        <button class="btn btn-primary" @click="editFaq">
          <span class="btn-text">수정</span>
        </button>
        <button class="btn btn-danger" @click="deleteFaq">
          <span class="btn-text">삭제</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.faq-detail-container {
  max-width: 1200px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.faq-header {
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  padding-bottom: 1rem;
  border-bottom: 2px solid #29C458;
}

.info-section {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-top: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
}

.content-section {
  margin: 2rem 0;
  min-height: 300px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
}

.post-content {
  line-height: 1.6;
}

.footer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.right-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.btn-primary {
  background-color: #29C458;
  color: white;
}

.btn-primary:hover {
  background-color: #23a94c;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.btn-text {
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .faq-detail-container {
    margin: 0.75rem;
    padding: 0.75rem;
  }

  .info-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .footer-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .left-buttons,
  .right-buttons {
    width: 100%;
    display: flex;
    gap: 0.75rem;
  }

  .btn {
    flex: 1;
  }
}
</style>