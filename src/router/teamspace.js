import TeamSpaceHome from "@/views/teamspace/TeamSpaceHome.vue";
import ChatTest from "@/views/chat/ChatTest.vue";
import ChatHome from "@/views/chat/ChatHome.vue";
import TeamBoardList from "@/components/teamspace/TeamBoardList.vue";
import TeamBoardSave from "@/components/teamspace/TeamBoardSave.vue";
import TeamBoardUpdate from "@/components/teamspace/TeamBoardUpdate.vue";

export default [
    {
        path: "/teamspace",
        component: TeamSpaceHome,
        children: [
            {
                path: 'board',
                component: TeamBoardList
            },
            {
                path: 'board/save',
                component: TeamBoardSave
            },{
                path: 'board/update',
                component: TeamBoardUpdate
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