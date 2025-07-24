"use client"

import { useState } from "react"
import { Brain, MessageSquare, DollarSign, CreditCard, FileText, TrendingUp, BarChart3, Send, Lightbulb, Target, AlertTriangle } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const quickQueries = [
  {
    icon: DollarSign,
    text: "Kolik jsme vydělali tento měsíc?",
    category: "příjmy"
  },
  {
    icon: CreditCard,
    text: "Největší výdaje za poslední kvartál?",
    category: "výdaje"
  },
  {
    icon: FileText,
    text: "DPH souhrn za aktuální období?",
    category: "dph"
  },
  {
    icon: TrendingUp,
    text: "Trendy příjmů vs výdajů?",
    category: "trendy"
  },
  {
    icon: BarChart3,
    text: "Top 5 dodavatelů podle objemu?",
    category: "dodavatelé"
  },
  {
    icon: Target,
    text: "Jak si vedeme oproti cílům?",
    category: "cíle"
  }
]

const aiInsights = [
  {
    type: "optimization",
    icon: Lightbulb,
    title: "Optimalizace nákladů",
    description: "Můžete ušetřit ~15% konsolidací dodavatelů služeb",
    impact: "Úspora: ~23,450 CZK/měsíc",
    color: "bg-blue-100 text-blue-800"
  },
  {
    type: "trend",
    icon: TrendingUp,
    title: "Pozitivní trend",
    description: "Příjmy rostou rychleji než výdaje (+8.3% rozdíl)",
    impact: "Zisková marže se zlepšuje",
    color: "bg-green-100 text-green-800"
  },
  {
    type: "warning",
    icon: AlertTriangle,
    title: "Upozornění na splatnost",
    description: "3 faktury s blížící se splatností do 5 dnů",
    impact: "Celkem: 127,450 CZK",
    color: "bg-orange-100 text-orange-800"
  }
]

export function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content: "Ahoj! Jsem váš finanční asistent. Mohu vám pomoci s analýzou příjmů, výdajů, DPH přehledů a trendů z vašich naskenovaných dokumentů. Na co se chcete zeptat?"
    }
  ])
  const [inputValue, setInputValue] = useState("")

  const handleQuickQuery = (query: string) => {
    setMessages(prev => [...prev, 
      { type: "user", content: query },
      { type: "ai", content: getAIResponse(query) }
    ])
  }

  const getAIResponse = (query: string) => {
    if (query.includes("vydělali")) {
      return "Za tento měsíc máte celkové příjmy 245,680 CZK, což je nárůst o 15.3% oproti minulému měsíci. Průměrná hodnota faktury je 8,774 CZK a největší transakce byla 45,000 CZK."
    }
    if (query.includes("výdaje")) {
      return "Největší výdaje za poslední kvartál: 1) Askela s.r.o. - 156,420 CZK, 2) Energie a služby - 89,340 CZK, 3) Doprava - 45,230 CZK. Celkem jste utratili 423,890 CZK."
    }
    return "Zpracovávám váš dotaz na základě naskenovaných dokumentů..."
  }

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages(prev => [...prev, 
        { type: "user", content: inputValue },
        { type: "ai", content: getAIResponse(inputValue) }
      ])
      setInputValue("")
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        {aiInsights.map((insight, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${insight.color}`}>
                  <insight.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  <p className="text-xs font-medium mt-2">{insight.impact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Finanční AI Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Queries */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 text-sm">💡 Rychlé dotazy:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-8"
                  onClick={() => handleQuickQuery(query.text)}
                >
                  <query.icon className="w-3 h-3 mr-2" />
                  {query.text}
                </Button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className="flex gap-3">
                {message.type === "ai" ? (
                  <>
                    <Avatar className="w-8 h-8 bg-blue-100">
                      <AvatarFallback className="text-blue-600 text-xs">AI</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback className="text-xs">JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Zeptejte se na finanční data..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Rychlý finanční přehled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">245,680</div>
              <div className="text-xs text-muted-foreground">Příjmy (CZK)</div>
              <div className="text-xs text-green-600">↗ +15.3%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">156,420</div>
              <div className="text-xs text-muted-foreground">Výdaje (CZK)</div>
              <div className="text-xs text-red-600">↘ -8.7%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">89,260</div>
              <div className="text-xs text-muted-foreground">Zisk (CZK)</div>
              <div className="text-xs text-green-600">↗ +23.8%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">51,593</div>
              <div className="text-xs text-muted-foreground">DPH (CZK)</div>
              <div className="text-xs text-muted-foreground">21% sazba</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
