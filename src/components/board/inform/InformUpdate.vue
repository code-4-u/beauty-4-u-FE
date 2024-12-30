<script setup>
import {onMounted, onBeforeUnmount, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {postFetch, putFetch, getFetch} from "@/stores/apiClient.js";
import BoardEditor from "@/components/board/editor/BoardEditor.vue";
import ImageManagement from "@/components/board/editor/ImageManagement.vue";

const router = useRouter();
const route = useRoute();
const informId = route.params['informId'];

const informTitle = ref('');
const editorContent = ref('');
const selectedFiles = ref([]);
const imageUrls = ref([]);
const boardEditorRef = ref(null);
const uploadStatus = ref('');
const isSubmitting = ref(false);
const originalS3Urls = ref([]);

const fetchInformDetail = async () => {
  try {
    const response = await getFetch(`/inform/${informId}`);
    const data = response.data.data;
    informTitle.value = data.informTitle;
    editorContent.value = data.informContent;

    // 본문에서 이미지 URL 추출
    const imageRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
    const imageMatches = [...data.informContent.matchAll(imageRegex)];
    const existingImageUrls = imageMatches.map(match => match[1]);

    // 기존 URL들 저장
    originalS3Urls.value = existingImageUrls;
    imageUrls.value = existingImageUrls;

    // 추출된 이미지를 selectedFiles에 추가
    selectedFiles.value = existingImageUrls.map((url, index) => ({
      id: `existing-${index}`,
      name: url.split('/').pop() || `image-${index}`,
      url: url,
      isExisting: true,
      size: 0,
      file: null
    }));

  } catch (error) {
    console.error("게시글 정보를 가져오는 데 실패했습니다:", error);
    alert("게시글 정보를 가져오는 데 실패했습니다.");
  }
};

const insertImageAtCursor = (imageUrl, options = {}) => {
  if (!boardEditorRef.value) return;

  try {
    if (options.removeUrl) {  // 이미지 제거 케이스
      boardEditorRef.value.removeImage(options.removeUrl);
    } else if (options.file) {    // 이미지 추가 케이스
      const tempUrl = URL.createObjectURL(options.file);
      boardEditorRef.value.insertImage(tempUrl, {
        style: `max-width: ${options.width || 400}px; height: ${options.height || 'auto'};`,
        'data-temp-url': 'true'
      });

      // selectedFiles 업데이트
      selectedFiles.value = selectedFiles.value.map(file => {
        if (file.id === options.id) {
          return { ...file, tempUrl };
        }
        return file;
      });
    }
  } catch (error) {
    console.error('이미지 삽입 중 오류:', error);
  }
};

const handleUpload = (files) => {
  uploadStatus.value = '업로드 중...';

  const newFiles = files.map(file => ({
    id: `new-${Date.now()}-${Math.random()}`,
    name: file.name,
    file: file.file,
    size: file.file.size,
    tempUrl: null  // tempUrl은 insertImageAtCursor에서 생성
  }));

  selectedFiles.value = [...selectedFiles.value, ...newFiles];
  uploadStatus.value = '';
};

const handleRemove = (fileId) => {
  const fileToRemove = selectedFiles.value.find(f => f.id === fileId);
  if (fileToRemove) {
    // 임시 URL 제거
    if (fileToRemove.tempUrl) {
      URL.revokeObjectURL(fileToRemove.tempUrl);

      // 본문에서 이미지 제거 (임시 URL)
      const tempRegex = new RegExp(`<img[^>]*src="${fileToRemove.tempUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g');
      editorContent.value = editorContent.value.replace(tempRegex, '');
    }

    // 기존 이미지 제거 (실제 URL)
    if (fileToRemove.url) {
      const urlRegex = new RegExp(`<img[^>]*src="${fileToRemove.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g');
      editorContent.value = editorContent.value.replace(urlRegex, '');
    }

    // 목록에서 제거
    selectedFiles.value = selectedFiles.value.filter(f => f.id !== fileId);
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
  router.push('/inform');
};

const updateInform = async () => {
  if (isSubmitting.value) return;

  const uploadedS3Urls = [];
  const originalFileNames = [];
  let modifiedContent = editorContent.value;

  try {
    isSubmitting.value = true;
    uploadStatus.value = '수정 중...';

    if (!informTitle.value.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // 1. 삭제된 이미지 처리
    const currentImageRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
    const currentImageMatches = [...modifiedContent.matchAll(currentImageRegex)];
    const currentImageUrls = currentImageMatches.map(match => match[1]);

    const deletedImageUrls = originalS3Urls.value.filter(url => !currentImageUrls.includes(url));

    if (deletedImageUrls.length > 0) {
      await postFetch("/file/s3/uploadList", deletedImageUrls);
      await postFetch('/file/delete', {
        fileS3UrlList: deletedImageUrls,
        fileIdList: []
      });
    }

    // 2. 새로운 이미지 S3 업로드 및 URL 매핑 수집
    const newFiles = selectedFiles.value.filter(file => {
      // blob URL을 포함한 파일만 필터링
      return file.file &&
          !file.isExisting &&
          (file.tempUrl?.startsWith('blob:') || modifiedContent.includes(`blob:${location.origin}`));
    });

    // 모든 파일 업로드를 병렬로 처리
    const uploadResults = await Promise.all(
        newFiles.map(async (fileInfo) => {
          const formData = new FormData();
          formData.append('image', fileInfo.file);

          try {
            const response = await postFetch('/file/s3/upload', formData);
            const s3Url = response.data.data;

            uploadedS3Urls.push(s3Url);
            originalFileNames.push(fileInfo.name);

            return {
              tempUrl: fileInfo.tempUrl,
              s3Url: s3Url
            };
          } catch (error) {
            console.error('이미지 업로드 실패:', error);
            throw error;
          }
        })
    );

    // 3. blob URL을 포함한 이미지 태그를 찾아서 S3 URL로 교체
    let updatedContent = modifiedContent;

    // 먼저 본문에서 blob URL을 사용하는 이미지 태그들을 찾음
    const blobImageRegex = /<img[^>]*src="(blob:[^"]*)"[^>]*>/g;
    const blobMatches = [...updatedContent.matchAll(blobImageRegex)];

    // 각 blob URL에 대해 S3 URL로 교체
    blobMatches.forEach((match, index) => {
      if (index < uploadResults.length) {
        const s3Url = uploadResults[index].s3Url;
        // 전체 이미지 태그에서 src 속성만 변경
        const originalTag = match[0];
        const updatedTag = originalTag.replace(/src="blob:[^"]*"/, `src="${s3Url}"`);
        updatedContent = updatedContent.replace(originalTag, updatedTag);
      }
    });

    // 4. 업데이트된 content로 게시글 수정
    await putFetch(`/inform/${informId}`, {
      informTitle: informTitle.value,
      informContent: updatedContent
    });

    // 5. 새로운 이미지 정보 DB 저장
    if (uploadedS3Urls.length > 0) {
      await postFetch('/file/save', {
        imageS3Urls: uploadedS3Urls,
        fileUrls: originalFileNames,
        entityType: "INFORM"
      });
    }

    // 6. 임시 URL 정리
    selectedFiles.value.forEach(file => {
      if (file.tempUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(file.tempUrl);
      }
    });

    // 7. 목록으로 이동
    await router.push({
      path: `/inform`
    });

  } catch (error) {
    console.error('수정에 실패했습니다.', error);

    // 에러 발생 시 업로드된 S3 이미지들 삭제
    if (uploadedS3Urls.length > 0) {
      try {
        await postFetch('/file/delete', {
          fileS3UrlList: uploadedS3Urls,
          fileIdList: []
        });
      } catch (deleteError) {
        console.error('S3 이미지 삭제 실패:', deleteError);
      }
    }

    alert('수정에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isSubmitting.value = false;
    uploadStatus.value = '';
  }
};

// 컴포넌트 마운트 시 상세 정보 조회
onMounted(() => {
  fetchInformDetail();
});

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
  <div class="notice-detail-container">
    <div class="notice-header">
      <div class="title-wrapper">
        <h3 class="title-label">제목</h3>
        <input
            type="text"
            class="title-input"
            v-model="informTitle"
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
            @click="updateInform"
            :disabled="isSubmitting"
        >
          <span class="btn-text">{{ isSubmitting ? '수정 중...' : '수정완료' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 스타일은 BoardWrite.vue와 동일 */
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