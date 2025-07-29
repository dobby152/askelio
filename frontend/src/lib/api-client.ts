/**
 * API Client for Askelio Backend
 * Handles authentication and API calls to the backend
 */

import { secureLogger } from './secure-logger'
import AskelioSDK from './askelio-sdk.js'
import { secureSessionManager } from './secure-session-manager'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  status?: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name?: string
}

export interface AuthData {
  user: {
    id: string
    email: string
    full_name?: string
    credit_balance: number
    subscription_tier: string
    subscription_expires_at?: string
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
    token_type: string
  }
}

class ApiClient {
  private baseUrl: string
  private accessToken: string | null = null
  private sdk: AskelioSDK

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl

    // Initialize SDK with automatic token refresh
    this.sdk = new AskelioSDK(this.baseUrl, {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000
    })

    // Set up token refresh callback
    this.sdk.setTokenRefreshCallback((session, error) => {
      if (session) {
        secureLogger.authEvent('Token refreshed automatically', { expires_at: session.expires_at })
        // Update local access token
        this.accessToken = session.access_token
      } else if (error) {
        secureLogger.authEvent('Token refresh failed', { error: error.message })
        // Clear local token on refresh failure
        this.accessToken = null
      }
    })

    // ✅ SECURE: Load token from secure session manager
    this.initializeSession()
  }

  private async initializeSession() {
    if (typeof window !== 'undefined') {
      const session = await secureSessionManager.getSession()
      if (session) {
        this.accessToken = session.access_token
        this.sdk.setAuthToken(session.access_token)
        secureLogger.authEvent('Session loaded from secure storage')
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add authorization header if token exists
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        // Map HTTP status codes to specific error types
        let errorType = data.error || 'unknown_error'

        if (response.status === 401) {
          errorType = 'authentication_required'
        } else if (response.status === 403) {
          errorType = 'access_forbidden'
        } else if (response.status === 429) {
          errorType = 'rate_limit_exceeded'
        } else if (response.status >= 500) {
          errorType = 'server_error'
        } else if (response.status >= 400) {
          errorType = 'client_error'
        }

        return {
          success: false,
          message: data.message || 'Request failed',
          error: errorType,
          status: response.status
        }
      }

      return data
    } catch (error) {
      secureLogger.apiRequest(options.method || 'GET', url, undefined, error)
      return {
        success: false,
        message: 'Network error',
        error: 'network_error'
      }
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<AuthData>> {
    console.log('🔐 API Client: Login attempt for:', email)
    const response = await this.request<AuthData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    console.log('🔐 API Client: Login response:', response)

    if (response.success && response.data?.session) {
      await this.setTokens(response.data.session)
      if (response.data.user) {
        this.setStoredUserData(response.data.user)
      }
    }

    return response
  }

  async register(email: string, password: string, fullName?: string): Promise<ApiResponse<AuthData>> {
    const response = await this.request<AuthData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        full_name: fullName 
      }),
    })

    if (response.success && response.data?.session) {
      await this.setTokens(response.data.session)
      if (response.data.user) {
        this.setStoredUserData(response.data.user)
      }
    }

    return response
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    })

    await this.clearTokens()
    return response
  }

  async refreshToken(): Promise<ApiResponse<AuthData>> {
    const refreshToken = await this.getRefreshToken()
    if (!refreshToken) {
      return {
        success: false,
        message: 'No refresh token available',
        error: 'no_refresh_token'
      }
    }

    const response = await this.request<AuthData>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (response.success && response.data?.session) {
      await this.setTokens(response.data.session)
    }

    return response
  }

  async resetPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  // ✅ SECURE: Token management with secure session manager
  private async setTokens(session: AuthData['session']) {
    if (typeof window !== 'undefined') {
      this.accessToken = session.access_token

      // Store tokens securely (handles private mode automatically)
      await secureSessionManager.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      })

      // Use SDK to manage tokens with automatic refresh
      this.sdk.setAuthTokens(session)

      secureLogger.authEvent('Tokens stored securely')
    }
  }

  private async clearTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = null

      // ✅ SECURE: Clear tokens from secure session manager
      await secureSessionManager.clearSession()

      // Use SDK to clear tokens and stop refresh timer
      this.sdk.clearAuthToken()

      secureLogger.authEvent('All tokens cleared securely')
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return await secureSessionManager.getRefreshToken()
    }
    return null
  }

  // ✅ SECURE: Check if user is authenticated using secure session manager
  async isAuthenticated(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    return await secureSessionManager.isSessionValid()
  }

  // Synchronous version for backward compatibility (less secure)
  isAuthenticatedSync(): boolean {
    return this.accessToken !== null
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken
  }

  getStoredUserData(): any | null {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('askelio_user_data')
        return userData ? JSON.parse(userData) : null
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        return null
      }
    }
    return null
  }

  private setStoredUserData(userData: any): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('askelio_user_data', JSON.stringify(userData))
      } catch (error) {
        console.error('Error storing user data:', error)
      }
    }
  }

  // User profile methods
  async getUserProfile(): Promise<ApiResponse<AuthData['user']>> {
    return this.request('/auth/profile')
  }

  // Document processing methods
  async processDocument(file: File, options?: any): Promise<ApiResponse> {
    const formData = new FormData()
    formData.append('file', file)
    
    if (options) {
      formData.append('options', JSON.stringify(options))
    }

    const headers: HeadersInit = {}
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/documents/process`, {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Document processing failed',
          error: data.error || 'processing_error'
        }
      }

      return data
    } catch (error) {
      console.error('Document processing failed:', error)
      return {
        success: false,
        message: 'Network error during document processing',
        error: 'network_error'
      }
    }
  }

  // Generic GET method for dashboard and other endpoints
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // Generic POST method
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health')
  }

  // ===== COMPANY MANAGEMENT =====

  async createCompany(companyData: {
    name: string
    legal_name?: string
    registration_number?: string
    tax_number?: string
    email?: string
    phone?: string
    website?: string
    address_line1?: string
    address_line2?: string
    city?: string
    postal_code?: string
    country?: string
    billing_email?: string
  }): Promise<ApiResponse> {
    return this.request('/api/companies', {
      method: 'POST',
      body: JSON.stringify(companyData)
    })
  }

  async getUserCompanies(): Promise<ApiResponse> {
    return this.request('/api/companies')
  }

  async getCompanyDetails(companyId: string): Promise<ApiResponse> {
    return this.request(`/api/companies/${companyId}`)
  }

  async updateCompany(companyId: string, updates: any): Promise<ApiResponse> {
    return this.request(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async getAvailablePlans(): Promise<ApiResponse> {
    return this.request('/api/companies/plans/available')
  }

  async upgradeCompanyPlan(companyId: string, planName: string): Promise<ApiResponse> {
    return this.request(`/api/companies/${companyId}/upgrade-plan`, {
      method: 'POST',
      body: JSON.stringify({ plan_name: planName })
    })
  }

  async checkCompanyLimits(companyId: string, limitType: 'users' | 'documents' | 'storage'): Promise<ApiResponse> {
    return this.request(`/api/companies/${companyId}/limits/${limitType}`)
  }

  async inviteUser(companyId: string, email: string, roleName: string): Promise<ApiResponse> {
    return this.request(`/api/companies/${companyId}/users/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role_name: roleName })
    })
  }

  async removeUser(companyId: string, userId: string): Promise<ApiResponse> {
    return this.request(`/api/companies/${companyId}/users/${userId}`, {
      method: 'DELETE'
    })
  }

  async updateUserRole(companyId: string, userId: string, roleName: string): Promise<ApiResponse> {
    return this.request(`/api/companies/${companyId}/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role_name: roleName })
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
