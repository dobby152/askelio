"use client"

import React, { useState, useCallback } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { DocumentsTable } from '@/components/documents-table'
import { PDFPreview } from '@/components/pdf-preview'
import { ExtractedDataDetails } from '@/components/extracted-data-details'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import { formatAmount } from '@/lib/format-utils'

interface SelectedDocument {
  id: string
  name: string
  fileUrl: string
  extractedData: ExtractedData[]
  processingDetails?: ProcessingDetails
  status: 'processing' | 'completed' | 'needs_review'
}

interface ExtractedData {
  id: string
  type: 'vendor' | 'amount' | 'date' | 'invoice_number' | 'item' | 'tax' | 'subtotal' | 'due_date' | 'payment_method'
  label: string
  value: string
  confidence: number
  position: {
    x: number
    y: number
    width: number
    height: number
    page: number
  }
  editable: boolean
  source_provider?: string
  raw_text?: string
  alternatives?: Array<{
    value: string
    confidence: number
    provider: string
  }>
}

interface ProcessingDetails {
  total_processing_time: number
  ocr_results: Array<{
    provider: string
    confidence: number
    processing_time: number
    success: boolean
    text_length: number
  }>
  gemini_decision: {
    selected_provider: string
    confidence_score: number
    reasoning: string
    processing_time: number
  }
  final_confidence: number
  status: 'completed' | 'processing' | 'needs_review' | 'error'
  ares_enrichment?: {
    enriched_at: string
    notes: string[]
    success: boolean
    error?: string
  }
}

interface DocumentWorkspaceProps {
  className?: string
}

export function DocumentWorkspace({ className }: DocumentWorkspaceProps) {
  const [selectedDocument, setSelectedDocument] = useState<SelectedDocument | null>(null)
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)



  const handleDocumentSelect = useCallback(async (documentId: string) => {
    try {
      console.log('🚀 DocumentWorkspace: Fetching document using API client:', documentId)
      // Fetch real document data from API
      const documentData = await apiClient.getDocument(documentId)
      console.log('📄 DocumentWorkspace: Document data:', documentData)

      // Convert backend data to frontend format
      const extractedData: ExtractedData[] = []

      // Process extracted_fields from backend
      if (documentData.extracted_fields && Array.isArray(documentData.extracted_fields)) {
        console.log('🔄 Processing extracted_fields:', documentData.extracted_fields)

        documentData.extracted_fields.forEach((field: any, index: number) => {
          // Skip metadata fields
          if (field.field_name === 'extracted_at' || field.field_name === 'extraction_method') {
            return
          }

          // Map field names to types and labels
          const fieldMapping: Record<string, { type: string, label: string }> = {
            'document_type': { type: 'item', label: 'Typ dokumentu' },
            'invoice_number': { type: 'invoice_number', label: 'Číslo faktury' },
            'date': { type: 'date', label: 'Datum vystavení' },
            'due_date': { type: 'due_date', label: 'Datum splatnosti' },
            'amount': { type: 'amount', label: 'Celková částka' },
            'vendor': { type: 'vendor', label: 'Dodavatel' },
            'customer': { type: 'vendor', label: 'Odběratel' },
            'tax': { type: 'tax', label: 'DPH' },
            'subtotal': { type: 'subtotal', label: 'Částka bez DPH' },
            'payment_method': { type: 'payment_method', label: 'Způsob platby' }
          }

          const mapping = fieldMapping[field.field_name] || { type: 'item', label: field.field_name }

          if (field.field_value && field.field_value.trim()) {
            extractedData.push({
              id: (index + 1).toString(),
              type: mapping.type as any,
              label: mapping.label,
              value: field.field_value,
              confidence: field.confidence || documentData.confidence || 0.6,
              position: {
                x: 100 + (index * 50),
                y: 150 + (index * 30),
                width: 200,
                height: 25,
                page: 1
              },
              editable: true,
              source_provider: documentData.provider_used || 'unknown'
            })
          }
        })
      }

      // Also process structured_data if available
      if (documentData.structured_data && Object.keys(documentData.structured_data).length > 0) {
        console.log('🔄 Processing structured_data:', documentData.structured_data)

        const structuredData = documentData.structured_data
        let idCounter = extractedData.length + 1

        // Helper function to add structured data item
        const addStructuredItem = (type: string, label: string, value: string, confidence?: number) => {
          if (value && value.trim() && !extractedData.some(item => item.value === value)) {
            extractedData.push({
              id: idCounter.toString(),
              type: type as any,
              label,
              value,
              confidence: confidence || documentData.confidence || 0.6,
              position: {
                x: 100 + (idCounter * 50),
                y: 150 + (idCounter * 30),
                width: 200,
                height: 25,
                page: 1
              },
              editable: true,
              source_provider: documentData.provider_used || 'structured_data'
            })
            idCounter++
          }
        }

        // Extract structured data fields
        if (structuredData.invoice_number) addStructuredItem('invoice_number', 'Číslo faktury', structuredData.invoice_number)
        if (structuredData.date) addStructuredItem('date', 'Datum vystavení', structuredData.date)
        if (structuredData.due_date) addStructuredItem('due_date', 'Datum splatnosti', structuredData.due_date)
        if (structuredData.total_amount) {
          const formattedAmount = formatAmount(structuredData.total_amount)
          addStructuredItem('amount', 'Celková částka', formattedAmount)
        }
        // Vendor data with ARES enrichment indicators
        if (structuredData.vendor?.name) {
          const vendorLabel = structuredData.vendor._ares_enriched ? 'Dodavatel (ARES)' : 'Dodavatel'
          addStructuredItem('vendor', vendorLabel, structuredData.vendor.name)
        }
        if (structuredData.vendor?.ico) addStructuredItem('vendor', 'IČO dodavatele', structuredData.vendor.ico)
        if (structuredData.vendor?.dic) addStructuredItem('vendor', 'DIČ dodavatele', structuredData.vendor.dic)
        if (structuredData.vendor?.address) addStructuredItem('vendor', 'Adresa dodavatele', structuredData.vendor.address)

        // Customer data with ARES enrichment indicators
        if (structuredData.customer?.name) {
          const customerLabel = structuredData.customer._ares_enriched ? 'Odběratel (ARES)' : 'Odběratel'
          addStructuredItem('vendor', customerLabel, structuredData.customer.name)
        }
        if (structuredData.customer?.ico) addStructuredItem('vendor', 'IČO odběratele', structuredData.customer.ico)
        if (structuredData.customer?.dic) addStructuredItem('vendor', 'DIČ odběratele', structuredData.customer.dic)
        if (structuredData.customer?.address) addStructuredItem('vendor', 'Adresa odběratele', structuredData.customer.address)
      }

      console.log('✅ Transformed extracted data:', extractedData)

      // Process processing details - create them even if not in response
      let processingDetails: ProcessingDetails | undefined
      processingDetails = {
        total_processing_time: documentData.processing_details?.total_processing_time || documentData.processing_time || 0,
        ocr_results: documentData.processing_details?.ocr_results || [],
        gemini_decision: documentData.processing_details?.gemini_decision || {
          selected_provider: documentData.provider_used || 'unknown',
          confidence_score: documentData.confidence || 0,
          reasoning: 'Není k dispozici',
          processing_time: documentData.processing_time || 0
        },
        final_confidence: documentData.processing_details?.final_confidence || documentData.confidence || 0,
        status: documentData.status || 'completed',
        // 🔍 DEBUG: Add raw data for debugging - check all possible locations
        raw_google_vision_text: documentData.extracted_text || documentData.raw_text || documentData.data?.raw_text || documentData.meta?.raw_google_vision_text || 'No raw text available',
        provider_used: documentData.provider_used || 'unknown',
        cost_czk: documentData.cost_czk || 0,
        // ARES enrichment info
        ares_enrichment: documentData.ares_enriched || structuredData._ares_enrichment
      }

      const selectedDoc: SelectedDocument = {
        id: documentId,
        name: documentData.filename,
        fileUrl: `http://localhost:8001/documents/${documentId}/preview`,
        extractedData: extractedData,
        processingDetails: processingDetails,
        status: documentData.status === 'completed' ? 'needs_review' : 'processing'
      }

      setSelectedDocument(selectedDoc)
      setPreviewCollapsed(false)
    } catch (error) {
      console.error('Error fetching document:', error)
      // Show error state instead of fake data
      setSelectedDocument(null)
      setPreviewCollapsed(true)
    }
  }, [])

  const handleDataEdit = useCallback((dataId: string, newValue: string) => {
    if (!selectedDocument) return
    
    const updatedData = selectedDocument.extractedData.map(item =>
      item.id === dataId ? { ...item, value: newValue } : item
    )
    
    setSelectedDocument({
      ...selectedDocument,
      extractedData: updatedData
    })
  }, [selectedDocument])

  const handleApprove = useCallback(() => {
    if (!selectedDocument) return
    
    // In real app, would send approval to API
    console.log('Approving document:', selectedDocument.id)
    setSelectedDocument({
      ...selectedDocument,
      status: 'completed'
    })
  }, [selectedDocument])

  const handleReject = useCallback(() => {
    if (!selectedDocument) return
    
    // In real app, would mark for manual review
    console.log('Rejecting document:', selectedDocument.id)
    setSelectedDocument({
      ...selectedDocument,
      status: 'needs_review'
    })
  }, [selectedDocument])

  const handleUploadComplete = useCallback((files: any[]) => {
    // Auto-select first uploaded file for preview
    if (files.length > 0 && files[0].status === 'completed') {
      handleDocumentSelect(files[0].id)
    }
  }, [handleDocumentSelect])

  if (isFullscreen && selectedDocument) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Náhled dokumentu</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
            >
              <Minimize2 className="w-4 h-4 mr-2" />
              Zmenšit
            </Button>
          </div>
          <div className="flex-1">
            <PDFPreview
              fileUrl={selectedDocument.fileUrl}
              fileName={selectedDocument.name}
              extractedData={selectedDocument.extractedData}
              onDataEdit={handleDataEdit}
              onApprove={handleApprove}
              onReject={handleReject}
              className="h-full"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full", className)}>
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Documents Only */}
        <Panel defaultSize={previewCollapsed ? 100 : 50} minSize={30}>
          <div className="h-full flex flex-col p-6">
            {/* Documents Table */}
            <div className="flex-1 min-h-0">
              <Card className="h-full">
                <DocumentsTable
                  onDocumentSelect={handleDocumentSelect}
                  selectedDocumentId={selectedDocument?.id}
                />
              </Card>
            </div>
          </div>
        </Panel>

        {/* Resize Handle */}
        {!previewCollapsed && (
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors relative group">
            <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-gray-400 group-hover:bg-gray-500 transition-colors" />
          </PanelResizeHandle>
        )}

        {/* Right Panel - Preview and Details */}
        {!previewCollapsed && (
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full p-6 pl-0">
              <PanelGroup direction="vertical" className="h-full">
                {/* PDF Preview Panel */}
                <Panel defaultSize={60} minSize={30}>
                  <div className="h-full relative">
                    {/* Preview Controls */}
                    <div className="absolute top-0 right-0 z-10 flex space-x-2 p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullscreen(true)}
                        disabled={!selectedDocument}
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewCollapsed(true)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <PDFPreview
                      fileUrl={selectedDocument?.fileUrl}
                      fileName={selectedDocument?.name}
                      extractedData={selectedDocument?.extractedData}
                      onDataEdit={handleDataEdit}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      className="h-full"
                    />
                  </div>
                </Panel>

                {/* Vertical Resize Handle */}
                <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-gray-300 transition-colors relative group">
                  <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-1 bg-gray-400 group-hover:bg-gray-500 transition-colors" />
                </PanelResizeHandle>

                {/* Extracted Data Details Panel */}
                <Panel defaultSize={40} minSize={20}>
                  <div className="h-full pt-2">
                    <ExtractedDataDetails
                      extractedData={selectedDocument?.extractedData || []}
                      processingDetails={selectedDocument?.processingDetails}
                      onDataEdit={handleDataEdit}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      className="h-full"
                    />
                  </div>
                </Panel>
              </PanelGroup>
            </div>
          </Panel>
        )}
      </PanelGroup>

      {/* Collapsed Preview Toggle */}
      {previewCollapsed && (
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewCollapsed(false)}
            className="flex flex-col items-center p-2 h-auto"
          >
            <ChevronLeft className="w-4 h-4 mb-1" />
            <FileText className="w-4 h-4 mb-1" />
            <span className="text-xs">Náhled</span>
          </Button>
        </div>
      )}

      {/* Mobile Preview Modal */}
      <div className="lg:hidden">
        {selectedDocument && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Náhled dokumentu</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDocument(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1">
                <PDFPreview
                  fileUrl={selectedDocument.fileUrl}
                  fileName={selectedDocument.name}
                  extractedData={selectedDocument.extractedData}
                  onDataEdit={handleDataEdit}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
