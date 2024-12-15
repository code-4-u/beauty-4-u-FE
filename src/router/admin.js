import AdminHome from "@/views/admin/AdminHome.vue";
import UserList from "@/views/admin/UserList.vue";

export default [
    {
        path: "/admin",
        component: AdminHome,
        children: [
            {
                path: 'user',
                component: UserList
            }
        ]
    }
];