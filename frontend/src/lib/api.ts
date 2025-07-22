// API client for FastAPI backend
import { supabase } from './supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'
const USE_MOCK_API = true // Set to false when backend is working

class ApiClient {
  private async getAuthHeaders() {
    // No authentication for main_simple.py backend
    return {}
  }

  private getUploadedDocuments(): any[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem('askelio_uploaded_documents')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private saveUploadedDocument(document: any): void {
    if (typeof window === 'undefined') return

    try {
      const existing = this.getUploadedDocuments()
      existing.unshift(document) // Add to beginning
      localStorage.setItem('askelio_uploaded_documents', JSON.stringify(existing))
    } catch (error) {
      console.error('Failed to save uploaded document:', error)
    }
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
      console.error('� API Client: Upload error:', error)
      throw error
    }
  }



  async getDocuments(): Promise<any[]> {
    if (USE_MOCK_API) {
      console.log('🚀 API Client: Using mock data (backend connection issues)')

      // Mock data with realistic Czech documents
      const mockData = [
        {
          "id": 1,
          "filename": "demo_faktura.pdf",
          "file_name": "demo_faktura.pdf",
          "status": "completed",
          "type": "application/pdf",
          "size": "1.2 MB",
          "pages": 2,
          "accuracy": "95%",
          "created_at": "2025-07-21T14:30:00.000000",
          "processed_at": "2025-07-21T14:30:15.000000",
          "processing_time": 2.45,
          "confidence": 0.95,
          "extracted_text": "ZÁLOHOVÁ FAKTURA č. 250800001\nDatum: 21.07.2024\nCelkem k úhradě: 25 678,90 Kč",
          "provider_used": "google_vision",
          "data_source": "gemini",
          "structured_data": {
            "document_type": "faktura",
            "vendor": "Demo Dodavatel s.r.o.",
            "amount": 25678.90,
            "currency": "CZK",
            "date": "2024-07-21",
            "invoice_number": "250800001",
            "ico": "12345678",
            "dic": "CZ12345678"
          }
        },
        {
          "id": 2,
          "filename": "demo_receipt.jpg",
          "file_name": "demo_receipt.jpg",
          "status": "completed",
          "type": "image/jpeg",
          "size": "0.5 MB",
          "pages": 1,
          "accuracy": "94%",
          "created_at": "2025-07-21T12:00:00.000000",
          "processed_at": "2025-07-21T12:00:05.000000",
          "processing_time": 1.23,
          "confidence": 0.94,
          "extracted_text": "TESCO\nDatum: 21.07.2024\nCelkem: 456,78 Kč",
          "provider_used": "google_vision",
          "data_source": "basic",
          "structured_data": {
            "document_type": "účtenka",
            "vendor": "TESCO",
            "amount": 456.78,
            "currency": "CZK",
            "date": "2024-07-21"
          }
        }
      ]

      // Add any uploaded documents from localStorage
      const uploadedDocs = this.getUploadedDocuments()
      const allDocs = [...uploadedDocs, ...mockData]

      console.log('📄 API Client: Returning mock data:', allDocs)
      return allDocs
    }

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
    // Mock credit balance
    return 2450
  }

  async exportDocument(id: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<any> {
    console.log('🚀 API Client: Exporting document:', id, 'format:', format)

    const document = await this.getDocument(id)

    if (format === 'json') {
      return {
        document_id: document.id,
        filename: document.filename,
        extracted_data: document.structured_data,
        metadata: {
          processed_at: document.processed_at,
          confidence: document.confidence,
          provider: document.provider_used
        }
      }
    } else if (format === 'csv') {
      const fields = document.extracted_fields || []
      let csv = 'field_name,field_value,confidence,data_type\n'
      fields.forEach((field: any) => {
        csv += `"${field.field_name}","${field.field_value}",${field.confidence},"${field.data_type}"\n`
      })
      return csv
    } else if (format === 'xml') {
      const data = document.structured_data || {}
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<document>\n'
      xml += `  <metadata>\n`
      xml += `    <id>${document.id}</id>\n`
      xml += `    <filename>${document.filename}</filename>\n`
      xml += `    <processed_at>${document.processed_at}</processed_at>\n`
      xml += `    <confidence>${document.confidence}</confidence>\n`
      xml += `  </metadata>\n`
      xml += `  <extracted_data>\n`
      Object.entries(data).forEach(([key, value]) => {
        xml += `    <${key}>${value}</${key}>\n`
      })
      xml += `  </extracted_data>\n</document>`
      return xml
    }
  }

  async exportAllDocuments(format: 'json' | 'csv' | 'xml' = 'json'): Promise<any> {
    console.log('🚀 API Client: Exporting all documents, format:', format)

    const documents = await this.getDocuments()

    if (format === 'json') {
      return {
        export_date: new Date().toISOString(),
        total_documents: documents.length,
        documents: documents.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          status: doc.status,
          extracted_data: doc.structured_data,
          metadata: {
            processed_at: doc.processed_at,
            confidence: doc.confidence,
            provider: doc.provider_used
          }
        }))
      }
    } else if (format === 'csv') {
      let csv = 'document_id,filename,status,field_name,field_value,confidence\n'
      documents.forEach(doc => {
        const data = doc.structured_data || {}
        Object.entries(data).forEach(([key, value]) => {
          csv += `${doc.id},"${doc.filename}","${doc.status}","${key}","${value}",${doc.confidence}\n`
        })
      })
      return csv
    }
  }

  async createCheckoutSession(amount: number): Promise<{ url: string }> {
    const response = await fetch(`${API_BASE_URL}/credits/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
