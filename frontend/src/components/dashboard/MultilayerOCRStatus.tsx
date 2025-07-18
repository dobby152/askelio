'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { apiClient } from '@/lib/api'
import { 
  Brain, 
  Cpu, 
  Eye, 
  Cloud, 
  Server, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Zap,
  Target,
  Users
} from 'lucide-react'

interface OCRProvider {
  provider: string
  available: boolean
  version?: string
  features?: string[]
  supported_formats?: string[]
}

interface OCRStatus {
  available_providers: string[]
  total_providers: number
  ai_decision_engine: boolean
  result_fusion_engine: boolean
  max_workers: number
  timeout: number
  provider_weights: Record<string, number>
}

export function MultilayerOCRStatus() {
  const [status, setStatus] = useState<OCRStatus | null>(null)
  const [providers, setProviders] = useState<OCRProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOCRData = async () => {
    try {
      const [statusData, providersData] = await Promise.all([
        apiClient.getOCRStatus(),
        apiClient.getOCRProviders()
      ])
      
      setStatus(statusData)
      setProviders(providersData.providers || [])
    } catch (error) {
      console.error('Error fetching OCR data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOCRData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOCRData()
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google_vision':
        return <Cloud className="h-4 w-4" />
      case 'azure_computer_vision':
        return <Cloud className="h-4 w-4" />
      case 'tesseract':
        return <Server className="h-4 w-4" />
      case 'paddle_ocr':
        return <Cpu className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getProviderName = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google_vision':
        return 'Google Vision'
      case 'azure_computer_vision':
        return 'Azure Computer Vision'
      case 'tesseract':
        return 'Tesseract OCR'
      case 'paddle_ocr':
        return 'PaddleOCR'
      default:
        return provider
    }
  }

  const getProviderBadgeVariant = (available: boolean) => {
    return available ? 'default' : 'secondary'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Multilayer OCR Status
          </CardTitle>
          <CardDescription>
            Načítání stavu OCR systému...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Multilayer OCR Status
          </CardTitle>
          <CardDescription>
            Nepodařilo se načíst stav OCR systému
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Zkusit znovu
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Multilayer OCR Status
            </CardTitle>
            <CardDescription>
              Stav pokročilého OCR systému s AI rozhodováním
            </CardDescription>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Obnovit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{status.available_providers.length}</div>
            <div className="text-sm text-muted-foreground">Aktivní providery</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Brain className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-2xl font-bold">
              {status.ai_decision_engine ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-red-500" />}
            </div>
            <div className="text-sm text-muted-foreground">AI Engine</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">
              {status.result_fusion_engine ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-red-500" />}
            </div>
            <div className="text-sm text-muted-foreground">Result Fusion</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{status.max_workers}</div>
            <div className="text-sm text-muted-foreground">Max Workers</div>
          </div>
        </div>

        <Separator />

        {/* OCR Providers */}
        <div>
          <h4 className="text-sm font-medium mb-3">OCR Providers</h4>
          <div className="grid gap-3">
            {providers.map((provider, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getProviderIcon(provider.provider)}
                  <div>
                    <div className="font-medium">{getProviderName(provider.provider)}</div>
                    {provider.version && (
                      <div className="text-sm text-muted-foreground">v{provider.version}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getProviderBadgeVariant(provider.available)}>
                    {provider.available ? 'Dostupný' : 'Nedostupný'}
                  </Badge>
                  {status.provider_weights[provider.provider] && (
                    <div className="text-sm text-muted-foreground">
                      Váha: {(status.provider_weights[provider.provider] * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Features */}
        {providers.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3">Podporované funkce</h4>
              <div className="grid gap-2">
                {providers.filter(p => p.features && p.features.length > 0).map((provider, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{getProviderName(provider.provider)}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {provider.features?.map((feature, fIndex) => (
                        <Badge key={fIndex} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* System Performance */}
        <Separator />
        <div>
          <h4 className="text-sm font-medium mb-3">Výkon systému</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Dostupnost providerů</span>
              <span>{Math.round((status.available_providers.length / status.total_providers) * 100)}%</span>
            </div>
            <Progress 
              value={(status.available_providers.length / status.total_providers) * 100} 
              className="h-2"
            />
            
            <div className="flex justify-between text-sm mt-4">
              <span>Timeout limit</span>
              <span>{status.timeout}s</span>
            </div>
            <Progress 
              value={Math.min((status.timeout / 600) * 100, 100)} 
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
