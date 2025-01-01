<script setup>
import {computed, ref} from 'vue';

const props = defineProps({
  selectedFiles: {
    type: Array,
    default: () => []
  },
  imageUrls: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['upload', 'remove', 'insert-to-editor']);
const uploadStatus = ref('');
const showPreviewModal = ref(false);

// handleFileChange 함수 수정
const handleFileChange = async (event) => {
  if (props.disabled) return;

  const files = Array.from(event.target.files);
  const validFiles = files.filter(file => file.type.startsWith('image/'));

  if (validFiles.length > 0) {
    for (const file of validFiles) {
      const img = new Image();
      const tempUrl = URL.createObjectURL(file);

      img.onload = () => {
        const maxWidth = 400;
        const maxHeight = 300;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        const fileInfo = {
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          tempUrl,
          width,
          height
        };

        // 먼저 파일 정보를 부모 컴포넌트에 전달
        emit('upload', [fileInfo]);

        // 에디터에 이미지 삽입
        emit('insert-to-editor', tempUrl, {
          file,
          id: fileInfo.id,
          width,
          height
        });
      };

      img.src = tempUrl;
    }
  }
  event.target.value = '';
};

// handleRemove 함수 수정
const handleRemove = (fileId) => {
  if (props.disabled) return;

  const fileToRemove = props.selectedFiles.find(f => f.id === fileId);
  if (fileToRemove) {
    const urlToRemove = fileToRemove.tempUrl || fileToRemove.url;
    if (urlToRemove) {
      // 이미지 제거를 위한 이벤트 emit
      emit('insert-to-editor', null, {
        removeUrl: urlToRemove
      });
    }
    emit('remove', fileId);
  }
};

const formatSize = (bytes) => {
  return (bytes / (1024 * 1024)).toFixed(2);
};

const totalSize = computed(() => {
  return props.selectedFiles.reduce((acc, file) => acc + file.size, 0);
});

const togglePreviewModal = () => {
  showPreviewModal.value = !showPreviewModal.value;
};
</script>

<template>
  <div class="image-management">
    <div class="image-management__header">
      <div class="image-management__actions">
        <input
            type="file"
            id="image-upload"
            class="image-management__file-input"
            @change="handleFileChange"
            accept="image/*"
            multiple
            :disabled="disabled"
        />
        <label
            for="image-upload"
            class="image-management__upload-label"
            :class="{ 'disabled': disabled }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          이미지 추가
        </label>
        <button
            v-if="selectedFiles.length > 0"
            class="image-management__preview-btn"
            @click="togglePreviewModal"
        >
          이미지 목록 보기 ({{ selectedFiles.length }})
        </button>
      </div>
    </div>

    <div v-if="uploadStatus" class="image-management__status-bar">
      {{ uploadStatus }}
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreviewModal" class="image-preview-modal">
      <div class="image-preview-modal__content">
        <div class="image-preview-modal__header">
          <h4>이미지 목록 ({{ selectedFiles.length }}개)</h4>
          <div class="image-preview-modal__total-size">
            총 용량: {{ formatSize(totalSize) }}MB
          </div>
          <button class="image-preview-modal__close" @click="togglePreviewModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="image-preview-modal__grid">
          <div v-for="file in selectedFiles" :key="file.id" class="image-preview-modal__item">
            <div class="image-preview-modal__image-wrapper">
              <img
                  :src="file.tempUrl || file.url"
                  :alt="file.name"
                  class="image-preview-modal__image"
              />
              <button
                  class="image-preview-modal__remove-btn"
                  @click="handleRemove(file.id)"
                  :disabled="disabled"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="image-preview-modal__file-info">
              <div class="image-preview-modal__filename">{{ file.name }}</div>
              <div class="image-preview-modal__filesize">{{ formatSize(file.size) }}MB</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-management {
  margin-top: -10px;
  margin-left: 20px;
}

.image-management__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-management__actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.image-management__file-input {
  display: none;
}

.image-management__upload-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-management__upload-label:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.image-management__preview-btn {
  padding: 0.625rem 1rem;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-management__preview-btn:hover {
  background-color: #e5e7eb;
}

.image-management__status-bar {
  padding: 0.75rem;
  margin-bottom: 1rem;
  background-color: #f3f4f6;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #4b5563;
}

.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.image-preview-modal__content {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
}

.image-preview-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.image-preview-modal__header h4 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
  font-weight: 600;
}

.image-preview-modal__total-size {
  font-size: 0.875rem;
  color: #6b7280;
}

.image-preview-modal__close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.image-preview-modal__close:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.image-preview-modal__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.image-preview-modal__item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.image-preview-modal__item:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.image-preview-modal__image-wrapper {
  position: relative;
  padding-top: 75%; /* 4:3 aspect ratio */
}

.image-preview-modal__image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-modal__remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-modal__remove-btn:hover:not(:disabled) {
  background-color: #fee2e2;
}

.image-preview-modal__remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-preview-modal__file-info {
  padding: 0.75rem;
  background-color: #f9fafb;
}

.image-preview-modal__filename {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-preview-modal__filesize {
  font-size: 0.75rem;
  color: #6b7280;
}

.image-management__upload-label.disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background-color: #f3f4f6;
}

@media (max-width: 768px) {
  .image-management {
    padding: 1rem;
  }

  .image-management__actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .image-preview-modal__content {
    width: 95%;
    padding: 1rem;
  }

  .image-preview-modal__grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .image-preview-modal__header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .image-preview-modal__total-size {
    width: 100%;
    order: 3;
  }
}
</style>