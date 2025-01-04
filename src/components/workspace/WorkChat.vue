<script setup>
import { Stomp } from '@stomp/stompjs';
import { ref, computed, onMounted, onBeforeUnmount, nextTick  } from 'vue';
import {delFetch, getFetch, postFetch} from "@/stores/apiClient.js"
import { useAuthStore } from '@/stores/auth.js';
import ChatImageManagement from "@/components/teamspace/ChatImageManagement.vue";
import CreateChatRoomModal from './CreateChatRoomModal.vue';
import InviteUserModal from './InviteUserModal.vue';
import ParticipantListModal from './ParticipantListModal.vue';
import ImagePreviewModal from "@/components/workspace/ImagePreviewModal.vue";
import axios from "axios";

const chatUrl = import.meta.env.VITE_API_CHAT_URL || 'localhost:8080';

// 유저 정보 관리
const useAuth = useAuthStore();
const userCode = ref(useAuth.userCode); // 현재 사용자 코드
const userName = ref(useAuth.userName); // 현재 사용자 이름

const authObjectInfo = {
  userId: useAuth.userCode,
  userName: useAuth.userName,
  accessToken: useAuth.accessToken,
};

const formatDate = (date) => {
  const d = new Date(date);
  const now = new Date();

  // 현재 날짜와 비교
  const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

  // 시간과 분 포맷
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  const formattedHours = hours % 12 || 12; // 12시간제 표시

  if (isToday) {
    // 오늘 날짜일 경우: 오후 5:54
    return `${period} ${formattedHours}:${minutes}`;
  } else {
    // 과거 날짜일 경우: 2024-12-19 오후 5:54
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day} ${period} ${formattedHours}:${minutes}`;
  }
};


// 날짜 헤더 표시
const formatDateHeader = (date) => {
  const options = { year: "numeric", month: "long", day: "numeric", weekday: "long" };
  return new Date(date).toLocaleDateString("ko-KR", options);
};

// 날짜 변경 감지 로직
const shouldDisplayDateHeader = (index) => {
  if (index === 0) return true; // 첫 번째 메시지에는 항상 날짜 헤더를 표시

  const currentMessageDate = new Date(messages.value[index].messageCreatedTime).toDateString();
  const previousMessageDate = new Date(messages.value[index - 1].messageCreatedTime).toDateString();

  // 날짜가 변경되었을 때 날짜 헤더를 표시
  return currentMessageDate !== previousMessageDate;
};


// 상태 관리
const isCreateRoomModalOpen = ref(false);
const chatRooms = ref([]); // 채팅방 목록
const chatRoomId = ref(null);
const selectedRoomName = ref(); // 선택된 채팅방 이름

const messages = ref([]); // 메시지 목록
const messageContent = ref(''); // 메세지 내용
const newRoomName = ref(''); // 새 채팅방 이름
const error = ref(null);

let stompClient = null; // WebSocket 클라이언트
const autoScrollEnabled = ref(true); // 자동 스크롤 활성화 여부

const selectedUsers = ref([]); // 선택된 사용자 목록
const inviteSearch = ref(''); // 사용자 검색어
const searchedUsers = ref([]); // 검색된 사용자 목록

const isInviteModalOpen = ref(false); // 초대 모달 열림 여부
const users = ref([]);

const showParticipantModal = ref(false); // 사용자 목록 모달 열림 여부
const participants = ref([]); // 참여자 목록

// 사용자 초대 검색어와 페이징 상태 관리
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10;
const totalItems = ref(0)

// 하이퍼링크 URL 감지
const detectURLs = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
};

const formatMessageContent = (content) => {
  return detectURLs(content);
};

// 파일 첨부 기능

const attachedFiles = ref([]); // 첨부된 파일 목록
const uploadStatus = ref('');
const selectedFiles = ref([]); // 선택된 파일들
const imageUrls = ref([]);
const chatEditorRef = ref(null);
const isSubmitting = ref(false);

const insertImageAtCursor = (imageUrl, options = {}) => {
  if (!chatEditorRef.value) return;

  try {
    if (options.removeUrl) {  // 이미지 제거 케이스
      chatEditorRef.value.removeImage(options.removeUrl);
    } else if (options.file) {    // 이미지 추가 케이스
      // ImageManagement에서 이미 생성된 tempUrl 사용
      chatEditorRef.value.insertImage(imageUrl, {
        style: `max-width: ${options.width || 400}px; height: ${options.height || 'auto'};`,
        'data-temp-url': 'true'
      });
    }
  } catch (error) {
    console.error('이미지 삽입 중 오류:', error);
  }
};

// 이미지 관리 핸들러
const handleUpload = (files) => {
  uploadStatus.value = '업로드 중...';

  // selectedFiles에 파일 추가
  selectedFiles.value = [
    ...selectedFiles.value,
    ...files
  ];

  uploadStatus.value = '';
};


const handleRemove = (fileId) => {
  const fileToRemove = selectedFiles.value.find(f => f.id === fileId);
  if (fileToRemove) {
    // 임시 URL 제거
    if (fileToRemove.tempUrl) {
      URL.revokeObjectURL(fileToRemove.tempUrl);
    }
    // 목록에서 제거
    selectedFiles.value = selectedFiles.value.filter(f => f.id !== fileId);

    // 본문에서 이미지 제거
    if (fileToRemove.tempUrl) {
      const regex = new RegExp(`<img[^>]*src="${fileToRemove.tempUrl}"[^>]*>`, 'g');
      messageContent.value = messageContent.value.replace(regex, '');
    }
  }
};

// 파일 모달 열기/닫기
const modalImageUrl = ref(null); // 현재 표시할 이미지의 URL

// 모달 열기
const openModal = (url) => {
  console.log('이미지 클릭됨:', url); // 디버깅용
  modalImageUrl.value = url;
};

// 모달 닫기
const closeModal = () => {
  modalImageUrl.value = null;
};

// 이미지 다운로드
const downloadImage = async (url) => {
  try {
    // Axios 요청
    const response = await axios.get(url, {
      responseType: 'blob', // Blob으로 응답 받기
      withCredentials: false, // CORS 문제 방지
    });

    // Blob 데이터 생성
    const blob = response.data; // Axios 응답에서 Blob 데이터는 data에 저장됨
    const downloadUrl = URL.createObjectURL(blob);

    // 다운로드 링크 생성 및 클릭
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = url.split('/').pop(); // URL에서 파일 이름 추출
    link.click();

    // URL 해제
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('이미지 다운로드 실패:', error);
    alert('이미지 다운로드에 실패했습니다.');
  }
};



// 채팅 참가자 목록 모달 열기/닫기
const openParticipantModal = async () => {
  showParticipantModal.value = true;
  searchQuery.value = '';
  currentPage.value = 1;
};

const closeParticipantModal = () => {
  showParticipantModal.value = false;
};

// 채팅방 생성 모달 열기/닫기
const openCreateRoomModal = async() => {
  isCreateRoomModalOpen.value = true;
  searchQuery.value = '';
  currentPage.value = 1;
  selectedUsers.value = [];
  await fetchUsers(); // 사용자 목록 초기화
};

const closeCreateRoomModal = () => {
  isCreateRoomModalOpen.value = false;
  newRoomName.value = '';
  searchedUsers.value = [];
  selectedUsers.value = [];
};


// 채팅방에서의 초대 모달 열기/닫기
const openInviteModal = async() => {
  isInviteModalOpen.value = true;
  currentPage.value = 1;
  searchQuery.value = '';
  await fetchUsers(); // 사용자 목록 초기화
};

const closeInviteModal = () => {
  isInviteModalOpen.value = false;
  inviteSearch.value = '';
  searchedUsers.value = [];
  selectedUsers.value = [];
};

// 새로운 채팅방 생성
const handleCreateRoom = async (roomData) => {
  try {
    const requestData = {
      chatRoomName: roomData.roomName,
      invitedUsers: roomData.selectedUsers.map(user => user.userId)
    };

    const response = await postFetch(`/chat/create`, requestData);

    if (response.status === 201) {
      alert('채팅방이 성공적으로 생성되었습니다.');
      await fetchChatRooms();
      closeCreateRoomModal();
    }
  } catch (error) {
    console.error('채팅방 생성 실패:', error);
    alert('채팅방 생성 중 문제가 발생했습니다.');
  }
};

// 채팅방 나가기
const leaveChatRoom = async () => {

  // 채팅방 나가기 여부 확인
  const confirmLeave = window.confirm('해당 채팅방을 나가시겠습니까?');

  if (!confirmLeave) {
    console.log('채팅방 나가기 취소됨');
    return; // 사용자가 취소를 선택한 경우 함수 종료
  }

  try {
    const response = await delFetch(`/chat/${chatRoomId.value}/leave`);
    console.log('채팅방 나가기 성공:', response.data);

    // 채팅방 나간 후 다른 페이지로 이동
    window.location.href = '/workspace/chat';
  } catch (error) {
    console.error('채팅방 나가기 실패:', error);
    alert('채팅방 나가기 중 오류가 발생했습니다.');
  }
};

// 사용자 목록 가져오기
const fetchUsers = async () => {
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      count: itemsPerPage
    })

    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }

    const response = await getFetch(`/user/list?${params.toString()}`)
    users.value = response.data.data.content.map(user => ({
      userId: user.userCode,
      name: user.userName,
      department: user.deptName
    }))
    totalItems.value = response.data.data.totalElements
  } catch (e) {
    error.value = '사용자 목록을 불러오는데 실패했습니다.'
    console.error('Error fetching users:', e)
  }

}

// 사용자 초대
const handleInviteUsers = async (selectedUsers) => {
  try {
    const userCodes = selectedUsers.map(user => user.userId);
    const response = await postFetch(`/chat/${chatRoomId.value}/invite`, userCodes);

    if (response.status === 200) {
      alert('사용자가 성공적으로 초대되었습니다.');
      isInviteModalOpen.value = false;
    }
  } catch (error) {
    console.error('사용자 초대 실패:', error);
    alert('초대 중 문제가 발생했습니다.');
  }
};

// self 속성을 메세지에 추가
const addSelfToMessages = (msgs) => msgs.map((msg) => ({
  ...msg,
  self: msg.userCode === userCode.value,
}));


// 스크롤 최하단으로 이동
const scrollToBottom = async (smooth = false) => {
  await nextTick();
  const chatBox = document.querySelector(".messages");
  if (chatBox) {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  }
};


// 채팅방 목록 가져오기
const fetchChatRooms = async () => {
  try {
    const response = await getFetch("/chat/rooms");
    console.log("채팅방 목록 테스트");
    chatRooms.value = response.data.data;
    console.log(chatRooms);
    console.log(response.data.data);
    console.log("채팅방 목록 가져오기 확인 후");

    console.log("내 채팅방 목록:", response.data);
  } catch (error) {
    console.error("채팅방 목록 조회 실패:", error);
  }
};


// 채팅방 정보 불러오기
const fetchChatInfo = async (roomId) => {
  try {
    const response = await getFetch(`/chat/${roomId}/details`);
    const data = await response.data.data;
    console.log("채팅방 정보 불러오기 데이터 : ",data);
    participants.value = data.participants;
    messages.value = data.messages;
    console.log("messages 정보 확인 : ", messages.value);

    console.log("채팅방 정보 불러온 뒤 채팅 사용자 정보 조회");
    console.log(participants.value);
    console.log(data.messages);
    // 메시지에 self 속성 추가
    messages.value = addSelfToMessages(data.messages); // 헬퍼 함수 사용

    await scrollToBottom(true);

  }catch (error) {
    console.error("채팅방 정보 조회 실패:", error);
  }
}


// WebSocket 연결
const connectWebSocket = (roomId) => {

  if (stompClient && stompClient.connected) {
    // 기존 연결이 있을 경우 해제
    stompClient.disconnect(() => {
      console.log("Disconnected from WebSocket");
    });
  }

  if (!roomId) {
    console.error("Invalid roomId:", roomId);
    return;
  }

  const socketUrl = `ws://${chatUrl}/chat`;
  stompClient = Stomp.over(() => new WebSocket(socketUrl));

  stompClient.connect(
      { Authorization: `Bearer ${authObjectInfo.accessToken}` },
      () => {
        console.log("Connected to WebSocket");

        stompClient.subscribe(`/sub/chat/${roomId}`, (message) => {
          try {
            const receivedMessage = JSON.parse(message.body);
            console.log(receivedMessage);

            if (receivedMessage.userCode === userCode.value) return;

            // 메시지 시간을 로컬 시간으로 조정 (9시간 추가)
            // const utcDate = new Date(receivedMessage.messageCreatedTime);
            // const adjustedDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000); // 9시간 추가
            // receivedMessage.messageCreatedTime = adjustedDate.toISOString();

            // self 속성 추가
            receivedMessage.self = receivedMessage.userCode === userCode.value;

            messages.value.push(receivedMessage);


            // DOM 업데이트 후 스크롤
            nextTick(() => scrollToBottom(true));

          } catch (error) {
            console.error("Failed to parse message:", error);
          }
        });
      },
      (error) => {
        console.error("WebSocket connection failed:", error);
        alert("WebSocket connection failed. Please try again later.");
      }
  );
};


// 메시지 전송
const sendMessage = async () => {
  if (!stompClient || !stompClient.connected) {
    alert("WebSocket is not connected. Please wait and try again.");
    return;
  }

  if (!messageContent.value.trim() && selectedFiles.value.length === 0) {
    alert("메시지 또는 파일을 입력해야 합니다.");
    return;
  }

  // 파일 업로드
  const uploadedS3Urls = []; // S3에 업로드된 URL들을 추적
  const originalFileNames = []; // 원본 파일명 추적

  try {
    isSubmitting.value = true;
    uploadStatus.value = '저장 중...';

    // 1. 선택된 파일들을 S3에 업로드
    const uploadPromises = selectedFiles.value.map(async (fileInfo) => {
      const formData = new FormData();
      formData.append('image', fileInfo.file);

      try {
        const response = await postFetch('/file/s3/upload', formData);
        const s3Url = response.data.data;
        console.log("파일 업로드시 response 확인")
        console.log(response);
        console.log(response.data);


        uploadedS3Urls.push(s3Url);
        originalFileNames.push(fileInfo.name);


        // tempUrl을 실제 S3 URL로 교체
        // editorContent.value = editorContent.value.replace(
        //     fileInfo.tempUrl,
        //     s3Url
        // );

        return s3Url;
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        throw error;
      }
    });

    // 모든 이미지 업로드 완료 대기
    const s3Urls = await Promise.all(uploadPromises);


    // -------------- S3 업로드 완료

    // 메세지 전송


    // 3. 파일 정보 DB 저장 (원본 파일명 포함)
    if (s3Urls.length > 0) {
      await postFetch('/file/save', {
        imageS3Urls: s3Urls,           // s3 url 배열
        fileUrls: originalFileNames,   // 원본 파일명 배열
        entityType: "CHAT"           // 엔티티 타입
      });
    }

    // 4. 임시 URL 정리
    selectedFiles.value.forEach(file => {
      if (file.tempUrl) {
        URL.revokeObjectURL(file.tempUrl);
      }
    });

    const chatMessage = {
      chatRoomId: chatRoomId.value,
      userCode: userCode.value,
      userName: userName.value,
      messageContent: messageContent.value,
      fileS3Urls: s3Urls,
      messageCreatedTime: new Date().toISOString()
    };

    stompClient.send(`/pub/${chatRoomId.value}`, {}, JSON.stringify(chatMessage));

    // 클라이언트에 self 필드를 추가해 메시지 표시
    messages.value.push({
      ...chatMessage,
      s3PresignedUrls: uploadedS3Urls, // Presigned URL 포함
      self: true, // 클라이언트에서만 사용하는 필드
    });


    // 5. 목록으로 이동
    console.log("파일 저장 완료")



  } catch (error) {
    console.error('저장에 실패했습니다.', error);

    // 에러시 s3에 이미지들 삭제
    if (uploadedS3Urls.length > 0) {
      try {
        await postFetch('/file/s3/uploadList', uploadedS3Urls);
      } catch (deleteError) {
        console.error('S3 이미지 삭제 실패:', deleteError);
      }
    }

    alert('저장에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isSubmitting.value = false;
    uploadStatus.value = '';
  }

  // 입력값 초기화
  messageContent.value = '';
  selectedFiles.value = [];

  await scrollToBottom(true);
};


// 엔터키로 메시지 전송
const handleKeyPress = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

// 채팅방 선택
const selectRoom = async (roomId, roomName) => {

  if (!roomId) return;

  selectedRoomName.value = roomName;
  chatRoomId.value = roomId;

  console.log("Selected room 이름:", selectedRoomName.value);
  console.log("chatRooms ", chatRooms)
  console.log("Selected Room:", roomId);

  // 채팅방 정보 가져오기
  await fetchChatInfo(roomId);

  // WebSocket 연결
  connectWebSocket(roomId);
};


// 컴포넌트 언마운트 시 WebSocket 연결 해제
onBeforeUnmount(() => {
  if (stompClient && stompClient.connected) {
    stompClient.disconnect(() => {
      console.log("Disconnected from WebSocket");
    });
  }
});

onMounted(() => {
  fetchChatRooms();
});
</script>

<template>
  <div class="container-wrapper">
    <div class="content-container">
      <div class="chat-container">
        <!-- 채팅방 목록 -->
        <div class="chat-rooms">
          <div class="chat-rooms-header">
            <h2>채팅방 목록</h2>
            <button class="create-room-btn" @click="openCreateRoomModal">
              + 새 채팅방
            </button>
          </div>

          <!-- 채팅방 목록 -->
          <div class="room-list">
            <div
                v-for="room in chatRooms"
                :key="room.chatRoomId"
                class="room-item"
                :class="{ 'selected': selectedRoomName && selectedRoomName === room.chatRoomName }"
                @click="selectRoom(room.chatRoomId, room.chatRoomName)"
            >
              <div class="room-info">
                <div class="room-name">{{ room.chatRoomName }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 채팅 내용 -->
        <div class="chat-content" v-if="selectedRoomName">
          <div class="chat-header">
            <h3>{{ selectedRoomName }}</h3>
            <button class="participants-btn" @click="openParticipantModal">사용자 목록</button>
            <button class="invite-btn" @click="openInviteModal">+ 사용자 추가</button>
            <button class="leave-btn" @click="leaveChatRoom">채팅방 나가기</button>
          </div>

          <!-- 메시지 영역 -->
          <div class="messages">
            <template v-for="(message, index) in messages" :key="index">
              <!-- 날짜 헤더 -->
              <div v-if="shouldDisplayDateHeader(index)" class="date-header-container">
                <div class="date-header">
                  {{ formatDateHeader(message.messageCreatedTime) }}
                </div>
              </div>

              <!-- 메시지 아이템 -->
              <div :class="['message', message.self ? 'mine' : 'other']">
                <div class="message-content">
                  <div class="sender" v-if="!message.self">
                    {{ message.userName || '알 수 없음' }}
                  </div>
                  <div class="sender" v-else>
                    {{ message.userName }}
                  </div>

                  <div class="bubble" v-if="message.messageContent"
                       v-html="formatMessageContent(message.messageContent)">
                  </div>

                  <!-- 첨부 이미지 -->
                  <div v-if="message.s3PresignedUrls" class="attached-files">
                    <div v-for="image in message.s3PresignedUrls"
                         :key="image"
                         class="file-preview">
                      <img v-if="image"
                           :src="image"
                           alt="미리보기 이미지"
                           class="preview-image"
                           @click="openModal(image)"
                      />
                    </div>
                  </div>

                  <div class="timestamp">
                    {{ formatDate(message.messageCreatedTime) }}
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- 메시지 입력 영역 -->
          <div class="message-input">
            <textarea v-model="messageContent"
                      :disabled="isSubmitting"
                      placeholder="메시지 입력"
                      @keypress="handleKeyPress"
            ></textarea>
            <div v-if="uploadStatus" class="upload-status">
              {{ uploadStatus }}
            </div>
            <button @click="sendMessage">전송</button>
          </div>

          <!-- 파일 첨부 -->
          <chat-image-management
              :selected-files="selectedFiles"
              :image-urls="imageUrls"
              @upload="handleUpload"
              @remove="handleRemove"
              @insert-to-editor="insertImageAtCursor"
              :disabled="isSubmitting"
          />
        </div>
      </div>
    </div>

    <!-- 모달 컴포넌트들 -->
    <ImagePreviewModal
        :is-open="!!modalImageUrl"
        :image-url="modalImageUrl"
        @close="closeModal"
        @download="downloadImage"
    />

    <ParticipantListModal
        :is-open="showParticipantModal"
        :participants="participants"
        :chatRoomId="chatRoomId"
        @close="showParticipantModal = false"
    />

    <InviteUserModal
        :is-open="isInviteModalOpen"
        :participants="participants"
        @close="isInviteModalOpen = false"
        @invite="handleInviteUsers"
    />

    <CreateChatRoomModal
        :is-open="isCreateRoomModalOpen"
        :user-code="userCode"
        @close="isCreateRoomModalOpen = false"
        @create="handleCreateRoom"
    />
  </div>
</template>

<style scoped>
.container-wrapper {
  padding: 2rem;
  background-color: var(--background-color);
  min-height: 100vh;
  width: 100%;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  width: 100%;
}

.chat-container {
  display: flex;
  gap: 2rem;
  height: calc(100vh - 200px);
  width: 100%;
}

/* 채팅방 목록 영역 */
.chat-rooms {
  flex: 0 0 300px;
  border-right: 2px solid #d1d5db;
  overflow-y: auto;
}

.chat-rooms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #d1d5db;
}

.chat-rooms-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.create-room-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-room-btn:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* 채팅방 목록 스타일 */
.room-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 1rem;
}

.room-item {
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  cursor: pointer;
  background-color: #f8fafc;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.room-item:hover {
  background-color: #f1f5f9;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.room-item.selected {
  background-color: #e8f5e9;
  border: 2px solid #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.room-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.925rem;
  letter-spacing: -0.01em;
}

/* 채팅 내용 영역 */
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding-bottom: 1rem;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.chat-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

/* 버튼 스타일 통일 */
.participants-btn,
.invite-btn,
.leave-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.participants-btn {
  background-color: #4CAF50;
  color: white;
  margin-left: auto;
}

.invite-btn {
  background-color: white;
  color: #4CAF50;
  border-color: #4CAF50;
}

.leave-btn {
  background-color: white;
  color: #ef4444;
  border-color: #ef4444;
}

.participants-btn:hover {
  background-color: #45a049;
}

.invite-btn:hover {
  background-color: #f0fdf4;
}

.leave-btn:hover {
  background-color: #fef2f2;
}

/* 메시지 영역 */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background-color: #f9fafb;
}

.message {
  display: flex;
  margin-bottom: 1rem;
}

.message.mine {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
}

.sender {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.bubble {
  background-color: white;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.message.mine .bubble {
  background-color: #4CAF50;
  color: white;
  border: none;
}

/* 입력 영역 */
.message-input {
  padding: 1rem;
  background-color: white;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

textarea {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem;
  resize: none;
  font-size: 0.875rem;
}

textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.message-input button {
  background-color: #4CAF50;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 65px;
}

.message-input button:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.date-header-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}


.date-header {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #e5e7eb;
  border-radius: 1rem;
  font-size: 0.875rem;
  color: #374151;
  font-family: 'Apple SD Gothic Neo', 'Nanum Gothic', sans-serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}


/* 이미지 관련 */
.attached-files {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem; /* 이미지 간 간격 */
  margin-top: 0.5rem;
  justify-content: flex-end; /* 우측 정렬 */
}

.file-preview {
  width: 160px; /* 고정된 너비 */
  height: 160px; /* 고정된 높이로 사각형 */
  overflow: hidden; /* 이미지가 영역을 넘지 않도록 */
  border-radius: 0.375rem; /* 모서리를 살짝 둥글게 */
  background-color: #f3f4f6; /* 이미지 로드 전 배경 색상 */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 부드러운 그림자 추가 */
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 이미지 크기 조정 */
  cursor: pointer; /* 클릭 가능한 느낌 */
  transition: transform 0.2s ease-in-out; /* 호버 시 애니메이션 */
}

.timestamp {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .container-wrapper {
    padding: 1rem;
  }

  .content-container {
    padding: 1rem;
  }

  .chat-container {
    flex-direction: column;
    height: auto;
  }

  .chat-rooms {
    flex: none;
    border-right: none;
    border-bottom: 2px solid #f3f4f6;
    padding-bottom: 1rem;
  }

  .chat-header {
    flex-wrap: wrap;
  }
}
</style>
