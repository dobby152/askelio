'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload,
  FileText,
  Image,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { apiClient } from '@/lib/api-complete'

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

interface DocumentUploadProps {
  onUploadComplete?: (files: UploadFile[]) => void
  maxFiles?: number
  maxFileSize?: number // in MB
}

export function DocumentUpload({ 
  onUploadComplete, 
  maxFiles = 10, 
  maxFileSize = 10 
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ]

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Nepodporovaný formát souboru. Podporované: PDF, JPG, PNG, WebP'
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Soubor je příliš velký. Maximum: ${maxFileSize}MB`
    }
    
    return null
  }

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    
    if (files.length + fileArray.length > maxFiles) {
      alert(`Můžete nahrát maximálně ${maxFiles} souborů najednou`)
      return
    }

    const validFiles: UploadFile[] = []
    
    fileArray.forEach(file => {
      const error = validateFile(file)
      validFiles.push({
        file,
        id: generateId(),
        status: error ? 'error' : 'pending',
        progress: 0,
        error
      })
    })

    setFiles(prev => [...prev, ...validFiles])
  }, [files.length, maxFiles])

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
    
    const droppedFiles = e.dataTransfer.files
    handleFiles(droppedFiles)
  }, [handleFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    try {
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ))

      console.log('🚀 DocumentUpload: Uploading file using API client:', uploadFile.file.name)
      const result = await apiClient.uploadDocument(uploadFile.file)
      console.log('✅ DocumentUpload: Upload successful:', result)

      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'success', progress: 100 }
          : f
      ))
    } catch (error) {
      console.error('💥 DocumentUpload: Upload failed:', error)
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: 'error',
              progress: 0,
              error: error instanceof Error ? error.message : 'Neznámá chyba'
            }
          : f
      ))
    }
  }

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of pendingFiles) {
        await uploadFile(file)
      }
      
      if (onUploadComplete) {
        onUploadComplete(files)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'))
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />
    }
    return <Image className="w-8 h-8 text-blue-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const successCount = files.filter(f => f.status === 'success').length
  const errorCount = files.filter(f => f.status === 'error').length

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Upload className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Nahrát dokumenty</h2>
        </div>
        {files.length > 0 && (
          <div className="flex items-center space-x-2">
            {successCount > 0 && (
              <button
                onClick={clearCompleted}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Vymazat dokončené
              </button>
            )}
            {pendingCount > 0 && (
              <button
                onClick={uploadAllFiles}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isUploading ? 'Nahrávám...' : `Nahrát (${pendingCount})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Přetáhněte soubory sem nebo klikněte pro výběr
        </h3>
        <p className="text-gray-600 mb-4">
          Podporované formáty: PDF, JPG, PNG, WebP (max. {maxFileSize}MB)
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Vybrat soubory
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">
              Vybrané soubory ({files.length})
            </h3>
            <div className="text-sm text-gray-500">
              {successCount > 0 && <span className="text-green-600">{successCount} úspěšných</span>}
              {errorCount > 0 && <span className="text-red-600 ml-2">{errorCount} chyb</span>}
            </div>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {files.map((uploadFile) => (
              <div key={uploadFile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center flex-1">
                  {getFileIcon(uploadFile.file)}
                  <div className="ml-3 flex-1">
                    <h4 className="font-medium text-gray-900 truncate max-w-xs">
                      {uploadFile.file.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    {uploadFile.error && (
                      <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {uploadFile.status === 'uploading' && (
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {getStatusIcon(uploadFile.status)}
                  
                  {uploadFile.status !== 'uploading' && (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
