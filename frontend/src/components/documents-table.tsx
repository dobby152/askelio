"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { apiClient } from "@/lib/api"

interface Document {
  id: string
  name: string
  type: "pdf" | "image"
  status: "completed" | "processing" | "error"
  accuracy: number
  processedAt: string
  size: string
  pages: number
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Faktura_2024_001.pdf",
    type: "pdf",
    status: "completed",
    accuracy: 98.5,
    processedAt: "2024-01-15 14:30",
    size: "2.4 MB",
    pages: 3,
  },
  {
    id: "2",
    name: "Smlouva_dodavatel.pdf",
    type: "pdf",
    status: "completed",
    accuracy: 97.2,
    processedAt: "2024-01-15 13:45",
    size: "1.8 MB",
    pages: 5,
  },
  {
    id: "3",
    name: "Doklad_scan.jpg",
    type: "image",
    status: "processing",
    accuracy: 0,
    processedAt: "2024-01-15 15:20",
    size: "3.2 MB",
    pages: 1,
  },
  {
    id: "4",
    name: "Certifikat_ISO.pdf",
    type: "pdf",
    status: "error",
    accuracy: 0,
    processedAt: "2024-01-15 12:15",
    size: "5.1 MB",
    pages: 8,
  },
  {
    id: "5",
    name: "Objednavka_2024.pdf",
    type: "pdf",
    status: "completed",
    accuracy: 99.1,
    processedAt: "2024-01-15 11:30",
    size: "1.2 MB",
    pages: 2,
  },
]

export function DocumentsTable() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('http://localhost:8000/documents')
        if (response.ok) {
          const data = await response.json()
          // Transform backend data to frontend format
          const transformedDocs = data.map((doc: any) => ({
            id: doc.id,
            name: doc.filename || doc.name || 'Unknown',
            type: doc.type === 'application/pdf' ? 'pdf' : 'image',
            status: doc.status === 'completed' ? 'completed' :
                   doc.status === 'processing' ? 'processing' : 'error',
            accuracy: doc.accuracy || 0,
            processedAt: doc.processed_at || doc.created_at || new Date().toISOString(),
            size: doc.size || '0 MB',
            pages: doc.pages || 1
          }))
          setDocuments(transformedDocs)
        } else {
          // Fallback to mock data
          setDocuments(mockDocuments)
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
        // Fallback to mock data
        setDocuments(mockDocuments)
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter
    const matchesType = typeFilter === "all" || doc.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
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
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Chyba
          </Badge>
        )
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
    <Card>
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
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dokument</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Přesnost</TableHead>
                <TableHead>Zpracováno</TableHead>
                <TableHead>Velikost</TableHead>
                <TableHead>Stránky</TableHead>
                <TableHead className="text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(document.type)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{document.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{document.type.toUpperCase()}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(document.status)}</TableCell>
                  <TableCell>
                    {document.status === "completed" ? (
                      <span className="font-medium text-green-600 dark:text-green-400">{document.accuracy}%</span>
                    ) : (
                      <span className="text-gray-400">-</span>
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
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Zobrazit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Stáhnout
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Smazat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Žádné dokumenty</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Žádné dokumenty neodpovídají vašim filtrům."
                : "Zatím jste nenahrali žádné dokumenty."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
