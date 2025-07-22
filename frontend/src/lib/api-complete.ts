// Complete API client with mock functionality for demo
import { supabase } from './supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8009'

class ApiClient {
  private async getAuthHeaders() {
    return {}
  }

  async uploadDocument(file: File): Promise<any> {
    console.log('🚀 API Client: Uploading document to backend:', file.name)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData
      })

      console.log('📡 API Client: Upload response received:', response.status, response.statusText)

      if (!response.ok) {
        console.error('❌ API Client: Upload failed:', response.status, response.statusText)
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📄 API Client: Upload response data:', data)

      return data
    } catch (error) {
      console.error('💥 API Client: Upload error:', error)
      throw error
    }
  }

  async getDocuments(): Promise<any[]> {
    console.log('🚀 API Client: Fetching documents from backend:', `${API_BASE_URL}/documents`)

    try {
      const response = await fetch(`${API_BASE_URL}/documents`)
      console.log('📡 API Client: Response received:', response.status, response.statusText)

      if (!response.ok) {
        console.error('❌ API Client: Response not OK:', response.status, response.statusText)
        throw new Error(`Failed to fetch documents: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📄 API Client: Data received from backend:', data)

      return data
    } catch (error) {
      console.error('💥 API Client: Error fetching documents:', error)
      throw error
    }
  }

  async getDocument(id: string): Promise<any> {
    console.log('🚀 API Client: Getting document details for ID:', id)

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`)
      console.log('📡 API Client: Document response received:', response.status, response.statusText)

      if (!response.ok) {
        console.error('❌ API Client: Document response not OK:', response.status, response.statusText)
        throw new Error(`Failed to fetch document: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📄 API Client: Document data received:', data)

      return data
    } catch (error) {
      console.error('💥 API Client: Error fetching document:', error)
      throw error
    }
  }



  async getCreditBalance(): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/credits`)

      if (!response.ok) {
        // Return default credits if endpoint doesn't exist
        return 2450
      }

      const data = await response.json()
      return data.balance || data.credits || 2450
    } catch (error) {
      console.error('Error fetching credit balance:', error)
      return 2450
    }
  }

  async exportDocument(id: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<any> {
    console.log('🚀 API Client: Exporting document from backend:', id, 'format:', format)

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}/export?format=${format}`)

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      if (format === 'json') {
        return await response.json()
      } else {
        return await response.text()
      }
    } catch (error) {
      console.error('💥 API Client: Export error:', error)
      throw error
    }
  }

  async exportAllDocuments(format: 'json' | 'csv' | 'xml' = 'json'): Promise<any> {
    console.log('🚀 API Client: Exporting all documents from backend, format:', format)

    try {
      const response = await fetch(`${API_BASE_URL}/documents/export/all?format=${format}`)

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
    const response = await fetch(`${API_BASE_URL}/credits/checkout`, {
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

    const response = await fetch(`${API_BASE_URL}/test-multilayer-ocr`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Multilayer OCR test failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getOCRStatus(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ocr/status`)

    if (!response.ok) {
      throw new Error(`Failed to get OCR status: ${response.statusText}`)
    }

    return response.json()
  }

  async getOCRProviders(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ocr/providers`)

    if (!response.ok) {
      throw new Error(`Failed to get OCR providers: ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()
