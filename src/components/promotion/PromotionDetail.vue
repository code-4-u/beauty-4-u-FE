<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFetch, putFetch } from "@/stores/apiClient.js"

const route = useRoute()
const router = useRouter()
const promotionId = route.params['promotionId']

const promotion = ref(null)
const promotionGoods = ref([])
const promotionTypes = ref([]) // 프로모션 타입 목록 저장
const loading = ref(true)
const error = ref(null)

// 수정 모드 상태 관리
const isBasicInfoEditing = ref(false)
const isGoodsEditing = ref(false)

// 수정용 임시 데이터 저장
const editedBasicInfo = ref(null)
const editedGoods = ref([])

const getStatusText = (status) => {
  const statusMap = {
    'BEFORE': '예정',
    'ONGOING': '진행중',
    'ENDED': '종료'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatPrice = (price) => {
  return price ? price.toLocaleString() : '0'
}

const calculateFinalPrice = (price, discountRate) => {
  if (!price) return '0'
  const discount = discountRate ?? 0
  return Math.round(price * (100 - discount) / 100).toLocaleString()
}

const fetchPromotionDetail = async () => {
  if (!promotionId) {
    error.value = '프로모션 ID가 유효하지 않습니다.'
    loading.value = false
    return
  }

  try {
    loading.value = true
    const goodsListParams = new URLSearchParams({
      page: '1',
      count: '10',
      sort: '',
      order: '',
      goodsName: ''
    })

    // 프로모션 타입도 함께 조회
    const [promotionResponse, goodsResponse, typesResponse] = await Promise.all([
      getFetch(`/promotion/${promotionId}`),
      getFetch(`/promotionGoods/${promotionId}?${goodsListParams}`),
      getFetch(`/promotionType?${new URLSearchParams({
        promotionTypeName: '',
        sort: '',
        order: '',
        page: 1,
        count: 10
      })}`)
    ])

    promotion.value = promotionResponse.data.data
    promotionGoods.value = goodsResponse.data.data
    promotionTypes.value = typesResponse.data.data
  } catch (e) {
    error.value = '프로모션 정보를 불러오는데 실패했습니다.'
    console.error('Error fetching promotion details:', e)
  } finally {
    loading.value = false
  }
}

// 기본 정보 수정 시작
const startBasicInfoEdit = () => {
  editedBasicInfo.value = { ...promotion.value }
  isBasicInfoEditing.value = true
}

// 상품 목록 수정 시작
const startGoodsEdit = () => {
  editedGoods.value = promotionGoods.value.map(item => ({ ...item }))
  isGoodsEditing.value = true
}

// 기본 정보 수정 저장
const saveBasicInfo = async () => {
  try {
    const promotionReqData = {
      promotionTypeId: Number(editedBasicInfo.value.promotionTypeId),
      promotionTitle: editedBasicInfo.value.promotionTitle,
      promotionContent: editedBasicInfo.value.promotionContent,
      promotionStartDate: editedBasicInfo.value.promotionStartDate,
      promotionEndDate: editedBasicInfo.value.promotionEndDate,
      promotionStatus: editedBasicInfo.value.promotionStatus
    }

    // API 호출
    await putFetch(`/promotion/${promotionId}`, promotionReqData)

    // 성공 시 상태 업데이트
    promotion.value = {
      ...promotion.value,
      ...promotionReqData,
      promotionTypeName: promotionTypes.value.find(
          type => type.promotionTypeId === promotionReqData.promotionTypeId
      )?.promotionTypeName
    }
    isBasicInfoEditing.value = false
  } catch (e) {
    console.error('Error saving basic info:', e)
    alert('프로모션 정보 수정에 실패했습니다.')
  }
}

// 상품 목록 수정 저장
const saveGoods = async () => {
  try {
    const promotionGoodsReqData = {
      promotionGoodsList: editedGoods.value.map(goods => ({
        promotionGoodsId: goods.promotionGoodsId,
        discountRate: goods.discountRate
      }))
    }

    // API 호출
    await putFetch(`/promotionGoods`, promotionGoodsReqData)

    // 성공 시 상태 업데이트
    promotionGoods.value = editedGoods.value
    isGoodsEditing.value = false
  } catch (e) {
    console.error('Error saving goods:', e)
    alert('할인 상품 수정에 실패했습니다.')
  }
}

// 수정 취소
const cancelBasicInfoEdit = () => {
  editedBasicInfo.value = null
  isBasicInfoEditing.value = false
}

const cancelGoodsEdit = () => {
  editedGoods.value = []
  isGoodsEditing.value = false
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  fetchPromotionDetail()
})
</script>

<template>
  <div class="page-container">
    <div class="promotion-detail">
      <div class="header">
        <div class="header-left">
          <button class="back-button" @click="handleBack">← 목록으로</button>
          <h2>프로모션 상세</h2>
        </div>
      </div>

      <div v-if="loading" class="loading">
        로딩중... <br>
        {{ error ? `Error: ${error}` : '' }}
      </div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <template v-else-if="promotion">
        <div class="detail-content">
          <!-- 기본 정보 섹션 -->
          <section class="info-section">
            <div class="section-header">
              <h3>기본 정보</h3>
              <div class="button-group">
                <template v-if="!isBasicInfoEditing">
                  <button class="edit-button" @click="startBasicInfoEdit">수정</button>
                </template>
                <template v-else>
                  <button class="save-button" @click="saveBasicInfo">저장</button>
                  <button class="cancel-button" @click="cancelBasicInfoEdit">취소</button>
                </template>
              </div>
            </div>

            <div class="info-grid">
              <!-- 읽기 모드 -->
              <template v-if="!isBasicInfoEditing">
                <div class="info-item">
                  <label>프로모션명</label>
                  <div class="info-value">{{ promotion.promotionTitle }}</div>
                </div>

                <div class="info-item">
                  <label>프로모션 타입</label>
                  <div class="info-value">
                    <span class="badge type">{{ promotion.promotionTypeName }}</span>
                  </div>
                </div>

                <div class="info-item">
                  <label>상태</label>
                  <div class="info-value">
                    <span :class="['badge', promotion.promotionStatus.toLowerCase()]">
                      {{ getStatusText(promotion.promotionStatus) }}
                    </span>
                  </div>
                </div>

                <div class="info-item">
                  <label>프로모션 기간</label>
                  <div class="info-value">
                    {{ formatDate(promotion.promotionStartDate) }} ~
                    {{ formatDate(promotion.promotionEndDate) }}
                  </div>
                </div>

                <div class="info-item full-width">
                  <label>프로모션 내용</label>
                  <div class="info-value content">
                    {{ promotion.promotionContent || '-' }}
                  </div>
                </div>
              </template>

              <!-- 수정 모드 -->
              <template v-else>
                <div class="info-item">
                  <label>프로모션명</label>
                  <input
                      v-model="editedBasicInfo.promotionTitle"
                      class="edit-input"
                      type="text"
                  />
                </div>

                <div class="info-item">
                  <label>프로모션 타입</label>
                  <select
                      v-if="isBasicInfoEditing"
                      v-model="editedBasicInfo.promotionTypeId"
                      class="edit-input"
                  >
                    <option v-for="type in promotionTypes"
                            :key="type.promotionTypeId"
                            :value="type.promotionTypeId">
                      {{ type.promotionTypeName }}
                    </option>
                  </select>
                  <div v-else class="info-value">
                    <span class="badge type">{{ promotion.promotionTypeName }}</span>
                  </div>
                </div>

                <div class="info-item">
                  <label>상태</label>
                  <select
                      v-model="editedBasicInfo.promotionStatus"
                      class="edit-input"
                  >
                    <option value="BEFORE">예정</option>
                    <option value="ONGOING">진행중</option>
                    <option value="ENDED">종료</option>
                  </select>
                </div>

                <div class="info-item">
                  <label>프로모션 기간</label>
                  <div class="date-inputs">
                    <input
                        v-model="editedBasicInfo.promotionStartDate"
                        class="edit-input"
                        type="datetime-local"
                    />
                    <span>~</span>
                    <input
                        v-model="editedBasicInfo.promotionEndDate"
                        class="edit-input"
                        type="datetime-local"
                    />
                  </div>
                </div>

                <div class="info-item full-width">
                  <label>프로모션 내용</label>
                  <textarea
                      v-model="editedBasicInfo.promotionContent"
                      class="edit-input content"
                      rows="4"
                  ></textarea>
                </div>
              </template>
            </div>
          </section>

          <!-- 할인 상품 섹션 -->
          <section class="goods-section">
            <div class="section-header">
              <h3>할인 상품 목록</h3>
              <div class="button-group">
                <template v-if="!isGoodsEditing">
                  <button class="edit-button" @click="startGoodsEdit">수정</button>
                </template>
                <template v-else>
                  <button class="save-button" @click="saveGoods">저장</button>
                  <button class="cancel-button" @click="cancelGoodsEdit">취소</button>
                </template>
              </div>
            </div>

            <div class="goods-grid">
              <!-- 읽기 모드 -->
              <template v-if="!isGoodsEditing">
                <div v-for="goods in promotionGoods"
                     :key="goods.goodsCode"
                     class="goods-card">
                  <div class="goods-info">
                    <div class="goods-name">{{ goods.goodsName }}</div>
                    <div class="goods-brand">{{ goods.brandName }}</div>
                    <div class="price-info">
                      <div class="original-price">
                        {{ formatPrice(goods.goodsPrice) }}원
                      </div>
                      <div class="discount-rate">
                        {{ goods.discountRate ?? 0 }}% 할인
                      </div>
                      <div class="final-price">
                        {{ calculateFinalPrice(goods.goodsPrice, goods.discountRate) }}원
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 수정 모드 -->
              <template v-else>
                <div v-for="(goods, index) in editedGoods"
                     :key="goods.goodsCode"
                     class="goods-card editing">
                  <div class="goods-info">
                    <div class="goods-name">{{ goods.goodsName }}</div>
                    <div class="goods-brand">{{ goods.brandName }}</div>
                    <div class="price-info">
                      <div class="original-price">
                        {{ formatPrice(goods.goodsPrice) }}원
                      </div>
                      <div class="discount-input-wrapper">
                        <input
                            v-model.number="goods.discountRate"
                            class="edit-input discount-input"
                            type="number"
                            min="0"
                            max="100"
                            placeholder="할인율"
                        />
                        <span class="discount-unit">%</span>
                      </div>
                      <div class="final-price">
                        {{ calculateFinalPrice(goods.goodsPrice, goods.discountRate) }}원
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 24px;
  background-color: #f9fafb;
  min-height: 100vh;
}

.promotion-detail {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.back-button {
  padding: 8px 16px;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  color: #374151;
}

.back-button:hover {
  background-color: #f3f4f6;
}

.detail-content {
  padding: 24px;
}

.info-section, .goods-section {
  margin-bottom: 32px;
  background-color: white;
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.button-group {
  display: flex;
  gap: 8px;
}

/* 버튼 스타일 */
.edit-button, .save-button, .cancel-button, .add-button, .remove-button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.edit-button {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.edit-button:hover {
  background-color: #45a049;
}

.save-button {
  background-color: #2196F3;
  color: white;
  border: none;
}

.save-button:hover {
  background-color: #1e88e5;
}

.cancel-button {
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.cancel-button:hover {
  background-color: #e5e7eb;
}

.add-button {
  width: 100%;
  padding: 12px;
  background-color: #f3f4f6;
  color: #4b5563;
  border: 2px dashed #e5e7eb;
  margin-top: 16px;
}

.add-button:hover {
  background-color: #e5e7eb;
}

.remove-button {
  padding: 4px 8px;
  background-color: #ef4444;
  color: white;
  border: none;
  font-size: 0.875rem;
}

.remove-button:hover {
  background-color: #dc2626;
}

/* 그리드 레이아웃 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #111827;
}

.info-value.content {
  white-space: pre-line;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 4px;
  min-height: 100px;
}

/* 입력 필드 스타일 */
.edit-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background-color: white;
}

.edit-input:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

.edit-input.content {
  min-height: 100px;
  resize: vertical;
}

.date-inputs {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 뱃지 스타일 */
.badge {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
}

.badge.before {
  background-color: #fef3c7;
  color: #92400e;
}

.badge.ongoing {
  background-color: #dcfce7;
  color: #15803d;
}

.badge.ended {
  background-color: #f3f4f6;
  color: #4b5563;
}

.badge.type {
  background-color: #dbeafe;
  color: #1e40af;
}

/* 상품 카드 스타일 */
.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.goods-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background-color: white;
  transition: box-shadow 0.2s;
}

.goods-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.goods-card.editing {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goods-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.goods-brand {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.price-info {
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
  margin-top: 8px;
}

.price-inputs {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.original-price {
  color: #9ca3af;
  text-decoration: line-through;
  font-size: 0.875rem;
}

.discount-rate {
  color: #ef4444;
  font-weight: 500;
  font-size: 0.875rem;
  margin: 4px 0;
}

.final-price {
  color: #111827;
  font-weight: 600;
}

/* 로딩 및 에러 상태 */
.loading, .error {
  padding: 48px;
  text-align: center;
  color: #6b7280;
}

.error {
  color: #ef4444;
}

.discount-input-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 8px 0;
}

.discount-input {
  width: 80px;
  text-align: right;
  padding-right: 8px;
}

.discount-unit {
  color: #6b7280;
}

/* 반응형 스타일 */
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .goods-grid {
    grid-template-columns: 1fr;
  }

  .date-inputs {
    flex-direction: column;
  }

  .button-group {
    flex-direction: column;
    width: 100%;
  }

  .button-group button {
    width: 100%;
  }
}
</style>