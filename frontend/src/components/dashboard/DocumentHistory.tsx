'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'

interface Document {
  id: string
  filename: string
  file_type: string
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled'
  document_type?: string
  processing_cost?: number
  confidence_score?: number
  created_at: string
  processed_at?: string
}

export function DocumentHistory() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch documents from API
      const documentsData = await apiClient.getDocuments()

      // Transform API data to component format
      const transformedDocuments: Document[] = documentsData.map((doc: any) => ({
        id: doc.id.toString(),
        filename: doc.filename,
        file_type: doc.type || 'application/pdf',
        status: doc.status,
        document_type: doc.type || 'unknown',
        processing_cost: doc.cost_czk || 0,
        confidence_score: doc.confidence || 0,
        created_at: doc.created_at,
        processed_at: doc.created_at
      }))

      setDocuments(transformedDocuments)
    } catch (err) {
      setError('Nepodařilo se načíst historii dokumentů')
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'processing':
      case 'uploading':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Dokončeno</Badge>
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Zpracovává se</Badge>
      case 'uploading':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Nahrává se</Badge>
      case 'failed':
        return <Badge variant="destructive">Chyba</Badge>
      case 'cancelled':
        return <Badge variant="secondary">Zrušeno</Badge>
      default:
        return <Badge variant="outline">Neznámý</Badge>
    }
  }

  const getDocumentTypeLabel = (type?: string) => {
    switch (type) {
      case 'invoice':
        return 'Faktura'
      case 'receipt':
        return 'Účtenka'
      case 'contract':
        return 'Smlouva'
      case 'form':
        return 'Formulář'
      default:
        return 'Dokument'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewDocument = (document: Document) => {
    toast.info(`Zobrazení dokumentu: ${document.filename}`)
    // TODO: Implement document viewer
  }

  const handleDownloadDocument = (document: Document) => {
    toast.info(`Stahování dokumentu: ${document.filename}`)
    // TODO: Implement document download
  }

  const handleDeleteDocument = async (document: Document) => {
    if (!confirm(`Opravdu chcete smazat dokument "${document.filename}"? Tato akce je nevratná.`)) {
      return
    }

    try {
      await apiClient.deleteDocument(document.id)

      // Remove document from local state
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))

      toast.success(`Dokument "${document.filename}" byl úspěšně smazán`)
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error(`Chyba při mazání dokumentu: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historie dokumentů
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historie dokumentů
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button 
            onClick={fetchDocuments} 
            variant="outline" 
            size="sm" 
            className="mt-4"
          >
            Zkusit znovu
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Historie dokumentů
        </CardTitle>
        <CardDescription>
          Přehled všech zpracovaných dokumentů
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat dokumenty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">Všechny stavy</option>
            <option value="completed">Dokončeno</option>
            <option value="processing">Zpracovává se</option>
            <option value="failed">Chyba</option>
          </select>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'Žádné dokumenty neodpovídají filtru'
                : 'Zatím nemáte žádné zpracované dokumenty'
              }
            </div>
          ) : (
            filteredDocuments.map((document) => (
              <div 
                key={document.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(document.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{document.filename}</p>
                      {getStatusBadge(document.status)}
                      {document.document_type && (
                        <Badge variant="outline" className="text-xs">
                          {getDocumentTypeLabel(document.document_type)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Nahráno: {formatDate(document.created_at)}</span>
                      {document.processed_at && (
                        <span>Zpracováno: {formatDate(document.processed_at)}</span>
                      )}
                      {document.processing_cost && (
                        <span>Cena: {document.processing_cost.toFixed(2)} Kč</span>
                      )}
                      {document.confidence_score && (
                        <span>Přesnost: {(document.confidence_score * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {document.status === 'completed' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDocument(document)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadDocument(document)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(document)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {filteredDocuments.length > 0 && (
          <div className="text-center pt-4">
            <Button variant="outline" onClick={fetchDocuments}>
              Načíst další
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
