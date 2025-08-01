"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Search,
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  Filter,
  FileText,
  ImageIcon,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"

// Přidej import pro ExportDialog
import { ExportDialog } from "@/components/export-dialog"
import { AresInfoBadge } from "@/components/ares-info-badge"
import { InvoiceDirectionBadge, FinancialCategoryBadge, DirectionConfidenceIndicator } from "@/components/invoice-direction-badge"
import { apiClient } from "@/lib/api"
import { formatAmount } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { toast } from 'sonner'

interface Document {
  id: string
  name: string
  type: "pdf" | "image"
  status: "completed" | "processing" | "error"
  accuracy: number
  processedAt: string
  size: string
  pages: number
  extractedData?: {
    vendor?: string
    amount?: number
    currency?: string
    date?: string
    invoice_number?: string
  }
  aresEnriched?: {
    enriched_at: string
    notes: string[]
    success: boolean
    error?: string
  }
  // Invoice direction fields
  invoice_direction?: 'incoming' | 'outgoing' | 'unknown'
  direction_confidence?: number
  direction_method?: string
  financial_category?: 'revenue' | 'expense' | 'unknown'
  requires_manual_review?: boolean
  errorMessage?: string
}



interface DocumentsTableProps {
  onDocumentSelect?: (documentId: string) => void
  selectedDocumentId?: string
  className?: string
}

export function DocumentsTable({
  onDocumentSelect,
  selectedDocumentId,
  className
}: DocumentsTableProps = {}) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('cs-CZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Neznámé datum'
    }
  }

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        console.log('🚀 DocumentsTable: Starting to fetch documents using API client...')
        const data = await apiClient.getDocuments()
        console.log('📄 DocumentsTable: Raw backend data:', data)

        // Handle empty data gracefully
        if (!data || !Array.isArray(data)) {
          console.log('📋 DocumentsTable: No documents found or invalid data format')
          setDocuments([])
          return
        }

        // Transform backend data to frontend format
        const transformedDocs = data.map((doc: any) => {
          console.log('🔄 DocumentsTable: Transforming document:', doc)

          // Extract vendor information from structured data
          const structuredData = doc.structured_data || doc.extracted_data || {}
          const vendorInfo = structuredData.vendor || {}

          const transformed = {
            id: doc.id?.toString() || 'unknown',
            name: doc.file_name || doc.filename || doc.name || 'Unknown Document',
            type: doc.type === 'application/pdf' || doc.file_type === 'application/pdf' ? 'pdf' : 'image',
            status: doc.status === 'completed' ? 'completed' :
                   doc.status === 'processing' ? 'processing' :
                   doc.status === 'failed' ? 'error' : 'error',
            accuracy: typeof doc.accuracy === 'string'
              ? parseFloat(doc.accuracy.replace('%', '') || '0')
              : parseFloat(doc.accuracy?.toString() || '0'),
            processedAt: formatDate(doc.processed_at || doc.created_at || new Date().toISOString()),
            size: doc.size || doc.file_size || '0 MB',
            pages: doc.pages || 1,
            extractedData: {
              vendor: vendorInfo.name || 'Neznámý dodavatel',
              amount: structuredData.total_amount || structuredData.amount,
              currency: structuredData.currency || 'CZK',
              date: structuredData.date,
              invoice_number: structuredData.invoice_number
            },
            // Invoice direction fields
            invoice_direction: doc.invoice_direction || 'unknown',
            direction_confidence: doc.direction_confidence || 0,
            direction_method: doc.direction_method,
            financial_category: doc.financial_category || 'unknown',
            requires_manual_review: doc.requires_manual_review || false,
            errorMessage: doc.error_message
          }

          console.log('✅ DocumentsTable: Transformed document:', transformed)
          return transformed
        }).filter(doc => doc.id !== 'unknown') // Filter out invalid documents

        console.log('📋 DocumentsTable: Final documents array:', transformedDocs)
        setDocuments(transformedDocs as any)

        // Show user-friendly message if no documents
        if (transformedDocs.length === 0) {
          console.log('📝 DocumentsTable: No documents to display')
        }

      } catch (error) {
        console.error('💥 DocumentsTable: Error fetching documents:', error)
        console.error('🔧 Backend connection failed. Make sure backend is running on port 8001')
        setDocuments([])

        // Show user-friendly error message
        toast.error('Nepodařilo se načíst dokumenty. Zkontrolujte připojení k serveru.')
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    if (!confirm(`Opravdu chcete smazat dokument "${documentName}"? Tato akce je nevratná.`)) {
      return
    }

    setDeletingDocumentId(documentId)

    try {
      await apiClient.deleteDocument(documentId)

      // Remove document from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))

      // Show success message
      toast.success(`Dokument "${documentName}" byl úspěšně smazán`)
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error(`Chyba při mazání dokumentu: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    } finally {
      setDeletingDocumentId(null)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter
    const matchesType = typeFilter === "all" || doc.type === typeFilter

    console.log(`🔍 Filtering document ${doc.name}:`, {
      searchTerm,
      statusFilter,
      typeFilter,
      docStatus: doc.status,
      docType: doc.type,
      matchesSearch,
      matchesStatus,
      matchesType,
      finalResult: matchesSearch && matchesStatus && matchesType
    })

    return matchesSearch && matchesStatus && matchesType
  })

  console.log(`📊 Filtered documents: ${filteredDocuments.length}/${documents.length}`, filteredDocuments)

  const getStatusBadge = (status: string, errorMessage?: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hotovo
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Zpracovává se
          </Badge>
        )
      case "error":
        if (errorMessage) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Badge
                        variant="destructive"
                        className="cursor-pointer hover:bg-red-600 transition-colors"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Chyba
                      </Badge>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          Detaily chyby
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                            Chybová zpráva:
                          </h4>
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                            <code className="text-sm text-red-800 dark:text-red-200 break-words">
                              {errorMessage}
                            </code>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                            Možné příčiny:
                          </h4>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {errorMessage.includes('Bad image data') && (
                              <>
                                <li>• PDF soubor obsahuje neplatná nebo poškozená data</li>
                                <li>• Soubor může být chráněn heslem</li>
                                <li>• PDF může obsahovat pouze naskenované obrázky špatné kvality</li>
                                <li>• Soubor může být poškozen při nahrávání</li>
                              </>
                            )}
                            {errorMessage.includes('cannot identify image file') && (
                              <>
                                <li>• PDF soubor nelze zpracovat pomocí Tesseract OCR</li>
                                <li>• Použijte Google Vision API pro PDF soubory</li>
                              </>
                            )}
                            {errorMessage.includes('timeout') && (
                              <li>• Zpracování trvalo příliš dlouho</li>
                            )}
                            {errorMessage.includes('API') && (
                              <li>• Problém s připojením k OCR službě</li>
                            )}
                            {!errorMessage.includes('Bad image data') &&
                             !errorMessage.includes('cannot identify image file') &&
                             !errorMessage.includes('timeout') &&
                             !errorMessage.includes('API') && (
                              <li>• Soubor může být poškozen nebo v nepodporovaném formátu</li>
                            )}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                            Doporučené řešení:
                          </h4>
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                            {errorMessage.includes('Bad image data') && (
                              <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium mb-2">Zkuste následující kroky:</p>
                                <ol className="list-decimal list-inside space-y-1">
                                  <li>Zkontrolujte, zda PDF není chráněn heslem</li>
                                  <li>Exportujte PDF znovu z původního zdroje</li>
                                  <li>Zkuste konvertovat PDF na obrázek (PNG/JPG) a nahrajte znovu</li>
                                  <li>Použijte jiný OCR provider (Tesseract pro obrázky)</li>
                                </ol>
                              </div>
                            )}
                            {errorMessage.includes('cannot identify image file') && (
                              <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium">Nahrajte soubor znovu - systém automaticky použije Google Vision API pro PDF soubory.</p>
                              </div>
                            )}
                            {!errorMessage.includes('Bad image data') && !errorMessage.includes('cannot identify image file') && (
                              <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium">Zkuste nahrát soubor znovu nebo použijte jiný formát.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Klikněte pro zobrazení detailů chyby</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        } else {
          return (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Chyba
            </Badge>
          )
        }
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "pdf" ? (
      <FileText className="w-4 h-4 text-red-500" />
    ) : (
      <ImageIcon className="w-4 h-4 text-blue-500" />
    )
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        {/* V CardHeader sekci, přidej export tlačítko vedle filtrů: */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle>Nedávné dokumenty</CardTitle>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {/* Existující filtry... */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Hledat dokumenty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny</SelectItem>
                <SelectItem value="completed">Hotovo</SelectItem>
                <SelectItem value="processing">Zpracovává se</SelectItem>
                <SelectItem value="error">Chyba</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Obrázek</SelectItem>
              </SelectContent>
            </Select>

            <ExportDialog
              data={{ documents: filteredDocuments }}
              trigger={
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-x-auto overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dokument</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Směr faktury</TableHead>
                <TableHead>Finanční kategorie</TableHead>
                <TableHead>Přesnost</TableHead>
                <TableHead>Extrahovaná data</TableHead>
                <TableHead>Zpracováno</TableHead>
                <TableHead>Velikost</TableHead>
                <TableHead>Stránky</TableHead>
                <TableHead className="text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => {
                console.log(`🔄 Rendering table row for: ${document.name}`)
                return (
                <TableRow
                  key={document.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                    selectedDocumentId === document.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => onDocumentSelect?.(document.id)}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(document.type)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{document.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{document.type.toUpperCase()}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(document.status, document.errorMessage)}</TableCell>
                  <TableCell>
                    {document.invoice_direction ? (
                      <div className="flex items-center gap-2">
                        <InvoiceDirectionBadge
                          direction={document.invoice_direction}
                          confidence={document.direction_confidence}
                          requiresManualReview={document.requires_manual_review}
                        />
                        {document.direction_confidence !== undefined && (
                          <DirectionConfidenceIndicator
                            confidence={document.direction_confidence}
                            method={document.direction_method}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {document.financial_category && document.extractedData?.amount ? (
                      <FinancialCategoryBadge
                        category={document.financial_category}
                        amount={document.extractedData.amount}
                        currency={document.extractedData.currency}
                      />
                    ) : document.financial_category ? (
                      <FinancialCategoryBadge category={document.financial_category} />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {document.status === "completed" ? (
                      <span className="font-medium text-green-600 dark:text-green-400">{document.accuracy}%</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {document.extractedData ? (
                      <div className="text-sm space-y-1">
                        {document.extractedData.vendor && (
                          <div className="flex items-center gap-2">
                            <div className="text-gray-900 dark:text-white font-medium">
                              {document.extractedData.vendor}
                            </div>
                            {document.aresEnriched && (
                              <AresInfoBadge
                                enriched={document.aresEnriched.success}
                                enrichmentData={document.aresEnriched}
                                size="sm"
                              />
                            )}
                          </div>
                        )}
                        {document.extractedData.amount && (
                          <div className="text-green-600 dark:text-green-400 font-semibold">
                            {formatAmount(document.extractedData.amount, document.extractedData.currency)}
                          </div>
                        )}
                        {document.extractedData.date && (
                          <div className="text-gray-500 dark:text-gray-400">
                            {document.extractedData.date}
                          </div>
                        )}
                        {document.extractedData.invoice_number && (
                          <div className="text-blue-600 dark:text-blue-400 text-xs">
                            #{document.extractedData.invoice_number}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Žádná data</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">{document.processedAt}</TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">{document.size}</TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">{document.pages}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDocumentSelect?.(document.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Zobrazit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          window.open(`http://localhost:8001/documents/${document.id}/preview`, '_blank')
                        }}>
                          <Download className="w-4 h-4 mr-2" />
                          Stáhnout
                        </DropdownMenuItem>
                        <ExportDialog
                          data={{ documents: [document] }}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <FileText className="w-4 h-4 mr-2" />
                              Exportovat data
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteDocument(document.id, document.name)}
                          disabled={deletingDocumentId === document.id}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deletingDocumentId === document.id ? 'Mazání...' : 'Smazat'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Načítání dokumentů...</h3>

          </div>
        )}

        {!loading && filteredDocuments.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Žádné dokumenty</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Žádné dokumenty neodpovídají vašim filtrům."
                : "Zatím jste nenahrali žádné dokumenty."}
            </p>
            {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Systém je připraven.</strong><br />
                      Nahrajte svůj první dokument pomocí tlačítka "Nahrát dokument" výše.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
