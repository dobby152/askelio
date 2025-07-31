"use client"

import { useState, useEffect } from "react"
import { 
  Brain, 
  MessageSquare, 
  DollarSign, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  BarChart3, 
  Send, 
  Lightbulb, 
  Target, 
  AlertTriangle,
  Settings,
  Save,
  Filter,
  Calendar,
  PieChart,
  LineChart,
  Plus,
  Eye,
  Download,
  RefreshCw,
  Zap,
  Star,
  Bookmark,
  History,
  Users,
  Building2
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { dashboardAPI } from "@/lib/dashboard-api"
import { aiAnalyticsAPI } from "@/lib/ai-analytics-api"

interface AIAssistantProps {
  section: 'ai-chat' | 'ai-overview' | 'ai-analytics'
}

// Personalized quick queries based on user behavior
const getPersonalizedQueries = (userProfile: any) => [
  {
    icon: DollarSign,
    text: "Kolik jsme vydělali tento měsíc?",
    category: "příjmy",
    priority: userProfile?.interests?.includes('revenue') ? 'high' : 'normal'
  },
  {
    icon: CreditCard,
    text: "Největší výdaje za poslední kvartál?",
    category: "výdaje",
    priority: userProfile?.interests?.includes('expenses') ? 'high' : 'normal'
  },
  {
    icon: FileText,
    text: "DPH souhrn za aktuální období?",
    category: "dph",
    priority: userProfile?.role === 'accountant' ? 'high' : 'normal'
  },
  {
    icon: TrendingUp,
    text: "Trendy příjmů vs výdajů?",
    category: "trendy",
    priority: 'high'
  },
  {
    icon: BarChart3,
    text: "Top 5 dodavatelů podle objemu?",
    category: "dodavatelé",
    priority: userProfile?.role === 'manager' ? 'high' : 'normal'
  },
  {
    icon: Target,
    text: "Jak si vedeme oproti cílům?",
    category: "cíle",
    priority: userProfile?.role === 'ceo' ? 'high' : 'normal'
  },
  {
    icon: Building2,
    text: "Porovnání s konkurencí v oboru",
    category: "benchmark",
    priority: userProfile?.plan === 'premium' ? 'high' : 'low'
  },
  {
    icon: Zap,
    text: "Predikce cash flow na příští kvartál",
    category: "forecast",
    priority: userProfile?.plan === 'premium' ? 'high' : 'low'
  }
]

// AI Insights with personalization
const getPersonalizedInsights = (userProfile: any, financialData: any) => [
  {
    type: "optimization",
    icon: Lightbulb,
    title: "Optimalizace nákladů",
    description: `Můžete ušetřit ~${Math.round(financialData?.totalExpenses * 0.15)} CZK konsolidací dodavatelů`,
    impact: `Úspora: ~${Math.round(financialData?.totalExpenses * 0.15 / 12)} CZK/měsíc`,
    color: "bg-blue-100 text-blue-800",
    priority: userProfile?.role === 'cfo' ? 'high' : 'normal'
  },
  {
    type: "trend",
    icon: TrendingUp,
    title: "Pozitivní trend",
    description: "Příjmy rostou rychleji než výdaje (+8.3% rozdíl)",
    impact: "Zisková marže se zlepšuje",
    color: "bg-green-100 text-green-800",
    priority: 'high'
  },
  {
    type: "warning",
    icon: AlertTriangle,
    title: "Upozornění na splatnost",
    description: "3 faktury s blížící se splatností do 5 dnů",
    impact: "Celkem: 127,450 CZK",
    color: "bg-orange-100 text-orange-800",
    priority: 'high'
  },
  {
    type: "forecast",
    icon: Target,
    title: "AI Predikce",
    description: "Na základě trendů očekáváme růst příjmů o 12% v příštím kvartálu",
    impact: "Očekávaný příjem: 275,000 CZK",
    color: "bg-purple-100 text-purple-800",
    priority: userProfile?.plan === 'premium' ? 'high' : 'low'
  }
]

// Widget templates for custom dashboards
const WIDGET_TEMPLATES = [
  {
    id: 'revenue-chart',
    title: 'Graf příjmů',
    type: 'chart',
    icon: LineChart,
    description: 'Trendy příjmů s AI predikcí'
  },
  {
    id: 'expense-pie',
    title: 'Rozložení výdajů',
    type: 'chart',
    icon: PieChart,
    description: 'Kategorie výdajů'
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow',
    type: 'chart',
    icon: BarChart3,
    description: 'Příjmy vs výdaje'
  },
  {
    id: 'ai-insights',
    title: 'AI Doporučení',
    type: 'insight',
    icon: Brain,
    description: 'Personalizovaná doporučení'
  }
]

export function AIAssistantEnhanced({ section }: AIAssistantProps) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [userProfile, setUserProfile] = useState(null)
  const [financialData, setFinancialData] = useState(null)
  const [timeRange, setTimeRange] = useState('3months')
  const [savedQueries, setSavedQueries] = useState([])
  const [customWidgets, setCustomWidgets] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [periodA, setPeriodA] = useState('this-month')
  const [periodB, setPeriodB] = useState('last-month')
  const [comparisonResults, setComparisonResults] = useState<any>(null)
  const [predictions, setPredictions] = useState<any>({})
  const [advancedInsights, setAdvancedInsights] = useState<any>(null)
  const [financialMetrics, setFinancialMetrics] = useState<any>(null)
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null)
  const [savedReports, setSavedReports] = useState<any[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Load user profile and financial data
  useEffect(() => {
    loadUserData()
    if (section === 'ai-analytics') {
      loadAnalyticsData()
    }
  }, [section])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      const [profile, stats] = await Promise.all([
        dashboardAPI.getUserProfile(),
        dashboardAPI.getStats()
      ])
      setUserProfile(profile)
      setFinancialData((stats as any).data)
      
      // Initialize with personalized welcome message
      setMessages([{
        type: "ai",
        content: `Ahoj ${profile?.name || 'uživateli'}! Jsem váš personalizovaný AI asistent. Na základě vašich dat a role (${profile?.role || 'uživatel'}) vám mohu poskytnout specifické analýzy a doporučení.`
      }])
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuery = async (query: string) => {
    setMessages(prev => [...prev, { type: "user", content: query }])
    
    try {
      const response = await dashboardAPI.sendAIMessage(query, financialData)
      setMessages(prev => [...prev, { type: "ai", content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: "ai", 
        content: "Omlouvám se, došlo k chybě při zpracování dotazu. Zkuste to prosím znovu." 
      }])
    }
  }

  const saveQuery = (query: string) => {
    setSavedQueries(prev => [...prev, { query, timestamp: Date.now() }])
    toast.success('Dotaz byl uložen')
  }

  const addCustomWidget = (widgetId: string) => {
    const template = WIDGET_TEMPLATES.find(t => t.id === widgetId)
    if (template) {
      setCustomWidgets(prev => [...prev, { ...template, id: Date.now() }])
      toast.success(`Widget "${template.title}" byl přidán`)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true)

      // Load comprehensive analytics data
      const [insights, metrics, risk, reports] = await Promise.all([
        aiAnalyticsAPI.getAdvancedInsights(),
        aiAnalyticsAPI.getFinancialMetrics(),
        aiAnalyticsAPI.getRiskAnalysis(),
        aiAnalyticsAPI.listSavedReports()
      ])

      setAdvancedInsights(insights)
      setFinancialMetrics(metrics)
      setRiskAnalysis(risk)
      setSavedReports(reports)

      // Load predictions for different metrics
      const predictionTypes = ['revenue', 'expenses', 'cashflow']
      const predictionPromises = predictionTypes.map(type =>
        aiAnalyticsAPI.getPrediction(type, 30)
      )

      const predictionResults = await Promise.all(predictionPromises)
      const predictionsMap = {}
      predictionTypes.forEach((type, index) => {
        predictionsMap[type] = predictionResults[index]
      })

      setPredictions(predictionsMap)

    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handlePeriodComparison = async () => {
    try {
      setAnalyticsLoading(true)

      // Convert period selections to date ranges
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

      const comparison = await aiAnalyticsAPI.comparePeriods(
        thisMonthStart, thisMonthEnd,
        lastMonthStart, lastMonthEnd
      )

      setComparisonResults(comparison)
      toast.success('Porovnání období dokončeno')

    } catch (error) {
      console.error('Error comparing periods:', error)
      toast.error('Chyba při porovnávání období')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Render different sections
  const renderFinancialChat = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* AI Insights */}
      <div className="lg:col-span-1 space-y-4">
        {getPersonalizedInsights(userProfile, financialData)
          .filter(insight => insight.priority === 'high')
          .map((insight, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${insight.color}`}>
                  <insight.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  <p className="text-sm font-medium mt-2">{insight.impact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Finanční AI Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Queries */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                💡 Rychlé dotazy:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {getPersonalizedQueries(userProfile)
                  .sort((a, b) => a.priority === 'high' ? -1 : 1)
                  .slice(0, 6)
                  .map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start h-auto p-3 text-left"
                    onClick={() => handleQuickQuery(query.text)}
                  >
                    <query.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{query.text}</span>
                    {query.priority === 'high' && (
                      <Star className="h-3 w-3 ml-auto text-yellow-500" />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div key={index} className="flex gap-3">
                  {message.type === 'ai' ? (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100">
                          <Brain className="h-4 w-4 text-blue-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">AI</div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 ml-auto">
                      <div className="bg-blue-500 text-white rounded-lg p-3 max-w-xs">
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{userProfile?.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                    </div>
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
                onKeyPress={(e) => e.key === 'Enter' && handleQuickQuery(inputValue)}
              />
              <Button onClick={() => handleQuickQuery(inputValue)}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Financial Overview */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rychlý finanční přehled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {financialData?.totalIncome?.toLocaleString() || '245,680'}
                </div>
                <div className="text-sm text-gray-600">Příjmy (CZK)</div>
                <div className="text-xs text-green-600 mt-1">↗ +15.3%</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {financialData?.totalExpenses?.toLocaleString() || '156,420'}
                </div>
                <div className="text-sm text-gray-600">Výdaje (CZK)</div>
                <div className="text-xs text-red-600 mt-1">↘ -8.7%</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {financialData?.profit?.toLocaleString() || '89,260'}
                </div>
                <div className="text-sm text-gray-600">Zisk (CZK)</div>
                <div className="text-xs text-blue-600 mt-1">↗ +23.8%</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {financialData?.vat?.toLocaleString() || '51,593'}
                </div>
                <div className="text-sm text-gray-600">DPH (CZK)</div>
                <div className="text-xs text-purple-600 mt-1">21% sazba</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Render AI Overviews with custom widgets
  const renderAIOverviews = () => (
    <div className="space-y-6">
      {/* Dashboard Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            🧱 Stavba analýz dashboardu z widgetů
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {WIDGET_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
                onClick={() => addCustomWidget(template.id)}
              >
                <CardContent className="p-4 text-center">
                  <template.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">{template.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                  <Button size="sm" className="mt-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Přidat
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Widgets Display */}
          {customWidgets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customWidgets.map((widget) => (
                <Card key={widget.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <widget.icon className="h-4 w-4" />
                      {widget.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
                      <span className="text-gray-500">Widget data loading...</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Period Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            🔍 Filtrace a porovnání období
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Období A</Label>
              <Select defaultValue="current-month">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Tento měsíc</SelectItem>
                  <SelectItem value="last-month">Minulý měsíc</SelectItem>
                  <SelectItem value="current-quarter">Tento kvartál</SelectItem>
                  <SelectItem value="last-quarter">Minulý kvartál</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>vs. Období B</Label>
              <Select defaultValue="last-month">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-month">Minulý měsíc</SelectItem>
                  <SelectItem value="last-quarter">Minulý kvartál</SelectItem>
                  <SelectItem value="last-year">Minulý rok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handlePeriodComparison}
                disabled={analyticsLoading}
              >
                {analyticsLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Porovnat
              </Button>
            </div>
          </div>

          {/* Comparison Results */}
          {comparisonResults && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className={`p-4 rounded-lg ${
                comparisonResults.comparison.income_change.trend === 'up' ? 'bg-green-50' :
                comparisonResults.comparison.income_change.trend === 'down' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div className={`text-lg font-bold ${
                  comparisonResults.comparison.income_change.trend === 'up' ? 'text-green-600' :
                  comparisonResults.comparison.income_change.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {comparisonResults.comparison.income_change.trend === 'up' ? '+' : ''}
                  {comparisonResults.comparison.income_change.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {comparisonResults.comparison.income_change.trend === 'up' ? 'Růst' :
                   comparisonResults.comparison.income_change.trend === 'down' ? 'Pokles' : 'Změna'} příjmů
                </div>
              </div>
              <div className={`p-4 rounded-lg ${
                comparisonResults.comparison.expense_change.trend === 'down' ? 'bg-green-50' :
                comparisonResults.comparison.expense_change.trend === 'up' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div className={`text-lg font-bold ${
                  comparisonResults.comparison.expense_change.trend === 'down' ? 'text-green-600' :
                  comparisonResults.comparison.expense_change.trend === 'up' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {comparisonResults.comparison.expense_change.trend === 'up' ? '+' : ''}
                  {comparisonResults.comparison.expense_change.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {comparisonResults.comparison.expense_change.trend === 'up' ? 'Růst' :
                   comparisonResults.comparison.expense_change.trend === 'down' ? 'Pokles' : 'Změna'} výdajů
                </div>
              </div>
              <div className={`p-4 rounded-lg ${
                comparisonResults.comparison.profit_change.trend === 'up' ? 'bg-green-50' :
                comparisonResults.comparison.profit_change.trend === 'down' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div className={`text-lg font-bold ${
                  comparisonResults.comparison.profit_change.trend === 'up' ? 'text-green-600' :
                  comparisonResults.comparison.profit_change.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {comparisonResults.comparison.profit_change.trend === 'up' ? '+' : ''}
                  {comparisonResults.comparison.profit_change.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {comparisonResults.comparison.profit_change.trend === 'up' ? 'Růst' :
                   comparisonResults.comparison.profit_change.trend === 'down' ? 'Pokles' : 'Změna'} zisku
                </div>
              </div>
            </div>
          )}

          {/* Fallback static results if no API data */}
          {!comparisonResults && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-green-600">+15.3%</div>
                <div className="text-sm text-gray-600">Růst příjmů</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-red-600">-8.7%</div>
                <div className="text-sm text-gray-600">Pokles výdajů</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-blue-600">+23.8%</div>
                <div className="text-sm text-gray-600">Růst zisku</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            💾 Uložené sestavy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedReports.length > 0 ? (
              savedReports.map((report) => (
                <Card key={report.id} className="border-dashed">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Bookmark className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <h4 className="font-medium">{report.name}</h4>
                      <p className="text-xs text-gray-600 mb-1">{report.description}</p>
                      <p className="text-xs text-gray-500">
                        Uloženo {new Date(report.saved_at).toLocaleDateString('cs-CZ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {report.widgets_count} widgetů
                      </p>
                      <Button size="sm" className="mt-2">Načíst</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Bookmark className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <h4 className="font-medium">Měsíční přehled</h4>
                      <p className="text-xs text-gray-600">Uloženo 15.1.2025</p>
                      <Button size="sm" className="mt-2">Načíst</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Bookmark className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <h4 className="font-medium">Kvartální analýza</h4>
                      <p className="text-xs text-gray-600">Uloženo 10.1.2025</p>
                      <Button size="sm" className="mt-2">Načíst</Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render AI Analytics with predictions
  const renderAIAnalytics = () => (
    <div className="space-y-6">
      {analyticsLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Načítám AI analýzy...</p>
          </CardContent>
        </Card>
      )}

      {/* Predictive Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            📈 Prediktivní analýza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="revenue" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="revenue">Příjmy</TabsTrigger>
              <TabsTrigger value="expenses">Výdaje</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Predikce na 30 dní</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {predictions.revenue ?
                        `${Math.round(predictions.revenue.predicted_value).toLocaleString()} CZK` :
                        '275,000 CZK'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Očekávané příjmy</div>
                    <div className={`text-xs mt-1 ${
                      predictions.revenue?.trend === 'up' ? 'text-green-600' :
                      predictions.revenue?.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {predictions.revenue?.trend === 'up' ? '↗' :
                       predictions.revenue?.trend === 'down' ? '↘' : '→'}
                      {predictions.revenue?.trend === 'up' ? ' Růst' :
                       predictions.revenue?.trend === 'down' ? ' Pokles' : ' Stabilní'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Spolehlivost predikce</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {predictions.revenue ?
                        `${Math.round(predictions.revenue.confidence * 100)}%` :
                        '87%'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Přesnost modelu</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {predictions.revenue?.confidence > 0.8 ? 'Vysoká spolehlivost' :
                       predictions.revenue?.confidence > 0.6 ? 'Střední spolehlivost' : 'Nízká spolehlivost'}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {predictions.revenue?.factors && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Klíčové faktory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {predictions.revenue.factors.map((factor, index) => (
                        <div key={index} className="text-sm text-gray-600">• {factor}</div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="expenses" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Predikce na 30 dní</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {predictions.expenses ?
                        `${Math.round(predictions.expenses.predicted_value).toLocaleString()} CZK` :
                        '32,500 CZK'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Očekávané výdaje</div>
                    <div className={`text-xs mt-1 ${
                      predictions.expenses?.trend === 'up' ? 'text-red-600' :
                      predictions.expenses?.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {predictions.expenses?.trend === 'up' ? '↗' :
                       predictions.expenses?.trend === 'down' ? '↘' : '→'}
                      {predictions.expenses?.trend === 'up' ? ' Růst' :
                       predictions.expenses?.trend === 'down' ? ' Pokles' : ' Stabilní'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Spolehlivost predikce</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {predictions.expenses ?
                        `${Math.round(predictions.expenses.confidence * 100)}%` :
                        '82%'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Přesnost modelu</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {predictions.expenses?.confidence > 0.8 ? 'Vysoká spolehlivost' :
                       predictions.expenses?.confidence > 0.6 ? 'Střední spolehlivost' : 'Nízká spolehlivost'}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {predictions.expenses?.factors && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Klíčové faktory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {predictions.expenses.factors.map((factor, index) => (
                        <div key={index} className="text-sm text-gray-600">• {factor}</div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cashflow" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Predikce na 30 dní</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {predictions.cashflow ?
                        `${Math.round(predictions.cashflow.predicted_value).toLocaleString()} CZK` :
                        '24,620 CZK'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Očekávaný cash flow</div>
                    <div className={`text-xs mt-1 ${
                      predictions.cashflow?.trend === 'up' ? 'text-green-600' :
                      predictions.cashflow?.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {predictions.cashflow?.trend === 'up' ? '↗' :
                       predictions.cashflow?.trend === 'down' ? '↘' : '→'}
                      {predictions.cashflow?.trend === 'up' ? ' Zlepšení' :
                       predictions.cashflow?.trend === 'down' ? ' Zhoršení' : ' Stabilní'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Spolehlivost predikce</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {predictions.cashflow ?
                        `${Math.round(predictions.cashflow.confidence * 100)}%` :
                        '89%'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Přesnost modelu</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {predictions.cashflow?.confidence > 0.8 ? 'Vysoká spolehlivost' :
                       predictions.cashflow?.confidence > 0.6 ? 'Střední spolehlivost' : 'Nízká spolehlivost'}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {predictions.cashflow?.factors && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Klíčové faktory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {predictions.cashflow.factors.map((factor, index) => (
                        <div key={index} className="text-sm text-gray-600">• {factor}</div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>



            <TabsContent value="leads" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Nové leady</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">45</div>
                    <div className="text-sm text-gray-600">Příští měsíc</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Konverzní poměr</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">23%</div>
                    <div className="text-sm text-gray-600">Lead → Zákazník</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Očekávaný obrat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">185,000</div>
                    <div className="text-sm text-gray-600">CZK z leadů</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            🤖 AI Doporučení a insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Real AI Insights from API */}
            {advancedInsights?.insights?.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      insight.type === 'positive' ? 'bg-green-100 text-green-800' :
                      insight.type === 'warning' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {insight.type === 'positive' && <TrendingUp className="h-5 w-5" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
                      {insight.type === 'success' && <Target className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Detail
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) ||
            // Fallback to personalized insights if API data not available
            getPersonalizedInsights(userProfile, financialData).map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${insight.color}`}>
                      <insight.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      <p className="text-sm font-medium mt-2">{insight.impact}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Detail
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            📊 Pokročilé analýzy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Finanční metriky</h4>
              <div className="space-y-2">
                {financialMetrics ? (
                  <>
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm">Zisková marže</span>
                      <Badge variant="secondary">
                        {financialMetrics.profit_margin.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm">Poměr nákladů</span>
                      <Badge variant="secondary">
                        {financialMetrics.expense_ratio.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                      <span className="text-sm">Finanční zdraví</span>
                      <Badge variant={
                        financialMetrics.health_status === 'excellent' ? 'default' :
                        financialMetrics.health_status === 'good' ? 'secondary' : 'destructive'
                      }>
                        {financialMetrics.health_description}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm">Zisková marže</span>
                      <Badge variant="secondary">5.0%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm">Poměr nákladů</span>
                      <Badge variant="secondary">75.0%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                      <span className="text-sm">ROI trend</span>
                      <Badge variant="secondary">Pozitivní</Badge>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Rizikové faktory</h4>
              <div className="space-y-2">
                {riskAnalysis?.risk_factors ? (
                  riskAnalysis.risk_factors.slice(0, 3).map((factor, index) => (
                    <div key={index} className={`flex justify-between items-center p-2 rounded ${
                      factor.level === 'high' ? 'bg-red-50' :
                      factor.level === 'medium' ? 'bg-yellow-50' : 'bg-green-50'
                    }`}>
                      <span className="text-sm">{factor.description}</span>
                      <Badge variant={
                        factor.level === 'high' ? 'destructive' :
                        factor.level === 'medium' ? 'secondary' : 'secondary'
                      }>
                        {factor.level === 'high' ? 'Vysoké' :
                         factor.level === 'medium' ? 'Střední' : 'Nízké'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm">Pozdní platby</span>
                      <Badge variant="destructive">Vysoké</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                      <span className="text-sm">Sezónnost</span>
                      <Badge variant="secondary">Střední</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm">Konkurence</span>
                      <Badge variant="secondary">Nízké</Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {section === 'ai-chat' && renderFinancialChat()}
      {section === 'ai-overview' && renderAIOverviews()}
      {section === 'ai-analytics' && renderAIAnalytics()}
    </div>
  )
}
