import PromotionSave from "@/views/promotion/PromotionSave.vue";
import PromotionAnalysis from "@/views/promotion/PromotionAnalysis.vue";

export default [
    {
        path: '/promotion',
        children: [
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