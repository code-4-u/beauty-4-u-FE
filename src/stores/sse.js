import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { EventSourcePolyfill } from 'event-source-polyfill'
import HeartIcon from '@/assets/icons/heart.png'
import axios from "axios"
import { useAuthStore } from "@/stores/auth.js"
import { getFetch } from "@/stores/apiClient.js"

export const useSSEStore = defineStore('sse', () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    const notifications = ref([])
    const connectionStatus = ref('disconnected') // disconnected, connecting, connected, error, auth_failed, failed
    const MAX_RECONNECT_ATTEMPTS = 5
    const INITIAL_RETRY_DELAY = 1000
    const reconnectAttempts = ref(0)
    let eventSource = null

    const getRetryDelay = () => {
        return Math.min(INITIAL_RETRY_DELAY * Math.pow(2, reconnectAttempts.value), 30000)
    }

    const loadInitialNotifications = async () => {
        const accessToken = localStorage.getItem('accessToken')
        if (!accessToken) return

        try {
            const response = await getFetch('/noti')
            notifications.value = response.data.data
        } catch (error) {
            // console.error('초기 알림 로드 실패:', error)
            throw error
        }
    }

    const requestNotificationPermission = async () => {
        try {
            const permission = await Notification.requestPermission()
            return permission === 'granted'
        } catch (error) {
            // console.error('알림 권한 요청 실패:', error)
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
                if (data.notiUrl && data.notiUrl !== '팀 일정') {
                    window.location.href = data.notiUrl
                }
            }
        }
    }

    const refreshToken = async () => {
        const authStore = useAuthStore()
        try {
            const response = await axios.post(`${baseUrl}/auth/refresh`, {}, {
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
            // console.error('토큰 갱신 실패:', error)
            authStore.logout()
            throw error
        }
    }

    const beforeRequest = async (xhr) => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            throw new Error('인증 토큰이 없습니다.')
        }

        xhr.setRequestHeader('Authorization', `Bearer ${token}`)

        xhr.addEventListener('error', async function() {
            if (xhr.status === 401) {
                try {
                    const newToken = await refreshToken()
                    if (newToken) {
                        if (eventSource) {
                            eventSource.close()
                            eventSource = null
                        }
                        reconnectAttempts.value = 0
                        await connectSSE()
                    }
                } catch (error) {
                    // console.error('토큰 갱신 실패:', error)
                    connectionStatus.value = 'auth_failed'
                    throw error
                }
            }
        })
    }

    const connectSSE = async () => {
        if (connectionStatus.value === 'connecting' || connectionStatus.value === 'connected') {
            // console.log('이미 연결중이거나 연결된 상태입니다.')
            return
        }

        if (eventSource) {
            eventSource.close()
            eventSource = null
        }

        connectionStatus.value = 'connecting'

        try {
            await loadInitialNotifications()
            await requestNotificationPermission()

            const token = localStorage.getItem('accessToken')
            if (!token) {
                throw new Error('인증 토큰이 없습니다.')
            }

            const options = {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true,
                heartbeatTimeout: 3600000,
                beforeRequest
            }

            try {
                eventSource = new EventSourcePolyfill(`${baseUrl}/noti/connect`, options)
            } catch (err) {
                connectionStatus.value = 'error'
                return
            }
            eventSource.onopen = () => {
                connectionStatus.value = 'connected'
                reconnectAttempts.value = 0
            }

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.notiType) {
                        notifications.value = [data, ...notifications.value]
                        showBrowserNotification(data)
                    }
                } catch (error) {
                    // console.error('메시지 파싱 에러:', error)
                }
            }

            eventSource.onerror = async (error) => {
                // console.error('SSE 에러:', error)
                connectionStatus.value = 'error'


                if (error.status === 200) {
                    await connectSSE();
                    return;
                }

                if (eventSource) {
                    eventSource.close()

                    if (reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
                        const delay = getRetryDelay()
                        // console.log(`${delay}ms 후 재연결 시도...`)
                        reconnectAttempts.value++
                        await new Promise(resolve => setTimeout(resolve, delay))
                        await connectSSE()
                    } else {
                        // console.error('최대 재연결 시도 횟수 초과')
                        connectionStatus.value = 'failed'
                    }
                }
            }
        } catch (error) {
            // console.error('SSE 연결 준비 중 에러:', error)
            connectionStatus.value = 'error'
            throw error
        }
    }

    const disconnectSSE = () => {
        if (eventSource) {
            eventSource.close()
            eventSource = null
        }
        connectionStatus.value = 'disconnected'
        reconnectAttempts.value = 0
    }

    const markAsRead = (notiId) => {
        notifications.value = notifications.value.filter(noti => noti.notiId !== notiId)
    }

    const markAllAsRead = () => {
        notifications.value = []
    }

    const isConnected = computed(() => connectionStatus.value === 'connected')

    return {
        notifications,
        connectionStatus,
        connectSSE,
        disconnectSSE,
        isConnected,
        loadInitialNotifications,
        markAsRead,
        markAllAsRead
    }
})