<script setup>
import {computed, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {getFetch, postFetch, putFetch, delFetch} from "@/stores/apiClient.js";
import {formatDate} from "@/stores/util.js";
import { useAuthStore } from '@/stores/auth.js';

const router = useRouter();
const route = useRoute();
const useAuth = useAuthStore();
const currentUserCode = computed(() => useAuth.userCode);
const teamspaceId = computed(() => useAuth.teamspaceId);

const teamBoardId = route.params['teamBoardId'];
const teamBoardDetail = ref({});
const teamBoardReplyList = ref([]);
const originalImages = ref([]);

// 이미지 미리보기 위한 상태
const isImagePreviewOpen = ref(false);
const previewImageUrl = ref('');

const newReplyContent = ref('');
const editingReplyId = ref(null);
const editReplyContent = ref('');

// 이미지 미리보기 열기 함수
const openImagePreview = (imageUrl) => {
  previewImageUrl.value = imageUrl;
  isImagePreviewOpen.value = true;
};

// 이미지 미리보기 닫기 함수
const closeImagePreview = () => {
  isImagePreviewOpen.value = false;
  previewImageUrl.value = '';
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

    // 본문에서 이미지 URL 추출 및 저장
    const imageRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
    const content = teamBoardDetail.value.teamBoardContent || '';
    const imageMatches = [...content.matchAll(imageRegex)];
    originalImages.value = imageMatches.map(match => match[1]);

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

onMounted(() => {
  fetchTeamBoardDetail();
})
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

    <!-- 본문 섹션 -->
    <div class="content-section">
      <h4 class="section-title">본문</h4>
      <div v-html="teamBoardDetail.teamBoardContent" class="post-content"></div>
    </div>

    <!-- 이미지 미리보기 모달 -->
    <div v-if="isImagePreviewOpen" class="modal-overlay" @click.self="closeImagePreview">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">이미지 미리보기</h3>
          <button class="modal-close" @click="closeImagePreview">&times;</button>
        </div>
        <div class="modal-body">
          <img :src="previewImageUrl" alt="이미지 미리보기" class="preview-image"/>
        </div>
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

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow: hidden;
}

.modal-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: calc(90vh - 100px);
  object-fit: contain;
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
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
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
  .board-detail-container {
    margin: 0.75rem;
    padding: 0.75rem;
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

  .modal-content {
    width: 95%;
    max-height: 80vh;
  }

  .preview-image {
    max-height: calc(80vh - 120px);
  }
}
</style>