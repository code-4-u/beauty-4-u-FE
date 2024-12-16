<script setup>
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {delFetch, getFetch, putFetch} from "@/stores/apiClient.js";
import {formatDate} from "@/stores/util.js";

const router = useRouter();
const route = useRoute();

const informId = route.params['informId'];

// 예시 데이터 (실제 데이터는 API를 통해 가져와야 함)
const informDetail = ref({});

const fetchInformDetail = async () => {
  try {
    const response = await getFetch(`/inform/${informId}`)

    informDetail.value = response.data.data;
  } catch (error) {
    console.error("공지사항 세부 정보를 가져오는 데 오류가 발생했습니다:", error);
  }

}

// 목록으로 돌아가기
const goBack = () => {
  router.push('/board/inform'); // 공지사항 목록으로 이동
};

// 수정 페이지로 이동
const editNotice = () => {
  router.push(
      {
        path: `/board/inform/${informId}/update`
      }
  );
};

// 삭제 api 호출
const deleteFetchInform = async () => {
  try {
    const response = await delFetch(`/inform/${informId}`);
  } catch (error) {
    console.error('삭제에 실패했습니다.', error);
  }
}

// 삭제 기능 (확인 대화상자 포함)
const deleteInform = () => {
  if (confirm('정말로 삭제하시겠습니까?')) {
    deleteFetchInform();
    alert('삭제되었습니다.');
    router.push('/board/inform');
  }
};

onMounted(() => {
  fetchInformDetail();
})
</script>

<template>
  <div class="notice-detail-container">
    <h2 class="notice-title">제목 : {{ informDetail.informTitle }}</h2>
    <div class="info-section">
      <span>조회수 : {{ informDetail.informViewcount }}</span>
      <span>상태 : {{ informDetail.publishStatus }}</span>
      <span>등록일 : {{ formatDate(informDetail.createdDate) }}</span>
      <span>작성자 : {{ informDetail.userName }}</span>
    </div>
    <div class="content-section">
      <div v-html="informDetail.informContent" class="post-content"></div>
    </div>
    <div class="button-group">
      <div>
        <button @click="goBack">목록</button>
      </div>
      <div class="d-flex gap-3">
        <button @click="editNotice">수정</button>
        <button @click="deleteInform">삭제</button>
      </div>
    </div>
  </div>
</template>


<style scoped>
.notice-detail-container {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
  max-width: 4000px;
  margin: auto;
}

.notice-title {
  margin-bottom: 20px;
  font-size: 24px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.info-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 16px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
  font-size: 14px;
}

.content-section {
  margin: 20px 0;
}

.notice-image {
  max-width: 100%;
  height: auto;
  margin-bottom: 10px;
}

.button-group {
  display: flex;
  justify-content: space-between;
}

button {
  padding: 7px 10px;
  border: none;
  border-radius: 5px;
  background-color: #29C458;
  color: white;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
