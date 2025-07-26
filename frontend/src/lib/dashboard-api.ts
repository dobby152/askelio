/**
 * Dashboard API Service
 * Provides data for the new dashboard components
 */

import { apiClient } from './api'
import { apiClient as authApiClient } from './api-client'

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  remainingCredits: number
  trends: {
    income: number
    expenses: number
    profit: number
    credits: number
  }
}

export interface RecentActivity {
  id: string
  type: 'invoice' | 'approval' | 'upload'
  title: string
  description: string
  amount?: string
  time: string
  icon: string
  color: string
}

export interface AIInsight {
  type: 'positive' | 'warning' | 'success'
  title: string
  description: string
  icon: string
}

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  color: string
  action: () => void
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
  profit: number
}

export interface ExpenseCategory {
  name: string
  value: number
  color: string
}

class DashboardAPI {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    try {
      console.log('🚀 Dashboard API: Starting getStats request...')

      // Check if authApiClient has a valid token
      const hasToken = authApiClient.getAccessToken()
      console.log('🔐 Dashboard API: Has access token:', !!hasToken)
      console.log('🔐 Dashboard API: Token value (first 20 chars):', hasToken ? hasToken.substring(0, 20) + '...' : 'null')

      // Check localStorage tokens
      if (typeof window !== 'undefined') {
        const localToken = localStorage.getItem('access_token')
        const refreshToken = localStorage.getItem('refresh_token')
        const expiresAt = localStorage.getItem('token_expires_at')
        console.log('🔐 Dashboard API: LocalStorage access_token:', !!localToken)
        console.log('🔐 Dashboard API: LocalStorage refresh_token:', !!refreshToken)
        console.log('🔐 Dashboard API: Token expires at:', expiresAt)

        if (expiresAt) {
          const now = Math.floor(Date.now() / 1000)
          const expires = parseInt(expiresAt)
          console.log('🔐 Dashboard API: Token expired?', expires < now)
          console.log('🔐 Dashboard API: Time until expiry (seconds):', expires - now)
        }
      }

      // Get data from new backend endpoint with authentication
      const result = await authApiClient.get('/dashboard/stats')

      console.log('📊 Dashboard API getStats result type:', typeof result)
      console.log('📊 Dashboard API getStats result keys:', Object.keys(result || {}))
      console.log('📊 Dashboard API getStats full result:', JSON.stringify(result, null, 2))

      // Handle empty or invalid response
      if (!result || typeof result !== 'object') {
        console.error('❌ Dashboard API: Received invalid response type:', typeof result)
        throw new Error('Invalid response from backend - expected object but got ' + typeof result)
      }

      // Check for authentication errors
      if (result.error === 'authentication_required') {
        console.error('🔐 Dashboard API: Authentication required')
        throw new Error('Authentication required - please log in again')
      }

      if (result.success && result.data) {
        console.log('✅ Dashboard API: Successfully parsed stats data')
        return {
          totalIncome: result.data.totalIncome || 0,
          totalExpenses: result.data.totalExpenses || 0,
          netProfit: result.data.netProfit || 0,
          remainingCredits: result.data.remainingCredits || 0,
          trends: result.data.trends || {
            income: 0,
            expenses: 0,
            profit: 0,
            credits: 0
          }
        }
      } else {
        console.error('❌ Dashboard API getStats failed - invalid response structure:')
        console.error('   - success:', result.success)
        console.error('   - data:', result.data)
        console.error('   - message:', result.message)
        console.error('   - error:', result.error)
        console.error('   - status:', result.status)

        const errorMessage = result.message || result.error || 'Unknown error - invalid response structure'
        throw new Error(`Backend returned unsuccessful response: ${errorMessage}`)
      }
    } catch (error) {
      console.error('💥 Dashboard API: Exception in getStats:', error)
      console.error('💥 Dashboard API: Error type:', error.constructor.name)
      console.error('💥 Dashboard API: Error message:', error.message)

      // If it's a network error, provide specific guidance
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.error('🌐 Dashboard API: Network error - check if backend is running on port 8001')
      }

      // Return zero values instead of mock data to show real state
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        remainingCredits: 0,
        trends: {
          income: 0,
          expenses: 0,
          profit: 0,
          credits: 0
        }
      }
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      console.log('🚀 Dashboard API: Starting getRecentActivity request...')

      // Get data from new backend endpoint with authentication
      const result = await authApiClient.get('/dashboard/recent-activity')

      console.log('📋 Dashboard API getRecentActivity result:', JSON.stringify(result, null, 2))

      // Handle empty or invalid response
      if (!result || typeof result !== 'object') {
        console.error('❌ Dashboard API: Received invalid response type for recent activity:', typeof result)
        throw new Error('Invalid response from backend - expected object but got ' + typeof result)
      }

      if (result.success && result.data) {
        console.log('✅ Dashboard API: Successfully parsed recent activity data')
        return result.data
      } else {
        console.error('❌ Dashboard API getRecentActivity failed:')
        console.error('   - success:', result.success)
        console.error('   - data:', result.data)
        console.error('   - message:', result.message)
        console.error('   - error:', result.error)

        const errorMessage = result.message || result.error || 'Unknown error - invalid response structure'
        throw new Error(`Backend returned unsuccessful response: ${errorMessage}`)
      }
    } catch (error) {
      console.error('💥 Dashboard API: Exception in getRecentActivity:', error)

      // Return empty array instead of mock data to show real state
      return []
    }
  }

  /**
   * Get AI insights and recommendations
   */
  async getAIInsights(): Promise<AIInsight[]> {
    try {
      console.log('🚀 Dashboard API: Starting getAIInsights request...')

      // Get data from backend endpoint with proper authentication
      const result = await authApiClient.get('/dashboard/ai-insights')
      console.log('🤖 Dashboard API getAIInsights result:', JSON.stringify(result, null, 2))

      // Handle empty or invalid response
      if (!result || typeof result !== 'object') {
        console.error('❌ Dashboard API: Received invalid response type for AI insights:', typeof result)
        throw new Error('Invalid response from backend - expected object but got ' + typeof result)
      }

      if (result.success && result.data) {
        console.log('✅ Dashboard API: Successfully parsed AI insights data')
        return result.data
      } else {
        console.error('❌ Dashboard API getAIInsights failed:')
        console.error('   - success:', result.success)
        console.error('   - data:', result.data)
        console.error('   - message:', result.message)
        console.error('   - error:', result.error)

        const errorMessage = result.message || result.error || 'Unknown error - invalid response structure'
        throw new Error(`Backend returned unsuccessful response: ${errorMessage}`)
      }
    } catch (error) {
      console.error('💥 Dashboard API: Exception in getAIInsights:', error)

      // Return empty array instead of mock data to show real state
      return []
    }
  }

  /**
   * Get monthly financial data for charts
   */
  async getMonthlyData(): Promise<MonthlyData[]> {
    try {
      // Get data from new backend endpoint with authentication
      const result = await authApiClient.get('/dashboard/monthly-data')

      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error('Backend returned unsuccessful response')
      }
    } catch (error) {
      console.error('Failed to fetch monthly data from backend:', error)

      // Return empty array instead of mock data to show real state
      return []
    }
  }

  /**
   * Get expense categories for pie chart
   */
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    try {
      // Get data from new backend endpoint with authentication
      const result = await authApiClient.get('/dashboard/expense-categories')

      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error('Backend returned unsuccessful response')
      }
    } catch (error) {
      console.error('Failed to fetch expense categories from backend:', error)

      // Return empty array instead of mock data to show real state
      return []
    }
  }

  /**
   * Get documents for documents page
   */
  async getDocuments() {
    return await apiClient.getDocuments()
  }

  /**
   * Upload document
   */
  async uploadDocument(file: File, options = {}) {
    return await apiClient.processDocument(file, options)
  }
}

export const dashboardAPI = new DashboardAPI()
