import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '../api/client'

interface User {
  id: number
  email: string
  username: string
  full_name?: string
  is_active: boolean
  is_verified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
  setAuth: (token: string, user: User) => void
  setToken: (token: string) => void
  setAdminStatus: (isAdmin: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      login: async (email: string, password: string) => {
        const formData = new URLSearchParams()
        formData.append('username', email)
        formData.append('password', password)
        
        const response = await api.post('/auth/login', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
        
        const { access_token } = response.data
        
        // Get user info from /me endpoint
        const userResponse = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${access_token}` },
        })
        
        set({
          token: access_token,
          user: userResponse.data,
          isAuthenticated: true,
        })
      },
      register: async (email: string, username: string, password: string, fullName?: string) => {
        await api.post('/auth/register', {
          email,
          username,
          password,
          full_name: fullName,
        })
        
        // After registration, log in
        await useAuthStore.getState().login(email, password)
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
        })
      },
      setAuth: (token: string, user: User) => {
        set({
          token,
          user,
          isAuthenticated: true,
        })
      },
      setToken: async (token: string) => {
        // Get user info with new token
        try {
          const userResponse = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          set({
            token,
            user: userResponse.data,
            isAuthenticated: true,
            // Admin status is not in /me response, keep existing value or reset to false
            isAdmin: false,
          })
        } catch (error) {
          // If getting user fails, just set token
          set({
            token,
            isAuthenticated: true,
            isAdmin: false,
          })
        }
      },
      setAdminStatus: (isAdmin: boolean) => {
        set({ isAdmin })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

