<script setup>
import {onMounted, ref} from 'vue'
import {getFetch} from "@/stores/apiClient.js";
import UpdatePasswordModal from "@/components/user/UpdatePasswordModal.vue";

const profile = ref('');
const showUpdatePasswordModal = ref(false);

const fetchProfile = async () => {
  try {
    const response = await getFetch('/user/profile');
    profile.value = response.data.data;
  } catch (error) {
    console.error('프로필을 불러오는데 에러가 발생했습니다.', error.response ? error.response.data : error.message);
  }
};

const goToUpdatePassword = () => {
  showUpdatePasswordModal.value = true;
};

onMounted(async () => {
  await Promise.all([
    fetchProfile(),
  ])
})
</script>

<template>
  <div class="employee-info">
    <div class="header">
      <div class="profile-circle">{{ profile.userName?.[0] }}</div>
      <div class="title-section">
        <h2>{{ profile.userName }}</h2>
        <p>{{ profile.deptName }} / {{ profile.jobName }}</p>
      </div>
    </div>

    <div class="info-section">
      <h3>기본 정보</h3>

      <div class="info-grid">
        <div class="info-item">
          <label>사원번호 (아이디)</label>
          <div class="info-value">{{ profile.userCode }}</div>
        </div>

        <div class="info-item">
          <label>전화번호</label>
          <div class="info-value">{{ profile.phone }}</div>
        </div>

        <div class="info-item">
          <label>비밀번호</label>
          <div class="password-tag" @click="goToUpdatePassword">비밀번호 수정</div>
        </div>

        <div class="info-item">
          <label>부서</label>
          <div class="info-value">{{ profile.deptName }}</div>
        </div>

        <div class="info-item">
          <label>이름</label>
          <div class="info-value">{{ profile.userName }}</div>
        </div>

        <div class="info-item">
          <label>직급</label>
          <div class="info-value">{{ profile.jobName }}</div>
        </div>

        <div class="info-item">
          <label>이메일</label>
          <div class="info-value">{{ profile.email }}</div>
        </div>

        <div class="info-item">
          <label>권한</label>
          <div class="info-value">{{ profile.userRoleName }}</div>
        </div>
      </div>
    </div>

    <UpdatePasswordModal
        v-if="showUpdatePasswordModal"
        @close="showUpdatePasswordModal = false"
    />
  </div>
</template>

<style scoped>
.employee-info {
  padding: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 2.5rem;
  padding: 1rem;
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.profile-circle {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #4CAF50, #81C784);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin-right: 1.5rem;
  color: white;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.profile-circle:hover {
  transform: scale(1.05);
}

.title-section h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
}

.title-section p {
  margin: 0.5rem 0 0;
  color: #5c6b7a;
  font-size: 1.1rem;
}

.info-section {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.info-section h3 {
  margin: 0 0 2rem;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
  position: relative;
  padding-bottom: 0.5rem;
}

.info-section h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100px;
  height: 3px;
  background: linear-gradient(to right, #4CAF50, #81C784);
  border-radius: 3px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.info-item {
  position: relative;
}

.info-item label {
  display: block;
  font-size: 0.95rem;
  color: #5c6b7a;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.info-value {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  color: #2c3e50;
  border: 1px solid #edf2f7;
  transition: all 0.2s ease;
}

.info-value:hover {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.password-tag {
  display: inline-block;
  background-color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #4CAF50;
  margin: 0.5rem 0;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.1);
  border: 1px solid #4CAF50;
  cursor: pointer;
  transition: all 0.2s ease;
}

.password-tag:hover {
  background-color: #4CAF50;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
}

@media (max-width: 768px) {
  .employee-info {
    padding: 1.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .header {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .profile-circle {
    margin: 0 0 1rem;
  }

  .info-section {
    padding: 1.5rem;
  }
}
</style>