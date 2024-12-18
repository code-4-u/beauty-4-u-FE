import { defineStore } from "pinia";
import { onMounted, ref } from "vue";

export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref(null);
    const refreshToken = ref(null);
    const userRole = ref(null);
    const userCode = ref(null);
    const jobName = ref(null);
    const deptCode = ref(null);
    const deptName = ref(null);
    const userName = ref(null);

    function setUserInfo(aToken) {
        const payload = decodeJwtPayload(aToken);
        userRole.value = payload.auth[0].authority.slice(5);
        userCode.value = payload.sub;
        jobName.value = payload.jobName;
        deptCode.value = payload.deptCode;
        deptName.value = payload.deptName;
        userName.value = payload.userName;
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

    function login(aToken, rToken) {
        accessToken.value = aToken;
        refreshToken.value = rToken;
        localStorage.setItem('accessToken', aToken);
        localStorage.setItem('refreshToken', rToken);
        setUserInfo(aToken);
    }

    function logout() {
        accessToken.value = null;
        refreshToken.value = null;
        userRole.value = null;
        userCode.value = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
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

    return { accessToken, refreshToken, userRole, userCode, jobName, deptCode, deptName, userName, login, logout, isAuthorized, setAccessToken, setRefreshToken };
});