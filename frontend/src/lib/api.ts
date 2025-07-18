// API client for FastAPI backend
import { supabase } from './supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private async getAuthHeaders() {
    // For demo purposes, return basic headers
    return {
      'Content-Type': 'application/json'
    }

    // Uncomment when Supabase is properly configured:
    /*
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
    }
    */
  }

  async uploadDocument(file: File): Promise<any> {
    const headers = await this.getAuthHeaders()
    delete headers['Content-Type'] // Let browser set it for FormData

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: headers,
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getDocuments(): Promise<any[]> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/documents`, {
      headers
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`)
    }

    return response.json()
  }

  async getDocument(id: string): Promise<any> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
      headers
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`)
    }

    return response.json()
  }

  async getCreditBalance(): Promise<number> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/credits/balance`, {
      headers
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch credit balance: ${response.statusText}`)
    }

    const data = await response.json()
    return data.balance
  }

  async createCheckoutSession(amount: number): Promise<{ url: string }> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/credits/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount })
    })

    if (!response.ok) {
      throw new Error(`Failed to create checkout session: ${response.statusText}`)
    }

    return response.json()
  }

  async testMultilayerOCR(file: File): Promise<any> {
    const headers = await this.getAuthHeaders()
    delete headers['Content-Type'] // Let browser set it for FormData

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/test-multilayer-ocr`, {
      method: 'POST',
      headers: headers,
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Multilayer OCR test failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getOCRStatus(): Promise<any> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/ocr/status`, {
      method: 'GET',
      headers: headers
    })

    if (!response.ok) {
      throw new Error(`Failed to get OCR status: ${response.statusText}`)
    }

    return response.json()
  }

  async getOCRProviders(): Promise<any> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/ocr/providers`, {
      method: 'GET',
      headers: headers
    })

    if (!response.ok) {
      throw new Error(`Failed to get OCR providers: ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()
