<script setup>
import {onMounted, onBeforeUnmount, ref, computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {getFetch, postFetch, putFetch} from "@/stores/apiClient.js";
import BoardEditor from "@/components/board/editor/BoardEditor.vue";
import ImageManagement from "@/components/board/editor/ImageManagement.vue";

const router = useRouter();
const route = useRoute();

const teamBoardId = route.params['teamBoardId'];
const teamBoardTitle = ref('');
const editorContent = ref('');
const selectedFiles = ref([]);
const imageUrls = ref([]);
const boardEditorRef = ref(null);
const uploadStatus = ref('');
const isSubmitting = ref(false);
const originalS3Urls = ref([]);

const fetchTeamBoardDetail = async () => {
  try {
    const response = await getFetch(`/teamspace/board/${teamBoardId}`);
    const data = response.data.data.teamBoardDetailDTO;
    teamBoardTitle.value = data.teamBoardTitle;
    editorContent.value = data.teamBoardContent;

    // 이미지 URL 가져오기
    const fileResponse = await getFetch(`/file/list?fileType=TEAMBOARD&fileUrl=${teamBoardId}`);
    if (fileResponse?.data?.data?.fileList && fileResponse.data.data.fileList.length > 0) {
      originalS3Urls.value = fileResponse.data.data.fileList;
      imageUrls.value = fileResponse.data.data.fileList;

      // 기존 이미지를 selectedFiles에 추가
      selectedFiles.value = fileResponse.data.data.fileList.map((url, index) => ({
        id: `existing-${index}`,
        name: url.split('/').pop() || `image-${index}`,
        url: url,
        isExisting: true,
        size: 0,
        file: null
      }));
    }

  } catch (error) {
    console.error("게시글 세부 정보를 가져오는 데 오류가 발생했습니다:", error);
  }
};

const handleUpload = (files) => {
  uploadStatus.value = '업로드 중...';

  const newFiles = files.map(file => ({
    id: `new-${Date.now()}-${Math.random()}`,
    name: file.name,
    file: file.file,
    size: file.file.size,
    tempUrl: null
  }));

  selectedFiles.value = [...selectedFiles.value, ...newFiles];
  uploadStatus.value = '';
};

const handleRemove = (fileId) => {
  const fileToRemove = selectedFiles.value.find(f => f.id === fileId);
  if (fileToRemove && fileToRemove.tempUrl) {
    URL.revokeObjectURL(fileToRemove.tempUrl);
  }

  selectedFiles.value = selectedFiles.value.filter(f => f.id !== fileId);
};

const goBack = () => {
  // 임시 URL 정리
  selectedFiles.value.forEach(file => {
    if (file.tempUrl) {
      URL.revokeObjectURL(file.tempUrl);
    }
  });
  router.push(`/workspace/board`);
};

const updateTeamBoard = async () => {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;
    uploadStatus.value = '수정 중...';

    if (!teamBoardTitle.value.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // 4. 게시글 수정
    await putFetch(`/teamspace/board/${teamBoardId}`, {
      teamBoardTitle: teamBoardTitle.value,
      teamBoardContent: editorContent.value
    });

    // 7. 목록으로 이동
    await router.push(`/workspace/board`);

  } catch (error) {
    console.error('수정에 실패했습니다.', error);
    alert('수정에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isSubmitting.value = false;
    uploadStatus.value = '';
  }
};

onMounted(() => {
  fetchTeamBoardDetail();
});

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
            placeholder="제목을 입력하세요"
            :disabled="isSubmitting"
        >
      </div>
    </div>

    <div class="info-section"></div>

    <image-management
        :selected-files="selectedFiles"
        :image-urls="imageUrls"
        @upload="handleUpload"
        @remove="handleRemove"
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
            @click="updateTeamBoard"
            :disabled="isSubmitting"
        >
          <span class="btn-text">{{ isSubmitting ? '수정 중...' : '수정완료' }}</span>
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
  border-color: #29C458;
  box-shadow: 0 0 0 3px rgba(41, 196, 88, 0.1);
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
  background-color: #29C458;
  color: white;
}

.btn-primary:not(:disabled):hover {
  background-color: #23a94c;
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

/* Editor Styles */
:deep(.editor-content) {
  min-height: 300px;
  padding: 1rem;
}

:deep(.editor-toolbar) {
  border-bottom: 1px solid #e0e0e0;
  padding: 0.5rem;
  background-color: #f8f9fa;
}

:deep(.editor-toolbar button) {
  padding: 0.25rem 0.5rem;
  margin-right: 0.25rem;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
}

:deep(.editor-toolbar button:hover) {
  color: #29C458;
}

:deep(.editor-toolbar button.active) {
  color: #29C458;
  background-color: rgba(41, 196, 88, 0.1);
  border-radius: 4px;
}

/* Image Management Styles */
:deep(.image-list) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

:deep(.image-item) {
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1;
}

:deep(.image-item img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:deep(.image-item .remove-button) {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #dc3545;
}

:deep(.image-item .remove-button:hover) {
  background-color: #dc3545;
  color: white;
}

:deep(.upload-area) {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.upload-area:hover) {
  border-color: #29C458;
  background-color: rgba(41, 196, 88, 0.05);
}

:deep(.upload-area.dragging) {
  border-color: #29C458;
  background-color: rgba(41, 196, 88, 0.1);
}

/* Mobile Responsive */
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

  :deep(.image-list) {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
  }

  :deep(.upload-area) {
    padding: 1rem;
  }

  :deep(.editor-toolbar) {
    overflow-x: auto;
    white-space: nowrap;
    padding: 0.5rem;
  }

  :deep(.editor-toolbar button) {
    padding: 0.25rem 0.4rem;
    margin-right: 0.2rem;
  }
}
</style>