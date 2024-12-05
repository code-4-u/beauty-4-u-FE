<script setup>
import { ref } from "vue";
import axios from "axios";

const userCode = ref('');
const userPassword = ref('');

const saveUser = async () => {
  try {
    const response = await axios.post('http://localhost:8080/api/v1/user/login',
        {
          userCode: userCode.value,
          userPassword: userPassword.value
        }
    );
    alert('로그인 성공');

  } catch (error) {
    console.log('로그인 실패', error);
  }
};

</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">로그인</h1>
      <form @submit.prevent="saveUser" class="login-form">
        <div class="form-group">
          <label for="userCode">사원번호(아이디)</label>
          <input
              type="text"
              v-model="userCode"
              id="userCode"
              required
              class="form-input"
              placeholder="사번 입력"
          />
        </div>
        <div class="form-group">
          <label for="userPassword">비밀번호</label>
          <input
              type="text"
              v-model="userPassword"
              id="userPassword"
              required
              class="form-input"
              placeholder="비밀번호 입력"
          />
        </div>
        <button type="submit" class="submit-button">로그인</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--background-color);
  padding: 20px;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-title {
  text-align: center;
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 2rem;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #555;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--main-green);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.submit-button {
  background-color: var(--main-green);
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;
}

.submit-button:hover {
  background-color: var(--hover-green);
}

.submit-button:active {
  transform: translateY(1px);
}
</style>