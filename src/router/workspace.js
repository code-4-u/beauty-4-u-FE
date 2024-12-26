import WorkSpaceHome from "@/views/workspace/WorkSpaceHome.vue";
import WorkChat from "@/components/workspace/WorkChat.vue";
import WorkBoard from "@/components/workspace/WorkBoard.vue";
import WorkBoardSave from "@/components/workspace/WorkBoardSave.vue";
import WorkBoardDetail from "@/components/workspace/WorkBoardDetail.vue";
import WorkBoardUpdate from "@/components/workspace/WorkBoardUpdate.vue";

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
            {
                path: 'board/save',
                component: WorkBoardSave
            },
            {
                path: 'board/:teamBoardId',
                component: WorkBoardDetail
            },
            {
                path: 'board/:teamBoardId/update',
                component: WorkBoardUpdate
            },
        ]
    }
];