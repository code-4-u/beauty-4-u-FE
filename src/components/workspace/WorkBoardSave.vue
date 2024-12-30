<script setup>
import {onBeforeUnmount, ref} from 'vue';
import {useRouter} from 'vue-router';
import {postFetch} from "@/stores/apiClient.js";
import BoardEditor from "@/components/board/editor/BoardEditor.vue";
import {useAuthStore} from '@/stores/auth.js';
import ImageManagement from "@/components/board/editor/ImageManagement.vue";

const router = useRouter();
const useAuth = useAuthStore();
const teamBoardTitle = ref('');
const editorContent = ref('<p>내용을 입력해주세요.</p>');
const selectedFiles = ref([]);
const imageUrls = ref([]);
const boardEditorRef = ref(null);
const uploadStatus = ref('');
const isSubmitting = ref(false);

const insertImageAtCursor = (imageUrl, options = {}) => {
  if (!boardEditorRef.value) return;

  try {
    if (options.removeUrl) {  // 이미지 제거 케이스
      boardEditorRef.value.removeImage(options.removeUrl);
    } else if (options.file) {    // 이미지 추가 케이스
      // ImageManagement에서 이미 생성된 tempUrl 사용
      boardEditorRef.value.insertImage(imageUrl, {
        style: `max-width: ${options.width || 400}px; height: ${options.height || 'auto'};`,
        'data-temp-url': 'true'
      });
    }
  } catch (error) {
    console.error('이미지 삽입 중 오류:', error);
  }
};

// 이미지 관리 핸들러
const handleUpload = (files) => {
  uploadStatus.value = '업로드 중...';

  // selectedFiles에 파일 추가
  selectedFiles.value = [
    ...selectedFiles.value,
    ...files
  ];

  uploadStatus.value = '';
};

const handleRemove = (fileId) => {
  const fileToRemove = selectedFiles.value.find(f => f.id === fileId);
  if (fileToRemove) {
    // 임시 URL 제거
    if (fileToRemove.tempUrl) {
      URL.revokeObjectURL(fileToRemove.tempUrl);
    }
    // 목록에서 제거
    selectedFiles.value = selectedFiles.value.filter(f => f.id !== fileId);

    // 본문에서 이미지 제거
    if (fileToRemove.tempUrl) {
      const regex = new RegExp(`<img[^>]*src="${fileToRemove.tempUrl}"[^>]*>`, 'g');
      editorContent.value = editorContent.value.replace(regex, '');
    }
  }
};

// 목록으로 돌아가기
const goBack = () => {
  // 임시 URL 정리
  selectedFiles.value.forEach(file => {
    if (file.tempUrl) {
      URL.revokeObjectURL(file.tempUrl);
    }
  });
  router.push('/workspace/board');
};

// 워크보드 저장
const saveWorkBoard = async () => {
  if (isSubmitting.value) return;

  const uploadedS3Urls = []; // S3에 업로드된 URL들을 추적
  const originalFileNames = []; // 원본 파일명 추적

  try {
    isSubmitting.value = true;
    uploadStatus.value = '저장 중...';

    if (!teamBoardTitle.value.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // 1. 선택된 파일들을 S3에 업로드
    const uploadPromises = selectedFiles.value.map(async (fileInfo) => {
      const formData = new FormData();
      formData.append('image', fileInfo.file);

      try {
        const response = await postFetch('/file/s3/upload', formData);
        const s3Url = response.data.data;

        uploadedS3Urls.push(s3Url);
        originalFileNames.push(fileInfo.name);

        // tempUrl을 실제 S3 URL로 교체
        editorContent.value = editorContent.value.replace(
            fileInfo.tempUrl,
            s3Url
        );
        return s3Url;
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        throw error;
      }
    });

    // 모든 이미지 업로드 완료 대기
    const s3Urls = await Promise.all(uploadPromises);

    // 2. 변환된 content로 게시글 저장
    const response = await postFetch(`/teamspace/board`, {
      teamBoardTitle: teamBoardTitle.value,
      teamBoardContent: editorContent.value
    });

    // 3. 파일 정보 DB 저장 (원본 파일명 포함)
    if (s3Urls.length > 0) {
      await postFetch('/file/save', {
        imageS3Urls: s3Urls,           // s3 url 배열
        fileUrls: originalFileNames,   // 원본 파일명 배열
        entityType: "TEAMBOARD"        // 엔티티 타입
      });
    }

    // 4. 임시 URL 정리
    selectedFiles.value.forEach(file => {
      if (file.tempUrl) {
        URL.revokeObjectURL(file.tempUrl);
      }
    });

    alert('저장되었습니다.');

    // 5. 목록으로 이동
    await router.push('/workspace/board');

  } catch (error) {
    console.error('저장에 실패했습니다.', error);

    // 에러시 s3에 이미지들 삭제
    if (uploadedS3Urls.length > 0) {
      try {
        await postFetch('/file/s3/uploadList', uploadedS3Urls);
      } catch (deleteError) {
        console.error('S3 이미지 삭제 실패:', deleteError);
      }
    }

    alert('저장에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isSubmitting.value = false;
    uploadStatus.value = '';
  }
};

// 컴포넌트 언마운트 시 임시 URL 정리
onBeforeUnmount(() => {
  selectedFiles.value.forEach(file => {
    if (file.tempUrl) {
      URL.revokeObjectURL(file.tempUrl);
    }
  });
});
</script>

<template>
  <div class="board-detail-container">
    <div class="board-header">
      <div class="title-wrapper">
        <h3 class="title-label">제목</h3>
        <input
            type="text"
            class="title-input"
            v-model="teamBoardTitle"
            placeholder="워크보드 제목을 입력하세요"
            :disabled="isSubmitting"
        >
      </div>
    </div>

    <div class="info-section"></div>

    <ImageManagement
        :selected-files="selectedFiles"
        :image-urls="imageUrls"
        @upload="handleUpload"
        @remove="handleRemove"
        @insert-to-editor="insertImageAtCursor"
        :disabled="isSubmitting"
    />

    <div class="editor-container">
      <board-editor
          ref="boardEditorRef"
          v-model="editorContent"
          :disabled="isSubmitting"
      />
    </div>

    <div v-if="uploadStatus" class="upload-status">
      {{ uploadStatus }}
    </div>

    <div class="footer-section">
      <div class="left-buttons">
        <button
            class="btn btn-secondary"
            @click="goBack"
            :disabled="isSubmitting"
        >
          <span class="btn-text">목록으로</span>
        </button>
      </div>

      <div class="right-buttons">
        <button
            class="btn btn-primary"
            @click="saveWorkBoard"
            :disabled="isSubmitting"
        >
          <span class="btn-text">{{ isSubmitting ? '저장 중...' : '등록' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-detail-container {
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

.board-header {
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
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.title-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
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

.upload-status {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  text-align: center;
  color: #666;
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

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:not(:disabled):hover {
  background-color: #45a049;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:not(:disabled):hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.btn-text {
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .board-detail-container {
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