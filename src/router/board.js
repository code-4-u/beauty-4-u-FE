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

export default [
    {
        path: '/inform',
        children: [
            {
                path: '',
                component: InformList
            },
            {
                path: 'save',
                component: InformSave
            },
            {
                path: ':informId',
                component: InformDetail
            },
            {
                path: ':informId/update',
                component: InformUpdate
            },
        ],
    },
    {
        path: '/qna',
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
        children: [
            {
                path: '',
                component: FaqList
            },
            {
                path: 'save',
                component: FaqSave
            },
            {
                path: ':faqId',
                component: FaqDetail
            },
            {
                path: ':faqId/update',
                component: FaqUpdate
            },
        ]
    }
]