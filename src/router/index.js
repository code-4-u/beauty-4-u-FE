import {createRouter, createWebHistory} from "vue-router";

import userRoutes from './user.js';
import boards from './board.js';
import customerRoutes from './customer.js'
import Home from "@/views/Home.vue";
import goods from "@/router/goods.js";

const routes = [
    {
        path: '/',
        component: Home
    },
    ...userRoutes,
    ...customerRoutes,
    ...boards,
    ...goods
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;