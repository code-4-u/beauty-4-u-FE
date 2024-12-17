<script setup>
import {computed, ref} from 'vue';
import {postFetch} from "@/stores/apiClient.js";

const props = defineProps({
  selectedFiles: {
    type: Array,
    default: () => []
  },
  imageUrls: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['upload', 'remove', 'insertToEditor']);
const uploadStatus = ref('');

const handleFileChange = async (event) => {
  const files = Array.from(event.target.files);
  const validFiles = files.filter(file => file.type.startsWith('image/'));

  if (validFiles.length > 0) {
    for (const file of validFiles) {
      try {
        // 1. S3 업로드
        const formData = new FormData();
        formData.append('image', file);
        const response = await postFetch('/file/s3/upload', formData);
        const imageUrl = response.data.data;

        // 2. 에디터에 이미지 삽입
        emit('insertToEditor', imageUrl);

        // 3. 파일 정보 저장 및 emit
        emit('upload', [{
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          url: imageUrl  // 실제 URL을 같이 저장
        }]);

      } catch (error) {
        console.error('파일 업로드 실패:', error);
      }
    }
  }
  event.target.value = '';
};

const handleRemove = (fileId) => {
  const fileToRemove = props.selectedFiles.find(f => f.id === fileId);
  if (fileToRemove && fileToRemove.url) {
    // 에디터에서 이미지 제거 신호 보내기
    emit('insertToEditor', null, fileToRemove.url);
    emit('remove', fileId);
  }
};

const formatSize = (bytes) => {
  return (bytes / (1024 * 1024)).toFixed(2);
};

const totalSize = computed(() => {
  return props.selectedFiles.reduce((acc, file) => acc + file.size, 0);
});
</script>

<template>
  <div class="image-management">
    <div class="image-management__header">
      <h3 class="image-management__title">이미지 관리</h3>
      <div class="image-management__actions">
        <input
            type="file"
            id="image-upload"
            class="image-management__file-input"
            @change="handleFileChange"
            accept="image/*"
            multiple
        />
        <label
            for="image-upload"
            class="image-management__upload-label"
        >
          이미지 추가
        </label>
      </div>
    </div>

    <!-- 업로드 상태 표시 -->
    <div v-if="uploadStatus" class="image-management__status-bar">
      {{ uploadStatus }}
    </div>

    <!-- 이미지 목록 부분 복원 -->
    <div v-if="selectedFiles.length > 0" class="image-management__list">
      <div v-for="file in selectedFiles" :key="file.id" class="image-management__item">
        <span class="image-management__filename">{{ file.name }}</span>
        <span class="image-management__filesize">({{ formatSize(file.size) }}MB)</span>
        <button
            class="image-management__remove-btn"
            @click="handleRemove(file.id)"
        >
          삭제
        </button>
      </div>

      <div class="image-management__summary">
        총 {{ selectedFiles.length }}개 파일 ({{ formatSize(totalSize) }}MB)
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-management {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.image-management__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.image-management__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.image-management__file-input {
  display: none;
}

.image-management__upload-label {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.image-management__upload-label:hover {
  background-color: #e9ecef;
}

.image-management__status-bar {
  padding: 0.5rem;
  margin-bottom: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.875rem;
}

.image-management__list {
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.image-management__item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.image-management__filename {
  flex: 1;
  margin-right: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-management__filesize {
  color: #6c757d;
  margin-right: 1rem;
}

.image-management__remove-btn {
  padding: 0.25rem 0.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.image-management__remove-btn:hover {
  background-color: #c82333;
}

.image-management__summary {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.875rem;
  color: #6c757d;
}

@media (max-width: 768px) {
  .image-management__item {
    flex-direction: column;
    align-items: flex-start;
  }

  .image-management__filename {
    margin-bottom: 0.25rem;
  }

  .image-management__filesize {
    margin-bottom: 0.25rem;
  }
}
</style>