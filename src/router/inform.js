import InformHome from "@/views/inform/InformHome.vue";

export default [
    {
        path: '/inform',
        component: InformHome,
        children: [
            {
                path: ''
            }
        ]
    }
]