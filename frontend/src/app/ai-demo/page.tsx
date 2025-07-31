"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Brain, MessageSquare, TrendingUp, Lightbulb } from 'lucide-react'
import AskelioSDK from '@/lib/askelio-sdk'

interface AIInsight {
  type: 'positive' | 'warning' | 'info'
  title: string
  description: string
}

export default function AIDemoPage() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [sdk] = useState(() => new AskelioSDK())

  const loadAIInsights = async () => {
    setLoading(true)
    try {
      const response = await sdk.getAIInsights() as any
      if (response.success) {
        setInsights(response.data)
      } else {
        console.error('Failed to load AI insights:', response.error)
      }
    } catch (error) {
      console.error('Error loading AI insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return
    
    setChatLoading(true)
    try {
      const response = await sdk.chatWithAI(chatMessage) as any
      if (response.success) {
        setChatResponse(response.data.response)
      } else {
        setChatResponse('Omlouváme se, došlo k chybě při zpracování vaší otázky.')
      }
    } catch (error) {
      console.error('Error in AI chat:', error)
      setChatResponse('Omlouváme se, došlo k chybě při zpracování vaší otázky.')
    } finally {
      setChatLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'warning':
        return <Lightbulb className="w-4 h-4 text-orange-600" />
      default:
        return <Brain className="w-4 h-4 text-blue-600" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-purple-600" />
          AI Demo - Cost-Effective Features
        </h1>
        <p className="text-muted-foreground">
          Testování skutečných AI funkcí pomocí OpenRouter API
        </p>
      </div>

      {/* AI Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              AI Doporučení
            </span>
            <Button 
              onClick={loadAIInsights}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Načíst Insights'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {insight.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Klikněte na &quot;Načíst Insights&quot; pro zobrazení AI doporučení</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Chat Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            AI Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Zeptejte se na své finance..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            />
            <Button 
              onClick={sendChatMessage}
              disabled={chatLoading || !chatMessage.trim()}
            >
              {chatLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Odeslat'
              )}
            </Button>
          </div>

          {chatResponse && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">AI Asistent:</p>
                  <p className="text-sm">{chatResponse}</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p className="mb-1">💡 Zkuste se zeptat na:</p>
            <div className="flex flex-wrap gap-1">
              {[
                "Jaký je můj zisk?",
                "Kolik mám příjmů?", 
                "Jak si vedu finančně?",
                "Porovnej s minulým měsícem"
              ].map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => setChatMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ℹ️ Informace o implementaci</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-1">🤖 AI Model:</h4>
              <p className="text-muted-foreground">Gemini 2.5 Flash-Lite (nejlevnější)</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">💰 Náklady:</h4>
              <p className="text-muted-foreground">~$0.00001 per request</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">⚡ Optimalizace:</h4>
              <p className="text-muted-foreground">Krátké prompty, cachování</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">🔄 Fallback:</h4>
              <p className="text-muted-foreground">Rule-based při selhání AI</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
