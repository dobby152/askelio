'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  MapPin,
  Hash,
  Shield,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react'

interface ExtractedField {
  id: string
  field: string
  value: string
  confidence: number
  validated?: boolean
  aresEnriched?: boolean
}

interface AresCompanyData {
  ico: string
  name: string
  dic?: string
  address?: string
  legal_form?: string
  is_active: boolean
  is_vat_payer: boolean
}

interface AresValidationProps {
  extractedData: ExtractedField[]
  aresData?: {
    vendor?: AresCompanyData
    customer?: AresCompanyData
  }
  onDataUpdate?: (updatedData: any) => void
}

export function AresValidation({ extractedData, aresData, onDataUpdate }: AresValidationProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<{
    vendor?: { status: 'success' | 'error' | 'warning', message: string, data?: AresCompanyData }
    customer?: { status: 'success' | 'error' | 'warning', message: string, data?: AresCompanyData }
  }>({})

  // Extract ICO values from extracted data
  const vendorIco = extractedData.find(f => f.field === 'vendor.ico')?.value
  const customerIco = extractedData.find(f => f.field === 'customer.ico')?.value

  useEffect(() => {
    // Initialize validation results based on existing ARES data
    if (aresData) {
      const results: typeof validationResults = {}
      
      if (aresData.vendor) {
        results.vendor = {
          status: 'success',
          message: 'Data úspěšně načtena z ARES',
          data: aresData.vendor
        }
      }
      
      if (aresData.customer) {
        results.customer = {
          status: 'success',
          message: 'Data úspěšně načtena z ARES',
          data: aresData.customer
        }
      }
      
      setValidationResults(results)
    }
  }, [aresData])

  const validateWithAres = async (ico: string, type: 'vendor' | 'customer') => {
    if (!ico || ico.length !== 8) {
      setValidationResults(prev => ({
        ...prev,
        [type]: {
          status: 'error',
          message: 'Neplatné IČO (musí mít 8 číslic)'
        }
      }))
      return
    }

    setIsValidating(true)
    
    try {
      const response = await fetch(`http://localhost:8001/api/v1/ares/${ico}`)
      const data = await response.json()

      if (data.success) {
        setValidationResults(prev => ({
          ...prev,
          [type]: {
            status: 'success',
            message: 'Data úspěšně načtena z ARES',
            data: data
          }
        }))

        // Update parent component with new ARES data
        if (onDataUpdate) {
          onDataUpdate({
            ...aresData,
            [type]: data
          })
        }
      } else {
        setValidationResults(prev => ({
          ...prev,
          [type]: {
            status: 'error',
            message: 'Společnost nebyla nalezena v ARES'
          }
        }))
      }
    } catch (error) {
      setValidationResults(prev => ({
        ...prev,
        [type]: {
          status: 'error',
          message: 'Chyba při komunikaci s ARES API'
        }
      }))
    } finally {
      setIsValidating(false)
    }
  }

  const handleValidateAll = async () => {
    const promises = []
    
    if (vendorIco) {
      promises.push(validateWithAres(vendorIco, 'vendor'))
    }
    
    if (customerIco) {
      promises.push(validateWithAres(customerIco, 'customer'))
    }

    await Promise.all(promises)
  }

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
    }
  }

  const CompanyCard = ({ 
    title, 
    ico, 
    type, 
    result 
  }: { 
    title: string
    ico?: string
    type: 'vendor' | 'customer'
    result?: { status: 'success' | 'error' | 'warning', message: string, data?: AresCompanyData }
  }) => (
    <Card className={`${result ? getStatusColor(result.status) : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>{title}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {result && getStatusIcon(result.status)}
            <Button
              size="sm"
              variant="outline"
              onClick={() => ico && validateWithAres(ico, type)}
              disabled={!ico || isValidating}
            >
              {isValidating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Ověřit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ico ? (
          <>
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-mono">{ico}</span>
              <Badge variant="outline" className="text-xs">IČO</Badge>
            </div>

            {result?.data && (
              <div className="space-y-2">
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Building2 className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{result.data.name}</p>
                      <p className="text-xs text-gray-500">Obchodní jméno</p>
                    </div>
                  </div>

                  {result.data.dic && (
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-mono">{result.data.dic}</span>
                      <Badge variant="outline" className="text-xs">DIČ</Badge>
                    </div>
                  )}

                  {result.data.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm">{result.data.address}</p>
                        <p className="text-xs text-gray-500">Sídlo</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2">
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${result.data.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs">{result.data.is_active ? 'Aktivní' : 'Neaktivní'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-gray-500" />
                      <span className="text-xs">{result.data.is_vat_payer ? 'Plátce DPH' : 'Neplátce DPH'}</span>
                    </div>
                  </div>

                  {result.data.legal_form && (
                    <div className="pt-1">
                      <Badge variant="secondary" className="text-xs">
                        {result.data.legal_form}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result?.message && (
              <Alert className="mt-3">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {result.message}
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">IČO nebylo extrahováno</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const hasAnyIco = vendorIco || customerIco
  const hasValidationResults = Object.keys(validationResults).length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">ARES Validace</h3>
          <Button
            size="sm"
            onClick={handleValidateAll}
            disabled={!hasAnyIco || isValidating}
          >
            {isValidating ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Ověřit vše
          </Button>
        </div>

        {!hasAnyIco && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Pro ARES validaci je potřeba extrahovat IČO dodavatele nebo odběratele.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <CompanyCard
            title="Dodavatel"
            ico={vendorIco}
            type="vendor"
            result={validationResults.vendor}
          />

          <CompanyCard
            title="Odběratel"
            ico={customerIco}
            type="customer"
            result={validationResults.customer}
          />

          {/* ARES Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-900">O ARES validaci</h4>
                  <p className="text-xs text-blue-700">
                    ARES (Administrativní registr ekonomických subjektů) automaticky doplňuje 
                    a ověřuje údaje o českých společnostech na základě IČO.
                  </p>
                  <div className="flex items-center space-x-1">
                    <ExternalLink className="w-3 h-3 text-blue-600" />
                    <a 
                      href="https://ares.gov.cz" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      ares.gov.cz
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
