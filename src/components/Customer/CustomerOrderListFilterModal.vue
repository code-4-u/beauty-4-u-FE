<script setup>
import {ref, watch} from 'vue';

const props = defineProps(['filter']);

// 부모한테 보낼 이벤트 2개
const emit = defineEmits(['update:filter', 'close']);

// props.filter를 복사해서 localFilter에 저장
const localFilter = ref({...props.filter});

// props.filter를 계속 감시
// localFilter.value를 바꿔준다.
watch(() => props.filter, (newFilter) => {
  localFilter.value = {...newFilter};
});

// Filter를 닫으면 작동
// 필터를 닫으면 해당 부모에게 이벤트 발송
const applyFilter = () => {
  emit('update:filter', localFilter.value);
  emit('close');
};
</script>

<template>
  <div class="filter-modal">
    <div class="modal-content">
      <h3>필터 설정</h3>
      <h5>주문 기간</h5>
      <label for="startDate">
        시작 날짜:
        <input type="date" id="startDate" v-model="localFilter.startDate"/>
      </label>

      <label for="endDate">
        종료 날짜:
        <input type="date" id="endDate" v-model="localFilter.endDate"/>
      </label>

      <h5>주문 금액</h5>
      <label for="minPrice">
        최소 금액:
        <input type="number" id="minPrice" v-model="localFilter.minPrice"/>
      </label>

      <label for="maxPrice">
        최대 금액:
        <input type="number" id="maxPrice" v-model="localFilter.maxPrice"/>
      </label>

      <label for="status">
        상태:
        <select id="status" v-model="localFilter.status">
          <option value="" selected>선택</option>
          <option value="PURCHASED">구매</option>
          <option value="REFUND">환불</option>
          <option value="CANCELLED">취소</option>
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