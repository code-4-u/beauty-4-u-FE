import ChatTest from "@/views/chat/ChatTest.vue";
import ChatHome from "@/views/chat/ChatHome.vue";


export default [
    {
        path: '/sockjs',
        component: ChatTest
    },
    {
        path: '/teamspace/:teamspaceId/chat',
        component: ChatHome
    }

];