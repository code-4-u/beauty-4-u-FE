import axios from "axios";
import {useAuthStore} from "@/stores/auth.js";
import {params} from "sockjs-client";

const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    withCredentials: true
});

// 요청 인터셉터
apiClient.interceptors.request.use(
    (config) => {
        console.log('요청 인터셉터:', config);

        const authStore = useAuthStore();
        if (authStore.accessToken) {
            config.headers.Authorization = `Bearer ${authStore.accessToken}`;
        }

        return config;
    },
    (error) => {
        console.error('요청 인터셉터 에러:', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
    (response) => {
        console.log('응답 인터셉터:', response);

        return response;
    },
    async (error) => {
        console.error('응답 인터셉터 에러:', error);

        const authStore = useAuthStore();

        // 401 Unauthorized 에러 처리 (액세스 토큰 만료)
        if (error.response?.status === 401) {
            try {

                // 액세스 토큰 갱신
                const response = await axios.post('http://localhost:8080/api/v1/auth/refresh', {}, {
                    withCredentials: true,
                    headers: {
                        'Refresh-Token': authStore.refreshToken
                    }
                });

                const newAccessToken = response.headers['authorization'];
                const newRefreshToken = response.headers['refresh-token'];

                if (newAccessToken && newRefreshToken) {
                    console.log('새로운 토큰 수신됨');
                    authStore.setAccessToken(newAccessToken);
                    authStore.setRefreshToken(newRefreshToken);

                    // 새 토큰으로 원래 요청 재시도
                    error.config.headers.Authorization = `Bearer ${newAccessToken}`;
                    return apiClient(error.config);
                }
            } catch (refreshError) {
                // 토큰 갱신 실패시 로그아웃
                authStore.logout();
                throw refreshError;
            }
        }

        return Promise.reject(error);
    }
);

/* 공통 요청 함수 */
const request = async (method, endpoint, data = null, params=null) => {
    try {
        return await apiClient.request({
            method: method,
            url: endpoint,
            data: data,
            params: params
        });
    } catch (error) {
        console.log('api 요청 중 에러 발생');
        throw error;
    }
};

const getFetch = (endpoint) => request('GET', endpoint, null, params);
const postFetch = (endpoint, data) => request('POST', endpoint, data);
const putFetch = (endpoint, data) => request('PUT', endpoint, data);
const delFetch = (endpoint) => request('DELETE', endpoint);

export { getFetch, postFetch, putFetch, delFetch };