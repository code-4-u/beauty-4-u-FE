import TeamSpaceHome from "@/views/teamspace/TeamSpaceHome.vue";
import Scrap from "@/views/teamspace/Scrap.vue";
import ChatTest from "@/views/chat/ChatTest.vue";
import ChatHome from "@/views/chat/ChatHome.vue";

export default [
    {
        path: "/teamspace",
        component: TeamSpaceHome,
        children: [
            {
                path: 'scrap',
                component: Scrap
            },
            {
                path: ':teamspaceId/chat',
                component: ChatHome
            },
        ]
    },
    {
        path: '/sockjs',
        component: ChatTest
    }
];