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

export interface AnalyticsData {
  overview: {
    total_income: number
    total_expenses: number
    net_profit: number
    documents_this_period: number
    pending_approvals: number
    active_users: number
    total_storage_gb: number
    profit_margin: number
  }
  documents: {
    total_documents: number
    processed_documents: number
    pending_documents: number
    failed_documents: number
    document_types: Array<{
      type: string
      count: number
      percentage: number
    }>
  }
  trends: {
    monthly_data: Array<{
      month: string
      income: number
      expenses: number
      profit: number
      documents: number
    }>
    expense_categories: Array<{
      category: string
      amount: number
      percentage: number
      color: string
    }>
  }
  users: {
    total_users: number
    active_users: number
    user_activity: Array<{
      user_id: string
      name: string
      documents_processed: number
      accuracy_rate: number
      last_active: string
    }>
  }
  storage: {
    total_storage_gb: number
    used_storage_gb: number
    storage_by_type: Array<{
      type: string
      size_gb: number
      percentage: number
    }>
  }
}

export interface CompanyAnalytics {
  success: boolean
  data: AnalyticsData
  period: {
    start_date: string
    end_date: string
  }
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

  /**
   * Get comprehensive analytics for a company
   */
  async getCompanyAnalytics(companyId: string, startDate?: string, endDate?: string): Promise<CompanyAnalytics> {
    try {
      console.log('🚀 Dashboard API: Starting getCompanyAnalytics request...')

      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const url = `/analytics/companies/${companyId}${params.toString() ? '?' + params.toString() : ''}`
      const result = await authApiClient.get(url)

      console.log('📊 Dashboard API getCompanyAnalytics result:', JSON.stringify(result, null, 2))

      if (result.success && result.data) {
        console.log('✅ Dashboard API: Successfully parsed analytics data')
        return result
      } else {
        throw new Error(result.message || result.error || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('💥 Dashboard API: Exception in getCompanyAnalytics:', error)
      console.log('🔄 Dashboard API: Falling back to mock data for development')

      // Return mock data for development
      return {
        success: true,
        data: {
          overview: {
            total_income: 1250000,
            total_expenses: 850000,
            net_profit: 400000,
            documents_this_period: 47,
            pending_approvals: 8,
            active_users: 12,
            total_storage_gb: 15.7,
            profit_margin: 32.0
          },
          documents: {
            total_documents: 156,
            processed_documents: 147,
            pending_documents: 9,
            failed_documents: 0,
            document_types: [
              { type: 'Faktury', count: 89, percentage: 57.1 },
              { type: 'Smlouvy', count: 34, percentage: 21.8 },
              { type: 'Objednávky', count: 23, percentage: 14.7 },
              { type: 'Ostatní', count: 10, percentage: 6.4 }
            ]
          },
          trends: {
            monthly_data: [
              { month: 'Led', income: 180000, expenses: 120000, profit: 60000, documents: 23 },
              { month: 'Úno', income: 220000, expenses: 140000, profit: 80000, documents: 28 },
              { month: 'Bře', income: 190000, expenses: 130000, profit: 60000, documents: 25 },
              { month: 'Dub', income: 240000, expenses: 150000, profit: 90000, documents: 31 },
              { month: 'Kvě', income: 260000, expenses: 160000, profit: 100000, documents: 35 },
              { month: 'Čer', income: 245000, expenses: 156000, profit: 89000, documents: 33 }
            ],
            expense_categories: [
              { category: 'Služby', amount: 385000, percentage: 45.3, color: '#3b82f6' },
              { category: 'Materiál', amount: 255000, percentage: 30.0, color: '#10b981' },
              { category: 'Energie', amount: 127500, percentage: 15.0, color: '#f59e0b' },
              { category: 'Ostatní', amount: 82500, percentage: 9.7, color: '#ef4444' }
            ]
          },
          users: {
            total_users: 15,
            active_users: 12,
            user_activity: [
              { user_id: '1', name: 'Jan Novák', documents_processed: 23, accuracy_rate: 98.5, last_active: '2024-01-26T10:30:00Z' },
              { user_id: '2', name: 'Marie Svobodová', documents_processed: 19, accuracy_rate: 97.2, last_active: '2024-01-26T09:15:00Z' }
            ]
          },
          storage: {
            total_storage_gb: 15.7,
            used_storage_gb: 12.3,
            storage_by_type: [
              { type: 'PDF', size_gb: 8.5, percentage: 69.1 },
              { type: 'Images', size_gb: 2.8, percentage: 22.8 },
              { type: 'Other', size_gb: 1.0, percentage: 8.1 }
            ]
          }
        },
        period: {
          start_date: startDate || '2024-01-01',
          end_date: endDate || '2024-01-26'
        }
      }
    }
  }

  /**
   * Get monthly trend data for charts
   */
  async getMonthlyTrends(companyId: string, startDate?: string, endDate?: string): Promise<MonthlyData[]> {
    try {
      const analytics = await this.getCompanyAnalytics(companyId, startDate, endDate)
      return analytics.data.trends.monthly_data.map(item => ({
        month: item.month,
        income: item.income,
        expenses: item.expenses,
        profit: item.profit
      }))
    } catch (error) {
      console.error('Failed to fetch monthly trends:', error)
      return []
    }
  }

  /**
   * Get expense categories for pie chart
   */
  async getAnalyticsExpenseCategories(companyId: string, startDate?: string, endDate?: string): Promise<ExpenseCategory[]> {
    try {
      const analytics = await this.getCompanyAnalytics(companyId, startDate, endDate)
      return analytics.data.trends.expense_categories.map(item => ({
        name: item.category,
        value: item.percentage,
        color: item.color
      }))
    } catch (error) {
      console.error('Failed to fetch expense categories:', error)
      return []
    }
  }

  /**
   * Get overview metrics
   */
  async getOverviewMetrics(companyId: string): Promise<any> {
    try {
      const params = new URLSearchParams()
      const url = `/analytics/companies/${companyId}/overview`
      const result = await authApiClient.get(url)

      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.message || result.error || 'Failed to fetch overview')
      }
    } catch (error) {
      console.error('Failed to fetch overview metrics:', error)
      console.log('🔄 Dashboard API: Using mock overview data for development')

      // Return mock data for development
      return {
        total_income: 1250000,
        total_expenses: 850000,
        net_profit: 400000,
        documents_this_period: 47,
        pending_approvals: 8,
        active_users: 12,
        total_storage_gb: 15.7,
        profit_margin: 32.0
      }
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(companyId: string, format: 'csv' | 'json' = 'csv', startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const url = `/analytics/companies/${companyId}/export?${params.toString()}`
      const result = await authApiClient.post(url, {})

      if (result.success) {
        return result
      } else {
        throw new Error(result.message || result.error || 'Failed to export analytics')
      }
    } catch (error) {
      console.error('Failed to export analytics:', error)
      throw error
    }
  }
}

export const dashboardAPI = new DashboardAPI()
