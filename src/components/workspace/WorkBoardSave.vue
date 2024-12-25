<script setup>
import {ref, computed} from 'vue';
import {useRouter} from 'vue-router';
import {postFetch} from "@/stores/apiClient.js";
import BoardEditor from "@/components/board/editor/BoardEditor.vue";
import ImageManagement from "@/components/board/editor/ImageManagement.vue";
import {useAuthStore} from '@/stores/auth.js';

const router = useRouter();
const useAuth = useAuthStore();
const teamBoardTitle = ref('');
const editorContent = ref('<p>내용을 입력해주세요.</p>');
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
    selectedFiles.value = selectedFiles.value.filter(f => f.id !== fileId);
  }
};

// 목록으로 돌아가기
const goBack = () => {
  router.push('/workspace/board');
};

// 워크보드 저장
const saveWorkBoard = async () => {
  try {
    // 입력값 검증
    if (!teamBoardTitle.value.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // 1. 현재 에디터 내용 가져오기
    let currentContent = editorContent.value;
    console.log('Original content:', currentContent); // 디버깅용

    // 2. 선택된 모든 파일들을 S3에 업로드하고 URL 매핑 생성
    const uploadedImages = [];
    for (const fileInfo of selectedFiles.value) {
      try {
        const formData = new FormData();
        formData.append('image', fileInfo.file);
        const response = await postFetch('/file/s3/upload', formData);
        const s3Url = response.data.data;

        // URL 매핑 저장
        uploadedImages.push({
          tempUrl: fileInfo.tempUrl,
          permanentUrl: s3Url
        });

        console.log('URL Mapping:', { // 디버깅용
          temp: fileInfo.tempUrl,
          permanent: s3Url
        });
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        throw new Error('이미지 업로드 중 오류가 발생했습니다.');
      }
    }

    // 3. 에디터 내용에서 임시 URL을 실제 S3 URL로 교체
    uploadedImages.forEach(({tempUrl, permanentUrl}) => {
      const escapedTempUrl = tempUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const urlRegex = new RegExp(escapedTempUrl, 'g');

      console.log('Replacing:', { // 디버깅용
        from: tempUrl,
        to: permanentUrl,
        regex: urlRegex
      });

      // 실제 교체 수행
      currentContent = currentContent.replace(urlRegex, permanentUrl);
    });

    console.log('Final content:', currentContent); // 디버깅용

    // 4. 워크보드 저장
    const response = await postFetch('/teamspace/board', {
      teamBoardTitle: teamBoardTitle.value,
      teamBoardContent: currentContent, // 교체된 내용 사용
    });

    // 5. 이미지 엔티티 저장
    if (uploadedImages.length > 0) {
      await postFetch('/file/save', {
        entityId: response.data.data,
        imageUrls: uploadedImages.map(img => img.permanentUrl),
        entityType: "teamboard"
      });
    }

    // 6. 성공 메시지 표시
    alert('저장되었습니다.');

    // 7. 목록으로 이동
    await router.push('/workspace/board');
  } catch (error) {
    console.error('워크보드 저장에 실패했습니다.', error);
    alert('저장에 실패했습니다. 다시 시도해주세요.');
  }
};
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
        <button class="btn btn-primary" @click="saveWorkBoard">
          <span class="btn-text">등록</span>
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
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
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