/**
 * Dashboard API Service
 * Provides data for the new dashboard components
 */

import { apiClient } from './api'

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
      // Get data from new backend endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/dashboard/stats`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        return {
          totalIncome: result.data.totalIncome,
          totalExpenses: result.data.totalExpenses,
          netProfit: result.data.netProfit,
          remainingCredits: result.data.remainingCredits,
          trends: result.data.trends
        }
      } else {
        throw new Error('Backend returned unsuccessful response')
      }
    } catch (error) {
      console.warn('Failed to fetch dashboard stats from backend, using fallback:', error)

      // Fallback to mock data
      return {
        totalIncome: 245680,
        totalExpenses: 156420,
        netProfit: 89260,
        remainingCredits: 1000,
        trends: {
          income: 15.3,
          expenses: -8.7,
          profit: 23.8,
          credits: -5.2
        }
      }
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      // Get data from new backend endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/dashboard/recent-activity`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        throw new Error('Backend returned unsuccessful response')
      }
    } catch (error) {
      console.warn('Failed to fetch recent activity from backend, using fallback:', error)

      return [
        {
          id: '1',
          type: 'invoice',
          title: 'Nová faktura od Askela s.r.o.',
          description: 'před 2 hodinami',
          amount: '45,000 CZK',
          time: 'před 2 hodinami',
          icon: 'FileText',
          color: 'blue'
        },
        {
          id: '2',
          type: 'approval',
          title: 'Schválena faktura #2024-001',
          description: 'před 4 hodinami',
          amount: '23,450 CZK',
          time: 'před 4 hodinami',
          icon: 'CheckCircle',
          color: 'green'
        },
        {
          id: '3',
          type: 'upload',
          title: 'Nahráno 5 nových dokumentů',
          description: 'včera',
          time: 'včera',
          icon: 'Upload',
          color: 'purple'
        }
      ]
    }
  }

  /**
   * Get AI insights and recommendations
   */
  async getAIInsights(): Promise<AIInsight[]> {
    try {
      // Get data from new backend endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/dashboard/ai-insights`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        throw new Error('Backend returned unsuccessful response')
      }
    } catch (error) {
      console.warn('Failed to fetch AI insights from backend, using fallback:', error)

      return [
        {
          type: 'positive',
          title: 'Pozitivní trend',
          description: 'Příjmy rostou rychleji než výdaje',
          icon: 'TrendingUp'
        },
        {
          type: 'warning',
          title: 'Upozornění',
          description: '3 faktury s blížící se splatností',
          icon: 'AlertTriangle'
        },
        {
          type: 'success',
          title: 'Cíl splněn',
          description: 'Měsíční cíl na 89%',
          icon: 'Target'
        }
      ]
    }
  }

  /**
   * Get monthly financial data for charts
   */
  async getMonthlyData(): Promise<MonthlyData[]> {
    try {
      // Get data from new backend endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/dashboard/monthly-data`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        throw new Error('Backend returned unsuccessful response')
      }
    } catch (error) {
      console.warn('Failed to fetch monthly data from backend, using fallback:', error)

      return [
        { month: "Led", income: 180000, expenses: 120000, profit: 60000 },
        { month: "Úno", income: 220000, expenses: 140000, profit: 80000 },
        { month: "Bře", income: 190000, expenses: 130000, profit: 60000 },
        { month: "Dub", income: 240000, expenses: 150000, profit: 90000 },
        { month: "Kvě", income: 260000, expenses: 160000, profit: 100000 },
        { month: "Čer", income: 245000, expenses: 156000, profit: 89000 },
      ]
    }
  }

  /**
   * Get expense categories for pie chart
   */
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    try {
      // Get data from new backend endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/dashboard/expense-categories`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        throw new Error('Backend returned unsuccessful response')
      }
    } catch (error) {
      console.warn('Failed to fetch expense categories from backend, using fallback:', error)

      return [
        { name: "Služby", value: 45, color: "#3b82f6" },
        { name: "Materiál", value: 30, color: "#10b981" },
        { name: "Energie", value: 15, color: "#f59e0b" },
        { name: "Ostatní", value: 10, color: "#ef4444" },
      ]
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
