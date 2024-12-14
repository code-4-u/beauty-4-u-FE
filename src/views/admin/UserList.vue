<script setup>
import {computed, onMounted, ref} from 'vue';
import {getFetch, putFetch} from "@/stores/apiClient.js";
import CreateUserModal from "@/components/admin/CreateUserModal.vue";
import UpdateUserModal from "@/components/admin/UpdateUserModal.vue";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

const users = ref([]);
const showCreateUserModal = ref(false);
const showUpdateUserModal = ref(false);
const selectedUserCode = ref('');

// 검색어 상태 관리
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 8;

const fetchUserList = async () => {
  try {
    const response = await getFetch('/user/list');
    users.value = response.data.data.map(user => ({
      userCode: user.userCode || '',
      userName: user.userName || '',
      userRoleName: user.userRoleName || '',
      deptName: user.deptName || '',
      jobName: user.jobName || '',
      createdDate: user.createdDate,
      userExpiredDate: user.userExpiredDate,
      userExpiredYn: user.userExpiredYn
    }));
  } catch (error) {
    console.error('회원 목록을 불러오는 중 에러가 발생했습니다.', error.response ? error.response.data : error.message);
  }
};

// 필터링된 직원 목록 계산
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    if (!user) return false;

    const searchLower = searchQuery.value.toLowerCase();
    const userCode = user.userCode || '';
    const userName = user.userName || '';
    const deptName = user.deptName || '';
    const jobName = user.jobName || '';

    return (
        userCode.toLowerCase().includes(searchLower) ||
        userName.toLowerCase().includes(searchLower) ||
        deptName.toLowerCase().includes(searchLower) ||
        jobName.toLowerCase().includes(searchLower)
    );
  });
});

// 페이지네이션된 직원 목록
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredUsers.value.slice(start, end);
});

// 총 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / itemsPerPage);
});

const deleteUser = async (userCode, isExpired) => {
  try {
    if (isExpired) {

      const confirmedUnexpire = confirm(`${userCode} 회원을 활성화하시겠습니까?`);
      if (!confirmedUnexpire) return;

      await putFetch('/user/unexpire',
          {
            userCode: userCode
          }
      );
      console.log('계정이 복구되었습니다.');
    } else {

      const confirmedExpire = confirm(`${userCode} 회원을 비활성화하시겠습니까?`);
      if (!confirmedExpire) return;

      await putFetch('/user/expire',
          {
            userCode: userCode
          }
      );
      console.log('계정이 삭제되었습니다.');
    }
    await fetchUserList();
  } catch (error) {
    console.error('작업 중 에러가 발생했습니다:', error.response ? error.response.data : error.message);
  }
};

const addNewUser = () => {
  showCreateUserModal.value = true;
};

const editUser = (userCode) => {
  selectedUserCode.value = userCode;
  showUpdateUserModal.value = true;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

onMounted(async () => {
  await Promise.all([
    fetchUserList(),
  ])
})
</script>

<template>
  <div class="user-management">
    <div class="header">
      <h2>직원 계정 관리</h2>
      <button class="add-button" @click="addNewUser">
        + 신규 계정 등록
      </button>
    </div>

    <div class="search-bar">
      <input
          type="text"
          v-model="searchQuery"
          placeholder="이름, 연락처, 사원번호로 검색"
      />
      <div class="filter-dropdown">
        <select>
          <option value="">등급순</option>
        </select>
      </div>
    </div>

    <table>
      <thead>
      <tr>
        <th>직원정보</th>
        <th>권한</th>
        <th>부서</th>
        <th>계정생성일</th>
        <th>만료일</th>
        <th>관리</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="user in paginatedUsers" :key="user.userCode">
        <td>
          <div class="user-info">

            <div>
              <div>{{ user.userName }}</div>
              <div class="sub-info">{{ user.userCode }}</div>
            </div>
          </div>
        </td>
        <td>
    <span :class="['status-badge', user.userRoleName === 'ADMIN' ? 'admin' : 'user']">
      {{ user.userRoleName }}
    </span>
        </td>
        <td>
          {{ user.deptName }}
          <div class="sub-info">{{ user.jobName }}</div>
        </td>
        <td>{{ formatDate(user.createdDate) }}</td>
        <td>{{ formatDate(user.userExpiredDate) }}</td>
        <td>
          <div class="action-buttons">
            <button class="edit" @click="editUser(user.userCode)">
              <font-awesome-icon :icon="['far', 'pen-to-square']" />
            </button>
            <button
                :class="{'delete': !user.userExpiredDate, 'rotate': user.userExpiredDate}"
                @click="deleteUser(user.userCode, user.userExpiredDate)"
            >
              <font-awesome-icon
                  :icon="user.userExpiredDate ? ['fas', 'arrow-rotate-right'] : ['far', 'trash-can']"
              />
            </button>
          </div>
        </td>
      </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button
          :disabled="currentPage === 1"
          @click="currentPage--"
      >
        이전
      </button>
      <button
          v-for="page in totalPages"
          :key="page"
          :class="{ active: currentPage === page }"
          @click="currentPage = page"
      >
        {{ page }}
      </button>
      <button
          :disabled="currentPage === totalPages"
          @click="currentPage++"
      >
        다음
      </button>
    </div>

    <CreateUserModal
        v-if="showCreateUserModal"
        @close="showCreateUserModal = false"
        @created="fetchUserList"
    />
    <UpdateUserModal
        v-if="showUpdateUserModal"
        :userCode="selectedUserCode"
        @close="showUpdateUserModal = false"
        @updated="fetchUserList"
    />
  </div>
</template>

<style scoped>
.user-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-bar input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.status-badge.admin {
  background-color: #ffebee;
  color: var(--red);
}

.status-badge.user {
  background-color: #e3f2fd;
  color: #2196f3;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.action-buttons .edit {
  background-color: var(--white);
  color: var(--black);
}

.action-buttons .delete {
  background-color: var(--white);
  color: var(--red);
}

.action-buttons .rotate {
  background-color: var(--white);
  color: var(--main-green)
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.pagination button {
  padding: 4px 8px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
}

.pagination button.active {
  background-color: #2196f3;
  color: white;
  border-color: #2196f3;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.sub-info {
  color: #666;
  font-size: 0.9em;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>