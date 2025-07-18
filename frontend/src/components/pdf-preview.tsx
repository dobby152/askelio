"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Check,
  X,
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface PDFPreviewProps {
  fileUrl?: string
  fileName?: string
  extractedData?: ExtractedData[]
  onDataEdit?: (dataId: string, newValue: string) => void
  onApprove?: () => void
  onReject?: () => void
  className?: string
}

export function PDFPreview({
  fileUrl,
  fileName,
  extractedData = [],
  onDataEdit,
  onApprove,
  onReject,
  className
}: PDFPreviewProps) {
  const [scale, setScale] = useState<number>(1.0)
  const [showOverlay, setShowOverlay] = useState<boolean>(true)
  const [editingData, setEditingData] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (fileUrl) {
      setIsLoading(false)
      setError(null)
    }
  }, [fileUrl])

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0))
    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${Math.min(scale + 0.25, 3.0)})`
    }
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${Math.max(scale - 0.25, 0.5)})`
    }
  }

  const handleDataEdit = (dataId: string, currentValue: string) => {
    setEditingData(dataId)
    setEditValue(currentValue)
  }

  const handleSaveEdit = () => {
    if (editingData && onDataEdit) {
      onDataEdit(editingData, editValue)
    }
    setEditingData(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingData(null)
    setEditValue('')
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500/20 border-green-500'
    if (confidence >= 0.7) return 'bg-yellow-500/20 border-yellow-500'
    return 'bg-red-500/20 border-red-500'
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge variant="default" className="bg-green-500">Vysoká</Badge>
    if (confidence >= 0.7) return <Badge variant="secondary">Střední</Badge>
    return <Badge variant="destructive">Nízká</Badge>
  }

  if (!fileUrl) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Vyberte dokument pro náhled</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">{fileName || 'PDF Náhled'}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOverlay(!showOverlay)}
            >
              {showOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showOverlay ? 'Skrýt' : 'Zobrazit'} data
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0 relative overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={containerRef} className="relative p-4">
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Načítání PDF...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-red-600">
                  <X className="w-12 h-12 mx-auto mb-4" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {!isLoading && !error && (
              <div className="relative w-full h-full">
                <iframe
                  ref={iframeRef}
                  src={fileUrl}
                  className="w-full h-full border-0"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    minHeight: '600px'
                  }}
                  title={fileName || 'PDF Preview'}
                />

                {/* Data Overlay */}
                {showOverlay && extractedData.map((data) => (
                  <div
                    key={data.id}
                    className={cn(
                      "absolute border-2 cursor-pointer transition-all hover:shadow-lg",
                      getConfidenceColor(data.confidence),
                      editingData === data.id && "ring-2 ring-blue-500"
                    )}
                    style={{
                      left: `${data.position.x * scale}px`,
                      top: `${data.position.y * scale}px`,
                      width: `${data.position.width * scale}px`,
                      height: `${data.position.height * scale}px`,
                    }}
                    onClick={() => data.editable && handleDataEdit(data.id, data.value)}
                  >
                    {data.editable && (
                      <div className="absolute -top-6 left-0 bg-white border rounded px-2 py-1 text-xs shadow-md">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{data.label}</span>
                          {getConfidenceBadge(data.confidence)}
                          <Edit3 className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>



        {/* Edit Modal */}
        {editingData && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Upravit {extractedData.find(d => d.id === editingData)?.label}
              </h3>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-4"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Zrušit
                </Button>
                <Button onClick={handleSaveEdit}>
                  Uložit
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Action Buttons */}
      <Separator />
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Extrahováno {extractedData.length} položek
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onReject}>
              <X className="w-4 h-4 mr-2" />
              Opravit
            </Button>
            <Button onClick={onApprove}>
              <Check className="w-4 h-4 mr-2" />
              Schválit
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
