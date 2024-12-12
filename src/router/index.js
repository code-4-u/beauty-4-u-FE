import {createRouter, createWebHistory} from "vue-router";

import Home from "@/views/Home.vue";

import userRoutes from './user.js';
import customerRoutes from './customer.js';
import boards from './board.js';

const routes = [
    {
        path : '/',
        component : Home
    },
    ...userRoutes,
    ...customerRoutes,
    ...boards
];

const router = createRouter({
    history : createWebHistory(),
    routes
});

export default router;