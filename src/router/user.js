import MyPage from "@/views/user/MyPage.vue";

export default [
    {
        path: '/mypage',
        component: MyPage,
        meta: { requiresAuth: true }
    }
];