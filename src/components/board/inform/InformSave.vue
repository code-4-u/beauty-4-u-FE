<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {postFetch} from "@/stores/apiClient.js";
import BoardEditor from "@/components/board/inform/BoardEditor.vue";

const router = useRouter();

// 사진 업로드
const selectedFile = ref(null);
const uploadStatus = ref('');
const imageUrls = ref([]);
const informTitle = ref('');
const editorContent = ref('<p>기본 내용입니다.</p>');

const fileSaveDTO = ref({
  entityId: null,
  imageUrls: imageUrls.value,
  isInform: true
})

// 커서 위치 표시
const setCursorPosition = () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.collapse(false); // 커서를 끝으로 이동
  }
};

const onFileChange = (event) => {
  const file = event.target.files[0];
  console.log(file);
  if (file && file.type.startsWith('image/')) {
    selectedFile.value = file; // 이미지 파일을 저장
    console.log(selectedFile.value)
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
  formData.append('image', selectedFile.value); // 파일을 FormData에 추가

  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value); // FormData의 각 항목 로그
  }
  try {
    const response = await postFetch('/file/s3/upload', formData);

    const imageUrl = response.data.data; // S3에서 반환된 이미지 URL
    console.log(imageUrl);
    imageUrls.value.push(imageUrl);
    insertImageAtCursor(imageUrl); // 커서 위치에 이미지 삽입
    uploadStatus.value = 'File uploaded successfully.'; // 성공 메시지
  } catch (error) {
    console.error('File upload failed:', error);
    uploadStatus.value = 'File upload failed.';
  }
};

// 커서 위치에 s3 업로드 url 넣기
const insertImageAtCursor = (imageUrl) => {
  const img = document.createElement('img'); // img 태그를 추가해서 삽입
  img.src = imageUrl;
  img.alt = 'Uploaded Image';
  img.style.maxWidth = '100%'; // 이미지 크기 조절 (필요 시)

  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  range.insertNode(img); // 커서 위치에 이미지 삽입
  range.collapse(false); // 커서를 이미지 뒤로 이동

  setCursorPosition(); // 커서 위치를 이미지 뒤로 이동
};

// DB에 저장하는 함수
const saveImagesToDB = async () => {

  console.log('saveImagesToDB 실행');
  try {
    await postFetch('/file/save', {
      entityId: fileSaveDTO.value.entityId,
      imageUrls: imageUrls.value,
      isInform : true
    });
    uploadStatus.value = 'Images saved to database successfully.';
  } catch (error) {
    console.error('Failed to save images to database:', error);
    uploadStatus.value = 'Failed to save images to database.';
  }
};

// 목록으로 돌아가기
const goBack = () => {
  router.push('/board/inform'); // 공지사항 목록으로 이동
};

const fetchSaveInform = async () => {

  try {
    const response = await postFetch(`/inform`, {
      informTitle: informTitle.value,
      informContent: editorContent.value
    });

    fileSaveDTO.value.entityId = response.data.data;
    fileSaveDTO.value.imageUrls = imageUrls.value ? imageUrls.value : null; // imageUrls 확인
    fileSaveDTO.value.isInform = true;

    console.log('saveImagesToDB 실행 전');

    await saveImagesToDB();

    await router.push({
      path: `/board/inform`
    })
  } catch (error) {
    console.error('저장에 실패했습니다.', error);
  }
}
</script>

<template>
  <div class="notice-detail-container">
    <div class="notice-title row">
      <h3 class="col-md-1">제목 :</h3>
      <input type="text" class="col-md-7 no-border" v-model="informTitle" placeholder="제목을 입력하세요">
    </div>

    <div class="info-section">

    </div>

    <div>
      <board-editor v-model="editorContent"/>
    </div>

    <div class="button-group justify-content-between align-items-center">
      <div>
        <button @click="goBack">목록</button>
      </div>
      <div class="d-flex gap-3 ml-auto">
        <input type="file" @change="onFileChange" accept="image/*"/>
        <button @click="uploadFile">Upload</button>
        <div v-if="uploadStatus">{{ uploadStatus }}</div>
        <button @click="fetchSaveInform">작성완료</button>
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
