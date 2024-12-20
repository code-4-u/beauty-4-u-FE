<script setup>
</script>

<template>
  <div class="chat-section">
    <div class="channel-header">
      팀 채팅방
    </div>
    <div class="chat-messages">
      <!-- 채팅 메시지 컴포넌트가 들어갈 자리 -->
    </div>
    <div class="message-input">
      <input type="text" placeholder="메시지를 입력하세요...">
    </div>
  </div>
</template>

<style scoped>
.channel-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  font-weight: bold;
  background-color: #ffffff;
}

.chat-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: #ffffff;
}

.message-input {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background-color: #ffffff;
}

.message-input input {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
}
</style>