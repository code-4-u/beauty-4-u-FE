<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {postFetch} from "@/stores/apiClient.js";
import BoardEditor from "@/components/board/inform/BoardEditor.vue";

const router = useRouter();

// 사진 업로드
const selectedFiles = ref([]);
const uploadStatus = ref('');
const imageUrls = ref([]);
const informTitle = ref('');
const editorContent = ref('<p>기본 내용입니다.</p>');

const fileSaveDTO = ref({
  entityId: null,
  imageUrls: imageUrls.value,
  isInform: true
})

// 커서 위치 표시
const setCursorPosition = () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.collapse(false); // 커서를 끝으로 이동
  }
};

const onFileChange = (event) => {
  const files = Array.from(event.target.files);
  const validFiles = files.filter(file => file.type.startsWith('image/'));

  if (validFiles.length > 0) {
    // 기존 선택된 파일들에 새로운 파일들을 추가
    selectedFiles.value = [
      ...selectedFiles.value,
      ...validFiles.map(file => ({
        file,
        id: Date.now() + Math.random(), // 고유 ID 생성
        name: file.name,
        size: file.size
      }))
    ];
    updateUploadStatus();
  } else {
    uploadStatus.value = '이미지 파일만 선택 가능합니다.';
  }

  // input 초기화 (동일한 파일을 다시 선택할 수 있도록)
  event.target.value = '';
};

const removeFile = (fileId) => {
  selectedFiles.value = selectedFiles.value.filter(file => file.id !== fileId);
  updateUploadStatus();
};

const updateUploadStatus = () => {
  if (selectedFiles.value.length > 0) {
    const totalSize = selectedFiles.value.reduce((acc, file) => acc + file.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    uploadStatus.value = `선택된 파일: ${selectedFiles.value.length}개 (총 ${totalSizeMB}MB)`;
  } else {
    uploadStatus.value = '';
  }
};

const uploadFile = async () => {
  if (selectedFiles.value.length === 0) {
    uploadStatus.value = '이미지를 선택해주세요.';
    return;
  }

  try {
    for (const fileData of selectedFiles.value) {
      const formData = new FormData();
      formData.append('image', fileData.file);

      const response = await postFetch('/file/s3/upload', formData);
      const imageUrl = response.data.data;
      imageUrls.value.push(imageUrl);
      insertImageAtCursor(imageUrl);
    }

    uploadStatus.value = '모든 파일이 성공적으로 업로드되었습니다.';
    selectedFiles.value = []; // 업로드 완료 후 선택된 파일 목록 초기화
  } catch (error) {
    console.error('File upload failed:', error);
    uploadStatus.value = '파일 업로드에 실패했습니다.';
  }
};

// 커서 위치에 s3 업로드 url 넣기
const insertImageAtCursor = (imageUrl) => {
  const img = document.createElement('img'); // img 태그를 추가해서 삽입
  img.src = imageUrl;
  img.alt = 'Uploaded Image';
  img.style.maxWidth = '100%'; // 이미지 크기 조절 (필요 시)

  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  range.insertNode(img); // 커서 위치에 이미지 삽입
  range.collapse(false); // 커서를 이미지 뒤로 이동

  setCursorPosition(); // 커서 위치를 이미지 뒤로 이동
};

// DB에 저장하는 함수
const saveImagesToDB = async () => {

  console.log('saveImagesToDB 실행');
  try {
    await postFetch('/file/save', {
      entityId: fileSaveDTO.value.entityId,
      imageUrls: imageUrls.value,
      isInform : true
    });
    uploadStatus.value = 'Images saved to database successfully.';
  } catch (error) {
    console.error('Failed to save images to database:', error);
    uploadStatus.value = 'Failed to save images to database.';
  }
};

// 목록으로 돌아가기
const goBack = () => {
  router.push('/board/inform'); // 공지사항 목록으로 이동
};

const fetchSaveInform = async () => {

  try {
    const response = await postFetch(`/inform`, {
      informTitle: informTitle.value,
      informContent: editorContent.value
    });

    fileSaveDTO.value.entityId = response.data.data;
    fileSaveDTO.value.imageUrls = imageUrls.value ? imageUrls.value : null; // imageUrls 확인
    fileSaveDTO.value.isInform = true;

    console.log('saveImagesToDB 실행 전');

    await saveImagesToDB();

    await router.push({
      path: `/board/inform`
    })
  } catch (error) {
    console.error('저장에 실패했습니다.', error);
  }
}
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

    <div class="info-section">
    </div>

    <div class="editor-container">
      <board-editor v-model="editorContent"/>
    </div>

    <div class="footer-section">
      <div class="left-buttons">
        <button class="btn btn-secondary" @click="goBack">
          <span class="btn-text">목록으로</span>
        </button>
      </div>

      <div class="right-buttons">
        <div class="file-upload-container">
          <input
              type="file"
              id="file-upload"
              class="file-input"
              @change="onFileChange"
              accept="image/*"
              multiple
          />
          <label for="file-upload" class="file-label">
            이미지 선택
          </label>

          <!-- 선택된 파일 목록 -->
          <div v-if="selectedFiles.length > 0" class="selected-files-list">
            <div v-for="file in selectedFiles" :key="file.id" class="selected-file-item">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">({{ (file.size / (1024 * 1024)).toFixed(2) }}MB)</span>
              <button class="btn-remove" @click="removeFile(file.id)" title="파일 제거">
                ×
              </button>
            </div>
            <div class="total-size">
              총 {{ selectedFiles.length }}개 파일
              ({{ (selectedFiles.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(2) }}MB)
            </div>
          </div>

          <button
              class="btn btn-upload"
              @click="uploadFile"
              :disabled="selectedFiles.length === 0"
          >
            <span class="btn-text">업로드</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notice-detail-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.notice-header {
  margin-bottom: 2rem;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.title-label {
  min-width: 60px;
  margin: 0;
  color: #333;
  font-weight: 600;
}

.title-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.2s ease;
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
  margin-bottom: 1.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.editor-container {
  margin: 1.5rem 0;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.footer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.right-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-upload-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-input {
  display: none;
}

.file-label {
  padding: 0.6rem 1rem;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  color: #495057;
}

.file-label:hover {
  background-color: #e9ecef;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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

.btn-upload {
  background-color: #495057;
  color: white;
}

.btn-upload:hover {
  background-color: #3d4246;
  transform: translateY(-1px);
}

.upload-status {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: #fff3cd;
  color: #856404;
}

.upload-status.success {
  background-color: #d4edda;
  color: #155724;
}

.selected-file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
}

.file-name {
  font-weight: 500;
  color: #495057;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #6c757d;
}

.btn-text {
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .notice-detail-container {
    margin: 1rem;
    padding: 1rem;
  }

  .title-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .footer-section {
    flex-direction: column;
    gap: 1rem;
  }

  .right-buttons {
    width: 100%;
    flex-direction: column;
  }

  .file-upload-container {
    width: 100%;
    justify-content: space-between;
  }

  .btn {
    width: 100%;
  }
}
</style>