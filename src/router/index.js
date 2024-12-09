import {createRouter, createWebHistory} from "vue-router";

import Home from "@/views/Home.vue";
import Login from "@/views/user/Login.vue";

import userRoutes from './user.js';
import chatRouters from './chat.js';
import boards from './board.js';
import adminRoutes from './admin.js';
import customerRoutes from './customer.js'
import goods from "@/router/goods.js";

const routes = [
    {
        path: '/',
        component: Home
    },
    {
        path: '/login',
        component: Login
    },
    ...userRoutes,
    ...customerRoutes,
    ...boards,
    ...adminRoutes,
    ...chatRouters,
    ...goods
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;