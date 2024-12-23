import UserList from "@/views/admin/UserList.vue";
import { useAuthStore } from '@/stores/auth';

export default [
    {
        path: "/admin",
        component: UserList,
        beforeEnter: (to, from, next) => {
            const authStore = useAuthStore();
            const userRole = authStore.userRole?.toUpperCase();

            if (userRole === 'ADMIN') {
                next(); // ADMIN인 경우 접근 허용
            } else {
                // ADMIN이 아닌 경우 메인 페이지나 다른 페이지로 리다이렉트
                next('/'); // 또는 다른 경로 (예: next('/unauthorized'))
            }
        }
    }
];