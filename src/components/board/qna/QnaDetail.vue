<script setup>
import {onMounted, onBeforeUnmount, ref, computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {delFetch, getFetch, postFetch, putFetch} from "@/stores/apiClient.js";
import {formatDate} from "@/stores/util.js";
import {useAuthStore} from "@/stores/auth.js";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const inquiryId = route.params['inquiryId'];
const inquiryDetail = ref({});
const comment = ref(null);
const newComment = ref('');
const editingCommentId = ref(null);
const editingContent = ref('');
const isSubmitting = ref(false);
const uploadStatus = ref('');
const originalImages = ref([]);

// 권한 관련 computed 속성들
const isAdmin = computed(() => authStore.userRole === 'ADMIN');
const isAuthor = computed(() => authStore.userCode === inquiryDetail.value.userCode);
const canEditDelete = computed(() => isAdmin.value || isAuthor.value);

// Q&A 상세 정보 조회 및 이미지 처리
const fetchInquiryDetail = async () => {
  try {
    const response = await getFetch(`/inquiry/${inquiryId}`);
    inquiryDetail.value = response.data.data;

    // 본문에서 이미지 URL 추출 및 저장
    const imageRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
    const content = inquiryDetail.value.inquiryContent || '';
    const imageMatches = [...content.matchAll(imageRegex)];
    originalImages.value = imageMatches.map(match => match[1]);

  } catch (error) {
    console.error("Q&A 세부 정보를 가져오는 데 오류가 발생했습니다:", error);
    alert("게시글 정보를 가져오는 데 실패했습니다.");
  }
};

// 답변 조회
const fetchComment = async () => {
  try {
    const response = await getFetch(`/inquiryReply/${inquiryId}`);
    comment.value = response.data.data;
  } catch (error) {
    console.error("답변을 가져오는 데 실패했습니다:", error);
  }
};

// 답변 작성 처리
const submitComment = async () => {
  if (isSubmitting.value) return;

  if (!isAdmin.value) {
    alert('관리자만 답변을 작성할 수 있습니다.');
    return;
  }

  if (!newComment.value.trim()) {
    alert('답변 내용을 입력해주세요.');
    return;
  }

  try {
    isSubmitting.value = true;
    uploadStatus.value = '답변 등록 중...';

    await postFetch(`/inquiry/${inquiryId}/reply`, {
      inquiryReplyContent: newComment.value,
      url: `/qna/${inquiryId}`,
    });

    newComment.value = '';
    await fetchComment();
    await fetchInquiryDetail();

  } catch (error) {
    console.error("답변 작성에 실패했습니다:", error);
    alert('답변 작성에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isSubmitting.value = false;
    uploadStatus.value = '';
  }
};

// 답변 수정 모드 시작
const startEdit = (commentData) => {
  if (!isAdmin.value) {
    alert('관리자만 답변을 수정할 수 있습니다.');
    return;
  }
  editingCommentId.value = true;
  editingContent.value = commentData.inquiryReplyContent;
};

// 답변 수정 취소
const cancelEdit = () => {
  editingCommentId.value = null;
  editingContent.value = '';
};

// 답변 수정 처리
const updateComment = async () => {
  if (isSubmitting.value) return;

  if (!isAdmin.value) {
    alert('관리자만 답변을 수정할 수 있습니다.');
    return;
  }

  if (!editingContent.value.trim()) {
    alert('답변 내용을 입력해주세요.');
    return;
  }

  try {
    isSubmitting.value = true;
    uploadStatus.value = '답변 수정 중...';

    await putFetch(`/inquiry/${comment.value.inquiryReplyId}/reply`, {
      inquiryReplyContent: editingContent.value
    });

    editingCommentId.value = null;
    editingContent.value = '';
    await fetchComment();

  } catch (error) {
    console.error("답변 수정에 실패했습니다:", error);
    alert('답변 수정에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isSubmitting.value = false;
    uploadStatus.value = '';
  }
};

// 답변 삭제 처리
const deleteComment = async () => {
  if (isSubmitting.value) return;

  if (!isAdmin.value) {
    alert('관리자만 답변을 삭제할 수 있습니다.');
    return;
  }

  if (!confirm('답변을 삭제하시겠습니까?')) return;

  try {
    isSubmitting.value = true;
    uploadStatus.value = '답변 삭제 중...';

    await delFetch(`/inquiry/${comment.value.inquiryReplyId}/reply`);

    comment.value = null;
    await fetchInquiryDetail();

  } catch (error) {
    console.error("답변 삭제에 실패했습니다:", error);
    alert('답변 삭제에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isSubmitting.value = false;
    uploadStatus.value = '';
  }
};

// 게시글 삭제 처리
const deleteInquiry = async () => {
  if (isSubmitting.value) return;

  if (!canEditDelete.value) {
    alert('삭제 권한이 없습니다.');
    return;
  }

  if (!confirm('게시글을 삭제하시겠습니까?')) return;

  try {
    isSubmitting.value = true;
    uploadStatus.value = '삭제 중...';

    // 1. 이미지가 있다면 S3에서 삭제
    if (originalImages.value.length > 0) {
      await postFetch('/file/s3/uploadList', originalImages.value);
      await postFetch('/file/delete', {
        fileS3UrlList: originalImages.value,
        fileIdList: []
      });
    }

    // 2. 게시글 삭제
    await delFetch(`/inquiry/${inquiryId}`);

    alert('삭제되었습니다.');
    router.push('/qna');

  } catch (error) {
    console.error('삭제에 실패했습니다.', error);
    alert('삭제에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isSubmitting.value = false;
    uploadStatus.value = '';
  }
};

// 수정 페이지로 이동
const editInquiry = () => {
  if (!canEditDelete.value) {
    alert('수정 권한이 없습니다.');
    return;
  }
  router.push(`/qna/${inquiryId}/update`);
};

// 목록으로 이동
const goBack = () => {
  router.push('/qna');
};

// 라이프사이클 훅
onMounted(() => {
  fetchInquiryDetail();
  fetchComment();
});

// 리소스 정리
onBeforeUnmount(() => {
  // 필요한 정리 작업이 있다면 여기서 수행
});
</script>

<template>
  <div class="qna-detail-container">
    <!-- Q&A 상세 정보 헤더 -->
    <div class="qna-header">
      <h3 class="title">{{ inquiryDetail.inquiryTitle }}</h3>
      <div class="info-section">
        <div class="info-item">
          <span class="info-label">조회수</span>
          <span class="info-value">{{ inquiryDetail.inquiryViewcount }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">상태</span>
          <span class="status-badge"
                :class="inquiryDetail.inquiryReplyYn === 'Y' ? 'answered' : 'waiting'">
            {{ inquiryDetail.inquiryReplyYn === 'Y' ? '답변완료' : '답변대기' }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">비밀글</span>
          <span class="info-value">{{ inquiryDetail.inquirySecretYn === 'Y' ? '예' : '아니오' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">등록일</span>
          <span class="info-value">{{ formatDate(inquiryDetail.createdDate) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">작성자</span>
          <span class="info-value">{{ inquiryDetail.userName }}</span>
        </div>
      </div>
    </div>

    <!-- Q&A 내용 -->
    <div class="content-section">
      <div v-html="inquiryDetail.inquiryContent" class="post-content"></div>
    </div>

    <!-- 답변 섹션 -->
    <div class="comments-section">
      <h4 class="comments-title">답변</h4>

      <!-- 업로드 상태 표시 -->
      <div v-if="uploadStatus" class="upload-status">
        {{ uploadStatus }}
      </div>

      <!-- 답변 작성 폼 - 관리자이면서 답변이 없을 때만 표시 -->
      <div v-if="isAdmin && !comment" class="comment-form">
        <textarea
            v-model="newComment"
            placeholder="답변을 입력하세요..."
            class="comment-input"
            :disabled="isSubmitting"
        ></textarea>
        <button
            class="btn btn-primary comment-submit"
            @click="submitComment"
            :disabled="isSubmitting"
        >
          {{ isSubmitting ? '등록 중...' : '답변 작성' }}
        </button>
      </div>

      <!-- 답변이 없고 관리자가 아닌 경우 메시지 -->
      <div v-if="!isAdmin && !comment" class="no-comments">
        관리자의 답변을 기다리고 있습니다.
      </div>

      <!-- 답변 표시 영역 -->
      <div v-if="comment" class="comment-item">
        <!-- 수정 모드가 아닐 때 -->
        <template v-if="!editingCommentId">
          <div class="comment-header">
            <span class="comment-author">관리자</span>
            <span class="comment-date">{{ formatDate(comment.createdDate) }}</span>
          </div>
          <div class="comment-content">{{ comment.inquiryReplyContent }}</div>
          <div v-if="isAdmin" class="comment-actions">
            <button
                class="btn-edit"
                @click="startEdit(comment)"
                :disabled="isSubmitting"
            >수정
            </button>
            <button
                class="btn-delete"
                @click="deleteComment"
                :disabled="isSubmitting"
            >삭제
            </button>
          </div>
        </template>

        <!-- 수정 모드일 때 -->
        <template v-else>
          <div class="edit-form">
            <textarea
                v-model="editingContent"
                class="edit-input"
                rows="4"
                :disabled="isSubmitting"
            ></textarea>
            <div class="edit-actions">
              <button
                  class="btn btn-primary"
                  @click="updateComment"
                  :disabled="isSubmitting"
              >
                {{ isSubmitting ? '저장 중...' : '저장' }}
              </button>
              <button
                  class="btn btn-secondary"
                  @click="cancelEdit"
                  :disabled="isSubmitting"
              >취소
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 버튼 그룹 -->
    <div class="footer-section">
      <div class="left-buttons">
        <button
            class="btn btn-secondary"
            @click="goBack"
            :disabled="isSubmitting"
        >
          <span class="btn-text">목록으로</span>
        </button>
      </div>
      <div class="right-buttons">
        <button
            v-if="canEditDelete"
            class="btn btn-primary"
            @click="editInquiry"
            :disabled="isSubmitting"
        >
          <span class="btn-text">수정</span>
        </button>
        <button
            v-if="canEditDelete"
            class="btn btn-danger"
            @click="deleteInquiry"
            :disabled="isSubmitting"
        >
          <span class="btn-text">{{ isSubmitting ? '삭제 중...' : '삭제' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qna-detail-container {
  max-width: 1200px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.qna-header {
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

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.waiting {
  background-color: #fff3e0;
  color: #e65100;
}

.status-badge.answered {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.content-section {
  margin: 2rem 0;
  min-height: 300px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
}

.post-content {
  line-height: 1.6;
}

/* 답변 섹션 스타일 */
.comments-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.comments-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
}

.comment-form {
  margin-bottom: 2rem;
}

.comment-input, .edit-input {
  width: 100%;
  min-height: 100px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  background-color: #fff;
}

.comment-input:disabled, .edit-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.comment-input:focus, .edit-input:focus {
  outline: none;
  border-color: #29C458;
  box-shadow: 0 0 0 2px rgba(41, 196, 88, 0.1);
}

.comment-submit {
  float: right;
  margin-bottom: 1rem;
}

.comments-list {
  clear: both;
}

.comment-item {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 1rem;
  background-color: #f8f9fa;
}

.comment-header {
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-author {
  font-weight: 600;
  color: #2e7d32;
}

.comment-date {
  font-size: 0.9rem;
  color: #666;
}

.comment-content {
  line-height: 1.5;
  color: #444;
  margin-bottom: 1rem;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-edit, .btn-delete {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit:disabled, .btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-edit {
  color: #2196F3;
}

.btn-delete {
  color: #dc3545;
}

.btn-edit:not(:disabled):hover,
.btn-delete:not(:disabled):hover {
  text-decoration: underline;
}

.edit-form {
  background-color: #fff;
  padding: 1rem;
  border-radius: 4px;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.no-comments {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.upload-status {
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  text-align: center;
  color: #666;
}

/* 버튼 공통 스타일 */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background-color: #29C458;
  color: white;
}

.btn-primary:not(:disabled):hover {
  background-color: #23a94c;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:not(:disabled):hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:not(:disabled):hover {
  background-color: #c82333;
  transform: translateY(-1px);
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

/* 반응형 스타일 */
@media (max-width: 768px) {
  .qna-detail-container {
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

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .comment-actions {
    margin-top: 0.5rem;
  }
}
</style>