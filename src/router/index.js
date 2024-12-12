import {createRouter, createWebHistory} from "vue-router";

import userRoutes from './user.js';
import customerRoutes from './customer.js'
import Home from "@/views/Home.vue";
import Goods from "@/components/goods/Goods.vue";
import Review from "@/components/goods/Review.vue";

const routes = [
    {
        path: '/',
        component: Home
    },
    {
        path: '/goods',
        component: Goods
    },
    {
        path: '/review',
        component: Review
    },
    ...userRoutes,
    ...userRoutes,
    ...customerRoutes
];

const router = createRouter({
    history : createWebHistory(),
    routes
});

export default router;