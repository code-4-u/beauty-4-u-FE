<!-- ImageManagement.vue -->
<script setup>
import { computed, ref } from 'vue';

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

const emit = defineEmits(['upload', 'remove']);
const uploadStatus = ref('');
const selectedImage = ref(null);

const handleFileChange = async (event) => {
  const files = Array.from(event.target.files);
  const validFiles = files.filter(file => file.type.startsWith('image/'));

  if (validFiles.length > 0) {
    for (const file of validFiles) {
      const tempUrl = URL.createObjectURL(file);
      const fileInfo = {
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        tempUrl: tempUrl
      };

      // 파일 정보만 emit하고 에디터에는 삽입하지 않음
      emit('upload', [fileInfo]);
    }
  }
  event.target.value = '';
};

const handleRemove = (fileId) => {
  emit('remove', fileId);
};

const formatSize = (bytes) => {
  return (bytes / (1024 * 1024)).toFixed(2);
};

const totalSize = computed(() => {
  return props.selectedFiles.reduce((acc, file) => acc + file.size, 0);
});

const handleImageClick = (file) => {
  selectedImage.value = selectedImage.value === file ? null : file;
};
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

    <div v-if="uploadStatus" class="image-management__status-bar">
      {{ uploadStatus }}
    </div>

    <!-- 이미지 미리보기 그리드 -->
    <div v-if="selectedFiles.length > 0" class="image-management__grid">
      <div
          v-for="file in selectedFiles"
          :key="file.id"
          class="image-management__grid-item"
          :class="{ 'selected': selectedImage === file }"
          @click="handleImageClick(file)"
      >
        <img :src="file.tempUrl" :alt="file.name" class="image-management__preview" />
        <div class="image-management__item-info">
          <span class="image-management__filename">{{ file.name }}</span>
          <span class="image-management__filesize">({{ formatSize(file.size) }}MB)</span>
          <button
              class="image-management__remove-btn"
              @click.stop="handleRemove(file.id)"
          >
            삭제
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedFiles.length > 0" class="image-management__summary">
      총 {{ selectedFiles.length }}개 파일 ({{ formatSize(totalSize) }}MB)
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

.image-management__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.image-management__grid-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-management__grid-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.image-management__grid-item.selected {
  border: 2px solid #4CAF50;
}

.image-management__preview {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-management__item-info {
  padding: 0.5rem;
}

/* 기존 스타일 유지 */
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

.image-management__filename {
  display: block;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-management__filesize {
  display: block;
  color: #6c757d;
  font-size: 0.75rem;
}

.image-management__remove-btn {
  width: 100%;
  margin-top: 0.5rem;
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
  .image-management__grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>