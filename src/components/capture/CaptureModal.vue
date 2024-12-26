<script setup>
import {ref} from 'vue';
import html2canvas from "html2canvas";
import {postFetch} from "@/stores/apiClient.js";

const isModalOpen = ref(false);
const capturePreview = ref(null);
const isUploading = ref(false);
const fileName = ref('');
const description = ref('');

const props = defineProps({
  prefix: {
    type: String,
    default: 'capture' // 기본값 설정
  }
});

//화면 캡처 함수
const captureScreen = async () => {
  try {
    // 캡처 시작을 알리는 토스트 메시지나 로딩 표시를 추가할 수 있습니다
    console.log('캡처 시작...');
    // 현재 시간을 한국 시간으로 설정
    const now = new Date();
    const koreanTime = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul'
    }).format(now).replace(/[^0-9]/g, '');

    fileName.value = `${props.prefix}-${koreanTime}.png`;

    // 스크롤 위치 저장
    const originalScrollPos = {
      x: window.pageXOffset,
      y: window.pageYOffset
    };

    // 전체 화면 크기 계산
    const fullHeight = Math.max(
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
    );
    const fullWidth = Math.max(
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
    );

    // html2canvas 캡처
    const canvas = await html2canvas(document.documentElement, {
      useCORS: true,
      scale: window.devicePixelRatio,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      foreignObjectRendering: true,
      height: fullHeight,
      width: fullWidth,
      windowWidth: fullWidth,
      windowHeight: fullHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0
    });

    // 캡처 이미지를 미리보기로 설정
    capturePreview.value = canvas.toDataURL('image/png');

    // 원래 스크롤 위치로 복원
    window.scrollTo(originalScrollPos.x, originalScrollPos.y);

    // 모달 열기
    isModalOpen.value = true;

  } catch (error) {
    console.error('화면 캡처 중 오류가 발생했습니다:', error);
  }
};

// 취소 버튼
const handleCancel = () => {
  isModalOpen.value = false;
  capturePreview.value = null;
  description.value = '';
}

// 등록 버튼
const handleSubmit = async () => {
  try {
    isUploading.value = true;

    // 로컬 저장
    const link = document.createElement('a');
    link.download = fileName.value;
    link.href = capturePreview.value;
    link.click();

    // 서버 업로드
    const response = await uploadCapture(capturePreview.value, fileName.value, description.value);
    if (response.success) {
      alert("캡처 이미지 등록 완료");
      handleCancel();
    }
  } catch (error) {
    console.error("캡처 등록 중 오류 발생: ", error);
    alert("캡처 등록 중 오류 발생")
  } finally {
    isUploading.value = false;
  }
};

// 서버 업로드 함수
const uploadCapture = async (imageData, fileName, description) => {
  try {
    //   Base64 문자열을 Blob로 변환
    const imageBlob = await fetch(imageData).then(r => r.blob());
    const formData = new FormData();
    formData.append('image', imageBlob, fileName);

    // 이미지 파일 업로드
    const response = await postFetch('/file/s3/upload', formData);
    const s3Url = response.data.data;

    //   워크보드 저장
    const boardResponse = await postFetch('/teamspace/board', {
      teamBoardTitle: fileName,
      teamBoardContent: description
    });

    //   이미지 엔티티 저장
    await postFetch('/file/save', {
      entityId: boardResponse.data.data,
      imageUrls: [s3Url],
      entityType: "teamboard"
    })
    return { success: true };
  } catch (error) {
    console.error("캡처 업로드 중 에러 발생: ", error);
    throw error;
  }
};

// 외부로 노출할 메서드들
defineExpose({
  captureScreen
});


</script>

<template>
  <div v-if="isModalOpen" class="modal-overlay">
    <div class="modal-content">
      <div class="title-wrapper">
        <h2 class="title-label">제목:</h2>
        <div class="title-text">{{ fileName }}</div>
      </div>

      <!--      설명 입력 -->
      <div class="description-container">
        <label for="description">설명</label>
        <textarea
            id="description"
            v-model="description"
            placeholder="캡처에 대한 설명을 입력하세요"
            rows="3"
        ></textarea>
      </div>

      <div class="preview-container" v-if="capturePreview">
        <img :src="capturePreview" alt="캡처 미리보기" class="capture-preview"/>
      </div>
      <div class="button-group">
        <button @click="handleCancel" class="cancel-btn">취소</button>
        <button @click="handleSubmit" class="submit-btn" :disabled="isUploading">
          {{ isUploading ? '등록 중...' : '등록' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-content h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fade-in 0.3s ease-out;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 80%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slide-up 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* 제목 영역 스타일 - 워크보드 스타일 적용 */
.title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.title-label {
  min-width: 60px;
  margin: 0;
  color: #333;
  font-weight: 600;
}

.title-text {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  color: #333;
}

.description-container {
  margin: 20px 0;
}

.description-container label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.preview-container {
  margin: 20px 0;
  max-height: 60vh;
  overflow-y: auto;
}

.capture-preview {
  max-width: 100%;
  height: auto;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.submit-btn, .cancel-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
}

</style>