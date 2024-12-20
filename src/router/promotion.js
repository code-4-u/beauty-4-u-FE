import PromotionSave from "@/components/promotion/PromotionSave.vue";
import PromotionAnalysis from "@/components/promotion/PromotionAnalysis.vue";
import PromotionHome from "@/views/promotion/PromotionHome.vue";
import PromotionList from "@/components/promotion/PromotionList.vue";
import PromotionDetail from "@/components/promotion/PromotionDetail.vue";

export default [
    {
        path: '/promotion',
        children: [
            {
                path: '',
                component: PromotionHome
            },
            {
                path: 'manage',
                component: PromotionList
            },
            {
                path: 'save',
                component: PromotionSave
            },
            {
                path: ':promotionId',
                component: PromotionDetail
            },
            {
                path: 'analysis',
                component: PromotionAnalysis
            },
        ]
    }
];