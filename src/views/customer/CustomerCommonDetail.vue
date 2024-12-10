<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {formatDate} from "@/stores/util.js";
import {useCustomerStore} from "@/stores/customerPinia.js";

const customerInfo = useCustomerStore();

const router = useRouter();

const activeTab = ref('basicInfo');

function toggleTab(tab) {
  activeTab.value = tab;
  router.push({
    path: `/customer/${customerInfo.customerCode}/` + tab // 수정된 부분
  });
}


</script>

<template>
  <div class="customer-header">
    <div class="profile-circle">
      <span>{{ customerInfo.customerName.charAt(0) }}</span>
    </div>
    <div class="customer-details ms-5">
      <h1>{{ customerInfo.customerName }}</h1>
      <p>{{ customerInfo.customerGrade }} 등급 | 가입일: {{ formatDate(customerInfo.createdDate) }}</p>
    </div>
  </div>

  <div class="mt-4 fs-5 tabs">
    <div 
      @click="toggleTab('basicInfo')" 
      :class="{ active: activeTab === 'basicInfo' }" 
      class="p-3"
    >
      기본 정보
    </div>
    <div 
      @click="toggleTab('purchaseHistory')" 
      :class="{ active: activeTab === 'purchaseHistory' }" 
      class="p-3"
    >
      구매 이력
    </div>
  </div>
  <router-view :customer-code="customerInfo.customerCode"/>
</template>

<style scoped>
.customer-header {
  display: flex;
  align-items: center;
}

.profile-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background-color: rgba(0, 255, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50px;
  color: green;
}

.customer-details {
  font-size: 35px;
}

.customer-details p {
  color: gray;
  font-size: 20px;
}

.tabs {
  display: flex;
}

.tabs div {
  border-bottom: 1px solid gray;
  background-color: white;
  cursor: pointer;
}

.tabs div.active {
  color: #29C458;
  border-color: #29C458;
}
</style>