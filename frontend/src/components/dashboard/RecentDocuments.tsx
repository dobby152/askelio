'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Activity,
  RefreshCw
} from 'lucide-react'
import { apiClient } from '@/lib/api-complete'

interface Document {
  id: string
  file_name: string
  status: 'processing' | 'completed' | 'error'
  created_at: string
  completed_at?: string
  final_extracted_data?: {
    total_amount?: number
    currency?: string
    vendor_name?: string
  }
  confidence_score?: number
  error_message?: string
}

interface RecentDocumentsProps {
  userId: string
  onDocumentUpdate?: (document: Document) => void
}

export function RecentDocuments({ userId, onDocumentUpdate }: RecentDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDocuments()
    // Set up real-time updates every 10 seconds for processing documents
    const interval = setInterval(() => {
      if (documents.some(doc => doc.status === 'processing')) {
        fetchDocuments(true)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [userId])

  const fetchDocuments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      console.log('🚀 RecentDocuments: Fetching documents using API client...')
      const data = await apiClient.getDocuments()
      console.log('📄 RecentDocuments: Raw backend data:', data)

      // Transform backend data to frontend format and limit to 5
      const transformedDocs = data.slice(0, 5).map((doc: any) => ({
        id: doc.id.toString(),
        name: doc.file_name || doc.filename || doc.name || 'Unknown',
        type: doc.type === 'application/pdf' ? 'pdf' : 'image',
        status: doc.status === 'completed' ? 'completed' :
               doc.status === 'processing' ? 'processing' :
               doc.status === 'failed' ? 'error' : 'error',
        accuracy: parseFloat(doc.accuracy?.toString().replace('%', '') || '0'),
        processedAt: doc.processed_at || doc.created_at || new Date().toISOString(),
        size: doc.size || '0 MB',
        pages: doc.pages || 1,
        extractedData: doc.extracted_data || doc.extracted_text,
        errorMessage: doc.error_message
      }))

      console.log('📋 RecentDocuments: Transformed documents:', transformedDocs)
      setDocuments(transformedDocs)

      // Notify parent component about updates
      if (onDocumentUpdate && transformedDocs.length > 0) {
        onDocumentUpdate(transformedDocs[0])
      }
    } catch (error) {
      console.error('💥 RecentDocuments: Error fetching documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `Před ${diffInMinutes} minutami`
    } else if (diffInHours < 24) {
      return `Před ${diffInHours} hodinami`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Před ${diffInDays} dny`
    }
  }

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return 'N/A'
    return `${amount.toLocaleString()} ${currency || 'CZK'}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 mr-1" />
      case 'processing':
        return <Clock className="w-3 h-3 mr-1 animate-spin" />
      case 'error':
        return <AlertCircle className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Dokončeno'
      case 'processing':
        return 'Zpracovává se'
      case 'error':
        return 'Chyba'
      default:
        return 'Neznámý'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Nedávné dokumenty</h2>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl animate-pulse">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-xl mr-4"></div>
                <div>
                  <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="w-20 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Nedávné dokumenty</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchDocuments(true)}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <a href="/documents" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Zobrazit vše
          </a>
        </div>
      </div>
      
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Zatím nemáte žádné dokumenty</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 truncate max-w-xs">{doc.file_name}</h3>
                  <p className="text-sm text-gray-600">{formatTimeAgo(doc.created_at)}</p>
                  {doc.error_message && (
                    <p className="text-xs text-red-600 mt-1">{doc.error_message}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatAmount(doc.final_extracted_data?.total_amount, doc.final_extracted_data?.currency)}
                  </p>
                  <div className="flex items-center justify-end">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {getStatusIcon(doc.status)}
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                </div>
                
                {doc.status === 'completed' && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
