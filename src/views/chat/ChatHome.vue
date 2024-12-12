<template>
  <div class="chat-home">
    <h1>팀스페이스 채팅</h1>
    <div v-for="(message, index) in messages" :key="index">
      {{ message.messageContent }} (보낸 사람: {{ message.userCode }})
    </div>
    <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="메시지를 입력하세요"
    />
    <button @click="sendMessage">전송</button>
  </div>
</template>

<script>
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default {
  name: 'ChatHome',
  data() {
    return {
      client: null,
      messages: [],
      newMessage: '',
      teamspaceId: 1, // 실제로는 동적으로 설정
      userCode: 'your-user-code', // 실제 사용자 코드로 대체
      serverUrl: 'http://localhost:8080/chat'
    }
  },
  mounted() {
    this.initializeWebSocket();
  },
  methods: {
    initializeWebSocket() {
      const socket = new SockJS(this.serverUrl);

      this.client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {},
        onConnect: () => {
          console.log('WebSocket 연결 성공');

          // 특정 팀스페이스 채팅 토픽 구독
          this.client.subscribe(`/sub/teamspace/${this.teamspaceId}`, (message) => {
            const receivedMessage = JSON.parse(message.body);
            this.messages.push(receivedMessage);
          });
        },
        onStompError: (frame) => {
          console.error('브로커 연결 오류:', frame);
        },
        onWebSocketError: (error) => {
          console.error('WebSocket 연결 오류:', error);
        }
      });

      // 연결 시작
      this.client.activate();
    },
    sendMessage() {
      if (this.newMessage.trim() && this.client) {
        // 서비스 코드의 DTO 구조에 맞춰 메시지 전송
        this.client.publish({
          destination: `/pub/${this.teamspaceId}`,
          body: JSON.stringify({
            messageContent: this.newMessage,
            userCode: this.userCode
          })
        });

        this.newMessage = '';
      }
    }
  },
  beforeUnmount() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}
</script>

<style scoped>
.chat-home {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
</style>