import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken })
          useAuthStore.setState({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
          originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          useAuthStore.getState().logout()
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
