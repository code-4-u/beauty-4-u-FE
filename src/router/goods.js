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
                name: GoodsList,
                component: () => import('@/views/goods/GoodsList.vue')
            },
            {
                path: 'review/list',
                name: 'Review',
                component: () => import('@/views/goods/Review.vue')
            }
        ]
    }
];