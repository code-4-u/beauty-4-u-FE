import {createRouter, createWebHistory} from "vue-router";

import Home from "@/views/Home.vue";
import Login from "@/views/user/Login.vue";

import userRoutes from './user.js';
import customerRoutes from './customer.js'

const routes = [
    {
        path : '/',
        component : Home
    },
    {
        path: '/login',
        component: Login
    },
    ...userRoutes,
    ...customerRoutes
];

const router = createRouter({
    history : createWebHistory(),
    routes
});

export default router;