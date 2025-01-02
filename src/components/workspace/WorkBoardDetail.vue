<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {delFetch, getFetch, postFetch, putFetch} from "@/stores/apiClient.js";
import {formatDate} from "@/stores/util.js";
import {useAuthStore} from '@/stores/auth.js';

const router = useRouter();
const route = useRoute();
const useAuth = useAuthStore();
const currentUserCode = computed(() => useAuth.userCode);
const teamspaceId = computed(() => useAuth.teamspaceId);

const teamBoardId = route.params['teamBoardId'];
const teamBoardDetail = ref({});
const teamBoardReplyList = ref([]);
const originalImages = ref([]);

// 이미지 미리보기 및 캐러셀 관련 상태
const isImagePreviewOpen = ref(false);
const previewImageUrl = ref('');
const currentImageIndex = ref(0);

const newReplyContent = ref('');
const editingReplyId = ref(null);
const editReplyContent = ref('');

const ITEMS_PER_ROW = 6;
const ROWS_TO_SHOW = 2;
const showAllImages = ref(false);

// 이미지 네비게이션 함수
const showNextImage = () => {
  if (currentImageIndex.value < originalImages.value.length - 1) {
    currentImageIndex.value++;
    previewImageUrl.value = originalImages.value[currentImageIndex.value];
  }
};

const showPrevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
    previewImageUrl.value = originalImages.value[currentImageIndex.value];
  }
};

// 특정 이미지 보기
const showImage = (index) => {
  currentImageIndex.value = index;
  previewImageUrl.value = originalImages.value[index];
  isImagePreviewOpen.value = true;
};

// 이미지 미리보기 닫기
const closeImagePreview = () => {
  isImagePreviewOpen.value = false;
  previewImageUrl.value = '';
  currentImageIndex.value = 0;
};

// 키보드 이벤트 핸들러
const handleKeydown = (e) => {
  if (!isImagePreviewOpen.value) return;

  if (e.key === 'ArrowRight') {
    showNextImage();
  } else if (e.key === 'ArrowLeft') {
    showPrevImage();
  } else if (e.key === 'Escape') {
    closeImagePreview();
  }
};

// 게시글 작성자 여부를 확인하는 computed 속성
const isAuthor = computed(() => {
  return teamBoardDetail.value.userCode === currentUserCode.value;
});

// 댓글 작성자 여부를 확인하는 메서드
const isReplyAuthor = (reply) => {
  return reply.userCode === currentUserCode.value;
};

const publishedReplies = computed(() => {
  return teamBoardReplyList.value.filter(reply => reply.publishStatus === 'PUBLISHED');
});

const fetchTeamBoardDetail = async () => {
  try {
    const response = await getFetch(`/teamspace/board/${teamBoardId}`);
    teamBoardDetail.value = response.data.data.teamBoardDetailDTO;
    teamBoardReplyList.value = response.data.data.teamBoardReplyList;

    // 이미지 URL 가져오기
    const fileResponse = await getFetch(`/file/list?fileType=TEAMBOARD&fileUrl=${teamBoardId}`);
    if (fileResponse?.data?.data?.fileList && fileResponse.data.data.fileList.length > 0) {
      originalImages.value = fileResponse.data.data.fileList;
    }
  } catch (error) {
    console.error("게시글 세부 정보를 가져오는 데 오류가 발생했습니다:", error);
  }
};

const goBack = () => {
  router.push(`/workspace/board`);
};

const editTeamBoard = () => {
  router.push({
    path: `/workspace/board/${teamBoardId}/update`
  });
};

const deleteFetchTeamBoard = async () => {
  try {
    // 1. 이미지가 있다면 S3에서 삭제
    if (originalImages.value.length > 0) {
      await postFetch('/file/s3/uploadList', originalImages.value);
      await postFetch('/file/delete', {
        fileS3UrlList: originalImages.value,
        fileIdList: []
      });
    }

    // 2. 게시글 삭제
    await delFetch(`/teamspace/board/${teamBoardId}`);

    alert('삭제되었습니다.');
    await router.push(`/workspace/board`);
  } catch (error) {
    console.error('삭제에 실패했습니다.', error);
    alert('삭제에 실패했습니다. 다시 시도해주세요.');
  }
};

const deleteTeamBoard = () => {
  if (confirm('게시글을 삭제하시겠습니까?')) {
    deleteFetchTeamBoard();
  }
};

// 댓글 작성
const addReply = async () => {
  try {
    if (!newReplyContent.value.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    await postFetch(`/teamspace/board/${teamBoardId}/reply`, {
      teamBoardReplyContent: newReplyContent.value
    });

    // 댓글 목록 새로고침
    await fetchTeamBoardDetail();
    // 입력창 초기화
    newReplyContent.value = '';
  } catch (error) {
    console.error('댓글 등록에 실패했습니다:', error);
    alert('댓글 등록에 실패했습니다.');
  }
};

// 댓글 수정 모드 시작
const startEditReply = (reply) => {
  editingReplyId.value = reply.teamBoardReplyId;
  editReplyContent.value = reply.teamBoardReplyContent;
};

// 댓글 수정 취소
const cancelEditReply = () => {
  editingReplyId.value = null;
  editReplyContent.value = '';
};

// 댓글 수정 저장
const updateReply = async (replyId) => {
  try {
    if (!editReplyContent.value.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    await putFetch(`/teamspace/board/${teamBoardId}/reply/${replyId}`, {
      teamBoardReplyContent: editReplyContent.value
    });

    // 댓글 목록 새로고침
    await fetchTeamBoardDetail();
    // 수정 모드 종료
    cancelEditReply();
  } catch (error) {
    console.error('댓글 수정에 실패했습니다:', error);
    alert('댓글 수정에 실패했습니다.');
  }
};

// 댓글 삭제
const deleteReply = async (replyId) => {
  if (!confirm('정말로 삭제하시겠습니까?')) return;

  try {
    await delFetch(`/teamspace/board/${teamBoardId}/reply/${replyId}`);
    // 댓글 목록 새로고침
    await fetchTeamBoardDetail();
  } catch (error) {
    console.error('댓글 삭제에 실패했습니다:', error);
    alert('댓글 삭제에 실패했습니다.');
  }
};

const displayedImages = computed(() => {
  if (showAllImages.value) return originalImages.value;
  return originalImages.value.slice(0, 6);
});

const toggleImages = () => {
  showAllImages.value = !showAllImages.value;
};

// 컴포넌트 마운트/언마운트 시 이벤트 리스너 관리
onMounted(() => {
  fetchTeamBoardDetail();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="board-detail-container">
    <div class="board-header">
      <h3 class="title">{{ teamBoardDetail.teamBoardTitle }}</h3>
      <div class="info-section">
        <div class="info-item">
          <span class="info-label">등록일</span>
          <span class="info-value">{{ formatDate(teamBoardDetail.createdDate) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">작성자</span>
          <span class="info-value">{{ teamBoardDetail.userName }}</span>
        </div>
      </div>
    </div>

    <div class="content-section">
      <!-- 이미지 갤러리 섹션 -->
      <div v-if="originalImages.length > 0" class="image-section">
        <h4 class="section-title">첨부 이미지</h4>
        <div class="gallery-container">
          <div class="gallery-grid" :class="{ 'expanded': showAllImages }">
            <div v-for="(imageUrl, index) in displayedImages"
                 :key="index"
                 class="gallery-item"
                 @click="showImage(index)">
              <img :src="imageUrl"
                   :alt="'이미지 ' + (index + 1)"
                   class="gallery-thumbnail"/>
            </div>
          </div>
          <button
              @click="toggleImages"
              class="gallery-toggle-btn">
            {{ showAllImages ? '접기' : '더보기' }}
          </button>
        </div>
      </div>

      <!-- 본문 섹션 -->
      <div class="text-content-section">
        <h4 class="section-title">본문</h4>
        <div class="post-content">{{ teamBoardDetail.teamBoardContent }}</div>
      </div>
    </div>

    <!-- 이미지 캐러셀 모달 -->
    <div v-if="isImagePreviewOpen" class="modal-overlay" @click.self="closeImagePreview">
      <div class="modal-carousel">
        <button class="carousel-btn prev"
                @click.stop="showPrevImage"
                :disabled="currentImageIndex === 0">
          &#10094;
        </button>

        <div class="carousel-content">
          <img :src="originalImages[currentImageIndex]"
               :alt="'이미지 ' + (currentImageIndex + 1)"
               class="carousel-image"/>

          <div class="carousel-counter">
            {{ currentImageIndex + 1 }} / {{ originalImages.length }}
          </div>
        </div>

        <button class="carousel-btn next"
                @click.stop="showNextImage"
                :disabled="currentImageIndex === originalImages.length - 1">
          &#10095;
        </button>

        <button class="close-btn" @click="closeImagePreview">
          &#10005;
        </button>
      </div>
    </div>

    <div class="comments-section">
      <div class="comments-header">
        <h4 class="comments-title">
          댓글 <span class="comment-count">{{ publishedReplies.length }}</span>
        </h4>
      </div>

      <div class="comment-form">
        <div class="comment-input-wrapper">
          <textarea
              class="comment-input"
              v-model="newReplyContent"
              placeholder="댓글을 입력하세요..."
          ></textarea>
          <div class="comment-submit">
            <button class="btn btn-primary" @click="addReply">
              <span class="btn-text">등록</span>
            </button>
          </div>
        </div>
      </div>

      <div class="comment-list">
        <div v-for="reply in publishedReplies"
             :key="reply.teamBoardReplyId"
             class="comment-item">
          <div class="comment-info">
            <span class="comment-author">{{ reply.userName }}</span>
            <span class="comment-date">{{ formatDate(reply.createdDate) }}</span>
          </div>

          <!-- 수정 모드일 때 -->
          <div v-if="editingReplyId === reply.teamBoardReplyId" class="comment-edit-form">
            <textarea
                v-model="editReplyContent"
                class="comment-input"
            ></textarea>
            <div class="comment-actions">
              <button class="comment-action-btn" @click="updateReply(reply.teamBoardReplyId)">저장</button>
              <button class="comment-action-btn" @click="cancelEditReply">취소</button>
            </div>
          </div>

          <!-- 일반 모드일 때 -->
          <template v-else>
            <p class="comment-content">
              {{ reply.teamBoardReplyContent }}
            </p>
            <div class="comment-actions">
              <template v-if="isReplyAuthor(reply)">
                <button class="comment-action-btn" @click="startEditReply(reply)">수정</button>
                <button class="comment-action-btn" @click="deleteReply(reply.teamBoardReplyId)">삭제</button>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="footer-section">
      <div class="left-buttons">
        <button class="btn btn-secondary" @click="goBack">
          <span class="btn-text">목록으로</span>
        </button>
      </div>
      <div class="right-buttons">
        <template v-if="isAuthor">
          <button class="btn btn-primary" @click="editTeamBoard">
            <span class="btn-text">수정</span>
          </button>
          <button class="btn btn-danger" @click="deleteTeamBoard">
            <span class="btn-text">삭제</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-detail-container {
  max-width: 1200px;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.board-header {
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  padding-bottom: 1rem;
  border-bottom: 2px solid #29C458;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #29C458;
}

.info-section {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-top: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
}

.content-section {
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.image-section {
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(6, 80px);
  gap: 0.4rem;
  padding: 0.75rem;
  max-height: 90px; /* 한 줄 높이로 조정 */
  overflow-y: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);  /* max-height와 opacity 모두에 애니메이션 적용 */
  opacity: 1;
}

.gallery-item {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}


.gallery-item:hover {
  transform: scale(1.2);  /* 1.05에서 1.1로 증가 */
  z-index: 1;  /* hover 시 다른 이미지 위에 표시 */
}

.gallery-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.text-content-section {
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.post-content {
  line-height: 1.6;
  color: #333;
}

.post-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
  border-radius: 4px;
  cursor: pointer;
}

.post-content :deep(.board-image) {
  margin: 20px auto;
  text-align: center;
  max-width: 800px;
}

.post-content :deep(.board-image img) {
  max-width: 100%;
  height: auto;
  max-height: 600px;
  width: auto;
  object-fit: contain;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.post-content :deep(.board-image img:hover) {
  transform: scale(1.01);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-carousel {
  position: relative;
  background: transparent;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  padding: 2rem;
}

.carousel-content {
  position: relative;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.carousel-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.carousel-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  transition: background-color 0.2s;
  margin: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.carousel-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.carousel-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
}

.carousel-counter {
  position: absolute;
  bottom: -2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: background-color 0.2s;
  z-index: 2;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.comments-section {
  margin-top: 2rem;
  border-top: 1px solid #eaeaea;
  padding-top: 2rem;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.comments-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comment-count {
  background-color: #29C458;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.9rem;
}

.comment-form {
  margin-bottom: 2rem;
}

.comment-input-wrapper {
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  background-color: #f8f9fa;
  transition: border-color 0.2s ease;
}

.comment-input-wrapper:focus-within {
  border-color: #29C458;
}

.comment-input {
  width: 100%;
  min-height: 80px;
  border: none;
  background: transparent;
  resize: none;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #333;
}

.comment-input:focus {
  outline: none;
}

.comment-submit {
  display: flex;
  justify-content: flex-end;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-item {
  padding: 1rem;
  border-bottom: 1px solid #eaeaea;
}

.comment-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.comment-author {
  font-weight: 600;
  color: #333;
}

.comment-date {
  font-size: 0.9rem;
  color: #666;
}

.comment-content {
  color: #444;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.comment-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.comment-action-btn {
  border: none;
  background: none;
  color: #666;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
}

.comment-action-btn:hover {
  color: #29C458;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.btn-primary {
  background-color: #29C458;
  color: white;
}

.btn-primary:hover {
  background-color: #23a94c;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #29C458;
  color: white;
}

.btn-secondary:hover {
  background-color: #23a94c;
  transform: translateY(-1px);
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.btn-text {
  font-size: 0.95rem;
}

.footer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.right-buttons {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .image-wrapper {
    max-width: 95%;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .modal-carousel {
    padding: 1rem;
  }

  .carousel-btn {
    width: 32px;
    height: 32px;
    font-size: 1rem;
    margin: 0 0.5rem;
  }

  .carousel-counter {
    font-size: 0.8rem;
    padding: 0.3rem 0.8rem;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .info-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .footer-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .left-buttons,
  .right-buttons {
    width: 100%;
    display: flex;
    gap: 0.75rem;
  }

  .btn {
    flex: 1;
  }

  .comments-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
  }

  .comment-input {
    min-height: 60px;
  }

  .comment-item {
    padding: 0.75rem;
  }

  .comment-info {
    flex-direction: column;
    gap: 0.25rem;
  }

  .preview-image {
    max-height: calc(70vh - 80px);
    object-fit: contain;
  }
}

.gallery-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);  /* 4개에서 6개로 변경 */
  gap: 0.5rem;  /* 1rem에서 0.5rem으로 줄임 */
  padding: 1rem;
  max-height: 260px;  /* 320px에서 260px로 줄임 */
  overflow-y: hidden;
  transition: max-height 0.3s ease;
}

.gallery-grid.expanded {
  max-height: 360px;
  overflow-y: auto;
}

.gallery-toggle-btn {
  align-self: center;
  padding: 0.5rem 1rem;
  background-color: #29C458;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.gallery-toggle-btn:hover {
  background-color: #23a94c;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>