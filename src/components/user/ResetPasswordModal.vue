<script setup>
import { ref } from 'vue';
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import {postFetch} from "@/stores/apiClient.js";

const emit = defineEmits(['close']);
const userCode = ref('');
const userName = ref('');
const userEmail = ref('');
const isLoading = ref(false);

const closeModal = () => {
  emit('close');
};

const resetPassword = async () => {

  if (isLoading.value) return; // 로딩 중에는 추가 요청 방지

  isLoading.value = true;
  try {
    await postFetch('/user/password/reset',
        {
          userCode: userCode.value,
          userName: userName.value,
          email: userEmail.value
        }
    )

    alert('입력하신 이메일로 재발급된 비밀번호가 발송되었습니다.');
    closeModal();
  } catch (error) {
    alert('비밀번호 재발급에 실패했습니다. 입력하신 정보를 다시 확인해주세요.');
    console.error('비밀번호 재발급 실패:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>비밀번호 재발급</h2>
        <button class="close-button" @click="closeModal">X</button>
      </div>
      <form @submit.prevent="resetPassword">
        <div class="form-group">
          <label>사원번호(아이디)</label>
          <input
              type="text"
              v-model="userCode"
              placeholder="사번 입력"
              required
              class="form-input"
              :disabled="isLoading"
          />
        </div>
        <div class="form-group">
          <label>이름</label>
          <input
              type="text"
              v-model="userName"
              placeholder="이름 입력"
              required
              class="form-input"
              :disabled="isLoading"
          />
        </div>
        <div class="form-group">
          <label>이메일</label>
          <input
              type="email"
              v-model="userEmail"
              placeholder="등록된 이메일 입력"
              required
              class="form-input"
              :disabled="isLoading"
          />
        </div>
        <div class="small-text">
          * 해당 이메일로 임시로 재발급된 비밀번호가 발송됩니다.
        </div>
        <div class="button-group">
          <button type="button" class="cancel-button" @click="closeModal">취소</button>
          <button
              type="submit"
              class="submit-button"
              :disabled="isLoading"
          >
            비밀번호 재발급
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
  margin-bottom: 1rem;
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

.small-text {
  font-size: 0.8rem;
  color: var(--small-gray);
  margin-bottom: 1.5rem;
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