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
  <div class="container">
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
                <font-awesome-icon :icon="['far', 'pen-to-square']"/>
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
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 2rem;
}

.user-management {
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.add-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-button:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-bar input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.search-bar input:focus {
  outline: none;
  border-color: var(--menu-green);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.filter-dropdown select {
  padding: 0.75rem 2rem 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 2rem;
}

th {
  background-color: #f9fafb;
  padding: 1rem;
  font-weight: 600;
  color: #374151;
  text-align: left;
  border-bottom: 2px solid #e5e7eb;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #1f2937;
}

tr:hover {
  background-color: #f9fafb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.status-badge.admin {
  background-color: #fef2f2;
  color: #dc2626;
}

.status-badge.user {
  background-color: #f0f9ff;
  color: #0284c7;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.action-buttons button {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: white;
}

.action-buttons .edit:hover {
  border-color: #666;
  color: #666;
  background-color: #f5f5f5;
}

.action-buttons .delete {
  color: #dc2626;
}

.action-buttons .delete:hover {
  border-color: #dc2626;
  background-color: #fef2f2;
}

.action-buttons .rotate {
  color: #4CAF50;
}

.action-buttons .rotate:hover {
  border-color: #4CAF50;
  background-color: #f0fdf4;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
  font-weight: 500;
}

.pagination button:hover:not(:disabled) {
  border-color: #4CAF50;
  color: #4CAF50;
  background-color: #f0fdf4;
}

.pagination button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.sub-info {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .user-management {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .search-bar {
    flex-direction: column;
  }

  .action-buttons {
    flex-direction: column;
  }

  .pagination {
    flex-wrap: wrap;
  }
}
</style>