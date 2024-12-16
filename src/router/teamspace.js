import TeamSpaceHome from "@/views/teamspace/TeamSpaceHome.vue";
import Scrap from "@/views/teamspace/Scrap.vue";

export default [
    {
        path: "/teamspace",
        component: TeamSpaceHome,
        children: [
            {
                path: 'scrap',
                component: Scrap
            }
        ]
    }
];