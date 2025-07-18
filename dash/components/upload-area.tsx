"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, ImageIcon, X, CheckCircle, AlertCircle } from "lucide-react"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
}

export function UploadArea() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
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

  const handleFiles = (fileList: File[]) => {
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    fileList.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Nepodporovaný formát",
          description: `Soubor ${file.name} má nepodporovaný formát.`,
          variant: "destructive",
        })
        return
      }

      if (file.size > maxSize) {
        toast({
          title: "Soubor je příliš velký",
          description: `Soubor ${file.name} překračuje limit 10MB.`,
          variant: "destructive",
        })
        return
      }

      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      }

      setFiles((prev) => [...prev, newFile])

      // Simulate upload progress
      simulateUpload(newFile.id)
    })
  }

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId) {
            if (file.progress < 100) {
              return { ...file, progress: file.progress + 10 }
            } else if (file.status === "uploading") {
              return { ...file, status: "processing" }
            } else if (file.status === "processing") {
              // Randomly succeed or fail
              const success = Math.random() > 0.2
              return {
                ...file,
                status: success ? "completed" : "error",
                progress: 100,
              }
            }
          }
          return file
        }),
      )
    }, 500)

    setTimeout(() => clearInterval(interval), 6000)
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
        <CardContent>
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
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Vybrat soubory
              </label>
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Podporované formáty: PDF, JPG, PNG (max. 10MB)
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
                <div key={file.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FileIcon className="w-8 h-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(file.status)}
                        {getStatusBadge(file.status)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                    {(file.status === "uploading" || file.status === "processing") && (
                      <Progress value={file.progress} className="mt-2 h-1" />
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
