import WorkSpaceHome from "@/views/workspace/WorkSpaceHome.vue";
import WorkChat from "@/components/workspace/WorkChat.vue";
import WorkBoard from "@/components/workspace/WorkBoard.vue";

export default [
    {
        path: '/workspace',
        children: [
            {
                path: '',
                component: WorkSpaceHome
            },
            {
                path: 'chat',
                component: WorkChat
            },
            {
                path: 'board',
                component: WorkBoard
            },
        ]
    }
];