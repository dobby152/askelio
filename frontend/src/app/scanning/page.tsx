'use client'

import { InvoiceUploadWorkspace } from '@/components/invoice-upload-workspace'

export default function ScanningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Enhanced Header */}
      <div className="text-center py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-6 leading-tight">
            Skenování dokumentů
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Nahrajte faktury, účtenky nebo jiné dokumenty pro automatické zpracování pomocí AI
          </p>

          {/* Decorative Elements */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full animate-pulse"></div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <InvoiceUploadWorkspace />
      </div>
    </div>
  )
}
