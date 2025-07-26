'use client'

import { AlertTriangle, FileText, Calendar, DollarSign } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DuplicateDocument {
  document_id: number
  filename: string
  created_at: string | null
  match_type: 'exact_hash' | 'invoice_number_supplier'
  invoice_number?: string
  supplier_name?: string
  total_amount?: number
}

interface DuplicateWarningProps {
  isVisible: boolean
  duplicateCount: number
  duplicates: DuplicateDocument[]
  onContinue?: () => void
  onCancel?: () => void
  className?: string
}

export function DuplicateWarning({
  isVisible,
  duplicateCount,
  duplicates,
  onContinue,
  onCancel,
  className = ''
}: DuplicateWarningProps) {
  if (!isVisible || duplicateCount === 0) {
    return null
  }

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'exact_hash':
        return 'Přesná shoda'
      case 'invoice_number_supplier':
        return 'Číslo faktury + dodavatel'
      default:
        return 'Podobnost'
    }
  }

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'exact_hash':
        return 'destructive'
      case 'invoice_number_supplier':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Neznámé datum'
    
    try {
      return new Date(dateString).toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Neplatné datum'
    }
  }

  const formatAmount = (amount: number | undefined) => {
    if (amount === undefined) return null
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(amount)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Možná duplicitní faktura!</AlertTitle>
        <AlertDescription>
          Nalezli jsme {duplicateCount} {duplicateCount === 1 ? 'dokument' : 'dokumenty'} 
          {duplicateCount > 4 ? 'ů' : ''}, které se podobají této faktuře. 
          Zkontrolujte prosím, zda se nejedná o duplicitu.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Podobné dokumenty ({duplicateCount})
          </CardTitle>
          <CardDescription>
            Dokumenty, které mohou být duplicitní s aktuálně zpracovávanou fakturou
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {duplicates.map((duplicate, index) => (
              <div
                key={duplicate.document_id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {duplicate.filename}
                    </span>
                    <Badge variant={getMatchTypeColor(duplicate.match_type) as any}>
                      {getMatchTypeLabel(duplicate.match_type)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(duplicate.created_at)}
                    </div>
                    
                    {duplicate.invoice_number && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Č. {duplicate.invoice_number}
                      </div>
                    )}
                    
                    {duplicate.total_amount && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatAmount(duplicate.total_amount)}
                      </div>
                    )}
                  </div>
                  
                  {duplicate.supplier_name && (
                    <div className="text-xs text-muted-foreground">
                      Dodavatel: {duplicate.supplier_name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {(onContinue || onCancel) && (
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Zrušit zpracování
            </Button>
          )}
          {onContinue && (
            <Button onClick={onContinue}>
              Pokračovat přesto
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default DuplicateWarning
