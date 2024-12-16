<script setup>
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {postFetch, putFetch, getFetch} from "@/stores/apiClient.js";

const router = useRouter();
const route = useRoute();

const informId = route.params['informId'];

const informDetail = ref({
  informTitle: '',
  informContent: ''
});

const postContent = ref(''); // 에디터 내용을 저장할 ref

const fetchInformDetail = async () => {
  try {
    const response = await getFetch(`/inform/${informId}`);
    informDetail.value = response.data.data;

    // 에디터 내용 초기화
    postContent.value = informDetail.value.informContent; // 기존 내용으로 초기화
    document.querySelector('.editor').innerHTML = postContent.value; // 에디터에 내용 설정
  } catch (error) {
    console.error("공지사항 세부 정보를 가져오는 데 오류가 발생했습니다:", error);
  }
}

// 목록으로 돌아가기
const goBack = () => {
  router.push('/board/inform'); // 공지사항 목록으로 이동
};

// 사진 업로드
const selectedFile = ref(null);
const uploadStatus = ref('');

const updateContent = () => {
  // 에디터의 내용을 HTML 문자열로 저장
  postContent.value = document.querySelector('.editor').innerHTML;
};

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    selectedFile.value = file; // 이미지 파일을 저장
    uploadStatus.value = ''; // 상태 초기화
  } else {
    uploadStatus.value = 'Please select a valid image file.'; // 오류 메시지
    selectedFile.value = null; // 파일 초기화
  }
};

const uploadFile = async () => {
  if (!selectedFile.value) {
    uploadStatus.value = 'Please select an image file first.';
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile.value); // 파일을 FormData에 추가

  try {
    const response = await postFetch('/file/s3/upload', formData);
    const imageUrl = response.data.fileUrl; // S3에서 반환된 이미지 URL
    insertImageAtCursor(imageUrl); // 커서 위치에 이미지 삽입
    uploadStatus.value = 'File uploaded successfully.'; // 성공 메시지
  } catch (error) {
    console.error('File upload failed:', error);
    uploadStatus.value = 'File upload failed.';
  }
};

const insertImageAtCursor = (imageUrl) => {
  const img = document.createElement('img'); // img 태그를 추가해서 삽입
  img.src = imageUrl;
  img.alt = 'Uploaded Image';
  img.style.maxWidth = '100%'; // 이미지 크기 조절 (필요 시)

  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  range.insertNode(img); // 커서 위치에 이미지 삽입
  range.collapse(false); // 커서를 이미지 뒤로 이동
};

const updateInform = async () => {
  // informDetail의 내용을 업데이트하고 에디터의 내용을 반영
  informDetail.value.informContent = postContent.value;

  const reqInform = {
    informTitle: informDetail.value.informTitle,
    informContent: informDetail.value.informContent
  }
  try {
    const response = await putFetch(`/inform/${informId}`, reqInform); // informDetail.value로 변경

    console.log('저장 성공');
  } catch (error) {
    console.error('저장 실패');
  }
}

onMounted(() => {
  fetchInformDetail();
});
</script>

<template>
  <div class="notice-detail-container">
    <div class="notice-title row">
      <h2 class="col-md-1">제목 :</h2>
      <input type="text" class="col-md-7 no-border" v-model="informDetail.informTitle" placeholder="제목을 입력하세요">
    </div>

    <div class="info-section">
      <!-- 추가 정보 섹션 -->
    </div>
    <div class="content-section">
      <div
          contenteditable="true"
          ref="editor"
          class="editor"
          @input="updateContent"
      ></div>
    </div>

    <div class="button-group justify-content-between align-items-center">
      <div>
        <button @click="goBack">목록</button>
      </div>
      <div class="d-flex gap-3 ml-auto">
        <input type="file" @change="onFileChange" accept="image/*"/>
        <button @click="uploadFile">Upload</button>
        <div v-if="uploadStatus">{{ uploadStatus }}</div>
        <button @click="updateInform">작성완료</button>
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

.no-border {
  border: none; /* 테두리 제거 */
  outline: none; /* 포커스 시 테두리 제거 */
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
  min-height: 50rem; /* 최소 높이 설정 */
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
