"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  FileText,
  Calculator,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from "lucide-react"

interface FinancialData {
  totalRevenue: number
  totalExpenses: number
  monthlyRevenue: number
  monthlyExpenses: number
  netProfit: number
  topVendors: Array<{
    name: string
    amount: number
    count: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
    expenses: number
  }>
  vatSummary: {
    totalVat: number
    vatByRate: Array<{
      rate: number
      amount: number
    }>
  }
  averageInvoiceValue: number
  largestTransaction: number
  documentsByType: {
    invoices: number
    receipts: number
    other: number
  }
}

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  suggestions?: string[]
  charts?: Array<{
    type: 'bar' | 'pie' | 'line'
    data: any
    title: string
  }>
  insights?: Array<{
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
    value?: string
  }>
}

interface FinancialAIChatProps {
  isOpen: boolean
  onClose: () => void
  financialData: FinancialData
  documents: any[]
}

export function FinancialAIChat({ isOpen, onClose, financialData, documents }: FinancialAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize with welcome message
      const welcomeMessage: Message = {
        id: '1',
        type: 'ai',
        content: `Ahoj! Jsem váš AI finanční asistent. Mám přehled o vašich finančních datech a mohu vám pomoci s analýzami a přehledy.`,
        timestamp: new Date(),
        suggestions: [
          "Jaký je můj celkový zisk?",
          "Kdo jsou moji největší dodavatelé?",
          "Jak se vyvíjejí moje příjmy?",
          "Kolik platím na DPH?",
          "Vytvoř mi měsíční přehled"
        ],
        insights: [
          {
            type: 'positive',
            title: 'Celkový zisk',
            description: 'Váš čistý zisk je pozitivní',
            value: formatCurrency(financialData.netProfit)
          },
          {
            type: 'neutral',
            title: 'Zpracované dokumenty',
            description: 'Celkem dokumentů v systému',
            value: `${financialData.documentsByType.invoices + financialData.documentsByType.receipts} dokumentů`
          },
          {
            type: financialData.totalRevenue > financialData.totalExpenses ? 'positive' : 'negative',
            title: 'Poměr příjmy/výdaje',
            description: 'Poměr vašich příjmů k výdajům',
            value: `${(financialData.totalRevenue / Math.max(financialData.totalExpenses, 1)).toFixed(1)}:1`
          }
        ]
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, financialData])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const generateAIResponse = async (userMessage: string): Promise<Message> => {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    const lowerMessage = userMessage.toLowerCase()
    
    // Simple pattern matching for demo
    if (lowerMessage.includes('zisk') || lowerMessage.includes('profit')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `Váš čistý zisk je ${formatCurrency(financialData.netProfit)}. To je rozdíl mezi celkovými příjmy (${formatCurrency(financialData.totalRevenue)}) a výdaji (${formatCurrency(financialData.totalExpenses)}).`,
        timestamp: new Date(),
        insights: [
          {
            type: financialData.netProfit > 0 ? 'positive' : 'negative',
            title: 'Ziskovost',
            description: financialData.netProfit > 0 ? 'Vaše podnikání je ziskové' : 'Výdaje převyšují příjmy',
            value: formatCurrency(financialData.netProfit)
          }
        ],
        suggestions: [
          "Jak mohu zvýšit zisk?",
          "Jaké jsou moje největší výdaje?",
          "Porovnej s minulým měsícem"
        ]
      }
    }

    if (lowerMessage.includes('dodavatel') || lowerMessage.includes('vendor')) {
      const topVendor = financialData.topVendors[0]
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `Váš největší dodavatel je ${topVendor?.name || 'neznámý'} s celkovou částkou ${formatCurrency(topVendor?.amount || 0)} za ${topVendor?.count || 0} dokumentů.`,
        timestamp: new Date(),
        insights: financialData.topVendors.slice(0, 3).map((vendor, index) => ({
          type: 'neutral' as const,
          title: `${index + 1}. ${vendor.name}`,
          description: `${vendor.count} dokumentů`,
          value: formatCurrency(vendor.amount)
        })),
        suggestions: [
          "Analýza dodavatelů podle měsíců",
          "Které dodavatele platím nejčastěji?",
          "Doporučení pro optimalizaci nákladů"
        ]
      }
    }

    if (lowerMessage.includes('dph') || lowerMessage.includes('vat')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `Celková částka DPH ve vašich dokumentech je ${formatCurrency(financialData.vatSummary.totalVat)}.`,
        timestamp: new Date(),
        insights: financialData.vatSummary.vatByRate.map(vat => ({
          type: 'neutral' as const,
          title: `DPH ${vat.rate}%`,
          description: 'Celková částka za tuto sazbu',
          value: formatCurrency(vat.amount)
        })),
        suggestions: [
          "Jak optimalizovat DPH?",
          "Měsíční přehled DPH",
          "DPH podle dodavatelů"
        ]
      }
    }

    if (lowerMessage.includes('přehled') || lowerMessage.includes('report')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `Zde je váš finanční přehled:

📊 **Celkové příjmy:** ${formatCurrency(financialData.totalRevenue)}
💸 **Celkové výdaje:** ${formatCurrency(financialData.totalExpenses)}
💰 **Čistý zisk:** ${formatCurrency(financialData.netProfit)}
📄 **Faktury:** ${financialData.documentsByType.invoices}
🧾 **Účtenky:** ${financialData.documentsByType.receipts}
💳 **Průměrná faktura:** ${formatCurrency(financialData.averageInvoiceValue)}`,
        timestamp: new Date(),
        suggestions: [
          "Exportuj přehled do Excel",
          "Porovnej s minulým obdobím",
          "Vytvoř graf vývoje"
        ]
      }
    }

    // Default response
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: `Rozumím vaší otázce "${userMessage}". Momentálně pracuji na analýze vašich dat. Můžete se zeptat na:
      
• Celkové příjmy a výdaje
• Analýzu dodavatelů
• DPH přehledy
• Měsíční trendy
• Ziskovost`,
      timestamp: new Date(),
      suggestions: [
        "Jaký je můj celkový zisk?",
        "Kdo jsou moji největší dodavatelé?",
        "Kolik platím na DPH?",
        "Vytvoř mi měsíční přehled"
      ]
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const aiResponse = await generateAIResponse(inputValue)
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Error generating AI response:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            AI Finanční Asistent
            <Badge variant="secondary" className="ml-2">Beta</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Messages */}
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'ai' && (
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <Card className={message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-50'}>
                      <CardContent className="p-4">
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        
                        {/* Insights */}
                        {message.insights && (
                          <div className="mt-3 space-y-2">
                            {message.insights.map((insight, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center gap-2">
                                  {insight.type === 'positive' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  {insight.type === 'negative' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                  {insight.type === 'neutral' && <Lightbulb className="h-4 w-4 text-blue-500" />}
                                  <div>
                                    <div className="font-medium text-sm text-gray-900">{insight.title}</div>
                                    <div className="text-xs text-gray-500">{insight.description}</div>
                                  </div>
                                </div>
                                {insight.value && (
                                  <div className="font-bold text-sm text-gray-900">{insight.value}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggestions */}
                        {message.suggestions && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="text-xs"
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {message.type === 'user' && (
                    <div className="p-2 bg-blue-500 rounded-full">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                        <span className="text-sm text-gray-500">AI analyzuje vaše data...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Zeptejte se na finanční analýzu..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
