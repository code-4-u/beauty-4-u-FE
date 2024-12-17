<script setup>
import { Stomp } from "@stomp/stompjs";
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import axios from "axios";

// 상태 변수
const messages = ref([]); // 메시지 리스트
const messageContent = ref(""); // 입력된 메시지
const teamspaceId = ref(null);
const useAuth = useAuthStore();
const userCode = ref(useAuth.userCode); // 현재 사용자 코드
const autoScrollEnabled = ref(true); // 자동 스크롤 활성화 여부
const newMessage = ref(null); // 새 메시지 알림
const DeptCode = ref(null);
const participants = ref([]); // 참여자 목록

let stompClient = null; // WebSocket 클라이언트

const authObjectInfo = {
  userId: useAuth.userCode,
  accessToken: useAuth.accessToken,
  refreshToken: useAuth.refreshToken
};

// 날짜 포맷 함수
const formatDate = (date) => new Date(date).toLocaleString();

// 부서 코드 찾기
const getTeamSpaceDeptCode = async (teamspaceId) => {
  try {
    const response = await axios.get(
        `http://localhost:8080/api/vi/teamspace/${teamspaceId}/dept`,
        {
          headers: {
            Authorization: `Bearer ${authObjectInfo.accessToken}`
          }
        }
    );
    console.log("TeamSpace DeptCode:", response.data);
    return response.data; // 서버에서 반환된 데이터를 리턴
  } catch (error) {
    console.error("Failed to fetch TeamSpace deptCode:", error);
    throw error; // 에러를 호출한 곳으로 전달
  }
};

// 스크롤 최하단으로 이동
const scrollToBottom = async (smooth = false) => {
  await nextTick();
  const chatBox = document.querySelector(".message-list");
  if (chatBox) {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  }
};

// 새 메시지 알림 클릭
const handleNewMessageClick = async () => {
  newMessage.value = null; // 알림 제거
  await nextTick(); // DOM 업데이트 후 실행
  await scrollToBottom(true); // 스크롤 맨 아래로 이동
};

// 스크롤 상태 감지
const handleScroll = () => {
  const chatBox = document.querySelector(".message-list");
  if (!chatBox) return;

  autoScrollEnabled.value =
      chatBox.scrollHeight - chatBox.scrollTop <= chatBox.clientHeight + 10;

  if (autoScrollEnabled.value) {
    newMessage.value = null;
  }
};

// 채팅 참여자 로드
const loadTeamSpaceUsersByDeptCode = async (deptCode) => {
  try {
    const response = await axios.get("http://localhost:8080/api/vi/teamspace/users", {
      params: { deptCode },
      headers: {
        Authorization: `Bearer ${authObjectInfo.accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch TeamSpace users:", error);
    throw error;
  }
};

// 채팅 메시지 로드
const loadChatMessages = async () => {
  try {
    const response = await axios.get(
        `http://localhost:8080/api/vi/teamspace/${teamspaceId.value}`,
        {
          headers: {
            Authorization: `Bearer ${authObjectInfo.accessToken}`
          }
        }
    );
    console.log("Loaded chat messages:", response.data);

    messages.value = response.data.flat();
    await scrollToBottom();
  } catch (error) {
    console.error("Failed to load chat messages:", error);
  }
};

// WebSocket 연결
const connectWebSocket = () => {
  const socketUrl = "ws://localhost:8080/chat";
  stompClient = Stomp.over(() => new WebSocket(socketUrl));

  stompClient.connect(
      { Authorization: `Bearer ${authObjectInfo.accessToken}` },
      () => {
        console.log("Connected to WebSocket");

        stompClient.subscribe(`/sub/teamspace/${teamspaceId.value}`, (message) => {
          try {
            const receivedMessage = JSON.parse(message.body);
            if (receivedMessage.userCode === userCode.value) return;

            messages.value.push(receivedMessage);

            if (autoScrollEnabled.value) {
              scrollToBottom(true);
            } else {
              newMessage.value = receivedMessage;
            }
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

  if (messageContent.value.trim()) {
    const chatMessage = {
      userCode: userCode.value,
      messageContent: messageContent.value,
      messageCreatedTime: new Date().toISOString()
    };

    stompClient.send(`/pub/${teamspaceId.value}`, {}, JSON.stringify(chatMessage));
    messages.value.push(chatMessage);
    messageContent.value = "";
    await scrollToBottom(true);
  }
};

// Lifecycle Hooks
const route = useRoute();

onMounted(async () => {
  const id = route.params.teamspaceId;
  if (!id) {
    console.error("Teamspace ID is missing.");
    alert("Invalid Teamspace ID.");
    return;
  }

  teamspaceId.value = id;
  DeptCode.value = await getTeamSpaceDeptCode(teamspaceId.value);

  participants.value = await loadTeamSpaceUsersByDeptCode(DeptCode.value);
  console.log("Participants:", participants.value);

  await loadChatMessages();
  connectWebSocket();
});

onBeforeUnmount(() => {
  if (stompClient) {
    stompClient.disconnect();
    stompClient = null;
  }
});
</script>

<template>

  <div class="chat-container">
    <h1>Teamspace Chat</h1>
    <div class="chat-wrapper">
      <!-- 채팅 메시지 리스트 -->
      <div class="message-list" @scroll="handleScroll">
        <div v-for="(message, index) in messages" :key="index" class="message-item">
          <strong>{{ message.userCode === userCode ? "나" : message.userCode || "Unknown" }}:</strong>
          {{ message.messageContent }}
          <small>({{ formatDate(message.messageCreatedTime) }})</small>
        </div>
      </div>

      <!-- 참여자 목록 -->
      <div class="participant-list">
        <h2>참여자</h2>
        <ul>
          <li v-for="(participant, index) in participants" :key="index">
            {{ participant.userName }}
          </li>
        </ul>
      </div>
    </div>

    <!-- 새 메시지 알림 -->
    <div v-if="newMessage" class="new-message-alert" @click="handleNewMessageClick">
      새 메시지: {{ newMessage.messageContent }}
    </div>

    <!-- 메시지 입력창 -->
    <div class="message-input">
      <input
          v-model="messageContent"
          @keyup.enter="sendMessage"
          placeholder="Type your message..."
      />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  position: relative;
}

/* 채팅 참여자 */
.chat-wrapper {
  display: flex;
  gap: 20px;
}

.message-list {
  flex: 3; /* 채팅 내역이 더 넓게 표시되도록 설정 */
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
}

.participant-list {
  flex: 1; /* 참여자 목록 비율 */
  border: 1px solid #ccc;
  background-color: #f1f1f1;
  padding: 10px;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.participant-list h2 {
  margin-top: 0;
  font-size: 1.2em;
  text-align: center;
}

.participant-list ul {
  list-style: none;
  padding: 0;
}

.participant-list li {
  padding: 5px 0;
  border-bottom: 1px solid #ddd;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.message-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 4px;
  position: relative;
}

.message-item {
  margin-bottom: 10px;
}

.new-message-alert {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border-radius: 20px;
  cursor: pointer;
  z-index: 1000;
}

.new-message-alert:hover {
  background-color: #0056b3;
}

.message-input {
  display: flex;
  gap: 10px;
}

input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>