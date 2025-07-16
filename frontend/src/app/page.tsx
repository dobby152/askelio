'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { FileUpload } from '@/components/FileUpload'
import { CheckCircle, AlertCircle, FileText, Zap, Shield, Clock } from 'lucide-react'

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
    return (
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Automatizace zpracování faktur
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Askelio je SaaS platforma pro automatizované vytěžování dat z faktur a účtenek
            pomocí OCR technologií a AI. Ušetřete čas a eliminujte chyby při zpracování dokumentů.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/auth/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Začít zdarma
            </a>
            <a
              href="/auth/login"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Přihlásit se
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 py-16">
          <div className="text-center">
            <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Rychlé zpracování</h3>
            <p className="text-gray-600">
              Automatické vytěžení dat během několika sekund pomocí pokročilého OCR a AI.
            </p>
          </div>
          <div className="text-center">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Vysoká přesnost</h3>
            <p className="text-gray-600">
              Inteligentní fallback na prémiové AI OCR zaručuje přesnost přes 95 % u klíčových polí.
            </p>
          </div>
          <div className="text-center">
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Úspora času</h3>
            <p className="text-gray-600">
              Eliminujte manuální přepisování dat a ušetřete desítky hodin měsíčně.
            </p>
          </div>
        </div>
      </div>
    )
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
