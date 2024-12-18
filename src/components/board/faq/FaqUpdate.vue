<script setup>
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {putFetch, getFetch} from "@/stores/apiClient.js";
import BoardEditor from "@/components/board/editor/BoardEditor.vue";

const router = useRouter();
const route = useRoute();
const faqId = route.params['faqId'];

const faqTitle = ref('');
const editorContent = ref('');
const boardEditorRef = ref(null);

const fetchFaqDetail = async () => {
  try {
    const response = await getFetch(`/inquiry/faq/${faqId}`);
    const data = response.data.data;
    faqTitle.value = data.faqTitle;
    editorContent.value = data.faqContent;
  } catch (error) {
    console.error("FAQ 세부 정보를 가져오는 데 오류가 발생했습니다:", error);
  }
}

// 목록으로 돌아가기
const goBack = () => {
  router.push('/faq');
};

// FAQ 수정
const updateFaq = async () => {
  try {
    // 입력값 검증
    if (!faqTitle.value.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // FAQ 수정
    await putFetch(`/inquiry/faq/${faqId}`, {
      faqTitle: faqTitle.value,
      faqContent: editorContent.value
    });

    // 목록으로 이동
    await router.push({
      path: `/faq`
    });
  } catch (error) {
    console.error('수정에 실패했습니다.', error);
    alert('수정에 실패했습니다. 다시 시도해주세요.');
  }
};

onMounted(() => {
  fetchFaqDetail();
});
</script>

<template>
  <div class="faq-detail-container">
    <div class="faq-header">
      <div class="title-wrapper">
        <h3 class="title-label">제목</h3>
        <input
            type="text"
            class="title-input"
            v-model="faqTitle"
            placeholder="FAQ 제목을 입력하세요"
        >
      </div>
    </div>

    <div class="info-section"></div>

    <div class="editor-container">
      <board-editor
          ref="boardEditorRef"
          v-model="editorContent"
      />
    </div>

    <div class="footer-section">
      <div class="left-buttons">
        <button class="btn btn-secondary" @click="goBack">
          <span class="btn-text">목록으로</span>
        </button>
      </div>

      <div class="right-buttons">
        <button class="btn btn-primary" @click="updateFaq">
          <span class="btn-text">수정완료</span>
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

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.title-label {
  min-width: 60px;
  margin: 0;
  color: #333;
  font-weight: 600;
}

.title-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.title-input:focus {
  outline: none;
  border-color: #29C458;
  box-shadow: 0 0 0 3px rgba(41, 196, 88, 0.1);
}

.title-input::placeholder {
  color: #aaa;
}

.info-section {
  margin-bottom: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.editor-container {
  margin: 1rem 0;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
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
  align-items: center;
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

.btn-text {
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .faq-detail-container {
    margin: 0.75rem;
    padding: 0.75rem;
  }

  .title-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .footer-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .right-buttons {
    width: 100%;
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn {
    width: 100%;
  }
}
</style>