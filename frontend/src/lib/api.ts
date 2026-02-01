// ============================================================================
// MindMap Hub - API Client Configuration
// ============================================================================
// Cliente Axios configurado para comunicação com o backend
// ============================================================================

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'

// ============================================================================
// API Configuration
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const REQUEST_TIMEOUT = 30000

// ============================================================================
// Create Axios Instance
// ============================================================================

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// ============================================================================
// Request Interceptor
// ============================================================================

apiClient.interceptors.request.use(
  (config) => {
    // Get token from auth store
    const token = useAuthStore.getState().accessToken
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId()
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================================================
// Response Interceptor
// ============================================================================

apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // Try to refresh token
        await useAuthStore.getState().refreshSession()
        
        // Retry original request with new token
        const token = useAuthStore.getState().accessToken
        if (token && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().signOut()
      }
    }

    // Handle other errors
    return Promise.reject(normalizeError(error))
  }
)

// ============================================================================
// Error Normalization
// ============================================================================

export interface APIError {
  message: string
  code: string
  status: number
  details?: Record<string, unknown>
}

function normalizeError(error: AxiosError): APIError {
  if (error.response) {
    // Server responded with error
    const data = error.response.data as any
    return {
      message: data?.detail || data?.message || 'Erro no servidor',
      code: data?.code || 'SERVER_ERROR',
      status: error.response.status,
      details: data
    }
  } else if (error.request) {
    // No response received
    return {
      message: 'Sem conexão com o servidor',
      code: 'NETWORK_ERROR',
      status: 0
    }
  } else {
    // Request setup error
    return {
      message: error.message || 'Erro na requisição',
      code: 'REQUEST_ERROR',
      status: 0
    }
  }
}

// ============================================================================
// Utilities
// ============================================================================

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// ============================================================================
// API Methods
// ============================================================================

export const api = {
  // GET request
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  // POST request
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  // PUT request
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  // PATCH request
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  // DELETE request
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data)
}

export default api
