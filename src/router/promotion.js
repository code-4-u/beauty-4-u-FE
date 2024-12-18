import PromotionSave from "@/components/promotion/PromotionSave.vue";
import PromotionAnalysis from "@/components/promotion/PromotionAnalysis.vue";
import PromotionHome from "@/views/promotion/PromotionHome.vue";

export default [
    {
        path: '/promotion',
        children: [
            {
                path: '',
                component: PromotionHome
            },
            {
                path: 'save',
                component: PromotionSave
            },
            {
                path: 'analysis',
                component: PromotionAnalysis
            },
        ]
    }
];