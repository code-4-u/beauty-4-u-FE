import InformList from "@/views/board/InformList.vue";
import boardHome from "@/views/board/BoardHome.vue";
import QAndAList from "@/views/board/QAndAList.vue";
import FAQList from "@/views/board/FAQList.vue";
import informDetail from "@/components/board/inform/InformDetail.vue";
import InformSave from "@/components/board/inform/InformSave.vue";
import InformUpdate from "@/components/board/inform/informUpdate.vue";

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
                component: informDetail
            },
            {
                path: 'inform/:informId/update',
                component: InformUpdate
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