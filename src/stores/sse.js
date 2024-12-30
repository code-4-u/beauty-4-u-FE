import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { EventSourcePolyfill } from 'event-source-polyfill'
import HeartIcon from '@/assets/icons/heart.png';
import axios from "axios";
import { useAuthStore } from "@/stores/auth.js";

export const useSSEStore = defineStore('sse', () => {
    const notifications = ref([])
    const connectionStatus = ref('disconnected')
    let eventSource = null

    const loadInitialNotifications = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/v1/noti', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            })
            notifications.value = response.data.data
        } catch (error) {
            console.error('초기 알림 로드 실패:', error)
        }
    }

    const requestNotificationPermission = async () => {
        try {
            const permission = await Notification.requestPermission()
            return permission === 'granted'
        } catch (error) {
            console.error('알림 권한 요청 실패:', error)
            return false
        }
    }

    const showBrowserNotification = (data) => {
        if (Notification.permission === 'granted') {
            const notification = new Notification('새로운 알림', {
                body: data.notiContent,
                icon: HeartIcon,
                tag: data.id,
            })

            notification.onclick = () => {
                window.focus()
                if (data.notiUrl) {
                    window.location.href = data.notiUrl
                }
            }
        }
    }

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
        const token = localStorage.getItem('accessToken')
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }

        xhr.addEventListener('error', async function() {
            if (xhr.status === 401) {
                try {
                    const newToken = await refreshToken()
                    if (newToken) {
                        if (eventSource) {
                            eventSource.close()
                        }
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
            return
        }

        connectionStatus.value = 'connecting'
        await loadInitialNotifications()
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
                connectionStatus.value = 'connected'
            }

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.notiType) {
                        notifications.value = [data, ...notifications.value]
                        showBrowserNotification(data)
                    }
                } catch (error) {
                    console.error('메시지 파싱 에러:', error)
                }
            }

            eventSource.onerror = (error) => {
                console.error('SSE 에러:', error)
                connectionStatus.value = 'error'

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
    }

    const markAsRead = (notiId) => {
        notifications.value = notifications.value.filter(noti => noti.notiId !== notiId);
    }

    const isConnected = computed(() => connectionStatus.value === 'connected')

    return {
        notifications,
        connectionStatus,
        connectSSE,
        disconnectSSE,
        isConnected,
        loadInitialNotifications,
        markAsRead
    }
})