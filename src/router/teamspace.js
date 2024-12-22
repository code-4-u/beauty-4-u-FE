import TeamSpaceHome from "@/views/teamspace/TeamSpaceHome.vue";
import ChatTest from "@/views/chat/ChatTest.vue";
import TeamBoardList from "@/components/teamspace/TeamBoardList.vue";
import TeamBoardSave from "@/components/teamspace/TeamBoardSave.vue";
import TeamBoardUpdate from "@/components/teamspace/TeamBoardUpdate.vue";
import TeamBoardDetail from "@/components/teamspace/TeamBoardDetail.vue";
import TeamChat from "@/views/chat/TeamChat.vue";

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
            },
            {
                path: 'board/:teamBoardId',
                component: TeamBoardDetail
            },
            {
                path: 'board/:teamBoardId/update',
                component: TeamBoardUpdate
            },
            {
                path: 'chat/:teamspaceId',
                component: TeamChat
            },
        ]
    },
    {
        path: '/sockjs',
        component: ChatTest
    }
];