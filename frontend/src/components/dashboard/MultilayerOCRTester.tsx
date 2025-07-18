'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api'
import { 
  Upload, 
  FileText, 
  Brain, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Target,
  TrendingUp
} from 'lucide-react'

interface MultilayerResult {
  status: string
  result: {
    best_result: {
      provider: string
      text: string
      confidence: number
      structured_data: {
        document_type?: string
        vendor?: string
        amount?: number
        currency?: string
        date?: string
        invoice_number?: string
      }
    }
    all_results: Array<{
      provider: string
      confidence: number
      success: boolean
    }>
    ai_decision_metadata: {
      method: string
      selected_provider: string
      all_scores: Array<{
        provider: string
        score: number
      }>
    }
    fusion_applied: boolean
    final_confidence: number
    processing_summary: {
      total_providers: number
      successful_providers: number
      processing_time: number
      best_provider: string
    }
  }
}

export function MultilayerOCRTester() {
  const [file, setFile] = useState<File | null>(null)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<MultilayerResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const handleTest = async () => {
    if (!file) return

    setTesting(true)
    setError(null)

    try {
      const testResult = await apiClient.testMultilayerOCR(file)
      setResult(testResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
    } finally {
      setTesting(false)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google_vision':
        return '🌐'
      case 'azure_computer_vision':
        return '☁️'
      case 'tesseract':
        return '🖥️'
      case 'paddle_ocr':
        return '🚀'
      default:
        return '👁️'
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Multilayer OCR Tester
        </CardTitle>
        <CardDescription>
          Otestujte pokročilý OCR systém s AI rozhodováním
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="ocr-test-file"
            />
            <label
              htmlFor="ocr-test-file"
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Vybrat soubor
            </label>
            {file && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
                <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
              </div>
            )}
          </div>

          <Button 
            onClick={handleTest} 
            disabled={!file || testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Zpracovávám...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Spustit Multilayer OCR Test
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Chyba při testování</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-6">
            <Separator />
            
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {result.result.final_confidence.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Finální confidence</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {getProviderIcon(result.result.best_result.provider)}
                </div>
                <div className="text-sm text-muted-foreground">Nejlepší provider</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {result.result.processing_summary.successful_providers}/{result.result.processing_summary.total_providers}
                </div>
                <div className="text-sm text-muted-foreground">Úspěšné providery</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {result.result.processing_summary.processing_time.toFixed(1)}s
                </div>
                <div className="text-sm text-muted-foreground">Doba zpracování</div>
              </div>
            </div>

            {/* Best Result */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Nejlepší výsledek - {getProviderName(result.result.best_result.provider)}
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    Confidence: {(result.result.best_result.confidence * 100).toFixed(1)}%
                  </Badge>
                  {result.result.fusion_applied && (
                    <Badge variant="secondary">
                      <Zap className="h-3 w-3 mr-1" />
                      Fusion Applied
                    </Badge>
                  )}
                </div>

                {/* Structured Data */}
                {result.result.best_result.structured_data && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(result.result.best_result.structured_data).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium capitalize">{key.replace('_', ' ')}:</span>
                          <span className="text-sm">{String(value)}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Extracted Text */}
                <div>
                  <label className="text-sm font-medium">Extrahovaný text:</label>
                  <Textarea
                    value={result.result.best_result.text}
                    readOnly
                    className="mt-1 h-32"
                  />
                </div>
              </div>
            </div>

            {/* All Providers Results */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Výsledky všech providerů
              </h4>
              
              <div className="space-y-2">
                {result.result.all_results.map((providerResult, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getProviderIcon(providerResult.provider)}</span>
                      <div>
                        <div className="font-medium">{getProviderName(providerResult.provider)}</div>
                        <div className="text-sm text-muted-foreground">
                          {providerResult.success ? 'Úspěšný' : 'Neúspěšný'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {providerResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant={providerResult.success ? 'default' : 'secondary'}>
                        {(providerResult.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Decision Metadata */}
            {result.result.ai_decision_metadata.all_scores && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Rozhodovací skóre
                </h4>
                
                <div className="space-y-2">
                  {result.result.ai_decision_metadata.all_scores.map((score, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{getProviderName(score.provider)}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={score.score * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{(score.score * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
