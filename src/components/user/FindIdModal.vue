<script setup>
import { ref } from 'vue';

const emit = defineEmits(['close']);
const userName = ref('');
const userContact = ref('');
const userEmail = ref('');

const closeModal = () => {
  emit('close');
};

const findId = async () => {
  try {
    // api 추가
    console.log('Finding ID with:', {
      name: userName.value,
      contact: userContact.value,
      email: userEmail.value
    });
  } catch (error) {
    console.error('ID 찾기 실패:', error);
  }
};
</script>

<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>사원번호(아이디) 찾기</h2>
        <button class="close-button" @click="closeModal">X</button>
      </div>
      <form @submit.prevent="findId">
        <div class="form-group">
          <label>이름</label>
          <input
              type="text"
              v-model="userName"
              placeholder="이름 입력"
              required
              class="form-input"
          />
        </div>
        <div class="form-group">
          <label>연락처</label>
          <input
              type="text"
              v-model="userContact"
              placeholder="연락처 입력"
              required
              class="form-input"
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
          />
        </div>
        <div class="button-group">
          <button type="button" class="cancel-button" @click="closeModal">취소</button>
          <button type="submit" class="submit-button">사원번호(아이디) 찾기</button>
        </div>
      </form>
    </div>
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
  background: white;
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
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
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
  background-color: #f5f5f5;
  color: #666;
  cursor: pointer;
  font-weight: 500;
}

.submit-button {
  flex: 2;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  background-color: var(--main-green);
  color: white;
  cursor: pointer;
  font-weight: 500;
}

.cancel-button:hover {
  background-color: #ebebeb;
}

.submit-button:hover {
  background-color: var(--hover-green);
}
</style>