import {createRouter, createWebHistory} from "vue-router";

import Home from "@/views/Home.vue";

import userRoutes from './user.js';
import customerRoutes from './customer.js'

const routes = [
    {
        path : '/',
        component : Home
    },
    ...userRoutes,
    ...customerRoutes
];

const router = createRouter({
    history : createWebHistory(),
    routes
});

export default router;