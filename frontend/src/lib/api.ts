// Complete API client with unified backend integration
import { supabase } from './supabase'
import { getSharedSDK } from './api-client'
import type {
  ProcessingOptions,
  ApiResponse,
  ProcessDocumentResponse,
  SystemStatus,
  CostStatistics,
  HealthStatus,
  ProcessingProgress
} from './askelio-types'

class ApiClient {
  private sdk: any

  constructor() {
    // Use the shared SDK instance to maintain authentication across all clients
    this.sdk = getSharedSDK()
  }

  private async getAuthHeaders() {
    return {}
  }

  /**
   * Upload and process document using unified endpoint
   * @param file - File to process
   * @param options - Processing options
   * @param onProgress - Progress callback
   * @returns Processing result
   */
  async uploadDocument(file: File, options: ProcessingOptions = {}, onProgress?: (progress: ProcessingProgress) => void): Promise<ApiResponse<ProcessDocumentResponse>> {
    console.log('🚀 API Client: Processing document with unified endpoint:', file.name)

    // Validate file first
    const validation = this.sdk.validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      console.warn('⚠️ File validation warnings:', validation.warnings)
    }

    try {
      // Use SDK with progress tracking
      const result = await this.sdk.processDocumentWithProgress(file, options, onProgress)
      console.log('✅ API Client: Document processed successfully:', result)
      return result
    } catch (error) {
      console.error('💥 API Client: Processing error:', error)
      throw error
    }
  }

  /**
   * Estimate processing cost before upload
   */
  async estimateCost(file: File, options: ProcessingOptions = {}): Promise<any> {
    return this.sdk.estimateCost(file, options)
  }

  /**
   * Batch process multiple documents
   */
  async batchProcessDocuments(files: File[], options: ProcessingOptions = {}, onProgress?: (progress: ProcessingProgress) => void): Promise<any[]> {
    return this.sdk.batchProcessDocuments(files, options, onProgress)
  }

  /**
   * Get system status and health information
   */
  async getSystemStatus(): Promise<SystemStatus> {
    return this.sdk.getSystemStatus()
  }

  /**
   * Get cost statistics and usage metrics
   */
  async getCostStatistics(): Promise<CostStatistics> {
    return this.sdk.getCostStatistics()
  }

  /**
   * Get health status of all components
   */
  async getHealthStatus(): Promise<HealthStatus> {
    return this.sdk.getHealthStatus()
  }

  async getDocuments(): Promise<any[]> {
    console.log('🚀 API Client: Fetching documents from backend (legacy endpoint)')

    try {
      const data = await this.sdk.getDocuments()
      console.log('📄 API Client: Documents received:', data)
      return data
    } catch (error) {
      console.error('💥 API Client: Backend connection failed:', error)
      console.error('🔧 Make sure backend is running on port 8001')
      console.error('🔧 Run: cd backend && python main.py')

      // Return empty array instead of throwing to prevent UI crash
      return []
    }
  }

  async getDocument(id: string): Promise<any> {
    console.log('🚀 API Client: Getting document details for ID:', id)

    try {
      const data = await this.sdk.getDocument(id)
      console.log('📄 API Client: Document data received:', data)
      return data
    } catch (error) {
      console.error('💥 API Client: Error fetching document:', error)
      throw error
    }
  }

  async deleteDocument(id: string): Promise<any> {
    console.log('🗑️ API Client: Deleting document from backend:', id)

    try {
      const result = await this.sdk.deleteDocument(parseInt(id))
      console.log('✅ API Client: Document deleted successfully:', result)
      return result
    } catch (error) {
      console.error('💥 API Client: Delete failed:', error)
      throw error
    }
  }



  async getCreditBalance(): Promise<number> {
    try {
      const response = await this.sdk.get('/credits')

      if (response.success && response.data) {
        return response.data.balance || response.data.credits || 2450
      } else {
        // Return default credits if endpoint doesn't exist
        return 2450
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error)
      return 2450
    }
  }

  async exportDocument(id: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<any> {
    console.log('🚀 API Client: Exporting document from backend:', id, 'format:', format)

    try {
      const response = await this.sdk.get(`/documents/${id}/export?format=${format}`)

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(`Export failed: ${response.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('💥 API Client: Export error:', error)
      throw error
    }
  }

  async exportAllDocuments(format: 'json' | 'csv' | 'xml' = 'json'): Promise<any> {
    console.log('🚀 API Client: Exporting all documents from backend, format:', format)

    try {
      const response = await this.sdk.get(`/documents/export/all?format=${format}`)

      if (!response.ok) {
        throw new Error(`Export all failed: ${response.statusText}`)
      }

      if (format === 'json') {
        return await response.json()
      } else {
        return await response.text()
      }
    } catch (error) {
      console.error('💥 API Client: Export all error:', error)
      throw error
    }
  }

  // Additional API methods for production
  async createCheckoutSession(amount: number): Promise<{ url: string }> {
    const response = await this.sdk.get(`/credits/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    })

    if (!response.ok) {
      throw new Error(`Failed to create checkout session: ${response.statusText}`)
    }

    return response.json()
  }

  async testMultilayerOCR(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.sdk.get(`/test-multilayer-ocr`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Multilayer OCR test failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getOCRStatus(): Promise<any> {
    const response = await this.sdk.get(`/ocr/status`)

    if (!response.ok) {
      throw new Error(`Failed to get OCR status: ${response.statusText}`)
    }

    return response.json()
  }

  async getOCRProviders(): Promise<any> {
    const response = await this.sdk.get(`/ocr/providers`)

    if (!response.ok) {
      throw new Error(`Failed to get OCR providers: ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()
