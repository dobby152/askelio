'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, BarChart3 } from 'lucide-react'
import DuplicateWarning from '@/components/DuplicateWarning'
import { duplicateAPI, type InvoiceData, type DuplicateCheckResult, type DuplicateStatsResult } from '@/lib/duplicate-api'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function TestDuplicatesPage() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoice_number: '',
    supplier_name: '',
    total_amount: undefined,
    date: '',
    currency: 'CZK'
  })
  
  const [isChecking, setIsChecking] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [checkResult, setCheckResult] = useState<DuplicateCheckResult | null>(null)
  const [stats, setStats] = useState<DuplicateStatsResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof InvoiceData, value: string) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: field === 'total_amount' ? (value ? parseFloat(value) : undefined) : value
    }))
  }

  const handleCheckDuplicates = async () => {
    setIsChecking(true)
    setError(null)
    setCheckResult(null)

    try {
      const result = await duplicateAPI.checkDuplicates(invoiceData)
      setCheckResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neočekávaná chyba')
    } finally {
      setIsChecking(false)
    }
  }

  const handleLoadStats = async () => {
    setIsLoadingStats(true)
    setError(null)

    try {
      const result = await duplicateAPI.getDuplicateStats()
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neočekávaná chyba')
    } finally {
      setIsLoadingStats(false)
    }
  }

  const fillSampleData = () => {
    setInvoiceData({
      invoice_number: '2501042',
      supplier_name: 'Askela s.r.o.',
      total_amount: 7865,
      date: '2025-01-15',
      currency: 'CZK'
    })
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Test detekce duplicit</h1>
          <p className="text-muted-foreground">
            Testování systému pro detekci duplicitních faktur
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Duplicate Check Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Kontrola duplicit
              </CardTitle>
              <CardDescription>
                Zadejte údaje faktury pro kontrolu duplicit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Číslo faktury</Label>
                <Input
                  id="invoice_number"
                  value={invoiceData.invoice_number || ''}
                  onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                  placeholder="např. 2501042"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_name">Název dodavatele</Label>
                <Input
                  id="supplier_name"
                  value={invoiceData.supplier_name || ''}
                  onChange={(e) => handleInputChange('supplier_name', e.target.value)}
                  placeholder="např. Askela s.r.o."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_amount">Celková částka (CZK)</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={invoiceData.total_amount || ''}
                  onChange={(e) => handleInputChange('total_amount', e.target.value)}
                  placeholder="např. 7865"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Datum faktury</Label>
                <Input
                  id="date"
                  type="date"
                  value={invoiceData.date || ''}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Měna</Label>
                <Input
                  id="currency"
                  value={invoiceData.currency || ''}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  placeholder="CZK"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCheckDuplicates}
                  disabled={isChecking}
                  className="flex-1"
                >
                  {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Zkontrolovat duplicity
                </Button>
                <Button
                  variant="outline"
                  onClick={fillSampleData}
                >
                  Vzorová data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistiky duplicit
              </CardTitle>
              <CardDescription>
                Přehled duplicitních dokumentů ve vašem účtu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Celkem dokumentů:</span>
                    <span className="font-medium">{stats.data.total_documents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>S hash hodnotou:</span>
                    <span className="font-medium">{stats.data.documents_with_hash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skupiny duplicit:</span>
                    <span className="font-medium">{stats.data.duplicate_groups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Celkem duplicit:</span>
                    <span className="font-medium">{stats.data.total_duplicates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Míra duplicit:</span>
                    <span className="font-medium">{stats.data.duplicate_rate.toFixed(1)}%</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleLoadStats}
                disabled={isLoadingStats}
                variant="outline"
                className="w-full"
              >
                {isLoadingStats && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Načíst statistiky
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Duplicate Warning */}
        {checkResult && (
          <DuplicateWarning
            isVisible={checkResult.is_duplicate}
            duplicateCount={checkResult.duplicate_count}
            duplicates={checkResult.duplicates}
            onContinue={() => {
              console.log('User chose to continue despite duplicates')
              setCheckResult(null)
            }}
            onCancel={() => {
              console.log('User cancelled due to duplicates')
              setCheckResult(null)
            }}
          />
        )}

        {/* Results */}
        {checkResult && !checkResult.is_duplicate && (
          <Alert>
            <AlertDescription>
              ✅ Žádné duplicity nebyly nalezeny. Faktura je unikátní.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </ProtectedRoute>
  )
}
