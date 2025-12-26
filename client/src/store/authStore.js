import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'
import toast from 'react-hot-toast'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,

      login: async (email, password) => {
        try {
          const { data } = await api.post('/auth/login', { email, password })
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
          toast.success(`Welcome back, ${data.user.firstName}!`)
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      register: async (userData) => {
        try {
          const { data } = await api.post('/auth/register', userData)
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
          toast.success('Account created successfully!')
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Registration failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          console.error('Logout error:', error)
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
        delete api.defaults.headers.common['Authorization']
        toast.success('Logged out successfully')
      },

      checkAuth: async () => {
        const { accessToken } = get()
        if (!accessToken) {
          set({ isLoading: false })
          return
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data, isAuthenticated: true, isLoading: false })
        } catch (error) {
          // Try refresh token
          const { refreshToken } = get()
          if (refreshToken) {
            try {
              const { data } = await api.post('/auth/refresh', { refreshToken })
              api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
              set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
              
              const userRes = await api.get('/auth/me')
              set({ user: userRes.data, isAuthenticated: true, isLoading: false })
              return
            } catch (refreshError) {
              console.error('Token refresh failed')
            }
          }
          
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },

      updateProfile: async (profileData) => {
        try {
          const { data } = await api.put('/users/me', profileData)
          set({ user: { ...get().user, ...data } })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Profile update failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      completeOnboarding: async () => {
        try {
          const { data } = await api.post('/users/me/complete-onboarding')
          set({ user: { ...get().user, onboardingCompleted: true, ...data } })
          toast.success('Welcome aboard! Your onboarding is complete.')
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Failed to complete onboarding'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      toggleDarkMode: () => {
        set({ isDarkMode: !get().isDarkMode })
      },
    }),
    {
      name: 'ams-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
)
