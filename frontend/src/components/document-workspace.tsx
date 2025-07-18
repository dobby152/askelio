"use client"

import React, { useState, useCallback } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { DocumentsTable } from '@/components/documents-table'
import { PDFPreview } from '@/components/pdf-preview'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectedDocument {
  id: string
  name: string
  fileUrl: string
  extractedData: ExtractedData[]
  status: 'processing' | 'completed' | 'needs_review'
}

interface ExtractedData {
  id: string
  type: 'vendor' | 'amount' | 'date' | 'invoice_number' | 'item'
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
      // Fetch real document data from API
      const response = await fetch(`http://localhost:8000/documents/${documentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch document')
      }

      const documentData = await response.json()

      // Convert backend data to frontend format
      const extractedData: ExtractedData[] = []

      if (documentData.extracted_data) {
        const data = documentData.extracted_data

        if (data.vendor) {
          extractedData.push({
            id: '1',
            type: 'vendor',
            label: 'Dodavatel',
            value: data.vendor,
            confidence: documentData.confidence || 0.95,
            position: { x: 100, y: 150, width: 200, height: 25, page: 1 },
            editable: true
          })
        }

        if (data.amount) {
          extractedData.push({
            id: '2',
            type: 'amount',
            label: 'Celková částka',
            value: `${data.amount} ${data.currency || 'CZK'}`,
            confidence: documentData.confidence || 0.98,
            position: { x: 400, y: 500, width: 120, height: 20, page: 1 },
            editable: true
          })
        }

        if (data.date) {
          extractedData.push({
            id: '3',
            type: 'date',
            label: 'Datum vystavení',
            value: data.date,
            confidence: documentData.confidence || 0.92,
            position: { x: 450, y: 200, width: 80, height: 18, page: 1 },
            editable: true
          })
        }

        if (data.invoice_number) {
          extractedData.push({
            id: '4',
            type: 'invoice_number',
            label: 'Číslo faktury',
            value: data.invoice_number,
            confidence: documentData.confidence || 0.89,
            position: { x: 450, y: 180, width: 60, height: 18, page: 1 },
            editable: true
          })
        }
      }

      const selectedDoc: SelectedDocument = {
        id: documentId,
        name: documentData.filename,
        fileUrl: `http://localhost:8000/documents/${documentId}/preview`,
        extractedData: extractedData,
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

        {/* Right Panel - Preview */}
        {!previewCollapsed && (
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full p-6 pl-0">
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
