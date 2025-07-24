'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  FileText,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  MapPin,
  Hash,
  CreditCard,
  Calendar,
  Euro,
  Save,
  Download,
  Zap,
  Edit
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'
import { InteractivePDFPreview } from './interactive-pdf-preview'
import { ExtractedDataEditor } from './extracted-data-editor'
import { AresValidation } from './ares-validation'
import { ProcessingStatus } from './processing-status'

interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  message?: string
}

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

interface ProcessedDocument {
  id: string
  fileName: string
  fileUrl: string
  extractedData: ExtractedField[]
  aresData?: {
    vendor?: any
    customer?: any
  }
  processingSteps: ProcessingStep[]
  status: 'processing' | 'completed' | 'error'
}

export function InvoiceUploadWorkspace() {
  const [document, setDocument] = useState<ProcessedDocument | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const [activeTab, setActiveTab] = useState('preview')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processingSteps: ProcessingStep[] = [
    { id: 'upload', name: 'Nahrávání souboru', status: 'pending', progress: 0 },
    { id: 'ocr', name: 'OCR zpracování', status: 'pending', progress: 0 },
    { id: 'extraction', name: 'Extrakce dat', status: 'pending', progress: 0 },
    { id: 'ares', name: 'ARES validace', status: 'pending', progress: 0 },
    { id: 'validation', name: 'Finální validace', status: 'pending', progress: 0 }
  ]

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsProcessing(true)
    setActiveTab('preview')

    // Initialize document with processing steps
    const newDocument: ProcessedDocument = {
      id: Date.now().toString(),
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      extractedData: [],
      processingSteps: processingSteps.map(step => ({ ...step })),
      status: 'processing'
    }
    setDocument(newDocument)

    try {
      // Step 1: Upload
      updateProcessingStep('upload', 'processing', 50, 'Nahrávání souboru...')
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate upload time
      updateProcessingStep('upload', 'completed', 100, 'Soubor nahrán')

      // Step 2: OCR Processing
      updateProcessingStep('ocr', 'processing', 30, 'Rozpoznávání textu...')
      
      const response = await apiClient.uploadDocument(file, {
        mode: 'cost_optimized',
        max_cost_czk: 5.0,
        enable_ares_enrichment: true
      }, (progress) => {
        // Update progress based on stage
        if (progress.stage === 'ocr') {
          updateProcessingStep('ocr', 'processing', progress.percentage, progress.message)
        } else if (progress.stage === 'extraction') {
          updateProcessingStep('extraction', 'processing', progress.percentage, progress.message)
        }
      })

      if (!response.success) {
        throw new Error(response.error?.message || 'Zpracování selhalo')
      }

      updateProcessingStep('ocr', 'completed', 100, 'Text rozpoznán')
      updateProcessingStep('extraction', 'processing', 60, 'Extrakce dat...')

      // Convert response data to ExtractedField format
      const extractedFields = convertResponseToFields(response.data.structured_data)
      
      setDocument(prev => prev ? {
        ...prev,
        extractedData: extractedFields,
        aresData: {
          vendor: response.data.structured_data.vendor,
          customer: response.data.structured_data.customer,
          _ares_enrichment: response.data.structured_data._ares_enrichment
        }
      } : null)

      updateProcessingStep('extraction', 'completed', 100, 'Data extrahována')
      updateProcessingStep('ares', 'processing', 80, 'ARES validace...')

      // Simulate ARES processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateProcessingStep('ares', 'completed', 100, 'ARES data doplněna')
      updateProcessingStep('validation', 'completed', 100, 'Validace dokončena')

      setDocument(prev => prev ? { ...prev, status: 'completed' } : null)

    } catch (error) {
      console.error('Processing error:', error)
      updateProcessingStep('ocr', 'error', 0, `Chyba: ${error.message}`)
      setDocument(prev => prev ? { ...prev, status: 'error' } : null)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const updateProcessingStep = (stepId: string, status: ProcessingStep['status'], progress: number, message?: string) => {
    setDocument(prev => {
      if (!prev) return null
      return {
        ...prev,
        processingSteps: prev.processingSteps.map(step =>
          step.id === stepId ? { ...step, status, progress, message } : step
        )
      }
    })
  }

  const convertResponseToFields = (data: any): ExtractedField[] => {
    const fields: ExtractedField[] = []
    let fieldId = 1

    // Convert all simple fields first
    const simpleFields = ['document_type', 'invoice_number', 'date', 'due_date', 'currency', 'variable_symbol', 'bank_account']
    simpleFields.forEach(fieldName => {
      if (data[fieldName]) {
        fields.push({
          id: `${fieldName}_${fieldId++}`,
          field: fieldName,
          value: String(data[fieldName]),
          confidence: 0.95,
          validated: false
        })
      }
    })

    // Convert vendor data
    if (data.vendor && typeof data.vendor === 'object') {
      Object.entries(data.vendor).forEach(([key, value]) => {
        if (value && !key.startsWith('_')) { // Skip metadata fields
          fields.push({
            id: `vendor_${key}_${fieldId++}`,
            field: `vendor.${key}`,
            value: String(value),
            confidence: 0.9,
            validated: false,
            aresEnriched: data.vendor._ares_enriched && (key === 'name' || key === 'address' || key === 'dic')
          })
        }
      })
    }

    // Convert customer data
    if (data.customer && typeof data.customer === 'object') {
      Object.entries(data.customer).forEach(([key, value]) => {
        if (value && !key.startsWith('_')) { // Skip metadata fields
          fields.push({
            id: `customer_${key}_${fieldId++}`,
            field: `customer.${key}`,
            value: String(value),
            confidence: 0.9,
            validated: false,
            aresEnriched: data.customer._ares_enriched && (key === 'name' || key === 'address' || key === 'dic')
          })
        }
      })
    }

    // Convert totals data
    if (data.totals && typeof data.totals === 'object') {
      Object.entries(data.totals).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          fields.push({
            id: `totals_${key}_${fieldId++}`,
            field: `totals.${key}`,
            value: String(value),
            confidence: 0.95,
            validated: false
          })
        }
      })
    }

    // Convert simple amount for receipts
    if (data.amount) {
      fields.push({
        id: `amount_${fieldId++}`,
        field: 'amount',
        value: String(data.amount),
        confidence: 0.95,
        validated: false
      })
    }

    console.log('🔄 Converted response to fields:', fields)
    return fields
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isProcessing
  })

  const handleFieldUpdate = (fieldId: string, newValue: string) => {
    setDocument(prev => {
      if (!prev) return null
      return {
        ...prev,
        extractedData: prev.extractedData.map(field =>
          field.id === fieldId ? { ...field, value: newValue, validated: true } : field
        )
      }
    })
  }

  const handleSave = async () => {
    if (!document) return
    // TODO: Implement save functionality
    console.log('Saving document:', document)
  }

  const handleExport = async () => {
    if (!document) return
    // TODO: Implement export functionality
    console.log('Exporting document:', document)
  }

  const getFieldTypeInfo = (field: ExtractedField) => {
    const fieldName = field.field.toLowerCase()

    if (fieldName.includes('ico') || fieldName.includes('dic') || fieldName.includes('company')) {
      return { icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-100', type: 'company' }
    }
    if (fieldName.includes('amount') || fieldName.includes('price') || fieldName.includes('total')) {
      return { icon: Euro, color: 'text-green-600', bgColor: 'bg-green-100', type: 'amount' }
    }
    if (fieldName.includes('date') || fieldName.includes('datum')) {
      return { icon: Calendar, color: 'text-purple-600', bgColor: 'bg-purple-100', type: 'date' }
    }
    if (fieldName.includes('number') || fieldName.includes('cislo')) {
      return { icon: Hash, color: 'text-orange-600', bgColor: 'bg-orange-100', type: 'number' }
    }
    if (fieldName.includes('address') || fieldName.includes('adresa')) {
      return { icon: MapPin, color: 'text-red-600', bgColor: 'bg-red-100', type: 'address' }
    }

    return { icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100', type: 'other' }
  }

  if (!document) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl mx-auto">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
            <CardContent className="p-0">
              <div
                {...getRootProps()}
                className={`
                  relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer
                  ${isDragActive
                    ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-400 border-dashed scale-[1.02]'
                    : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 border-2 border-gray-200 border-dashed hover:border-blue-300 hover:scale-[1.01] hover:shadow-xl'
                  }
                  ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                <input {...getInputProps()} />

                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03]">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    animation: 'float 6s ease-in-out infinite'
                  }} />
                </div>

                <div className="relative p-16 text-center">
                  {/* Main Upload Icon with Floating Animation */}
                  <div className="relative mb-8">
                    <div className={`
                      w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600
                      flex items-center justify-center shadow-2xl transition-all duration-500
                      ${isDragActive ? 'scale-110 rotate-3' : 'hover:scale-105 hover:-rotate-1'}
                    `} style={{
                      boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                    }}>
                      {isProcessing ? (
                        <Loader2 className="w-14 h-14 text-white animate-spin" />
                      ) : (
                        <Upload className="w-14 h-14 text-white" />
                      )}
                    </div>

                    {/* Floating Decorative Elements */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '0.5s' }}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '1s' }}>
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute top-1/2 -right-6 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <FileText className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Main Text with Gradient */}
                  <div className="space-y-4 mb-10">
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent leading-tight">
                      {isDragActive ? 'Perfektní! Pusťte soubor zde' : 'Nahrajte fakturu'}
                    </h3>
                    <p className="text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
                      {isDragActive
                        ? 'Skvělé! Pusťte soubor a začneme s AI zpracováním'
                        : 'Přetáhněte dokument sem nebo klikněte pro výběr'
                      }
                    </p>
                  </div>

                  {/* Enhanced Features Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { icon: Zap, label: 'AI zpracování', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
                      { icon: CheckCircle, label: 'ARES validace', color: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
                      { icon: Eye, label: 'PDF náhled', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50' },
                      { icon: Edit, label: 'Editace dat', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50' }
                    ].map((feature, index) => {
                      const IconComponent = feature.icon
                      return (
                        <div key={index} className={`
                          flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg
                          ${feature.bg} border border-white/50 backdrop-blur-sm
                        `}>
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 text-center leading-tight">
                            {feature.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* File Format Pills */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {['PDF', 'JPG', 'PNG', 'GIF', 'BMP', 'TIFF'].map((format) => (
                      <span key={format} className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
                        {format}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Maximální velikost: 10MB</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Tips */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              { icon: '🚀', title: 'Rychlé zpracování', desc: 'AI extrakce dat za několik sekund' },
              { icon: '🎯', title: 'Vysoká přesnost', desc: 'Pokročilé rozpoznávání textu a dat' },
              { icon: '🔒', title: 'Bezpečné', desc: 'Vaše dokumenty jsou v bezpečí' }
            ].map((tip, index) => (
              <div key={index} className="text-center p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:bg-white/80 transition-all">
                <div className="text-2xl mb-2">{tip.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                <p className="text-sm text-gray-600">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {document.fileName}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={document.status !== 'completed'}
              >
                <Save className="w-4 h-4 mr-2" />
                Uložit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={document.status !== 'completed'}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {document.status === 'processing' && (
              <>
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm text-muted-foreground">Zpracovává se...</span>
              </>
            )}
            {document.status === 'completed' && (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Zpracování dokončeno</span>
              </>
            )}
            {document.status === 'error' && (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Chyba při zpracování</span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Processing Steps */}
          <div className="grid grid-cols-5 gap-4">
            {document.processingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-2">
                <div className="flex-shrink-0">
                  {step.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {step.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                  {step.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {step.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{step.name}</p>
                  {step.message && <p className="text-xs text-muted-foreground truncate">{step.message}</p>}
                  {step.status === 'processing' && (
                    <Progress value={step.progress} className="h-1 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* PDF Preview - Takes more space */}
        <div className="lg:col-span-3">
          <div className="h-[700px] rounded-lg overflow-hidden border shadow-sm">
            <InteractivePDFPreview
              fileUrl={document.fileUrl}
              fileName={document.fileName}
              extractedData={document.extractedData}
              showOverlay={showOverlay}
              onFieldUpdate={handleFieldUpdate}
            />
          </div>
        </div>

        {/* Enhanced Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Rychlé akce
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowOverlay(!showOverlay)}
              >
                {showOverlay ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showOverlay ? 'Skrýt pole' : 'Zobrazit pole'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleSave}
                disabled={document.status !== 'completed'}
              >
                <Save className="w-4 h-4 mr-2" />
                Uložit změny
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExport}
                disabled={document.status !== 'completed'}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportovat
              </Button>
            </CardContent>
          </Card>

          {/* Data Tabs */}
          <Card className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <CardHeader className="pb-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preview" className="text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    Náhled
                  </TabsTrigger>
                  <TabsTrigger value="data" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Data
                  </TabsTrigger>
                  <TabsTrigger value="ares" className="text-xs">
                    <Building2 className="w-3 h-3 mr-1" />
                    ARES
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-3">
                <TabsContent value="preview" className="mt-0">
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {document.extractedData.length}
                      </div>
                      <div className="text-xs text-blue-700">
                        Extrahovaných polí
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Průměrná přesnost: {Math.round(document.extractedData.reduce((acc, field) => acc + field.confidence, 0) / document.extractedData.length * 100)}%
                      </div>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {document.extractedData.slice(0, 8).map(field => {
                        const typeInfo = getFieldTypeInfo(field)
                        const IconComponent = typeInfo.icon

                        return (
                          <div key={field.id} className="p-2 bg-muted/30 rounded border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={cn("w-4 h-4 rounded flex items-center justify-center", typeInfo.bgColor)}>
                                <IconComponent className={cn("w-2.5 h-2.5", typeInfo.color)} />
                              </div>
                              <span className="text-xs font-medium truncate flex-1">
                                {field.field.split('.').pop()?.replace(/_/g, ' ')}
                              </span>
                              <Badge
                                variant={field.confidence > 0.9 ? 'default' : field.confidence > 0.7 ? 'secondary' : 'destructive'}
                                className="text-xs px-1 py-0"
                              >
                                {Math.round(field.confidence * 100)}%
                              </Badge>
                            </div>
                            <div className="text-xs font-mono bg-background p-1.5 rounded border text-gray-700">
                              {field.value || 'Nerozpoznáno'}
                            </div>
                            {(field.aresEnriched || field.validated) && (
                              <div className="flex gap-1 mt-1">
                                {field.aresEnriched && (
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    <Building2 className="w-2 h-2 mr-1" />
                                    ARES
                                  </Badge>
                                )}
                                {field.validated && (
                                  <Badge variant="outline" className="text-xs px-1 py-0 text-green-600">
                                    <CheckCircle className="w-2 h-2 mr-1" />
                                    Ověřeno
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {document.extractedData.length > 8 && (
                        <div className="text-center py-2">
                          <Button variant="outline" size="sm" onClick={() => setActiveTab('data')} className="text-xs">
                            Zobrazit všech {document.extractedData.length} polí
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="data" className="mt-0">
                  <div>
                    <h3 className="font-medium mb-2">Editor dat</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upravte extrahovaná data podle potřeby
                    </p>
                    <div className="max-h-96 overflow-auto">
                      <ExtractedDataEditor
                        extractedData={document.extractedData}
                        onFieldUpdate={handleFieldUpdate}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ares" className="mt-0">
                  <div>
                    <h3 className="font-medium mb-2">ARES Validace</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ověření a obohacení dat z ARES registru
                    </p>
                    <div className="max-h-96 overflow-auto">
                      <AresValidation
                        extractedData={document.extractedData}
                        aresData={document.aresData}
                        onDataUpdate={(updatedData) => {
                          setDocument(prev => prev ? { ...prev, aresData: updatedData } : null)
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}
