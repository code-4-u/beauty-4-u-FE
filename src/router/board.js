import InformList from "@/views/board/InformList.vue";
import boardHome from "@/views/board/BoardHome.vue";
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

export default [
    {
        path: '/board',
        component: boardHome,
        children: [
            {
                path: 'inform',
                component: InformList
            },
            {
                path: 'inform/save',
                component: InformSave
            },
            {
                path: 'inform/:informId',
                component: InformDetail
            },
            {
                path: 'inform/:informId/update',
                component: InformUpdate
            },
            {
                path: 'qna',
                component: QnaList
            },
            {
                path: 'qna/save',
                component: QnaSave
            },
            {
                path: 'qna/:inquiryId',
                component: QnaDetail
            },
            {
                path: 'qna/:inquiryId/update',
                component: QnaUpdate
            },
            {
                path: 'faq',
                component: FaqList
            },
            {
                path: 'faq/save',
                component: FaqSave
            },
            {
                path: 'faq/:faqId',
                component: FaqDetail
            },
            {
                path: 'faq/:faqId/update',
                component: FaqUpdate
            },
        ]
    }
]