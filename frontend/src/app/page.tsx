'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { FileUpload } from '@/components/FileUpload'
import { LandingPage } from '@/components/LandingPage'
import { CheckCircle, AlertCircle, FileText, Zap } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUploadSuccess = (document: any) => {
    setUploadSuccess(`Dokument "${document.file_name}" byl úspěšně nahrán a zpracování bylo zahájeno.`)
    setUploadError(null)
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
    setUploadSuccess(null)
  }

  if (!user) {
    return <LandingPage />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Nahrát nový dokument
        </h1>
        <p className="text-gray-600">
          Nahrajte fakturu nebo účtenku pro automatické zpracování
        </p>
      </div>

      {/* Upload Success/Error Messages */}
      {uploadSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-sm text-green-700">{uploadSuccess}</p>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <a
          href="/documents"
          className="block p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <FileText className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Moje dokumenty</h3>
          <p className="text-gray-600">Zobrazit všechny nahrané a zpracované dokumenty</p>
        </a>

        <a
          href="/credits"
          className="block p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <Zap className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Správa kreditů</h3>
          <p className="text-gray-600">Zobrazit zůstatek a dobít kredity pro AI zpracování</p>
        </a>
      </div>
    </div>
  )
}
