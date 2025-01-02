<script setup>
const props = defineProps({
  isOpen: Boolean,
  imageUrl: String
});

const emit = defineEmits(['close', 'download']);

const closeModal = () => {
  emit('close');
};

const downloadImage = () => {
  emit('download', props.imageUrl);
};
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <button class="close-button" @click="closeModal">✕</button>
      </div>
      <div class="modal-content">
        <img :src="imageUrl" alt="확대 이미지" class="modal-image"/>
      </div>
      <div class="modal-footer">
        <button class="download-button" @click="downloadImage">
          이미지 다운로드
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.close-button:hover {
  color: #000;
}

.modal-content {
  overflow: auto;
  padding: 1rem;
}

.modal-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.modal-footer {
  padding: 1rem;
  display: flex;
  justify-content: center;
}

.download-button {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
}

.download-button:hover {
  background-color: #45a049;
}
</style>