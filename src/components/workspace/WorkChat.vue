<script setup>
import { Stomp } from '@stomp/stompjs';
import { ref, computed, onMounted, onBeforeUnmount, nextTick  } from 'vue';
import {delFetch, getFetch, postFetch} from "@/stores/apiClient.js"
import { useAuthStore } from '@/stores/auth.js';
import ChatImageManagement from "@/components/teamspace/ChatImageManagement.vue";
import CreateChatRoomModal from './CreateChatRoomModal.vue';
import InviteUserModal from './InviteUserModal.vue';
import ParticipantListModal from './ParticipantListModal.vue';

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

const openFile = (url) => {
  window.open(url, "_blank");
};

// URL이 이미지인지 확인
const isImage = (url) => {
  const cleanUrl = url.split('?')[0]; // 쿼리 매개변수 제거
  return /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(cleanUrl);
};


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



// 디버그용
// 이미지 로드 핸들러
const handleImageLoad = (index, url) => {
  console.log(`이미지 로드 성공: 메시지 ${index}, URL: ${url}`);
};

// 이미지 에러 핸들러
const handleImageError = (index, url) => {
  console.error(`이미지 로드 실패: 메시지 ${index}, URL: ${url}`);
  messages[index].imageLoadError = true; // 반응성 유지
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


// 총 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage)
})

// 채팅방 유저 총 페이지 수 계산
const chatUserTotalPages = computed(() => {
  return Math.ceil(filteredParticipants.value.length / itemsPerPage)
})

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
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) throw new Error('다운로드 실패');
    const blob = await response.blob(); // 파일 데이터를 Blob으로 변환
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = url.split('/').pop(); // 파일 이름 추출
    link.click();
    URL.revokeObjectURL(downloadUrl); // URL 해제
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

// 참가자를 Set으로 변환
const invitedUserSet = computed(() => new Set(participants.value.map((user) => user.userCode)));

const isDisabled = (user) => {
  // 본인 또는 이미 초대된 사용자라면 비활성화
  return invitedUserSet.value.has(user.userId); // Set으로 빠르게 탐색
};


// 새로운 채팅방 생성
const handleCreateRoom = async (roomData) => {
  try {
    const requestData = {
      chatRoomName: roomData.roomName,
      invitedUsers: roomData.selectedUsers.map(user => user.userId)
    };

    const response = await postFetch(`/chat/create`, requestData);

    if (response.status === 200) {
      alert('채팅방이 성공적으로 생성되었습니다.');
      window.location.reload();
    }
  } catch (error) {
    console.error('채팅방 생성 실패:', error);
    alert('채팅방 생성 중 문제가 발생했습니다.');
  }
};

// 채팅방 나가기
const leaveChatRoom = async () => {
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


// 사용자 선택/해제
const toggleUserSelection = (user) => {

  if (user.userId === userCode.value) {
    // 본인은 선택할 수 없음
    return;
  }

  console.log(selectedUsers);
  const index = selectedUsers.value.findIndex(u => u.userId === user.userId);
  if (index === -1) {
    selectedUsers.value.push(user);
  } else {
    selectedUsers.value.splice(index, 1);
  }
};

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

// 페이지 변경
const changePage = async (page) => {
  currentPage.value = page;
  await fetchUsers();
};

// 검색
const handleSearch = async () => {
  currentPage.value = 1;
  await fetchUsers();
};

// 사용자 목록 검색




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

  const socketUrl = `wss://${chatUrl}/chat`;
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
            <h2>채팅 목록</h2>
            <button class="create-room-btn" @click="openCreateRoomModal">
              + 새 채팅방
            </button>
          </div>

          <!-- 왼쪽 사이드바 채팅방 정보 -->
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

          <div class="messages">
            <template v-for="(message, index) in messages" :key="index">
              <!-- 날짜 헤더 -->
              <div v-if="shouldDisplayDateHeader(index)" class="date-header">
                {{ formatDateHeader(message.messageCreatedTime) }}
              </div>

              <!-- 메시지 아이템 -->
              <div
                  :class="['message', message.self ? 'mine' : 'other']"
              >
                <div class="message-content">
                  <!-- 메시지 보낸 사람 이름 -->
                  <div class="sender" v-if="!message.self">
                    {{ message.userName || '알 수 없음' }}
                  </div>
                  <div class="sender" v-else>
                    {{ message.userName }}
                  </div>

                  <!-- 메시지 내용 -->
                  <div
                      class="bubble"
                      v-if="message.messageContent"
                      v-html="formatMessageContent(message.messageContent)"
                  ></div>

                <div v-if="message.s3PresignedUrls" class="attached-files">
                  <div
                      v-for="image in message.s3PresignedUrls"
                      :key="image"
                      class="file-preview"
                  >
                    <!-- 이미지 미리보기 -->
                    <img
                        v-if="image"
                        :src="image"
                        alt="미리보기 이미지"
                        class="preview-image"
                        @click="openModal(image)"
                    />
                  </div>

                  <!-- 이미지 모달 -->
                  <div v-if="modalImageUrl" class="modal-backdrop-image" @click="closeModal">
                    <div class="modal-content">
                      <!-- 닫기 버튼 -->
                      <span class="close" @click="closeModal">&times;</span>

                      <!-- 확대 이미지 -->
                      <img :src="modalImageUrl" alt="확대 이미지" class="modal-image"/>

                      <!-- 다운로드 버튼 -->
                      <div class="modal-footer">
                        <button class="download-button" @click="downloadImage(modalImageUrl)">이미지 다운로드</button>
                      </div>
                    </div>
                  </div>

                  <!-- 메시지 전송 시간 -->
                  <div class="timestamp">{{ formatDate(message.messageCreatedTime) }}</div>

                  </div>
                </div>


              </div>
            </template>
          </div>


          <div class="message-input">
            <textarea
                v-model="messageContent"
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

    <ParticipantListModal
        :is-open="showParticipantModal"
        :participants="participants"
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
  padding: 12px;
  background-color: var(--background-color);
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 12px;
  width: 100%;
}

.chat-container {
  display: flex;
  gap: 12px;
  height: calc(100vh - 150px);
  width: 100%;
  overflow: hidden;
}

/* 채팅방 목록 영역 */
.chat-rooms {
  flex: 0 0 280px;
  border-right: 1px solid #edf2f7;
  overflow-y: auto;
  min-width: 200px;
}

.chat-rooms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  margin-bottom: 1.5rem;
}

.chat-rooms-header h2 {
  font-size: 1.5rem;
  color: #2d3748;
  margin: 0;
}

.create-room-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-room-btn:hover {
  background-color: #3182ce;
}

/* 채팅방 목록 스타일 */
.room-list {
  margin-top: 16px;
  padding: 0;
  margin: 0;
}

.room-item {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  margin: 0 8px 8px 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.room-item:hover {
  background-color: #f8fafc;
  transform: translateY(-1px);
}

.room-item.selected {
  background-color: #ebf8ff;
  border: 1px solid #bee3f8;
}

.room-info {
  flex: 1;
}

.room-name {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 6px;
}

/* 채팅 내용 영역 */
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid #edf2f7;
}

.chat-header h3 {
  font-size: 1.25rem;
  color: #2d3748;
  font-weight: 600;
  margin: 0;
}

/* 메시지 목록 영역 */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  display: flex;
  margin-bottom: 4px;
}

.message-content {
  max-width: 70%;
}

.sender {
  font-size: 0.9em;
  margin-bottom: 6px;
  color: #718096;
  font-weight: 500;
}

.bubble {
  background-color: #f7fafc;
  padding: 12px 16px;
  border-radius: 16px;
  border-top-left-radius: 4px;
  margin-bottom: 4px;
  color: #2d3748;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  line-height: 1.5;
}

.message.mine .bubble {
  background-color: #4299e1;
  color: white;
  border-top-right-radius: 4px;
  border-top-left-radius: 16px;
}

/* 메시지 입력 영역 */
.message-input {
  padding: 20px;
  border-top: 1px solid #edf2f7;
  display: flex;
  gap: 12px;
  background-color: #ffffff;
  border-radius: 0 0 12px 12px;
}

.message-input button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  box-shadow: 0 2px 4px rgba(66, 153, 225, 0.2);
}

.message-input button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(66, 153, 225, 0.3);
  background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
}

.message-input button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(66, 153, 225, 0.2);
}

.message-input button:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

textarea {
  flex: 1;
  border: 2px solid #edf2f7;
  border-radius: 12px;
  padding: 12px 16px;
  resize: none;
  height: 60px;
  font-size: 1rem;
  color: #2d3748;
  transition: border-color 0.2s ease;
}

textarea:focus {
  outline: none;
  border-color: #4299e1;
}

textarea::placeholder {
  color: #a0aec0;
}

/* 헤더 버튼 스타일 */
.participants-btn, .invite-btn, .leave-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: -5px;
}

.participants-btn {
  background-color: #4caf50;
  margin-left: auto;
}

.invite-btn {
  background-color: #4299e1;
}

.leave-btn {
  background-color: #f44336;
}

.participants-btn:hover {
  background-color: #45a049;
}

.invite-btn:hover {
  background-color: #3182ce;
}

.leave-btn:hover {
  background-color: #d32f2f;
}

/* 첨부 파일 관련 스타일 */
.attached-files {
  flex-wrap: wrap;
  gap: 10px;
}

.preview-image {
  max-width: 300px;
  max-height: 200px;
  object-fit: contain;
  cursor: pointer;
  margin: 2px;
  border: 2px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

/* 날짜 표시 */
.date-header {
  text-align: center;
  margin: 10px auto;
  font-size: 0.9em;
  color: #495057;
  font-weight: bold;
  background-color: #f1f3f5;
  padding: 4px 12px;
  border-radius: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.timestamp {
  font-size: 0.85em;
  color: #a0aec0;
}

/* 이미지 모달 관련 */
.modal-backdrop-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 900px;
  height: auto;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  position: relative;
}

.modal-image {
  max-width: 100%;
  max-height: calc(90vh - 100px);
  height: auto;
  object-fit: contain;
  border-radius: 4px;
}

.download-button {
  background-color: #4299e1;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease-in-out;
}

.download-button:hover {
  background-color: #3182ce;
}

.close {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  color: #4a5568;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 1;
}

.modal-footer {
  padding: 1rem 0 0;
  display: flex;
  justify-content: center;
}
</style>
