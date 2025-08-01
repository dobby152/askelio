/**
 * AI Analytics API Service
 * Advanced analytics and predictions
 */

import { apiClient } from './api-client'

export interface PredictionResult {
  prediction_type: string
  period_days: number
  predicted_value: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  factors: string[]
  generated_at: string
}

export interface WidgetData {
  widget_type: string
  data: any
  generated_at: string
}

export interface PeriodComparison {
  period_a: {
    start: string
    end: string
    data: any
  }
  period_b: {
    start: string
    end: string
    data: any
  }
  comparison: {
    income_change: any
    expense_change: any
    profit_change: any
    summary: string
  }
  generated_at: string
}

export interface AdvancedInsights {
  predictions: {
    revenue: any
    expenses: any
    cashflow: any
  }
  insights: any[]
  summary: string
  generated_at: string
}

export interface CustomerSegmentation {
  segmentation: {
    vip_customers: any
    regular_customers: any
    occasional_customers: any
  }
  total_customers: number
  recommendations: string[]
  generated_at: string
}

export interface RiskAnalysis {
  overall_risk: 'low' | 'medium' | 'high'
  risk_score: number
  risk_factors: any[]
  recommendations: string[]
  generated_at: string
}

export interface SavedReport {
  id: string
  name: string
  description: string
  widgets_count: number
  saved_at: string
  last_accessed: string
}

class AIAnalyticsAPI {
  /**
   * Get AI prediction for specific metric
   */
  async getPrediction(predictionType: string, periodDays: number = 30): Promise<PredictionResult> {
    try {
      console.log(`🔮 AI Analytics: Getting ${predictionType} prediction for ${periodDays} days`)

      const result = await apiClient.get(`/ai-analytics/predictions/${predictionType}?period_days=${periodDays}`)
      
      if (result.success && result.data) {
        console.log('✅ AI Analytics: Successfully got prediction')
        return result.data
      } else {
        throw new Error(result.message || 'Failed to get prediction')
      }
    } catch (error) {
      console.error('💥 AI Analytics: Exception in getPrediction:', error)
      throw error
    }
  }

  /**
   * Get data for analytics widget
   */
  async getWidgetData(widgetType: string, config: any): Promise<WidgetData> {
    try {
      console.log(`📊 AI Analytics: Getting widget data for ${widgetType}`)

      const result = await apiClient.post(`/ai-analytics/widgets/${widgetType}/data`, config)
      
      if (result.success && result.data) {
        console.log('✅ AI Analytics: Successfully got widget data')
        return {
          widget_type: (result as any).widget_type,
          data: (result as any).data,
          generated_at: (result as any).generated_at
        }
      } else {
        throw new Error(result.message || 'Failed to get widget data')
      }
    } catch (error) {
      console.error('💥 AI Analytics: Exception in getWidgetData:', error)
      throw error
    }
  }

  /**
   * Compare two time periods
   */
  async comparePeriods(
    periodAStart: string,
    periodAEnd: string,
    periodBStart: string,
    periodBEnd: string
  ): Promise<PeriodComparison> {
    try {
      console.log('📊 AI Analytics: Comparing periods')

      const result = await apiClient.post('/ai-analytics/compare-periods', {
        period_a_start: periodAStart,
        period_a_end: periodAEnd,
        period_b_start: periodBStart,
        period_b_end: periodBEnd
      })
      
      if (result.success && result.data) {
        console.log('✅ AI Analytics: Successfully compared periods')
        return result.data
      } else {
        throw new Error(result.message || 'Failed to compare periods')
      }
    } catch (error) {
      console.error('💥 AI Analytics: Exception in comparePeriods:', error)
      throw error
    }
  }

  /**
   * Get advanced AI insights and recommendations
   */
  async getAdvancedInsights(): Promise<AdvancedInsights> {
    try {
      console.log('🤖 AI Analytics: Getting advanced insights')

      const result = await apiClient.get('/ai-analytics/insights/advanced')
      
      if (result.success && result.data) {
        console.log('✅ AI Analytics: Successfully got advanced insights')
        return result.data
      } else {
        throw new Error(result.message || 'Failed to get advanced insights')
      }
    } catch (error) {
      console.error('💥 AI Analytics: Exception in getAdvancedInsights:', error)
      throw error
    }
  }

  /**
   * Get financial metrics analysis
   */
  async getFinancialMetrics(): Promise<any> {
    try {
      console.log('📊 AI Analytics: Getting financial metrics')

      const result = await apiClient.get('/ai-analytics/financial-metrics')

      if (result.success && result.data) {
        console.log('✅ AI Analytics: Successfully got financial metrics')
        return result.data
      } else {
        throw new Error(result.message || 'Failed to get financial metrics')
      }
    } catch (error) {
      console.error('💥 AI Analytics: Exception in getFinancialMetrics:', error)
      throw error
    }
  }

  /**
   * Get risk analysis and factors
   */
  async getRiskAnalysis(): Promise<RiskAnalysis> {
    try {
      console.log('⚠️ AI Analytics: Getting risk analysis')

      const result = await apiClient.get('/ai-analytics/risk-analysis')
      
      if (result.success && result.data) {
        console.log('✅ AI Analytics: Successfully got risk analysis')
        return result.data
      } else {
        throw new Error(result.message || 'Failed to get risk analysis')
      }
    } catch (error) {
      console.error('💥 AI Analytics: Exception in getRiskAnalysis:', error)
      throw error
    }
  }

  /**
   * Save custom analytics report
   */
  async saveCustomReport(reportData: any): Promise<any> {
    try {
      console.log('💾 AI Analytics: Saving custom report')

      const result = await apiClient.post('/ai-analytics/reports/save', reportData)
      
      if (result.success && result.data) {
        console.log('✅ AI Analytics: Successfully saved custom report')
        return result.data
      } else {
        throw new Error(result.message || 'Failed to save custom report')
      }
    } catch (error) {
      console.error('💥 AI Analytics: Exception in saveCustomReport:', error)
      throw error
    }
  }

  /**
   * List saved analytics reports
   */
  async listSavedReports(): Promise<SavedReport[]> {
    try {
      console.log('📋 AI Analytics: Listing saved reports')

      const result = await apiClient.get('/ai-analytics/reports/list')
      
      if (result.success && result.data) {
        console.log('✅ AI Analytics: Successfully got saved reports')
        return result.data.reports
      } else {
        throw new Error(result.message || 'Failed to get saved reports')
      }
    } catch (error) {
      console.error('💥 AI Analytics: Exception in listSavedReports:', error)
      throw error
    }
  }

  /**
   * Generate multiple predictions at once
   */
  async getMultiplePredictions(types: string[], periodDays: number = 30): Promise<Record<string, PredictionResult>> {
    try {
      console.log(`🔮 AI Analytics: Getting multiple predictions: ${types.join(', ')}`)

      const predictions: Record<string, PredictionResult> = {}
      
      // Get all predictions in parallel
      const promises = types.map(async (type) => {
        const prediction = await this.getPrediction(type, periodDays)
        return { type, prediction }
      })
      
      const results = await Promise.all(promises)
      
      results.forEach(({ type, prediction }) => {
        predictions[type] = prediction
      })
      
      console.log('✅ AI Analytics: Successfully got multiple predictions')
      return predictions
    } catch (error) {
      console.error('💥 AI Analytics: Exception in getMultiplePredictions:', error)
      throw error
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getComprehensiveDashboard(): Promise<any> {
    try {
      console.log('📊 AI Analytics: Getting comprehensive dashboard data')

      // Get all data in parallel
      const [
        advancedInsights,
        financialMetrics,
        riskAnalysis,
        predictions
      ] = await Promise.all([
        this.getAdvancedInsights(),
        this.getFinancialMetrics(),
        this.getRiskAnalysis(),
        this.getMultiplePredictions(['revenue', 'expenses', 'cashflow'])
      ])

      const dashboardData = {
        insights: advancedInsights,
        metrics: financialMetrics,
        risk: riskAnalysis,
        predictions,
        generated_at: new Date().toISOString()
      }

      console.log('✅ AI Analytics: Successfully got comprehensive dashboard data')
      return dashboardData
    } catch (error) {
      console.error('💥 AI Analytics: Exception in getComprehensiveDashboard:', error)
      throw error
    }
  }
}

// Export singleton instance
export const aiAnalyticsAPI = new AIAnalyticsAPI()
