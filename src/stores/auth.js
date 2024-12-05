import { defineStore } from "pinia";
import { onMounted, ref } from "vue";

export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref(null);
    const refreshToken = ref(null);
    const userRole = ref(null);
    const userCode = ref(null);

    onMounted(() => {
        const aToken = localStorage.getItem('accessToken');
        const rToken = localStorage.getItem('refreshToken');
        console.log("액세스 토큰: ", aToken);
        console.log("리프레시 토큰: ", rToken);
        if (aToken) {
            accessToken.value = aToken;
            refreshToken.value = rToken;
            const payload = JSON.parse(atob(aToken.split('.')[1]));
            userRole.value = payload.auth[0].authority.slice(5);
            userCode.value = payload.sub;
        }
    });

    function login(aToken, rToken) {
        accessToken.value = aToken;
        refreshToken.value = rToken;
        localStorage.setItem('accessToken', aToken);
        localStorage.setItem('refreshToken', rToken);
        const payload = JSON.parse(atob(aToken.split('.')[1]));
        userRole.value = payload.auth[0].authority.slice(5);
        userCode.value = payload.sub;
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

    return { accessToken, refreshToken, userRole, userCode, login, logout, isAuthorized, setAccessToken, setRefreshToken };
});