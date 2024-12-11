<script setup>
import {onMounted, ref} from "vue";
import {getFetch} from "@/stores/apiClient.js";
import {formatDate} from "@/stores/util.js";

const props = defineProps({
  customerCode: {
    type: String,
    required: true
  }
});

// 고객 정보를 저장할 변수
const customerDetails = ref({});

// 고객 정보를 가져오는 메서드
const fetchCustomerDetails = async () => {
  try {
    console.log(props.customerCode);
    const response = await getFetch(`/customer/${props.customerCode}`)
    console.log(response);
    customerDetails.value = response.data.data;
    console.log(customerDetails.value);
  } catch (error) {
    console.error('고객 정보를 가져오는 데 실패했습니다:', error);
  }
}

onMounted(async () => {
  await Promise.all([
    fetchCustomerDetails()
  ])
});

</script>

<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-6">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">상세 정보</h5>
            <div class="row mb-2">
              <div class="col-4 text-muted">휴대폰</div>
              <div class="col-8">{{ customerDetails.customerPhone }}</div>
            </div>
            <div class="row mb-2">
              <div class="col-4 text-muted">이메일</div>
              <div class="col-8">{{ customerDetails.customerEmail }}</div>
            </div>
            <div class="row mb-2">
              <div class="col-4 text-muted">나이</div>
              <div class="col-8">만 {{ customerDetails.customerAge }}세</div>
            </div>
            <div class="row mb-2">
              <div class="col-4 text-muted">성별</div>
              <div class="col-8">{{ customerDetails.customerGender }}</div>
            </div>
            <div class="row mb-2">
              <div class="col-4 text-muted">피부타입</div>
              <div class="col-8">{{ customerDetails.customerSkintype }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">구매 요약 <small class="text-muted">(최근 12개월)</small></h5>
            <div class="row mb-2">
              <div class="col-6 text-muted">총 구매금액</div>
              <div class="col-6">{{ customerDetails.allOrderPrice }}</div>
            </div>
            <div class="row mb-2">
              <div class="col-6 text-muted">취소/환불 횟수</div>
              <div class="col-6">{{ customerDetails.cancelRefundCount }}</div>
            </div>
            <div class="row mb-2">
              <div class="col-6 text-muted">최근 구매일</div>
              <div class="col-6">{{ formatDate(customerDetails.customerLastOrderDate) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>

</style>