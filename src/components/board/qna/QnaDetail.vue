<script setup>
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {delFetch, getFetch} from "@/stores/apiClient.js";
import {formatDate} from "@/stores/util.js";

const router = useRouter();
const route = useRoute();

const inquiryId = route.params['inquiryId'];
const inquiryDetail = ref({});

const fetchInquiryDetail = async () => {
  try {
    const response = await getFetch(`/inquiry/${inquiryId}`)
    inquiryDetail.value = response.data.data;
  } catch (error) {
    console.error("Q&A 세부 정보를 가져오는 데 오류가 발생했습니다:", error);
  }
}

const goBack = () => {
  router.push('/qna');
};

const editInquiry = () => {
  router.push({
    path: `/qna/${inquiryId}/update`
  });
};

const deleteFetchInquiry = async () => {
  try {
    await delFetch(`/inquiry/${inquiryId}`);
  } catch (error) {
    console.error('삭제에 실패했습니다.', error);
  }
}

const deleteInquiry = () => {
  if (confirm('정말로 삭제하시겠습니까?')) {
    deleteFetchInquiry();
    alert('삭제되었습니다.');
    router.push('/qna');
  }
};

onMounted(() => {
  fetchInquiryDetail();
})
</script>

<template>
  <div class="qna-detail-container">
    <div class="qna-header">
      <h3 class="title">{{ inquiryDetail.inquiryTitle }}</h3>
      <div class="info-section">
        <div class="info-item">
          <span class="info-label">조회수</span>
          <span class="info-value">{{ inquiryDetail.inquiryViewcount }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">상태</span>
          <span
              class="status-badge"
              :class="inquiryDetail.inquiryReplyYn === 'Y' ? 'answered' : 'waiting'"
          >
            {{ inquiryDetail.inquiryReplyYn === 'Y' ? '답변완료' : '답변대기' }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">비밀글</span>
          <span class="info-value">{{ inquiryDetail.inquirySecretYn === 'Y' ? '예' : '아니오' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">등록일</span>
          <span class="info-value">{{ formatDate(inquiryDetail.createdDate) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">작성자</span>
          <span class="info-value">{{ inquiryDetail.userName }}</span>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div v-html="inquiryDetail.inquiryContent" class="post-content"></div>
    </div>

    <div class="footer-section">
      <div class="left-buttons">
        <button class="btn btn-secondary" @click="goBack">
          <span class="btn-text">목록으로</span>
        </button>
      </div>
      <div class="right-buttons">
        <button class="btn btn-primary" @click="editInquiry">
          <span class="btn-text">수정</span>
        </button>
        <button class="btn btn-danger" @click="deleteInquiry">
          <span class="btn-text">삭제</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qna-detail-container {
  max-width: 1200px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.qna-header {
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

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.waiting {
  background-color: #fff3e0;
  color: #e65100;
}

.status-badge.answered {
  background-color: #e8f5e9;
  color: #2e7d32;
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

.post-content img {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
  border-radius: 4px;
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
  .qna-detail-container {
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