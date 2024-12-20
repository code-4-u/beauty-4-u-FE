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
const DeptCode = ref(useAuth.deptCode);
const TeamSpaceName = ref(null);
const userName = ref(useAuth.userName);
const participants = ref([]); // 참여자 목록

let stompClient = null; // WebSocket 클라이언트

const authObjectInfo = {
  userId: useAuth.userCode,
  accessToken: useAuth.accessToken,
  refreshToken: useAuth.refreshToken
};

// 날짜 포맷 함수
const formatDate = (date) => new Date(date).toLocaleString();

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

// 팀스페이스 정보 로드
const loadTeamSpaceDetails = async (teamspaceId, deptCode) => {
  try {
    console.log("loadTeamSpaceDetails called");
    const response = await axios.get(`http://localhost:8080/api/v1/teamspace/${teamspaceId}/details`, {
      params: { deptCode },
      headers: {
        Authorization: `Bearer ${authObjectInfo.accessToken}`
      }
    });

    // 응답 데이터 구조에 맞게 상태 업데이트
    const data = response.data;
    TeamSpaceName.value = data.deptName;
    participants.value = data.participants;
    messages.value = data.messages;

    // 메시지에 self 속성 추가
    messages.value = data.messages.map((msg) => ({
      ...msg,
      self: msg.userCode === userCode.value,
    }));

    console.log("TeamSpace details loaded:", data);
    await scrollToBottom();
  } catch (error) {
    console.error("Failed to load TeamSpace details:", error);
    throw error;
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

            // self 속성 추가
            receivedMessage.self = receivedMessage.userCode === userCode.value;

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
      userName: userName.value,
      messageContent: messageContent.value,
      messageCreatedTime: new Date().toISOString(),
    };

    stompClient.send(`/pub/${teamspaceId.value}`, {}, JSON.stringify(chatMessage));
    // 클라이언트에 self 필드를 추가해 메시지 표시
    messages.value.push({
      ...chatMessage,
      self: true, // 클라이언트에서만 사용하는 필드
    });
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

  // 통합 API 호출
  await loadTeamSpaceDetails(teamspaceId.value, DeptCode.value);
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
    <h1>{{ TeamSpaceName }}</h1>
    <div class="chat-wrapper">
      <!-- 채팅 메시지 리스트 -->
      <div class="message-list" @scroll="handleScroll">
        <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message-item', message.self ? 'self' : 'other']"
        >
          <strong>{{ message.self ? userName : message.userName || '알 수 없음' }}:</strong>
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  border: none;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  position: relative;
}

h1 {
  text-align: center;
  font-size: 1.8em;
  color: #333;
  margin-bottom: 20px;
}

.chat-wrapper {
  display: flex;
  gap: 20px;
}

.message-list {
  flex: 3;
  max-height: 500px;
  overflow-y: auto;
  border: none;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.05);
}

.message-item.self {
  background-color: #007bff;
  color: #fff;
  align-self: flex-end;
}

.message-item.other {
  background-color: #e9ecef;
  align-self: flex-start;
}


.message-item {
  background-color: #e9ecef;
  padding: 15px;
  border-radius: 12px;
  font-size: 0.9em;
  color: #495057;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.message-item strong {
  color: #343a40;
  font-size: 0.95em;
}

.message-item small {
  font-size: 0.8em;
  color: #868e96;
  text-align: right;
}

.participant-list {
  flex: 1;
  border: none;
  background-color: #f1f3f5;
  padding: 15px;
  border-radius: 12px;
  max-height: 500px;
  overflow-y: auto;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.05);
}

.participant-list h2 {
  margin-top: 0;
  font-size: 1.2em;
  text-align: center;
  color: #495057;
  margin-bottom: 15px;
}

.participant-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.participant-list li {
  padding: 10px;
  background-color: #ffffff;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 0.9em;
  color: #495057;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.new-message-alert {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border-radius: 20px;
  cursor: pointer;
  z-index: 1000;
  font-size: 0.9em;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease;
}

.new-message-alert:hover {
  background-color: #0056b3;
}

.message-input {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.message-input input {
  flex: 1;
  padding: 15px;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  font-size: 1em;
  background-color: #ffffff;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-input input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
}

.message-input button {
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  background-color: #007bff;
  color: #fff;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.message-input button:hover {
  background-color: #0056b3;
}
</style>
