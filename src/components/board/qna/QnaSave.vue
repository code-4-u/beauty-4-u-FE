<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {postFetch} from "@/stores/apiClient.js";
import BoardEditor from "@/components/board/editor/BoardEditor.vue";
import ImageManagement from "@/components/board/editor/ImageManagement.vue";

const router = useRouter();
const qnaTitle = ref('');
const editorContent = ref('<p>내용을 입력해주세요.</p>');
const selectedFiles = ref([]);
const imageUrls = ref([]);
const boardEditorRef = ref(null);
const uploadStatus = ref('');
const isPrivate = ref('N');

const insertImageAtCursor = (imageUrl, removeUrl) => {
  if (boardEditorRef.value) {
    if (removeUrl) {
      boardEditorRef.value.removeImage(removeUrl);
    } else if (imageUrl) {
      boardEditorRef.value.insertImage(imageUrl);
    }
  }
};

const handleUpload = (files) => {
  uploadStatus.value = '업로드 중';
  selectedFiles.value = [
    ...selectedFiles.value,
    ...files
  ];
  uploadStatus.value = '업로드 완료';
};

const handleRemove = (fileId) => {
  const fileToRemove = selectedFiles.value.find(f => f.id === fileId);
  if (fileToRemove) {
    selectedFiles.value = selectedFiles.value.filter(f => f.id !== fileId);
  }
};

const goBack = () => {
  router.push('/qna');
};

const fetchSaveQna = async () => {
  try {
    if (uploadStatus.value === '업로드 중') {
      await new Promise(resolve => {
        const checkUpload = setInterval(() => {
          if (uploadStatus.value !== '업로드 중') {
            clearInterval(checkUpload);
            resolve();
          }
        }, 500);
      });
    }

    // 입력값 검증
    if (!qnaTitle.value.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // 본문에서 이미지 URL 추출
    const imageRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
    const content = editorContent.value;
    const imageMatches = [...content.matchAll(imageRegex)];
    const imageUrls = imageMatches.map(match => match[1]);

    // QNA 저장
    const response = await postFetch(`/inquiry`, {
      inquiryTitle: qnaTitle.value,
      inquiryContent: editorContent.value,
      inquirySecretYn: isPrivate.value === true ? 'Y' : 'N',
    });

    console.log(response.data.data)

    // 이미지 저장
    if (imageUrls.length > 0) {
      await postFetch('/file/save', {
        entityId: response.data.data,
        imageUrls: imageUrls,
        isInform: false
      });
    }

    await router.push({
      path: `/qna`
    });
  } catch (error) {
    console.error('저장에 실패했습니다.', error);
    alert('저장에 실패했습니다. 다시 시도해주세요.');
  }
};
</script>

<template>
  <div class="qna-detail-container">
    <div class="qna-header">
      <div class="title-wrapper">
        <h3 class="title-label">제목</h3>
        <input
            type="text"
            class="title-input"
            v-model="qnaTitle"
            placeholder="질문 제목을 입력하세요"
        >
      </div>

      <div class="private-setting">
        <label class="private-label">
          <input
              type="checkbox"
              v-model="isPrivate"
              class="private-checkbox"
          >
          비밀글로 작성
        </label>
      </div>
    </div>

    <div class="info-section"></div>

    <image-management
        :selected-files="selectedFiles"
        :image-urls="imageUrls"
        @upload="handleUpload"
        @remove="handleRemove"
        @insert-to-editor="insertImageAtCursor"
    />

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
        <button class="btn btn-primary" @click="fetchSaveQna">
          <span class="btn-text">질문 등록</span>
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

.editor-container, :deep(.image-management) {
  width: 100%;
}

.qna-header {
  margin-bottom: 1.5rem;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.private-setting {
  margin-top: 1rem;
  padding: 0.5rem 0;
}

.private-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  cursor: pointer;
}

.private-checkbox {
  width: 1rem;
  height: 1rem;
  margin: 0;
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
  .qna-detail-container {
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