import MyPage from "@/views/user/MyPage.vue";
import UserHome from "@/views/user/UserHome.vue";

export default [
    {
        path: "/user",
        component: UserHome,
        children: [
            {
                path: 'mypage',
                component: MyPage
            }
        ]
    }
];