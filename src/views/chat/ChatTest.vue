<script setup>
import { Stomp } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "@/stores/auth.js";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

// Pinia 스토어 사용
const authStore = useAuthStore();
const userCode = ref(authStore.userCode);

const messages = ref([]); // 수신된 메시지 리스트
const messageContent = ref(""); // 입력된 메시지 내용

const teamspaceId = ref(null);
let stompClient = ref(null); // WebSocket 클라이언트를 일반 변수로 선언

const route = useRoute(); // 현재 라우트 정보 가져오기

// WebSocket 연결
const connectWebSocket = () => {
  const socket = new SockJS("http://localhost:8080/chat"); // 절대 경로로 설정
  console.log("연결됨?1");
  stompClient = Stomp.over(socket); // Stomp 클라이언트 생성
  console.log(stompClient);

  stompClient.debug = function(str) {
    console.log('STOMP debug:', str);
  };

  console.log("Attempting WebSocket connection...");
  stompClient.connect(
      {},
      () => {
        console.log("Connected to WebSocket");
        console.log(`Teamspace ID: ${teamspaceId.value}`);

        stompClient.subscribe(`/sub/teamspace/${teamspaceId.value}`, (message) => {
          try {
            const chatMessage = JSON.parse(message.body);
            console.log("Raw message received:", message.body);
            messages.value.push(chatMessage);
          } catch (error) {
            console.error("Failed to parse message:", error, message.body);
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
const sendMessage = () => {
  if (!stompClient || !stompClient.connected) {
    alert("WebSocket is not connected. Please wait and try again.");
    return;
  }

  if (messageContent.value.trim() !== "") {
    const chatMessage = {
      // userCode: userCode.value,
      messageContent: messageContent.value,
    };

    stompClient.send(
        `/pub/${teamspaceId.value}`,
        {},
        JSON.stringify(chatMessage)
    );

    messages.value.push(chatMessage);
    messageContent.value = "";
  }
};

// Vue Lifecycle Hooks
onMounted(() => {
  const id = route.params.teamspaceId;
  if (!id) {
    console.error("Teamspace ID is missing in the route parameters.");
    alert("Invalid Teamspace ID.");
    return;
  }

  teamspaceId.value = id;
  console.log(`Teamspace ID: ${teamspaceId.value}`);
  connectWebSocket();

  onBeforeUnmount(() => {
    if (stompClient) {
      stompClient.disconnect(() => {
        console.log("Disconnected from WebSocket");
      });
      stompClient = null; // 연결 해제 후 초기화
    }
  });

});


</script>

<template>
  <div class="chat-container">
    <h1>Teamspace Chat</h1>

    <!-- 메시지 리스트 -->
    <div class="message-list">
      <div
          v-for="(message, index) in messages"
          :key="index"
          class="message-item"
      >
        <strong>{{ message.userCode }}:</strong> {{ message.messageContent }}
      </div>
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
}

.message-item {
  margin-bottom: 10px;
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
