import InformList from "@/views/board/InformList.vue";
import boardHome from "@/views/board/BoardHome.vue";
import QAndAList from "@/views/board/QAndAList.vue";
import FAQList from "@/views/board/FAQList.vue";
import informDetail from "@/components/board/inform/InformDetail.vue";

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
                path: 'inform/:informId',
                component: informDetail
            },
            {
                path: 'QAndA',
                component: QAndAList
            },
            {
                path: 'FAQ',
                component: FAQList
            }
        ]
    }
]