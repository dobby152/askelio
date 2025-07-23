"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/lib/use-toast"
import { Upload, FileText, ImageIcon, X, CheckCircle, AlertCircle, DollarSign, Clock } from "lucide-react"
import { apiClient } from "@/lib/api"
import type {
  ProcessingOptions,
  ProcessingProgress,
  ProcessingMode,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE_MB
} from "@/lib/askelio-types"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  cost_estimate?: number
  processing_time?: number
  confidence?: number
  result?: any
  error_message?: string
}

export function UploadArea() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("cost_optimized")
  const [maxCost, setMaxCost] = useState<number>(5.0)  // 🚀 Increased for powerful models
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }, [])

  const handleFiles = async (fileList: File[]) => {
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/gif", "image/bmp", "image/tiff"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    for (const file of fileList) {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Nepodporovaný formát",
          description: `Soubor ${file.name} má nepodporovaný formát. Podporované: PDF, JPG, PNG, GIF, BMP, TIFF`,
          variant: "destructive",
        })
        continue
      }

      // Validate file size
      if (file.size > maxSize) {
        toast({
          title: "Soubor je příliš velký",
          description: `Soubor ${file.name} překračuje limit 10MB.`,
          variant: "destructive",
        })
        continue
      }

      // Show cost estimate
      try {
        const costEstimate = await apiClient.estimateCost(file, {
          mode: processingMode,
          max_cost_czk: maxCost
        })

        if (costEstimate.estimated_cost_czk > maxCost) {
          toast({
            title: "Odhadované náklady překračují limit",
            description: `Soubor ${file.name}: ${costEstimate.estimated_cost_czk} Kč (limit: ${maxCost} Kč)`,
            variant: "destructive",
          })
          continue
        }

        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          status: "uploading",
          progress: 0,
          cost_estimate: costEstimate.estimated_cost_czk,
        }

        setFiles((prev) => [...prev, newFile])

        // Process document with unified API
        processDocument(file, newFile.id)
      } catch (error) {
        console.error('Cost estimation failed:', error)
        toast({
          title: "Chyba při odhadu nákladů",
          description: `Nelze odhadnout náklady pro ${file.name}`,
          variant: "destructive",
        })
      }
    }
  }

  const processDocument = async (file: File, fileId: string) => {
    const startTime = Date.now()

    try {
      const options: ProcessingOptions = {
        mode: processingMode,
        max_cost_czk: maxCost,
        min_confidence: 0.8,
        enable_fallbacks: true,
        return_raw_text: true
      }

      console.log('🚀 UploadArea: Processing document with unified API:', file.name, options)

      const result = await apiClient.uploadDocument(file, options, (progress: ProcessingProgress) => {
        // Update progress in real-time
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  progress: progress.percentage,
                  status: progress.stage === 'complete' ? 'completed' :
                          progress.stage === 'error' ? 'error' : 'processing'
                }
              : f
          )
        )

        // Show progress updates
        if (progress.stage === 'uploading') {
          console.log(`📤 ${file.name}: ${progress.message}`)
        } else if (progress.stage === 'processing') {
          console.log(`⚙️ ${file.name}: ${progress.message}`)
        }
      })

      const processingTime = (Date.now() - startTime) / 1000

      console.log('✅ UploadArea: Document processed successfully:', result)

      // Update final status
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "completed",
                progress: 100,
                result: result,
                processing_time: processingTime,
                confidence: result.data?.confidence,
                cost_estimate: result.meta?.cost_czk
              }
            : f
        )
      )

      // Show success notification with details
      const confidenceText = result.data?.confidence
        ? `s ${(result.data.confidence * 100).toFixed(1)}% přesností`
        : ''
      const costText = result.meta?.cost_czk
        ? ` (${result.meta.cost_czk.toFixed(3)} Kč)`
        : ''

      toast({
        title: "Úspěšně zpracováno",
        description: `${file.name} byl zpracován ${confidenceText}${costText}`,
      })

    } catch (error) {
      console.error('Processing error:', error)

      let errorMessage = 'Neznámá chyba'

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Zpracování trvalo příliš dlouho (timeout)'
        } else {
          errorMessage = error.message
        }
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error",
                progress: 0,
                error_message: errorMessage
              }
            : f
        )
      )

      toast({
        title: "Chyba při zpracování",
        description: `${file.name}: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon
    if (type === "application/pdf") return FileText
    return FileText
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploading":
        return <Badge variant="secondary">Nahrává se</Badge>
      case "processing":
        return <Badge variant="secondary">Zpracovává se</Badge>
      case "completed":
        return <Badge variant="default">Hotovo</Badge>
      case "error":
        return <Badge variant="destructive">Chyba</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nahrát dokumenty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Processing Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">Režim zpracování</label>
              <select
                value={processingMode}
                onChange={(e) => setProcessingMode(e.target.value as ProcessingMode)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="cost_optimized">Optimalizované náklady (0.043 Kč/dok)</option>
                <option value="accuracy_first">Nejvyšší přesnost (0.30 Kč/dok)</option>
                <option value="speed_first">Nejrychlejší (0.014 Kč/dok)</option>
                <option value="budget_strict">Nejlevnější (0.007 Kč/dok)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max. náklady na dokument (Kč)</label>
              <input
                type="number"
                value={maxCost}
                onChange={(e) => setMaxCost(parseFloat(e.target.value) || 1.0)}
                step="0.1"
                min="0.1"
                max="5.0"
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Přetáhněte soubory sem</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">nebo klikněte pro výběr souborů</p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="cursor-pointer"
            >
              Vybrat soubory
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Podporované formáty: PDF, JPG, PNG, GIF, BMP, TIFF (max. 10MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nahrané soubory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type)
              return (
                <div key={file.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FileIcon className="w-8 h-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(file.status)}
                        {getStatusBadge(file.status)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>{formatFileSize(file.size)}</span>
                      {file.cost_estimate && (
                        <span className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {file.cost_estimate.toFixed(3)} Kč
                        </span>
                      )}
                      {file.processing_time && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {file.processing_time.toFixed(1)}s
                        </span>
                      )}
                      {file.confidence && (
                        <span className="text-green-600 dark:text-green-400">
                          {(file.confidence * 100).toFixed(1)}% přesnost
                        </span>
                      )}
                    </div>

                    {(file.status === "uploading" || file.status === "processing") && (
                      <Progress value={file.progress} className="mt-2 h-2" />
                    )}

                    {file.status === "error" && file.error_message && (
                      <p className="text-xs text-red-500 mt-1">{file.error_message}</p>
                    )}

                    {file.status === "completed" && file.result?.data?.structured_data && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                        <p className="text-green-700 dark:text-green-300">
                          Typ: {file.result.data.structured_data.document_type || 'Neznámý'}
                          {file.result.data.structured_data.amount && (
                            <span> • Částka: {file.result.data.structured_data.amount} {file.result.data.structured_data.currency || 'CZK'}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
