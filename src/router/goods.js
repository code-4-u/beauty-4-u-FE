import GoodsHome from "@/views/goods/GoodsHome.vue";
import GoodsAnalysis from "@/components/goods/GoodsAnalysis.vue";
import GoodsSearch from "@/components/goods/GoodsSearch.vue";
import Review from "@/components/goods/Review.vue";
import GoodsList from "@/components/goods/GoodsList.vue";

export default [
    {
        path: '/goods',
        children: [
            {
                path: '',
                component: GoodsHome
            },
            {
                path: 'manage',
                component: GoodsList
            },
            {
                path: 'analysis',
                component: GoodsAnalysis
            },
            {
                path: 'search',
                component: GoodsSearch
            },
            {
                path: 'review',
                component: Review
            },
        ]
    }
];