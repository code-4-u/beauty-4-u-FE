import Review from "@/views/goods/Review.vue";
import GoodsHome from "@/views/goods/GoodsHome.vue";
import GoodsList from "@/views/goods/GoodsList.vue";

export default [
    {
        path: '/goods',
        component: GoodsHome,
        children: [
            {
                path: 'search',
                component: GoodsList
            },
            {
                path: 'review/list',
                name: 'ReviewList',
                component: () => import('@/views/goods/Review.vue')
            }
        ]
    }
];