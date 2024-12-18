import {createRouter, createWebHistory} from "vue-router";

import Home from "@/views/Home.vue";
import Login from "@/views/user/Login.vue";

import userRoutes from './user.js';
import boardRoutes from './board.js';
import adminRoutes from './admin.js';
import customerRoutes from './customer.js'
import goodsRoutes from "@/router/goods.js";
import teamspaceRoutes from "./teamspace.js";
import analysisRoutes from "@/router/analysis.js"
import {useAuthStore} from "@/stores/auth.js";

const routes = [
    {
        path: '/',
        component: Home,
        meta: { requiresAuth: true }
    },
    {
        path: '/login',
        component: Login
    },
    ...userRoutes,
    ...customerRoutes,
    ...boardRoutes,
    ...adminRoutes,
    ...teamspaceRoutes,
    ...goodsRoutes,
    ...analysisRoutes
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.accessToken) {
        next({ path: '/login' });
    }
    else if (authStore.accessToken && (to.path === '/login')) {
        next({ path: '/' });
    } else {
        next();
    }
});

export default router;