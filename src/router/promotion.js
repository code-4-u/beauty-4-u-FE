import PromotionHome from "@/views/promotion/PromotionHome.vue";
import PromotionList from "@/components/promotion/PromotionList.vue";

export default [
    {
        path: "/promotion",
        component: PromotionHome,
        children: [
            {
                path: 'list',
                component: PromotionList
            }
        ]
    }
];