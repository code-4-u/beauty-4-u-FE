<script setup>
import { ref, onMounted } from 'vue';
import CreateChatModal from "@/components/workspace/CreateChatModal.vue";

// 상태 관리
const isCreateRoomModalOpen = ref(false);
const newRoomName = ref('');

const chatRooms = ref([
  { id: 1, name: '채팅방 1', lastMessage: '안녕하세요', unreadCount: 2, timestamp: '14:30' },
  { id: 2, name: '채팅방 2', lastMessage: '네 알겠습니다', unreadCount: 0, timestamp: '12:15' },
  { id: 3, name: '채팅방 3', lastMessage: '확인했습니다', unreadCount: 5, timestamp: '어제' },
]);

const messages = ref([
  { id: 1, sender: 'user1', content: '안녕하세요!', timestamp: '14:25', isMine: false },
  { id: 2, sender: '나', content: '네, 안녕하세요!', timestamp: '14:26', isMine: true },
  { id: 3, sender: 'user1', content: '오늘 회의 몇시인가요?', timestamp: '14:27', isMine: false },
  { id: 4, sender: '나', content: '2시입니다!', timestamp: '14:28', isMine: true },
]);

const selectedRoom = ref(null);
const newMessage = ref('');

// 채팅방 생성 모달 열기/닫기
const openCreateRoomModal = () => {
  isCreateRoomModalOpen.value = true;
};

const closeCreateRoomModal = () => {
  isCreateRoomModalOpen.value = false;
  newRoomName.value = '';
};

// 새로운 채팅방 생성
const createNewRoom = () => {
  if (!newRoomName.value.trim()) return;

  const newRoom = {
    id: chatRooms.value.length + 1,
    name: newRoomName.value,
    lastMessage: '',
    unreadCount: 0,
    timestamp: '방금'
  };

  chatRooms.value.unshift(newRoom);
  closeCreateRoomModal();
  selectRoom(newRoom);
};

// 채팅방 선택
const selectRoom = (room) => {
  selectedRoom.value = room;
};

// 메시지 전송
const sendMessage = () => {
  if (!newMessage.value.trim()) return;

  messages.value.push({
    id: messages.value.length + 1,
    sender: '나',
    content: newMessage.value,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isMine: true
  });

  newMessage.value = '';
};

// 엔터키로 메시지 전송
const handleKeyPress = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

onMounted(() => {
  // 초기 채팅방 선택
  if (chatRooms.value.length > 0) {
    selectRoom(chatRooms.value[0]);
  }
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

          <CreateChatModal
              v-model:isOpen="isCreateRoomModalOpen"
          />

          <div class="room-list">
            <div
                v-for="room in chatRooms"
                :key="room.id"
                class="room-item"
                :class="{ 'selected': selectedRoom && selectedRoom.id === room.id }"
                @click="selectRoom(room)"
            >
              <div class="room-info">
                <div class="room-name">{{ room.name }}</div>
                <div class="last-message">{{ room.lastMessage }}</div>
              </div>
              <div class="room-meta">
                <div class="timestamp">{{ room.timestamp }}</div>
                <div v-if="room.unreadCount > 0" class="unread-count">
                  {{ room.unreadCount }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 채팅 내용 -->
        <div class="chat-content" v-if="selectedRoom">
          <div class="chat-header">
            <h3>{{ selectedRoom.name }}</h3>
          </div>
          <div class="messages">
            <div
                v-for="message in messages"
                :key="message.id"
                class="message"
                :class="{ 'mine': message.isMine }"
            >
              <div class="message-content">
                <div class="sender" v-if="!message.isMine">{{ message.sender }}</div>
                <div class="bubble">{{ message.content }}</div>
                <div class="timestamp">{{ message.timestamp }}</div>
              </div>
            </div>
          </div>
          <div class="message-input">
            <textarea
                v-model="newMessage"
                placeholder="메시지를 입력하세요..."
                @keypress="handleKeyPress"
            ></textarea>
            <button @click="sendMessage">전송</button>
          </div>
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

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal {
  background-color: white;
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

/* 모달 입력 필드 스타일 */
.modal-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #edf2f7;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.modal-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

/* 모달 버튼 스타일 */
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-buttons button {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: #edf2f7;
  color: #4a5568;
  border: none;
}

.cancel-btn:hover {
  background-color: #e2e8f0;
  transform: translateY(-1px);
}

.create-btn {
  background-color: #4299e1;
  color: white;
  border: none;
}

.create-btn:hover {
  background-color: #3182ce;
  transform: translateY(-1px);
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
  padding: 20px;
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

/* 반응형 스타일 */
@media (max-width: 768px) {
  .container-wrapper {
    padding: 8px;
  }

  .content-container {
    padding: 8px;
  }

  .chat-container {
    gap: 8px;
  }

  .chat-rooms {
    flex: 0 0 220px;
  }
}

@media (max-width: 480px) {
  .chat-rooms {
    flex: 0 0 180px;
  }
}
</style>