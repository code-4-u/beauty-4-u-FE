import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { useSSEStore } from "@/stores/sse.js";
import axios from "axios";

export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref(null);
    const refreshToken = ref(null);
    const userRole = ref(null);
    const userCode = ref(null);
    const jobName = ref(null);
    const deptCode = ref(null);
    const deptName = ref(null);
    const userName = ref(null);
    const teamspaceId = ref(null);
    const sseStore = useSSEStore();

    function setUserInfo(aToken) {
        const payload = decodeJwtPayload(aToken);
        userRole.value = payload.auth[0].authority.slice(5);
        userCode.value = payload.sub;
        jobName.value = payload.jobName;
        deptCode.value = payload.deptCode;
        deptName.value = payload.deptName;
        userName.value = payload.userName;
    }

    async function fetchTeamspaceId() {
        if (!deptCode.value) {
            console.error("부서 코드가 없습니다.");
            return null;
        }
        try {
            const response = await axios.get("http://localhost:8080/api/v1/teamspace", {
                params: { deptCode: deptCode.value },
                headers: {
                    Authorization: `Bearer ${accessToken.value}`
                },
            });
            teamspaceId.value = response.data; // teamspaceId 저장
            console.log("teamspaceId fetched: ", teamspaceId.value);
            return teamspaceId.value;
        } catch (error) {
            console.error("팀스페이스 ID 조회 실패:", error);
            return null;
        }
    }

    onMounted(() => {
        const aToken = localStorage.getItem('accessToken');
        const rToken = localStorage.getItem('refreshToken');
        console.log("액세스 토큰: ", aToken);
        console.log("리프레시 토큰: ", rToken);
        if (aToken) {
            accessToken.value = aToken;
            refreshToken.value = rToken;
            setUserInfo(aToken);
        }
    });

    async function login(aToken, rToken) {
        accessToken.value = aToken;
        refreshToken.value = rToken;
        localStorage.setItem('accessToken', aToken);
        localStorage.setItem('refreshToken', rToken);
        setUserInfo(aToken);
        try {
            await sseStore.connectSSE();
        } catch (error) {
            console.error('SSE 연결 중 오류 발생:', error);
        }
    }

    function logout() {
        accessToken.value = null;
        refreshToken.value = null;
        userRole.value = null;
        userCode.value = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sseStore.disconnectSSE();
    }

    function isAuthorized(requiredRole) {
        if (!userRole.value) return false;
        return userRole.value.includes(requiredRole);
    }

    function setAccessToken(aToken) {
        accessToken.value = aToken;
        localStorage.removeItem('accessToken');
        localStorage.setItem('accessToken', aToken);
    }

    function setRefreshToken(rToken) {
        refreshToken.value = rToken;
        localStorage.removeItem('refreshToken');
        localStorage.setItem('refreshToken', rToken);
    }

    function decodeJwtPayload(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    }

    return { accessToken, refreshToken, userRole, userCode, jobName, deptCode, deptName, userName, teamspaceId, login, logout, isAuthorized, setAccessToken, setRefreshToken, fetchTeamspaceId, };
});