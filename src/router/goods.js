import GoodsHome from "@/views/goods/GoodsHome.vue";
import GoodsAnalysis from "@/views/goods/GoodsAnalysis.vue";
import GoodsList from "@/views/goods/GoodsList.vue";
import Review from "@/views/goods/Review.vue";

export default [
    {
        path: '/goods',
        children: [
            {
                path: '',
                component: GoodsHome
            },
            {
                path: 'analysis',
                component: GoodsAnalysis
            },
            {
                path: 'search',
                component: GoodsList
            },
            {
                path: 'review',
                component: Review
            },
        ]
    }
];