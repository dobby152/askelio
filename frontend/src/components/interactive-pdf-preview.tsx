'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  EyeOff,
  Edit3,
  Check,
  X,
  FileText,
  Building2,
  Calendar,
  Hash,
  DollarSign,
  MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExtractedField {
  id: string
  field: string
  value: string
  confidence: number
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
  validated?: boolean
  aresEnriched?: boolean
}

interface InteractivePDFPreviewProps {
  fileUrl: string
  fileName: string
  extractedData: ExtractedField[]
  showOverlay?: boolean
  onFieldUpdate?: (fieldId: string, newValue: string) => void
}

export function InteractivePDFPreview({
  fileUrl,
  fileName,
  extractedData,
  showOverlay = true,
  onFieldUpdate
}: InteractivePDFPreviewProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
  }, [fileUrl])

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'border-green-500 bg-green-100/50'
    if (confidence >= 0.7) return 'border-yellow-500 bg-yellow-100/50'
    return 'border-red-500 bg-red-100/50'
  }

  const getFieldTypeIcon = (field: string) => {
    if (field.includes('ico') || field.includes('dic')) return '🏢'
    if (field.includes('amount') || field.includes('price')) return '💰'
    if (field.includes('date')) return '📅'
    if (field.includes('number')) return '#️⃣'
    if (field.includes('name')) return '👤'
    if (field.includes('address')) return '📍'
    return '📄'
  }

  const handleFieldClick = (field: ExtractedField) => {
    setEditingField(field.id)
    setEditValue(field.value)
  }

  const handleSaveEdit = () => {
    if (editingField && onFieldUpdate) {
      onFieldUpdate(editingField, editValue)
    }
    setEditingField(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setError('Nepodařilo se načíst PDF náhled')
  }

  // Generate mock positions for fields if not provided
  const getFieldPosition = (field: ExtractedField, index: number) => {
    if (field.position) return field.position

    // Generate mock positions based on field type and index
    const baseY = 100 + (index * 40)
    const baseX = field.field.includes('vendor') ? 50 : 300

    return {
      x: baseX,
      y: baseY,
      width: 200,
      height: 25
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">{fileName}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-mono min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full overflow-auto bg-gray-100"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Načítání PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center text-red-600">
                <X className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="relative w-full h-full min-h-[600px]">
            <iframe
              ref={iframeRef}
              src={fileUrl}
              className="w-full h-full border-0"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'top left',
                minHeight: '600px'
              }}
              title={fileName}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />

            {/* Interactive Field Overlays */}
            {showOverlay && !isLoading && !error && extractedData.map((field, index) => {
              const position = getFieldPosition(field, index)
              const isEditing = editingField === field.id

              return (
                <div key={field.id} className="absolute">
                  {/* Field Highlight */}
                  <div
                    className={cn(
                      "absolute border-2 cursor-pointer transition-all hover:shadow-lg",
                      getConfidenceColor(field.confidence),
                      isEditing && "ring-2 ring-blue-500 z-20"
                    )}
                    style={{
                      left: `${position.x * scale}px`,
                      top: `${position.y * scale}px`,
                      width: `${position.width * scale}px`,
                      height: `${position.height * scale}px`,
                      transform: `rotate(${rotation}deg)`,
                    }}
                    onClick={() => !isEditing && handleFieldClick(field)}
                  />

                  {/* Field Label */}
                  <div
                    className="absolute bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow-lg z-10"
                    style={{
                      left: `${position.x * scale}px`,
                      top: `${(position.y - 30) * scale}px`,
                      transform: `rotate(${rotation}deg)`,
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{getFieldTypeIcon(field.field)}</span>
                      <span className="font-medium">{field.field.split('.').pop()}</span>
                      <Badge
                        variant={field.confidence > 0.9 ? 'default' : 'secondary'}
                        className="text-xs px-1"
                      >
                        {Math.round(field.confidence * 100)}%
                      </Badge>
                      {field.aresEnriched && (
                        <Badge variant="outline" className="text-xs px-1">
                          ARES
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Inline Editor */}
                  {isEditing && (
                    <div
                      className="absolute bg-white border-2 border-blue-500 rounded-lg p-3 shadow-xl z-30 min-w-[250px]"
                      style={{
                        left: `${position.x * scale}px`,
                        top: `${(position.y + position.height + 10) * scale}px`,
                        transform: `rotate(${rotation}deg)`,
                      }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{field.field}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(field.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit()
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Check className="w-3 h-3 mr-1" />
                            Uložit
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="w-3 h-3 mr-1" />
                            Zrušit
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Field Count Badge */}
        {showOverlay && extractedData.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            {extractedData.length} polí
          </div>
        )}
      </CardContent>
    </Card>
  )
}
