/**
 * Duplicate Detection API Service
 * Provides functions for checking and managing duplicate invoices
 */

import { apiClient } from './api-client'

export interface DuplicateDocument {
  document_id: number
  filename: string
  created_at: string | null
  match_type: 'exact_hash' | 'invoice_number_supplier'
  invoice_number?: string
  supplier_name?: string
  total_amount?: number
}

export interface DuplicateCheckResult {
  success: boolean
  is_duplicate: boolean
  duplicate_count: number
  duplicates: DuplicateDocument[]
  message: string
}

export interface DuplicateStats {
  total_documents: number
  documents_with_hash: number
  duplicate_groups: number
  total_duplicates: number
  duplicate_rate: number
}

export interface DuplicateStatsResult {
  success: boolean
  data: DuplicateStats
  message: string
}

export interface InvoiceData {
  invoice_number?: string
  supplier_name?: string
  total_amount?: number
  date?: string
  currency?: string
}

class DuplicateAPI {
  /**
   * Check for duplicate invoices before processing
   */
  async checkDuplicates(invoiceData: InvoiceData): Promise<DuplicateCheckResult> {
    try {
      const params = new URLSearchParams()
      
      if (invoiceData.invoice_number) {
        params.append('invoice_number', invoiceData.invoice_number)
      }
      if (invoiceData.supplier_name) {
        params.append('supplier_name', invoiceData.supplier_name)
      }
      if (invoiceData.total_amount !== undefined) {
        params.append('total_amount', invoiceData.total_amount.toString())
      }
      if (invoiceData.date) {
        params.append('date', invoiceData.date)
      }
      if (invoiceData.currency) {
        params.append('currency', invoiceData.currency)
      }

      const response = await apiClient.post('/api/v1/documents/check-duplicates', {}, {
        params: Object.fromEntries(params)
      })

      return response.data
    } catch (error) {
      console.error('Failed to check duplicates:', error)
      throw new Error('Nepodařilo se zkontrolovat duplicity')
    }
  }

  /**
   * Get duplicate statistics for the current user
   */
  async getDuplicateStats(): Promise<DuplicateStatsResult> {
    try {
      const response = await apiClient.get('/api/v1/documents/duplicate-stats')
      return response.data
    } catch (error) {
      console.error('Failed to get duplicate statistics:', error)
      throw new Error('Nepodařilo se načíst statistiky duplicit')
    }
  }

  /**
   * Extract invoice data from structured data returned by document processing
   */
  extractInvoiceData(structuredData: any): InvoiceData {
    if (!structuredData) return {}

    const invoiceData: InvoiceData = {}

    // Extract invoice number
    if (structuredData.invoice_number) {
      invoiceData.invoice_number = structuredData.invoice_number
    }

    // Extract supplier name
    if (structuredData.supplier_name) {
      invoiceData.supplier_name = structuredData.supplier_name
    } else if (structuredData.vendor?.name) {
      invoiceData.supplier_name = structuredData.vendor.name
    }

    // Extract total amount
    if (structuredData.totals?.total) {
      invoiceData.total_amount = structuredData.totals.total
    }

    // Extract date
    if (structuredData.date) {
      invoiceData.date = structuredData.date
    }

    // Extract currency
    if (structuredData.currency) {
      invoiceData.currency = structuredData.currency
    }

    return invoiceData
  }

  /**
   * Check if duplicate warning should be shown based on processing result
   */
  shouldShowDuplicateWarning(processingResult: any): boolean {
    return !!(
      processingResult?.data?.duplicate_warning?.is_duplicate &&
      processingResult.data.duplicate_warning.duplicate_count > 0
    )
  }

  /**
   * Get duplicate warning data from processing result
   */
  getDuplicateWarningData(processingResult: any): {
    duplicateCount: number
    duplicates: DuplicateDocument[]
  } | null {
    const warning = processingResult?.data?.duplicate_warning
    
    if (!warning?.is_duplicate) {
      return null
    }

    return {
      duplicateCount: warning.duplicate_count || 0,
      duplicates: warning.duplicates || []
    }
  }
}

export const duplicateAPI = new DuplicateAPI()
export default duplicateAPI
