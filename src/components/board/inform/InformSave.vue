<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {postFetch} from "@/stores/apiClient.js";
import BoardEditor from "@/components/board/inform/BoardEditor.vue";
import ImageManagement from "@/components/board/ImageManagement.vue";

const router = useRouter();
const informTitle = ref('');
const editorContent = ref('<p>기본 내용입니다.</p>');
const selectedFiles = ref([]);
const imageUrls = ref([]);
const boardEditorRef = ref(null);
const uploadStatus = ref('');

const insertImageAtCursor = (imageUrl, removeUrl) => {
  if (boardEditorRef.value) {
    if (removeUrl) {
      // 이미지 제거
      boardEditorRef.value.removeImage(removeUrl);
    } else if (imageUrl) {
      // 이미지 추가
      boardEditorRef.value.insertImage(imageUrl);
    }
  }
};

// 이미지 관리 핸들러
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
    // 목록에서 제거
    selectedFiles.value = selectedFiles.value.filter(f => f.id !== fileId);
  }
};

// 목록으로 돌아가기
const goBack = () => {
  router.push('/board/inform');
};

// 게시글 저장
const fetchSaveInform = async () => {
  try {
    // 1. 모든 이미지가 업로드될 때까지 대기
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
    if (!informTitle.value.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // 2. 본문에서 이미지 URL 추출
    const imageRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
    const content = editorContent.value;
    const imageMatches = [...content.matchAll(imageRegex)];
    const imageUrls = imageMatches.map(match => match[1]);

    // 3. 게시글 저장
    const response = await postFetch(`/inform`, {
      informTitle: informTitle.value,
      informContent: editorContent.value
    });

    // 4. 저장된 게시글의 ID로 이미지 저장
    if (imageUrls.length > 0) {
      await postFetch('/file/save', {
        entityId: response.data.data,
        imageUrls: imageUrls,
        isInform: true
      });
    }

    // 5. 목록으로 이동
    await router.push({
      path: `/board/inform`
    });
  } catch (error) {
    console.error('저장에 실패했습니다.', error);
    alert('저장에 실패했습니다. 다시 시도해주세요.');
  }
};
</script>

<template>
  <div class="notice-detail-container">
    <div class="notice-header">
      <div class="title-wrapper">
        <h3 class="title-label">제목</h3>
        <input
            type="text"
            class="title-input"
            v-model="informTitle"
            placeholder="제목을 입력하세요"
        >
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
        <button class="btn btn-primary" @click="fetchSaveInform">
          <span class="btn-text">등록</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notice-detail-container {
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

.notice-header {
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
  .notice-detail-container {
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