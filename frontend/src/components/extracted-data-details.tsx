"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Edit3,
  Check,
  X,
  FileText,
  Calendar,
  DollarSign,
  Building,
  Hash,
  ShoppingCart,
  Eye,
  EyeOff,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

interface ExtractedDataDetailsProps {
  extractedData: ExtractedData[]
  processingDetails?: ProcessingDetails
  onDataEdit?: (dataId: string, newValue: string) => void
  onApprove?: () => void
  onReject?: () => void
  className?: string
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'vendor': return <Building className="w-4 h-4" />
    case 'amount': return <DollarSign className="w-4 h-4" />
    case 'date': return <Calendar className="w-4 h-4" />
    case 'invoice_number': return <Hash className="w-4 h-4" />
    case 'item': return <ShoppingCart className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'text-green-600 bg-green-50 border-green-200'
  if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

const getConfidenceBadge = (confidence: number) => {
  const percentage = Math.round(confidence * 100)
  if (confidence >= 0.9) return <Badge variant="default" className="bg-green-100 text-green-800">{percentage}%</Badge>
  if (confidence >= 0.7) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{percentage}%</Badge>
  return <Badge variant="destructive" className="bg-red-100 text-red-800">{percentage}%</Badge>
}

export function ExtractedDataDetails({
  extractedData = [],
  processingDetails,
  onDataEdit,
  onApprove,
  onReject,
  className
}: ExtractedDataDetailsProps) {
  const [editingData, setEditingData] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAlternatives, setShowAlternatives] = useState<string | null>(null)

  const handleEdit = (dataId: string, currentValue: string) => {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportData = () => {
    const dataToExport = {
      extracted_data: extractedData,
      processing_details: processingDetails,
      exported_at: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extracted-data-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Extrahovaná data
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {processingDetails && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {processingDetails.total_processing_time.toFixed(2)}s
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="data" className="h-full">
          <div className="px-6 pb-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="data">Data ({extractedData.length})</TabsTrigger>
              <TabsTrigger value="processing">Zpracování</TabsTrigger>
              <TabsTrigger value="quality">Kvalita</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="data" className="mt-0 h-full">
            <ScrollArea className="h-[400px] px-6">
              <div className="space-y-4 py-4">
                {extractedData.map((data) => (
                  <div key={data.id} className={cn(
                    "border rounded-lg p-4 transition-all hover:shadow-sm",
                    getConfidenceColor(data.confidence)
                  )}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(data.type)}
                        <span className="font-medium">{data.label}</span>
                        {getConfidenceBadge(data.confidence)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(data.value)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        {data.editable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(data.id, data.value)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingData === data.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                            <X className="w-3 h-3 mr-1" />
                            Zrušit
                          </Button>
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Check className="w-3 h-3 mr-1" />
                            Uložit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="font-mono text-sm bg-white/50 p-2 rounded border">
                          {data.value}
                        </div>
                        
                        {data.source_provider && (
                          <div className="text-xs text-gray-500">
                            Zdroj: {data.source_provider}
                          </div>
                        )}

                        {data.alternatives && data.alternatives.length > 0 && (
                          <div className="space-y-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAlternatives(
                                showAlternatives === data.id ? null : data.id
                              )}
                              className="text-xs h-6 px-2"
                            >
                              {showAlternatives === data.id ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                              Alternativy ({data.alternatives.length})
                            </Button>
                            
                            {showAlternatives === data.id && (
                              <div className="space-y-1 pl-4 border-l-2 border-gray-200">
                                {data.alternatives.map((alt, idx) => (
                                  <div key={idx} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                                    <span className="font-mono">{alt.value}</span>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {alt.provider}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {Math.round(alt.confidence * 100)}%
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="processing" className="mt-0 h-full">
            <ScrollArea className="h-[400px] px-6">
              {processingDetails ? (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Celkový čas</Label>
                      <div className="text-2xl font-bold">
                        {processingDetails.total_processing_time.toFixed(2)}s
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Finální přesnost</Label>
                      <div className="text-2xl font-bold">
                        {Math.round(processingDetails.final_confidence * 100)}%
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">OCR Providery</Label>
                    {processingDetails.ocr_results.map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            result.success ? "bg-green-500" : "bg-red-500"
                          )} />
                          <span className="font-medium">{result.provider}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{Math.round(result.confidence * 100)}%</span>
                          <span>{result.processing_time.toFixed(2)}s</span>
                          <span>{result.text_length} znaků</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {processingDetails.gemini_decision && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Gemini AI Rozhodnutí</Label>
                        <div className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Vybraný provider:</span>
                            <Badge variant="outline">{processingDetails.gemini_decision.selected_provider}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Skóre důvěry:</span>
                            <span>{Math.round(processingDetails.gemini_decision.confidence_score * 100)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Čas zpracování:</span>
                            <span>{processingDetails.gemini_decision.processing_time.toFixed(2)}s</span>
                          </div>
                          <div className="mt-3">
                            <Label className="text-sm font-medium">Zdůvodnění:</Label>
                            <div className="mt-1 text-sm bg-gray-50 p-3 rounded border">
                              {processingDetails.gemini_decision.reasoning}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p>Detaily zpracování nejsou k dispozici</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="quality" className="mt-0 h-full">
            <ScrollArea className="h-[400px] px-6">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {extractedData.filter(d => d.confidence >= 0.9).length}
                    </div>
                    <div className="text-sm text-gray-600">Vysoká přesnost</div>
                    <div className="text-xs text-gray-500">≥90%</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {extractedData.filter(d => d.confidence >= 0.7 && d.confidence < 0.9).length}
                    </div>
                    <div className="text-sm text-gray-600">Střední přesnost</div>
                    <div className="text-xs text-gray-500">70-89%</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {extractedData.filter(d => d.confidence < 0.7).length}
                    </div>
                    <div className="text-sm text-gray-600">Nízká přesnost</div>
                    <div className="text-xs text-gray-500">&lt;70%</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Doporučení</Label>
                  <div className="space-y-2">
                    {extractedData.filter(d => d.confidence < 0.7).length > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-red-800">Vyžaduje kontrolu</div>
                          <div className="text-red-700">
                            {extractedData.filter(d => d.confidence < 0.7).length} položek má nízkou přesnost a mělo by být zkontrolováno.
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {extractedData.filter(d => d.confidence >= 0.9).length === extractedData.length && (
                      <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-green-800">Výborná kvalita</div>
                          <div className="text-green-700">
                            Všechna extrahovaná data mají vysokou přesnost. Dokument je připraven ke schválení.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Separator />
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Extrahováno {extractedData.length} položek
              {processingDetails && (
                <span className="ml-2">
                  • Průměrná přesnost: {Math.round((extractedData.reduce((sum, d) => sum + d.confidence, 0) / extractedData.length) * 100)}%
                </span>
              )}
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
      </CardContent>
    </Card>
  )
}
