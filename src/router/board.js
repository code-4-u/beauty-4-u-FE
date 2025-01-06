import InformList from "@/views/board/InformList.vue";
import QnaList from "@/views/board/QnaList.vue";
import FaqList from "@/views/board/FaqList.vue";
import InformDetail from "@/components/board/inform/InformDetail.vue";
import InformSave from "@/components/board/inform/InformSave.vue";
import InformUpdate from "@/components/board/inform/InformUpdate.vue";
import FaqSave from "@/components/board/faq/FaqSave.vue";
import FaqDetail from "@/components/board/faq/FaqDetail.vue";
import FaqUpdate from "@/components/board/faq/FaqUpdate.vue";
import QnaSave from "@/components/board/qna/QnaSave.vue";
import QnaDetail from "@/components/board/qna/QnaDetail.vue";
import QnaUpdate from "@/components/board/qna/QnaUpdate.vue";
import { useAuthStore } from '@/stores/auth.js';

// 관리자 권한 체크 함수
const checkAdminRole = (to, from, next) => {
    const userStore = useAuthStore();
    if (userStore.userRole === 'ADMIN') {
        next();
    } else {
        alert('관리자만 접근 가능합니다.');
        next('/inform'); // 메인 공지사항 목록으로 리다이렉트
    }
};

export default [
    {
        path: '/inform',
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                component: InformList
            },
            {
                path: 'save',
                component: InformSave,
                beforeEnter: checkAdminRole // 관리자 권한 체크 추가
            },
            {
                path: ':informId',
                component: InformDetail
            },
            {
                path: ':informId/update',
                component: InformUpdate,
                beforeEnter: checkAdminRole // 관리자 권한 체크 추가
            },
        ],
    },
    {
        path: '/qna',
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                component: QnaList
            },
            {
                path: 'save',
                component: QnaSave
            },
            {
                path: ':inquiryId',
                component: QnaDetail
            },
            {
                path: ':inquiryId/update',
                component: QnaUpdate
            },
        ]
    },
    {
        path: '/faq',
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                component: FaqList
            },
            {
                path: 'save',
                component: FaqSave,
                beforeEnter: checkAdminRole // 관리자 권한 체크 추가
            },
            {
                path: ':faqId',
                component: FaqDetail
            },
            {
                path: ':faqId/update',
                component: FaqUpdate,
                beforeEnter: checkAdminRole // 관리자 권한 체크 추가
            },
        ]
    }
]