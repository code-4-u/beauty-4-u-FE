<script setup>
import { ref } from 'vue';
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import { putFetch } from "@/stores/apiClient.js";

const emit = defineEmits(['close']);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);

const closeModal = () => {
  emit('close');
};

const updatePassword = async () => {
  if (isLoading.value) return;

  if (newPassword.value !== confirmPassword.value) {
    alert('새 비밀번호가 일치하지 않습니다.');
    return;
  }

  isLoading.value = true;
  try {
    await putFetch('/user/password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    });

    alert('비밀번호가 성공적으로 변경되었습니다.');
    closeModal();
  } catch (error) {
    alert('비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.');
    console.error('비밀번호 변경 실패:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>비밀번호 수정</h2>
        <button class="close-button" @click="closeModal">X</button>
      </div>
      <form @submit.prevent="updatePassword">
        <div class="form-group">
          <label>현재 비밀번호</label>
          <input
              type="text"
              v-model="currentPassword"
              placeholder="현재 비밀번호 입력"
              required
              class="form-input"
              :disabled="isLoading"
          />
        </div>
        <div class="form-group">
          <label>새 비밀번호</label>
          <input
              type="text"
              v-model="newPassword"
              placeholder="새 비밀번호 입력"
              required
              class="form-input"
              :disabled="isLoading"
          />
        </div>
        <div class="form-group">
          <label>새 비밀번호 확인</label>
          <input
              type="text"
              v-model="confirmPassword"
              placeholder="새 비밀번호 다시 입력"
              required
              class="form-input"
              :disabled="isLoading"
          />
        </div>
        <div class="button-group">
          <button type="button" class="cancel-button" @click="closeModal">취소</button>
          <button
              type="submit"
              class="submit-button"
              :disabled="isLoading"
          >
            변경하기
          </button>
        </div>
      </form>
    </div>
    <LoadingSpinner v-if="isLoading"/>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--white);
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--black);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--black);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--gray);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--main-green);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  background-color: var(--background-color);
  color: var(--gray);
  cursor: pointer;
  font-weight: 500;
}

.submit-button {
  flex: 2;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  background-color: var(--main-green);
  color: var(--white);
  cursor: pointer;
  font-weight: 500;
}

.cancel-button:hover {
  background-color: var(--disabled2);
}

.submit-button:hover {
  background-color: var(--hover-green);
}

.submit-button:disabled {
  background-color: var(--disabled1);
  cursor: not-allowed;
}

.form-input:disabled {
  background-color: var(--disabled2);
  cursor: not-allowed;
}
</style>