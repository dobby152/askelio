'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Building2, 
  User, 
  Hash, 
  Calendar, 
  Euro, 
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  Undo
} from 'lucide-react'

interface ExtractedField {
  id: string
  field: string
  value: string
  confidence: number
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
  validated?: boolean
  aresEnriched?: boolean
}

interface ExtractedDataEditorProps {
  extractedData: ExtractedField[]
  onFieldUpdate?: (fieldId: string, newValue: string) => void
}

interface FieldGroup {
  title: string
  icon: React.ReactNode
  fields: ExtractedField[]
  color: string
}

export function ExtractedDataEditor({ extractedData, onFieldUpdate }: ExtractedDataEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  // Group fields by category
  const fieldGroups: FieldGroup[] = useMemo(() => {
    const groups: FieldGroup[] = [
      {
        title: 'Dodavatel',
        icon: <Building2 className="w-4 h-4" />,
        fields: extractedData.filter(f => f.field.startsWith('vendor.')),
        color: 'blue'
      },
      {
        title: 'Odběratel',
        icon: <User className="w-4 h-4" />,
        fields: extractedData.filter(f => f.field.startsWith('customer.')),
        color: 'green'
      },
      {
        title: 'Faktura',
        icon: <FileText className="w-4 h-4" />,
        fields: extractedData.filter(f => 
          f.field.includes('invoice_number') || 
          f.field.includes('issue_date') || 
          f.field.includes('due_date')
        ),
        color: 'purple'
      },
      {
        title: 'Částky',
        icon: <Euro className="w-4 h-4" />,
        fields: extractedData.filter(f => 
          f.field.includes('amount') || 
          f.field.includes('price') || 
          f.field.includes('vat') ||
          f.field.includes('total')
        ),
        color: 'orange'
      },
      {
        title: 'Ostatní',
        icon: <Hash className="w-4 h-4" />,
        fields: extractedData.filter(f => 
          !f.field.startsWith('vendor.') &&
          !f.field.startsWith('customer.') &&
          !f.field.includes('invoice_number') &&
          !f.field.includes('issue_date') &&
          !f.field.includes('due_date') &&
          !f.field.includes('amount') &&
          !f.field.includes('price') &&
          !f.field.includes('vat') &&
          !f.field.includes('total')
        ),
        color: 'gray'
      }
    ].filter(group => group.fields.length > 0)

    return groups
  }, [extractedData])

  const getFieldIcon = (fieldName: string) => {
    if (fieldName.includes('ico') || fieldName.includes('dic')) return <Building2 className="w-4 h-4" />
    if (fieldName.includes('name')) return <User className="w-4 h-4" />
    if (fieldName.includes('address')) return <MapPin className="w-4 h-4" />
    if (fieldName.includes('phone')) return <Phone className="w-4 h-4" />
    if (fieldName.includes('email')) return <Mail className="w-4 h-4" />
    if (fieldName.includes('date')) return <Calendar className="w-4 h-4" />
    if (fieldName.includes('amount') || fieldName.includes('price')) return <Euro className="w-4 h-4" />
    if (fieldName.includes('number')) return <Hash className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const getFieldDisplayName = (fieldName: string) => {
    const parts = fieldName.split('.')
    const lastPart = parts[parts.length - 1]
    
    const displayNames: Record<string, string> = {
      'ico': 'IČO',
      'dic': 'DIČ',
      'name': 'Název',
      'address': 'Adresa',
      'phone': 'Telefon',
      'email': 'Email',
      'invoice_number': 'Číslo faktury',
      'issue_date': 'Datum vystavení',
      'due_date': 'Datum splatnosti',
      'total_amount': 'Celková částka',
      'subtotal': 'Částka bez DPH',
      'vat_amount': 'DPH',
      'vat_rate': 'Sazba DPH'
    }
    
    return displayNames[lastPart] || lastPart
  }

  const handleStartEdit = (field: ExtractedField) => {
    setEditingField(field.id)
    setEditValues(prev => ({ ...prev, [field.id]: field.value }))
  }

  const handleSaveEdit = (field: ExtractedField) => {
    const newValue = editValues[field.id] || field.value
    if (onFieldUpdate) {
      onFieldUpdate(field.id, newValue)
    }
    setEditingField(null)
  }

  const handleCancelEdit = () => {
    setEditingField(null)
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Vysoká ({Math.round(confidence * 100)}%)</Badge>
    } else if (confidence >= 0.7) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Střední ({Math.round(confidence * 100)}%)</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-300">Nízká ({Math.round(confidence * 100)}%)</Badge>
    }
  }

  const validatedCount = extractedData.filter(f => f.validated).length
  const aresEnrichedCount = extractedData.filter(f => f.aresEnriched).length

  return (
    <div className="h-full flex flex-col">
      {/* Header with stats */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Extrahovaná data</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {extractedData.length} polí
            </Badge>
            <Badge variant="outline" className="text-xs">
              {validatedCount} ověřeno
            </Badge>
            {aresEnrichedCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {aresEnrichedCount} z ARES
              </Badge>
            )}
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-semibold text-green-700">{validatedCount}</div>
            <div className="text-green-600">Ověřeno</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="font-semibold text-blue-700">{aresEnrichedCount}</div>
            <div className="text-blue-600">ARES</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded">
            <div className="font-semibold text-orange-700">
              {extractedData.filter(f => f.confidence < 0.8).length}
            </div>
            <div className="text-orange-600">Kontrola</div>
          </div>
        </div>
      </div>

      {/* Field groups */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {fieldGroups.map((group) => (
            <Card key={group.title} className="border-l-4" style={{ borderLeftColor: `var(--${group.color}-500)` }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  {group.icon}
                  <span>{group.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {group.fields.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.fields.map((field) => {
                  const isEditing = editingField === field.id
                  const currentValue = editValues[field.id] || field.value

                  return (
                    <div key={field.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getFieldIcon(field.field)}
                          <Label className="text-sm font-medium">
                            {getFieldDisplayName(field.field)}
                          </Label>
                          {field.aresEnriched && (
                            <Badge variant="outline" className="text-xs px-1">
                              ARES
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getConfidenceBadge(field.confidence)}
                          {field.validated ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={currentValue}
                            onChange={(e) => setEditValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                            className="text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(field)
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                          />
                          <div className="flex items-center space-x-2">
                            <Button size="sm" onClick={() => handleSaveEdit(field)}>
                              <Save className="w-3 h-3 mr-1" />
                              Uložit
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <Undo className="w-3 h-3 mr-1" />
                              Zrušit
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleStartEdit(field)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono">{field.value || '(prázdné)'}</span>
                            <Edit3 className="w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
