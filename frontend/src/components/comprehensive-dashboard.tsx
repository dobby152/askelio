"use client"

import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  FileText,
  PieChartIcon,
  Settings,
  TrendingUp,
  Upload,
  Users,
  Bell,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  MessageSquare,
  X,
  Star,
  Flag,
  User,
  Mail,
  Phone,
  Globe,
  Zap,
  Brain,
  MoreHorizontal,
  ChevronDown,
  Clock,
  Target,
  AlertTriangle,
  Lightbulb,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  Receipt,
  FileCheck,
  Scan,
  BarChart,
  LineChartIcon,
  Download,
  RefreshCw,
  ChevronRight,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { dashboardAPI } from "@/lib/dashboard-api"
import {
  LineChart,
  Line,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"
import React, { useState, useEffect } from "react"
import { AIAssistant } from "@/components/ai-assistant"
import type { DashboardStats, RecentActivity, AIInsight } from "@/lib/dashboard-api"

// Navigation structure
const navigationItems = [
  { id: "dashboard", title: "Dashboard", icon: BarChart3, url: "#" },
  { id: "documents", title: "Dokumenty", icon: FileText, url: "#" },
  { id: "scanning", title: "Skenování", icon: Upload, url: "#" },
  { id: "statistics", title: "Statistiky", icon: PieChartIcon, url: "#" },
]

const companyItems = [
  { id: "company-settings", title: "Moje firma", icon: Building2, url: "#" },
  { id: "team", title: "Tým", icon: Users, url: "#" },
  { id: "approval", title: "Schvalování", icon: CheckCircle, url: "#" },
]

const aiItems = [
  { id: "ai-chat", title: "Finanční chat", icon: MessageSquare, url: "#" },
  { id: "ai-overview", title: "Přehledy", icon: BarChart3, url: "#" },
  { id: "ai-analytics", title: "Analýzy", icon: TrendingUp, url: "#" },
]

// Page titles mapping
const pageTitles = {
  dashboard: "Dashboard",
  documents: "Dokumenty",
  scanning: "Skenování dokumentů",
  statistics: "Statistiky",
  "company-settings": "Nastavení firmy",
  team: "Správa týmu",
  approval: "Schvalování faktur",
  "ai-chat": "AI Finanční asistent",
  "ai-overview": "AI Přehledy",
  "ai-analytics": "AI Analýzy",
}

// Chart data will be loaded dynamically from API

function AppSidebar({ activeSection, onSectionChange }) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">ASKELIO</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault()
                console.log(`Navigating to: ${item.id}`)
                onSectionChange(item.id)
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                activeSection === item.id
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        <div className="border-t my-4"></div>

        {/* Company Section */}
        <div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            FIRMA
          </div>
          <div className="space-y-1 mt-2">
            {companyItems.map((item) => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault()
                  console.log(`Navigating to: ${item.id}`)
                  onSectionChange(item.id)
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                  activeSection === item.id
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t my-4"></div>

        {/* AI Assistant Section */}
        <div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Brain className="w-4 h-4" />
            AI ASISTENT
          </div>
          <div className="space-y-1 mt-2">
            {aiItems.map((item) => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault()
                  console.log(`Navigating to: ${item.id}`)
                  onSectionChange(item.id)
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                  activeSection === item.id
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-muted-foreground">Premium Plan</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Progress value={89} className="flex-1 h-1" />
            <span>89%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardHome({ onSectionChange }: { onSectionChange?: (section: string) => void }) {
  const [aiInput, setAiInput] = useState("")
  const [aiMessages, setAiMessages] = useState([
    {
      type: "ai",
      content:
        "Ahoj! Mohu vám pomoci upravit dashboard podle vašich potřeb. Zkuste například: 'Zobraz mi trendy příjmů' nebo 'Přidej graf výdajů podle kategorií'",
    },
  ])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)

  const currentTime = new Date()
  const greeting =
    currentTime.getHours() < 12 ? "Dobré ráno" : currentTime.getHours() < 18 ? "Dobrý den" : "Dobrý večer"

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const [stats, activities, insights] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivity(),
          dashboardAPI.getAIInsights()
        ])

        setDashboardStats(stats)
        setRecentActivities(activities)
        setAiInsights(insights)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // Set empty/zero values instead of mock data to show real state
        setDashboardStats({
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
          remainingCredits: 0,
          trends: { income: 0, expenses: 0, profit: 0, credits: 0 }
        })
        setRecentActivities([])
        setAiInsights([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const handleAiMessage = () => {
    if (aiInput.trim()) {
      setAiMessages((prev) => [
        ...prev,
        { type: "user", content: aiInput },
        { type: "ai", content: "Zpracovávám váš požadavek na úpravu dashboardu..." },
      ])
      setAiInput("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greeting}, John!</h1>
            <p className="text-gray-600 mt-1">
              Zde je přehled vašich financí k {currentTime.toLocaleDateString("cs-CZ")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {currentTime.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Financial Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Celkové příjmy</p>
                    <p className="text-2xl font-bold text-green-600">
                      {loading ? "..." : `${dashboardStats?.totalIncome?.toLocaleString('cs-CZ') || 0} CZK`}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {loading ? "..." : `${dashboardStats?.trends?.income > 0 ? '+' : ''}${dashboardStats?.trends?.income || 0}% vs minulý měsíc`}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Celkové výdaje</p>
                    <p className="text-2xl font-bold text-red-600">
                      {loading ? "..." : `${dashboardStats?.totalExpenses?.toLocaleString('cs-CZ') || 0} CZK`}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                      <ArrowDownRight className="w-3 h-3" />
                      {loading ? "..." : `${dashboardStats?.trends?.expenses > 0 ? '+' : ''}${dashboardStats?.trends?.expenses || 0}% vs minulý měsíc`}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Čistý zisk</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {loading ? "..." : `${dashboardStats?.netProfit?.toLocaleString('cs-CZ') || 0} CZK`}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                      <Target className="w-3 h-3" />
                      {loading ? "..." : `${dashboardStats?.trends?.profit > 0 ? '+' : ''}${dashboardStats?.trends?.profit || 0}% z cíle`}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Rychlé akce
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                <Button
                  className="justify-start h-auto p-4 bg-transparent"
                  variant="outline"
                  onClick={() => onSectionChange?.('scanning')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Scan className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Naskenovat dokument</div>
                      <div className="text-xs text-muted-foreground">Nahrát novou fakturu nebo účtenku</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>

                <Button
                  className="justify-start h-auto p-4 bg-transparent"
                  variant="outline"
                  onClick={() => onSectionChange?.('approval')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Schválit faktury</div>
                      <div className="text-xs text-muted-foreground">3 faktury čekají na schválení</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>

                <Button
                  className="justify-start h-auto p-4 bg-transparent"
                  variant="outline"
                  onClick={() => onSectionChange?.('statistics')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Zobrazit statistiky</div>
                      <div className="text-xs text-muted-foreground">Detailní analýzy a trendy</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>

                <Button
                  className="justify-start h-auto p-4 bg-transparent"
                  variant="outline"
                  onClick={() => onSectionChange?.('ai-chat')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">AI Asistent</div>
                      <div className="text-xs text-muted-foreground">Zeptat se na finanční data</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Nedávná aktivita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground">Načítám aktivity...</div>
                  </div>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className={`w-8 h-8 bg-${item.color}-100 rounded-lg flex items-center justify-center`}>
                        {item.type === 'invoice' && <FileText className={`w-4 h-4 text-${item.color}-600`} />}
                        {item.type === 'approval' && <CheckCircle className={`w-4 h-4 text-${item.color}-600`} />}
                        {item.type === 'upload' && <Upload className={`w-4 h-4 text-${item.color}-600`} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                      {item.amount && <div className="text-sm font-medium">{item.amount}</div>}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground">Žádné nedávné aktivity</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Dashboard Assistant */}
        <div className="space-y-6">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                AI Doporučení
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="text-sm text-muted-foreground">Načítám doporučení...</div>
                </div>
              ) : aiInsights.length > 0 ? (
                aiInsights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    insight.type === 'positive' ? 'bg-blue-50' :
                    insight.type === 'warning' ? 'bg-orange-50' :
                    'bg-green-50'
                  }`}>
                    <div className="flex items-start gap-2">
                      {insight.type === 'positive' && <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />}
                      {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />}
                      {insight.type === 'success' && <Target className="w-4 h-4 text-green-600 mt-0.5" />}
                      <div>
                        <p className={`text-sm font-medium ${
                          insight.type === 'positive' ? 'text-blue-900' :
                          insight.type === 'warning' ? 'text-orange-900' :
                          'text-green-900'
                        }`}>{insight.title}</p>
                        <p className={`text-xs ${
                          insight.type === 'positive' ? 'text-blue-700' :
                          insight.type === 'warning' ? 'text-orange-700' :
                          'text-green-700'
                        }`}>{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <div className="text-sm text-muted-foreground">Žádná doporučení</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Chat for Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Upravit dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {aiMessages.map((message, index) => (
                  <div key={index} className="flex gap-2">
                    {message.type === "ai" ? (
                      <>
                        <Avatar className="w-6 h-6 bg-blue-100">
                          <AvatarFallback className="text-blue-600 text-xs">AI</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/50 p-2 rounded-lg">
                          <p className="text-xs">{message.content}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Avatar className="w-6 h-6">
                          <AvatarImage src="/placeholder.svg?height=24&width=24" />
                          <AvatarFallback className="text-xs">JD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-blue-50 p-2 rounded-lg">
                          <p className="text-xs">{message.content}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Jak chcete upravit dashboard?"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAiMessage()}
                  className="text-xs"
                />
                <Button size="sm" onClick={handleAiMessage}>
                  <Send className="w-3 h-3" />
                </Button>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Zkuste například:</p>
                <div className="flex flex-wrap gap-1">
                  {["Zobraz trendy", "Přidej graf výdajů", "Skryj aktivity"].map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 px-2 bg-transparent"
                      onClick={() => setAiInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatisticsPage() {
  const [chartType, setChartType] = useState("line")
  const [timePeriod, setTimePeriod] = useState("6months")
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [overviewMetrics, setOverviewMetrics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock company ID - in real app this would come from auth context
  const companyId = "mock-company-id"

  const getDateRange = (period: string) => {
    const endDate = new Date()
    const startDate = new Date()

    switch (period) {
      case "3months":
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case "6months":
        startDate.setMonth(endDate.getMonth() - 6)
        break
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setMonth(endDate.getMonth() - 6)
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { startDate, endDate } = getDateRange(timePeriod)

      // Load all analytics data in parallel
      const [monthlyTrends, expenseData, overview] = await Promise.all([
        dashboardAPI.getMonthlyTrends(companyId, startDate, endDate),
        dashboardAPI.getAnalyticsExpenseCategories(companyId, startDate, endDate),
        dashboardAPI.getOverviewMetrics(companyId)
      ])

      setMonthlyData(monthlyTrends)
      setExpenseCategories(expenseData)
      setOverviewMetrics(overview)

    } catch (error) {
      console.error('Error loading analytics data:', error)
      setError('Nepodařilo se načíst analytická data')

      // Set fallback data
      setMonthlyData([])
      setExpenseCategories([])
      setOverviewMetrics({
        total_income: 0,
        total_expenses: 0,
        net_profit: 0,
        profit_margin: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalyticsData()
  }, [timePeriod])

  const handleExport = async () => {
    try {
      const { startDate, endDate } = getDateRange(timePeriod)
      await dashboardAPI.exportAnalytics(companyId, 'csv', startDate, endDate)
      // Handle successful export (e.g., show notification)
    } catch (error) {
      console.error('Export failed:', error)
      // Handle export error
    }
  }

  const getTimePeriodLabel = (period: string) => {
    switch (period) {
      case "3months": return "Poslední 3 měsíce"
      case "6months": return "Posledních 6 měsíců"
      case "year": return "Poslední rok"
      default: return "Posledních 6 měsíců"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Statistiky</h2>
            <p className="text-muted-foreground">Načítám analytická data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-muted-foreground">Načítám statistiky...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Statistiky</h2>
            <p className="text-muted-foreground text-red-600">{error}</p>
          </div>
          <Button onClick={loadAnalyticsData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Zkusit znovu
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Statistiky</h2>
          <p className="text-muted-foreground">Detailní analýzy a přehledy vašich financí</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                {getTimePeriodLabel(timePeriod)}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTimePeriod("3months")}>Poslední 3 měsíce</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod("6months")}>Posledních 6 měsíců</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod("year")}>Poslední rok</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Finanční přehled</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={chartType === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("line")}
              >
                <LineChartIcon className="w-4 h-4 mr-2" />
                Čárový
              </Button>
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("bar")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Sloupcový
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              income: {
                label: "Příjmy",
                color: "#10b981",
              },
              expenses: {
                label: "Výdaje",
                color: "#ef4444",
              },
              profit: {
                label: "Zisk",
                color: "#3b82f6",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              {monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Žádná data k zobrazení</p>
                    <p className="text-sm text-gray-400 mt-2">Data se zobrazí po zpracování dokumentů</p>
                  </div>
                </div>
              ) : chartType === "line" ? (
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} name="Příjmy" />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--color-expenses)"
                    strokeWidth={2}
                    name="Výdaje"
                  />
                  <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} name="Zisk" />
                </LineChart>
              ) : (
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="income" fill="var(--color-income)" name="Příjmy" />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" name="Výdaje" />
                  <Bar dataKey="profit" fill="var(--color-profit)" name="Zisk" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Výdaje podle kategorií
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Hodnota",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                {expenseCategories.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <PieChartIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Žádné kategorie výdajů</p>
                      <p className="text-sm text-gray-400 mt-2">Data se zobrazí po zpracování faktur</p>
                    </div>
                  </div>
                ) : (
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Klíčové metriky
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Celkové příjmy</span>
                <span className="font-medium">{overviewMetrics.total_income?.toLocaleString('cs-CZ') || 0} CZK</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Celkové výdaje</span>
                <span className="font-medium">{overviewMetrics.total_expenses?.toLocaleString('cs-CZ') || 0} CZK</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Čistý zisk</span>
                <span className="font-medium">{overviewMetrics.net_profit?.toLocaleString('cs-CZ') || 0} CZK</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Zisková marže</span>
                <span className="font-medium text-green-600">{overviewMetrics.profit_margin?.toFixed(1) || 0}%</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Cíle na tento měsíc</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Dokumenty zpracované</span>
                    <span>{overviewMetrics.documents_this_period || 0}</span>
                  </div>
                  <Progress value={Math.min((overviewMetrics.documents_this_period || 0) / 100 * 100, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Čekající schválení</span>
                    <span>{overviewMetrics.pending_approvals || 0}</span>
                  </div>
                  <Progress value={Math.max(0, 100 - (overviewMetrics.pending_approvals || 0) * 10)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Aktivní uživatelé</span>
                    <span>{overviewMetrics.active_users || 0}</span>
                  </div>
                  <Progress value={Math.min((overviewMetrics.active_users || 0) / 10 * 100, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Využité úložiště</span>
                    <span>{overviewMetrics.total_storage_gb?.toFixed(2) || 0} GB</span>
                  </div>
                  <Progress value={Math.min((overviewMetrics.total_storage_gb || 0) / 100 * 100, 100)} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Enhanced components for other sections
function DocumentsPage() {
  const [documents, setDocuments] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true)
        const activities = await dashboardAPI.getRecentActivity()
        setDocuments(activities)
      } catch (error) {
        console.error('Error loading documents:', error)
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dokumenty</h2>
          <p className="text-muted-foreground">Přehled všech naskenovaných dokumentů</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nahrát dokument
        </Button>
      </div>

      <div className="flex gap-4">
        <Input placeholder="Hledat dokumenty..." className="max-w-sm" />
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtry
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">Načítám dokumenty...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Zatím nemáte žádné dokumenty</p>
            <p className="text-sm text-gray-400 mt-2">Nahrajte svůj první dokument pomocí tlačítka "Nahrát dokument"</p>
          </div>
        ) : (
          documents.map((activity, i) => (
            <Card key={activity.id || i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium">{activity.title}</h4>
                      <div className="text-sm text-muted-foreground">{activity.description}</div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={activity.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {activity.type === 'success' ? 'Dokončeno' : 'Zpracováno'}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

function ScanningPage() {
  // Redirect to the proper scanning page
  React.useEffect(() => {
    window.location.href = '/scanning'
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Přesměrování...</h2>
        <p className="text-muted-foreground">Přesměrováváme vás na stránku skenování</p>
      </div>
    </div>
  )
}

function CompanySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nastavení firmy</h2>
        <p className="text-muted-foreground">Spravujte údaje o vaší firmě</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Základní údaje
            </CardTitle>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Upravit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-6">
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Building2 className="w-8 h-8 mx-auto text-gray-400" />
                <Button variant="link" size="sm" className="text-xs">
                  Nahrát logo
                </Button>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold">Askela s.r.o.</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>IČO: 12345678</div>
                <div>DIČ: CZ12345678</div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Plátce DPH: Ano
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Adresa
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Václavské náměstí 1</div>
                  <div>110 00 Praha 1</div>
                  <div>Česká republika</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Kontakt
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    info@askela.cz
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    +420 123 456 789
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    www.askela.cz
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Bankovní údaje
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Účet: 123456789/0100</div>
                <div>IBAN: CZ65 0100 0000 0012 3456 7890</div>
                <div>SWIFT: KOMBCZPP</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button>
              <CheckCircle className="w-4 h-4 mr-2" />
              Uložit změny
            </Button>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Obnovit z ARES
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Správa týmu</h2>
          <p className="text-muted-foreground">Spravujte členy týmu a jejich oprávnění</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Přidat člena
        </Button>
      </div>

      <div className="flex gap-4">
        <Input placeholder="Hledat členy..." className="max-w-sm" />
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtry
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>JN</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Jan Novák</h4>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Online</span>
                </div>
                <div className="text-sm text-muted-foreground">jan.novak@askela.cz</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-purple-100 text-purple-800">
                    <Star className="w-3 h-3 mr-1" />
                    Administrátor
                  </Badge>
                  <span className="text-xs text-muted-foreground">• Přidán 15.1.2024</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Upravit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Oprávnění
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="w-4 h-4 mr-2" />
                  Kontakt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 space-y-2">
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Oprávnění:
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Schvalování faktur
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Správa týmu
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Export dat
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Nastavení firmy
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Aktivita: 47 dokumentů • 94% přesnost
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Statistiky týmu:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">Celkem členů</div>
            <div className="text-muted-foreground">5</div>
          </div>
          <div>
            <div className="font-medium">Aktivních</div>
            <div className="text-muted-foreground">3</div>
          </div>
          <div>
            <div className="font-medium">Průměrná přesnost</div>
            <div className="text-muted-foreground">95.2%</div>
          </div>
          <div>
            <div className="font-medium">Naskenováno tento měsíc</div>
            <div className="text-muted-foreground">156 dokumentů</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApprovalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schvalování faktur</h2>
          <p className="text-muted-foreground">Kontrolujte a schvalujte faktury před zpracováním</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Vše
          </Button>
          <Button variant="outline" size="sm">
            Moje
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Nastavení
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4" />
        <span className="font-medium">Čekají na schválení (0)</span>
      </div>

      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné dokumenty ke schválení</h3>
        <p className="text-gray-500 mb-4">
          Momentálně nemáte žádné dokumenty, které by čekaly na schválení.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Systém je připraven.</strong><br />
                Dokumenty se zde zobrazí po nahrání a zpracování.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Přehled schvalování:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">Čekají</div>
            <div className="text-muted-foreground">3</div>
          </div>
          <div>
            <div className="font-medium">Schváleno dnes</div>
            <div className="text-muted-foreground">12</div>
          </div>
          <div>
            <div className="font-medium">Zamítnuto</div>
            <div className="text-muted-foreground">1</div>
          </div>
          <div>
            <div className="font-medium">Průměrný čas schválení</div>
            <div className="text-muted-foreground">2.3 hodiny</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ComprehensiveDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")

  const handleSectionChange = (sectionId: string) => {
    console.log(`Changing section from ${activeSection} to ${sectionId}`)
    setActiveSection(sectionId)
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardHome onSectionChange={handleSectionChange} />
      case "documents":
        return <DocumentsPage />
      case "scanning":
        return <ScanningPage />
      case "statistics":
        return <StatisticsPage />
      case "company-settings":
        return <CompanySettingsPage />
      case "team":
        return <TeamPage />
      case "approval":
        return <ApprovalPage />
      case "ai-chat":
        return <AIAssistant />
      case "ai-overview":
        return <AIAssistant />
      case "ai-analytics":
        return <AIAssistant />
      default:
        return <DashboardHome onSectionChange={handleSectionChange} />
    }
  }

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <AppSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{pageTitles[activeSection] || "Dashboard"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Search className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@johndoe" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Nastavení</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <span>Odhlásit se</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
