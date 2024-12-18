<script setup>
import {onMounted, ref} from 'vue';
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

    // 추출된 이미지를 selectedFiles에 추가
    selectedFiles.value = existingImageUrls.map((url, index) => ({
      id: `existing-${index}`,
      name: url.split('/').pop() || `image-${index}`, // URL에서 파일명 추출 또는 기본값 사용
      url: url,
      size: 0, // 기존 이미지의 경우 size 정보를 알 수 없으므로 0으로 설정
    }));

    imageUrls.value = existingImageUrls;
  } catch (error) {
    console.error("공지사항 세부 정보를 가져오는 데 오류가 발생했습니다:", error);
  }
}

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
  router.push('/inform');
};

// 게시글 수정
const updateInform = async () => {
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

    // 3. 게시글 수정
    await putFetch(`/inform/${informId}`, {
      informTitle: informTitle.value,
      informContent: editorContent.value
    });

    // 4. 저장된 게시글의 ID로 이미지 저장
    if (imageUrls.length > 0) {
      await postFetch('/file/save', {
        entityId: informId,
        imageUrls: imageUrls,
        isInform: true
      });
    }

    // 5. 목록으로 이동
    await router.push({
      path: `/inform`
    });
  } catch (error) {
    console.error('수정에 실패했습니다.', error);
    alert('수정에 실패했습니다. 다시 시도해주세요.');
  }
};

onMounted(() => {
  fetchInformDetail();
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
        <button class="btn btn-primary" @click="updateInform">
          <span class="btn-text">수정완료</span>
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