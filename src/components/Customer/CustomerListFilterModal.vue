<script setup>
import {ref, watch} from 'vue';

const props = defineProps(['filter']);
const emit = defineEmits(['update:filter', 'close']);

const localFilter = ref({ ...props.filter });

watch(() => props.filter, (newFilter) => {
  localFilter.value = { ...newFilter };
});

const applyFilter = () => {
  emit('update:filter', localFilter.value);
  emit('close');
};
</script>

<template>
  <div class="filter-modal">
    <div class="modal-content">
      <h3>필터 설정</h3>
      <label>
        등급:
        <select v-model="localFilter.grade">
          <option value="">선택</option>
          <option value="BABY">BABY</option>
          <option value="PINK">PINK</option>
          <option value="GREEN">GREEN</option>
          <option value="BLACK">BLACK</option>
          <option value="GOLD">GOLD</option>
        </select>
      </label>
      <label>
        성별:
        <select v-model="localFilter.gender">
          <option value="">선택</option>
          <option value="MALE">남성</option>
          <option value="FEMALE">여성</option>
        </select>
      </label>
      <label>
        연령대:
        <select v-model="localFilter.ageGroup">
          <option value="">선택</option>
          <option value="10">10대</option>
          <option value="20">20대</option>
          <option value="30">30대</option>
          <option value="40">40대</option>
          <option value="50">50대</option>
          <option value="60">60대 이상</option>
        </select>
      </label>
      <div class="modal-buttons">
        <button @click="applyFilter">적용</button>
        <button @click="$emit('close')">취소</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 스타일 추가 */
.filter-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border: 1px solid #29C458;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  width: 400px;
}

.modal-content {
  display: flex;
  flex-direction: column;
}

.modal-content h3 {
  margin-bottom: 16px;
  color: #29C458;
}

label {
  margin-bottom: 12px;
}

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.modal-buttons button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: #29C458;
  color: white;
  cursor: pointer;
}

.modal-buttons button:hover {
  background: #29C458;
}
</style>