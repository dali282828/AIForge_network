import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Use direct backend URL (CORS is enabled on backend)
// For production, always use the Fly.io backend
// For local development, use localhost
// Environment variable VITE_API_URL takes precedence if set
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// Determine API base URL
// Priority: 1. VITE_API_URL env var, 2. localhost check, 3. Fly.io production
const apiBaseURL = import.meta.env.VITE_API_URL || 
  (isLocalhost 
    ? 'http://localhost:8000/api' 
    : 'https://aiforge-backend.fly.dev/api')

// Log API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('API Base URL:', apiBaseURL)
}

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

