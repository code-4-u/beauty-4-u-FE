<script setup>
import { Stomp } from '@stomp/stompjs';
import { ref, computed, onMounted, onBeforeUnmount, nextTick  } from 'vue';
import { getFetch, postFetch } from "@/stores/apiClient.js"
import { useAuthStore } from '@/stores/auth.js';
import ImageManagement from "@/components/board/editor/ImageManagement.vue";

const chatUrl = import.meta.env.VITE_API_CHAT_URL;

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


// 검색어와 페이징 상태 관리
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const totalItems = ref(0)

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


// 채팅 참가자 모달 열기/닫기
const openParticipantModal = () => {
  showParticipantModal.value = true;
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
const createNewRoom = async() => {
  if (!newRoomName.value.trim()) {
    alert("채팅방 이름을 입력해주세요.");
    return;
  }

  try {
    console.log(selectedUsers.value);

    // 사용자 ID 배열로 변환
    const userCodes = selectedUsers.value.map(user => user.userId);
    console.log(userCodes);

    // 요청 데이터 구성
    const requestData = {
      chatRoomName: newRoomName.value.trim(), // 채팅방 이름
      invitedUsers: userCodes // 초대된 사용자 ID 리스트
    };

    const response = await postFetch(`/chat/create`,
        requestData
    );

    // 채팅방 생성시 응답 정보 추가

    if (response.status === 200) {
      alert('채팅방이 성공적으로 생성되었습니다.');
    }
  } catch (error) {
    console.error('채팅방 생성 실패:', error);
    alert('채팅방 생성 중 문제가 발생했습니다.');
  }

  closeCreateRoomModal();
  window.location.reload(); // 현재 페이지 새로고침
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
const inviteUsers = async () => {
  if (selectedUsers.value.length === 0) {
    alert('초대할 사용자를 선택해주세요.');
    return;
  }
  try {
    console.log("사용자 초대 로그");
    console.log(chatRoomId.value);
    console.log(selectedUsers.value);

    // 사용자 ID 배열로 변환
    const userCodes = selectedUsers.value.map(user => user.userId);
    console.log(userCodes);

    const response = await postFetch(`/chat/${chatRoomId.value}/invite`,
        userCodes
    );
    if (response.status === 200) {
      alert('사용자가 성공적으로 초대되었습니다.');
      closeInviteModal();
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
            const utcDate = new Date(receivedMessage.messageCreatedTime);
            const adjustedDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000); // 9시간 추가
            receivedMessage.messageCreatedTime = adjustedDate.toISOString();

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

  if (!messageContent.value.trim() && !isSubmitting.value) return;

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

  // then(() => {
  //   if (chatRooms.value.length > 0) {
  //     selectRoom(chatRooms.value[0]);
  //   }
  // });
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
<!--                <div class="last-message">{{ room.lastMessage }}</div>-->
              </div>
<!--              <div class="room-meta">-->
<!--                <div class="timestamp">{{ room.timestamp }}</div>-->
<!--                <div v-if="room.unreadCount > 0" class="unread-count">-->
<!--                  {{ room.unreadCount }}-->
<!--                </div>-->
<!--              </div>-->
            </div>
          </div>
        </div>

        <!-- 채팅 내용 -->
        <div class="chat-content" v-if="selectedRoomName">
          <div class="chat-header">
              <h3>{{ selectedRoomName }}</h3>
            <button class="participants-btn" @click="openParticipantModal">사용자 목록</button>
            <button class="invite-btn" @click="openInviteModal">+ 사용자 추가</button>
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
                  <div class="bubble">{{ message.messageContent }}</div>
                  <!-- 메시지 전송 시간 -->
                  <div class="timestamp">{{ formatDate(message.messageCreatedTime) }}</div>
                </div>

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
                        @click="openModal(image)"/>
<!--                        @load="handleImageLoad(index, image)"-->
<!--                        @error="handleImageError(index, image)"-->
<!--                    />image-->

                    <!-- 이미지 모달 -->
                    <div v-if="modalImageUrl" class="modal-backdrop" @click="closeModal">
                      <div class="modal-content">
                        <!-- 닫기 버튼 -->
                        <span class="close" @click="closeModal">&times;</span>

                        <!-- 확대 이미지 -->
                        <img :src="modalImageUrl" alt="확대 이미지" class="modal-image" />

                        <!-- 다운로드 버튼 -->
                        <div class="modal-footer">
                          <button class="download-button" @click="downloadImage(modalImageUrl)">이미지 다운로드</button>
                        </div>
                      </div>
                    </div>


                    <!-- 다운로드 버튼 -->
<!--                    <a :href="url" target="_blank" download class="download-button">-->
<!--                      다운로드-->
<!--                    </a>-->
<!--                    <button @click="openFile(url)">다운로드</button>-->
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

            <!-- 파일 첨부 -->

            <image-management
                :selected-files="selectedFiles"
                :image-urls="imageUrls"
                @upload="handleUpload"
                @remove="handleRemove"
                @insert-to-editor="insertImageAtCursor"
                :disabled="isSubmitting"
            />


            <div v-if="uploadStatus" class="upload-status">
              {{ uploadStatus }}
            </div>


            <button @click="sendMessage">전송</button>
          </div>

        </div>


      </div>
    </div>

    <!-- 채팅방 사용자 모달 -->
    <div v-if="showParticipantModal" class="modal-backdrop">
      <div class="modal-content">
        <div class="modal-header">
          <h3>채팅방 사용자 목록</h3>
          <button class="close-button" @click="closeParticipantModal">✕</button>
        </div>
        <div class="modal-body">
          <ul class="participants-list">
            <li
                v-for="participant in participants"
                :key="participant.userCode"
            >
              {{ participant.userName || "이름 없음" }}
              ({{ participant.deptName }}, {{ participant.email }})
            </li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="close-btn" @click="closeParticipantModal">닫기</button>
        </div>
      </div>
    </div>


    <!-- 채팅방에서의 사용자 초대 모달 -->
    <div v-if="isInviteModalOpen" class="modal-backdrop">
      <div class="modal-content">
        <div class="modal-header">
          <h3>사용자 초대</h3>
          <button class="close-button" @click="closeInviteModal">✕</button>
        </div>

        <!-- 검색 섹션 -->
        <div class="search-box">
          <input
              v-model="searchQuery"
              type="text"
              placeholder="사용자 검색"
              @input="handleSearch"
          />
        </div>

        <!-- 사용자 목록 -->
        <ul class="user-list">
          <li
              v-for="user in users"
              :key="user.userId"
              @click="!isDisabled(user) ? toggleUserSelection(user) : null"
              :class="{ selected: selectedUsers.includes(user), disabled: isDisabled(user) }"
          >
            {{ user.name }} ({{ user.department }})
          </li>
        </ul>

        <!-- 페이지네이션 -->
        <div class="pagination">
          <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
            이전
          </button>
          <button
              v-for="page in totalPages"
              :key="page"
              @click="changePage(page)"
              :class="{ active: currentPage === page }"
          >
            {{ page }}
          </button>
          <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
          >
            다음
          </button>
        </div>

        <!-- 모달 푸터 -->
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeInviteModal">취소</button>
          <button class="invite-btn" @click="inviteUsers">초대</button>
        </div>
      </div>
    </div>



    <!-- 새 채팅방 모달 -->
    <div v-if="isCreateRoomModalOpen" class="modal-backdrop">
      <div class="modal-content">
        <div class="modal-header">
          <h3>새 채팅방 추가</h3>
          <button class="close-button" @click="closeCreateRoomModal">✕</button>
        </div>

        <input
            class="modal-input"
            v-model="newRoomName"
            placeholder="채팅방 이름 입력"
            type="text"
        />

        <!-- 검색 섹션 -->
        <div class="search-box">
          <input
              v-model="searchQuery"
              type="text"
              placeholder="사용자 검색"
              @input="handleSearch"
          />
        </div>



        <!-- 사용자 목록 -->
        <ul class="user-list">
          <li
              v-for="user in users"
              :key="user.userId"
              @click="user.userId !== userCode ? toggleUserSelection(user) : null"
              :class="{ selected: selectedUsers.includes(user), disabled: user.userId === userCode }"
          >
            {{ user.name }} ({{ user.department }})
          </li>
        </ul>

        <!-- 페이지네이션 -->
        <div class="pagination">
          <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
            이전
          </button>
          <button
              v-for="page in totalPages"
              :key="page"
              @click="changePage(page)"
              :class="{ active: currentPage === page }"
          >
            {{ page }}
          </button>
          <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
          >
            다음
          </button>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="closeCreateRoomModal">취소</button>
          <button class="create-btn" @click="createNewRoom">생성</button>
        </div>
      </div>
    </div>


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

.room-list {
  margin-top: 16px;
}

.room-item {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  margin: 0 8px 8px 8px;
  transition: all 0.2s ease;
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

.last-message {
  color: #718096;
  font-size: 0.95em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.room-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.timestamp {
  font-size: 0.85em;
  color: #a0aec0;
}

.unread-count {
  background-color: #4299e1;
  color: white;
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 0.85em;
  min-width: 24px;
  text-align: center;
  font-weight: 500;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  min-width: 0;
}

.chat-header {
  display: flex; /* Flexbox 레이아웃 활성화 */
  justify-content: space-between; /* 좌우 요소 간격을 최대화 */
  padding: 8px;
  border-bottom: 1px solid #edf2f7;
}

.chat-header h3 {
  font-size: 1.25rem;
  color: #2d3748;
  font-weight: 600;
  margin: 0;
}

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

.message.mine {
  justify-content: flex-end;
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

.message-input {
  padding: 20px;
  border-top: 1px solid #edf2f7;
  display: flex;
  gap: 12px;
  background-color: #ffffff;
  border-radius: 0 0 12px 12px;
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

button {
  background-color: #4299e1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.2s ease;
}

button:hover {
  background-color: #3182ce;
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.invite-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.invite-btn:hover {
  background-color: #3182ce;
}

/* 모달 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: whitesmoke;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.user-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.user-list li {
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-list li.selected {
  background-color: #4299e1;
  color: white;
}

.user-list li.disabled {
  color: gray;
  cursor: not-allowed;
  opacity: 0.6;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.participants-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.participants-btn:hover {
  background-color: #45a049;
}

.participants-list {
  list-style: none;
  padding: 0;
}

.participants-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f1f1;
}


.close-btn {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.close-btn:hover {
  background-color: #d32f2f;
}

.participants-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.participants-btn:hover {
  background-color: #45a049;
}

/* 모달 스타일 */

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  padding: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ccc;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.modal-image {
  max-width: 100%; /* 이미지 크기 조정 */
  height: auto; /* 비율 유지 */
  border-radius: 8px; /* 선택사항 */
  margin-bottom: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal-body {
  max-height: 400px;
  overflow-y: auto;
}


.participants-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.participants-list li {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.participants-list li:last-child {
  border-bottom: none;
}

.close-btn {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.close-btn:hover {
  background-color: #d32f2f;
}

/* 날짜 헤더 */
.date-header {
  text-align: center;
  margin: 10px auto; /* 위, 아래 여백과 가운데 정렬 */
  font-size: 0.9em;
  color: #495057;
  font-weight: bold;
  background-color: #f1f3f5;
  padding: 4px 12px;
  border-radius: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 채팅방 */
.room-list {
  padding: 0;
  margin: 0;
}

.room-item {
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.room-item:hover {
  background-color: #f4f4f4;
  transform: translateY(-2px);
}

.room-item.selected {
  background-color: #4299e1; /* 선택된 채팅방의 배경색 */
  color: white; /* 선택된 채팅방의 텍스트 색 */
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 파일 미리보기 이미지 스타일 */
.preview-image {
  max-width: 100%; /* 부모 요소 너비에 맞게 크기 제한 */
  max-height: 300px; /* 최대 높이 제한 */
  object-fit: contain; /* 이미지가 잘리지 않게 조정 */
  cursor: pointer; /* 클릭 가능한 이미지처럼 보이도록 설정 */
  transition: transform 0.2s ease-in-out; /* 확대 효과 */
}

.preview-image:hover {
  transform: scale(1.05); /* 호버 시 살짝 확대 */
}


.close {
  position: absolute;
  top: 10px;
  right: 20px;
  color: white;
  font-size: 30px;
  font-weight: bold;
  cursor: pointer;
}

/* 파일 다운로드 버튼 */
.download-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease-in-out;
}

.download-button:hover {
  background-color: #0056b3;
}

</style>
