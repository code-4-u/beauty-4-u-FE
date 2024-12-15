<script setup>
import {onMounted, ref} from 'vue';
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import {getFetch, postFetch} from "@/stores/apiClient.js";

const emit = defineEmits(['close']);
const isLoading = ref(false);
const depts = ref([]);
const jobs = ref([]);
const roles = ref([]);

const formData = ref({
  userCode: '',
  jobCode: '',
  deptCode: '',
  userRoleId: '',
  userName: '',
  email: '',
  phone: ''
});

const closeModal = () => {
  emit('close');
};

const fetchDeptList = async () => {
  try {
    const response = await getFetch('/user/dept/list');
    depts.value = response.data.data;

    if (depts.value.length > 0) {
      formData.value.deptCode = depts.value[0].deptCode;
    }
  } catch (error) {
    console.error('부서를 불러오는데 실패했습니다.', error);
  }
};

const fetchJobList = async () => {
  try {
    const response = await getFetch('/user/job/list');
    jobs.value = response.data.data;

    if (jobs.value.length > 0) {
      formData.value.jobCode = jobs.value[0].jobCode;
    }
  } catch (error) {
    console.error('직급을 불러오는데 실패했습니다.', error);
  }
};

const fetchRoleList = async () => {
  try {
    const response = await getFetch('/user/role/list');
    roles.value = response.data.data;

    if (roles.value.length > 0) {
      formData.value.userRoleId = roles.value[0].userRoleId;
    }
  } catch (error) {
    console.error('직급을 불러오는데 실패했습니다.', error);
  }
};

const createUser = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    await postFetch('/user', formData.value);

    alert('계정이 성공적으로 생성되었습니다.');
    emit('created');
    closeModal();
  } catch (error) {
    alert('계정 생성에 실패했습니다.');
    console.error('계정 생성 실패:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([
    fetchDeptList(),
    fetchJobList(),
    fetchRoleList()
  ])
});
</script>

<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>계정 등록</h2>
        <button class="close-button" @click="closeModal">X</button>
      </div>
      <form @submit.prevent="createUser">
        <div class="form-grid">
          <div class="form-column">
            <div class="form-group">
              <label>사원번호 (아이디)<span class="required">*</span></label>
              <input
                  type="text"
                  v-model="formData.userCode"
                  placeholder="EMP001"
                  required
                  class="form-input"
                  :disabled="isLoading"
              />
            </div>
            <div class="form-group password-group">
              <label>비밀번호</label>
              <div class="password-notice">
                * 초기 비밀번호는 사번과 동일하게 설정됩니다.
              </div>
            </div>
            <div class="form-group">
              <label>이름<span class="required">*</span></label>
              <input
                  type="text"
                  v-model="formData.userName"
                  placeholder="홍길동"
                  required
                  class="form-input"
                  :disabled="isLoading"
              />
            </div>
            <div class="form-group">
              <label>부서<span class="required">*</span></label>
              <select
                  v-model="formData.deptCode"
                  class="form-input"
                  :disabled="isLoading"
              >
                <option v-for="dept in depts" :key="dept.deptCode" :value="dept.deptCode">
                  {{ dept.deptName }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-column">
            <div class="form-group">
              <label>전화번호<span class="required">*</span></label>
              <input
                  type="text"
                  v-model="formData.phone"
                  placeholder="010-0000-0000"
                  required
                  class="form-input"
                  :disabled="isLoading"
              />
            </div>
            <div class="form-group">
              <label>이메일<span class="required">*</span></label>
              <input
                  type="email"
                  v-model="formData.email"
                  placeholder="employee@company.com"
                  required
                  class="form-input"
                  :disabled="isLoading"
              />
            </div>
            <div class="form-group">
              <label>직급<span class="required">*</span></label>
              <select
                  v-model="formData.jobCode"
                  class="form-input"
                  :disabled="isLoading"
              >
                <option v-for="job in jobs" :key="job.jobCode" :value="job.jobCode">
                  {{ job.jobName }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>계정 권한<span class="required">*</span></label>
              <select
                  v-model="formData.userRoleId"
                  class="form-input"
                  :disabled="isLoading"
              >
                <option v-for="role in roles" :key="role.userRoleId" :value="role.userRoleId">
                  {{ role.userRoleName }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="button-group">
          <button type="button" class="cancel-button" @click="closeModal">취소</button>
          <button
              type="submit"
              class="submit-button"
              :disabled="isLoading"
          >
            등록하기
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
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1rem;
}

.form-column {
  display: flex;
  flex-direction: column;
}

.form-group {
  height: 85px;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--black);
}

.required {
  color: #f44336;
  margin-left: 0.25rem;
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
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
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
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
  font-weight: 500;
}

.cancel-button:hover {
  background-color: #eeeeee;
}

.submit-button:hover {
  background-color: #43A047;
}

.submit-button:disabled {
  background-color: #9E9E9E;
  cursor: not-allowed;
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.password-notice {
  color: var(--gray);
  font-size: 0.9rem;
  margin-top: 1rem;
  margin-left: 1rem;
}
</style>