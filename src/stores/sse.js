import { defineStore } from 'pinia'
import {computed, ref} from 'vue'
import { EventSourcePolyfill } from 'event-source-polyfill'
import HeartIcon from '@/assets/icons/heart.png';
import axios from "axios";
import {useAuthStore} from "@/stores/auth.js";

export const useSSEStore = defineStore('sse', () => {
    const notifications = ref([])
    const connectionStatus = ref('disconnected')
    let eventSource = null

    // 알림 권한 요청
    const requestNotificationPermission = async () => {
        try {
            const permission = await Notification.requestPermission()
            console.log('알림 권한:', permission)
            return permission === 'granted'
        } catch (error) {
            console.error('알림 권한 요청 실패:', error)
            return false
        }
    }

    // 브라우저 알림 표시
    const showBrowserNotification = (data) => {
        if (Notification.permission === 'granted') {
            const notification = new Notification('새로운 알림', {
                body: data.notiContent,
                icon: HeartIcon,
                tag: data.id,
            })

            // 알림 클릭 시 해당 페이지로 이동
            notification.onclick = () => {
                window.focus()
                if (data.notiUrl) {
                    window.location.href = data.notiUrl
                }
            }
        }
    }

    // 토큰 갱신 함수
    const refreshToken = async () => {
        const authStore = useAuthStore()
        try {
            const response = await axios.post('http://localhost:8080/api/v1/auth/refresh', {}, {
                withCredentials: true,
                headers: {
                    'Refresh-Token': authStore.refreshToken
                }
            })

            const newAccessToken = response.headers['authorization']
            const newRefreshToken = response.headers['refresh-token']

            if (newAccessToken && newRefreshToken) {
                console.log('새로운 토큰 발급 성공')
                localStorage.setItem('accessToken', newAccessToken)
                authStore.setAccessToken(newAccessToken)
                authStore.setRefreshToken(newRefreshToken)
                return newAccessToken
            }
            return null
        } catch (error) {
            console.error('토큰 갱신 실패:', error)
            authStore.logout()
            throw error
        }
    }

    const beforeRequest = async (xhr) => {
        // 요청 전 인터셉터
        console.log('SSE 요청 인터셉터 실행')

        // 현재 토큰 가져오기
        const token = localStorage.getItem('accessToken')
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }

        // 에러 핸들링을 위한 이벤트 리스너 추가
        xhr.addEventListener('error', async function() {
            if (xhr.status === 401) {
                console.log('SSE 연결 중 401 에러 발생')
                try {
                    const newToken = await refreshToken()
                    if (newToken) {
                        // 기존 연결 종료
                        if (eventSource) {
                            eventSource.close()
                        }
                        // 새 토큰으로 재연결
                        await connectSSE()
                    }
                } catch (error) {
                    console.error('토큰 갱신 실패:', error)
                }
            }
        })
    }

    const connectSSE = async () => {
        if (connectionStatus.value === 'connecting' || connectionStatus.value === 'connected') {
            console.log('이미 SSE가 연결중이거나 연결된 상태입니다.')
            return
        }

        connectionStatus.value = 'connecting'
        console.log('SSE 연결 시도')

        // 알림 권한 요청
        await requestNotificationPermission()

        const token = localStorage.getItem('accessToken')
        if (!token) {
            connectionStatus.value = 'disconnected'
            return
        }

        const options = {
            headers: { 'Authorization': `Bearer ${token}` },
            withCredentials: true,
            heartbeatTimeout: 3600000,
            beforeRequest
        }

        try {
            eventSource = new EventSourcePolyfill('http://localhost:8080/api/v1/noti/connect', options)

            eventSource.onopen = () => {
                console.log('SSE 연결 성공')
                connectionStatus.value = 'connected'
            }

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)

                    console.log(data)
                    if (data.notiType) {
                        notifications.value.push(data)
                        showBrowserNotification(data)
                    }
                } catch (error) {
                    console.error('메시지 파싱 에러:', error)
                }
            }

            eventSource.onerror = (error) => {
                console.error('SSE 에러:', error)
                connectionStatus.value = 'error'

                // 일반적인 연결 에러는 여기서 처리
                if (eventSource) {
                    eventSource.close()
                    setTimeout(connectSSE, 5000)
                }
            }
        } catch (error) {
            console.error('SSE 연결 실패:', error)
            connectionStatus.value = 'error'
            setTimeout(connectSSE, 5000)
        }
    }

    const disconnectSSE = () => {
        if (eventSource) {
            eventSource.close()
            eventSource = null
        }
        connectionStatus.value = 'disconnected'
        notifications.value = []
    }

    const isConnected = computed(() => connectionStatus.value === 'connected')

    return {
        notifications,
        connectionStatus,
        connectSSE,
        disconnectSSE,
        isConnected
    }
})