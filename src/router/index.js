import {createRouter, createWebHistory} from "vue-router";
import {useAuthStore} from "@/stores/auth.js";

import Home from "@/views/Home.vue";
import Login from "@/views/user/Login.vue";

import userRoutes from './user.js';
import boardRoutes from './board.js';
import adminRoutes from './admin.js';
import customerRoutes from './customer.js'
import goodsRoutes from './goods.js';
import teamspaceRoutes from './teamspace.js';
import analysisRoutes from './analysis.js';
import promotionRoutes from './promotion.js'

const routes = [
    {
        path: '/',
        component: Home,
        meta: { requiresAuth: true }
    },
    {
        path: '/login',
        component: Login,
        meta: { hideHeader: true }
    },
    ...userRoutes,
    ...customerRoutes,
    ...boardRoutes,
    ...adminRoutes,
    ...teamspaceRoutes,
    ...goodsRoutes,
    ...analysisRoutes,
    ...promotionRoutes
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();

    // 1. 인증 확인
    if (to.meta.requiresAuth && !authStore.accessToken) {
        return next({ path: '/login' });
    }

    // 2. 로그인 상태에서 로그인 페이지로 접근 방지
    if (authStore.accessToken && to.path === '/login') {
        return next({ path: '/' });
    }

    // 3. /teamspace 경로 접근 시 리다이렉트
    if (to.path === '/teamspace') {
        if (!authStore.teamspaceId) {
            await authStore.fetchTeamspaceId();
        }

        const redirectPath = `/teamspace/chat/${authStore.teamspaceId}`;
        if (to.path !== redirectPath) {
            return next(redirectPath); // 리다이렉트
        }
    }

    // 4. 잘못된 teamspaceId 접근 차단
    if (to.path.startsWith('/teamspace/chat/')) {
        const requestedTeamspaceId = to.params.teamspaceId;

        if (!authStore.teamspaceId) {
            await authStore.fetchTeamspaceId();
        }

        if (requestedTeamspaceId !== authStore.teamspaceId) {
            const redirectPath = `/teamspace/chat/${authStore.teamspaceId}`;
            if (to.path !== redirectPath) {
                return next(redirectPath); // 리다이렉트
            }
        }
    }

    // 5. 기본적으로 next() 호출
    next();
});

export default router;