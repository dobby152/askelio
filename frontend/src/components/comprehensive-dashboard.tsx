"use client"

import {
  // Basic icons
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  PieChartIcon,
  Settings,
  TrendingUp,
  Users,
  User,

  // Action icons
  Upload,
  Download,
  Save,
  Edit,
  Send,
  RefreshCw,

  // UI icons
  Bell,
  Search,
  Filter,
  Plus,
  Eye,
  EyeOff,
  MessageSquare,
  X,
  Star,
  Flag,
  Mail,
  Phone,
  Globe,
  Zap,
  Brain,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,

  // Status icons
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Clock,
  Target,
  Lightbulb,
  XCircle,
  Files,

  // Chart icons
  BarChart,
  LineChartIcon,
  Activity,

  // Direction icons
  ArrowUpRight,
  ArrowDownRight,

  // Other icons
  Wallet,
  Receipt,
  FileCheck,
  Scan,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { dashboardAPI } from "@/lib/dashboard-api"
import { apiClient } from "@/lib/api"
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
import React, { useState, useEffect, useCallback, useRef } from "react"
import { useDropzone } from 'react-dropzone'
import { AIAssistantEnhanced } from "@/components/ai-assistant-enhanced"
import { useAuth } from "@/components/AuthProvider"
import { InteractivePDFPreview } from "@/components/interactive-pdf-preview"
import { ExtractedDataEditor } from "@/components/extracted-data-editor"
import { AresValidation } from "@/components/ares-validation"
import CompanySettings from "@/components/company/CompanySettings"
import UserManagement from "@/components/company/UserManagement"
import ApprovalWorkflow from "@/components/approval/ApprovalWorkflow"
import type { DashboardStats, RecentActivity, AIInsight } from "@/lib/dashboard-api"
import { formatAmount, extractAmountFields, extractItemFields } from "@/lib/format-utils"

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
          pendingApprovals: 0,
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
                      <div className="text-xs text-muted-foreground">
                        {dashboardStats?.pendingApprovals || 0} {
                          (dashboardStats?.pendingApprovals || 0) === 1 ? 'faktura čeká' :
                          (dashboardStats?.pendingApprovals || 0) < 5 ? 'faktury čekají' :
                          'faktur čeká'
                        } na schválení
                      </div>
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
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Load user's company ID
  useEffect(() => {
    const loadUserCompany = async () => {
      try {
        const { apiClient } = await import('@/lib/api-client')
        const result = await apiClient.getUserCompanies()

        if (result.success && result.data && result.data.length > 0) {
          // Use the first company for now - in a multi-company app, user would select
          const firstCompany = result.data[0]
          setCompanyId(firstCompany.companies.id)
        } else {
          setError('Nenalezena žádná firma pro uživatele')
        }
      } catch (error) {
        console.error('Error loading user companies:', error)
        setError('Chyba při načítání firem uživatele')
      }
    }

    loadUserCompany()
  }, [])

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
    if (!companyId) return

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

      // Clear data on error - no fallback data
      setMonthlyData([])
      setExpenseCategories([])
      setOverviewMetrics({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyId) {
      loadAnalyticsData()
    }
  }, [timePeriod, companyId])

  const handleExport = async () => {
    if (!companyId) return

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

  if (error || !companyId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Statistiky</h2>
            <p className="text-muted-foreground text-red-600">{error || 'Nepodařilo se načíst data firmy'}</p>
          </div>
          <Button onClick={loadAnalyticsData} variant="outline" disabled={!companyId}>
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
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true)
        console.log('📄 Loading documents from API...')
        const response = await apiClient.getDocuments()
        console.log('📄 Documents API response:', response)

        // apiClient.getDocuments() vrací přímo array dokumentů
        if (Array.isArray(response)) {
          setDocuments(response)
          console.log('📄 Documents loaded successfully:', response.length, 'documents')
        } else if (response && response.success && response.data) {
          setDocuments(response.data)
          console.log('📄 Documents loaded successfully:', response.data.length, 'documents')
        } else {
          console.error('📄 Failed to load documents:', response)
          setDocuments([])
        }
      } catch (error) {
        console.error('📄 Error loading documents:', error)
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const handleDocumentClick = (document: any) => {
    console.log('📄 Document clicked:', document)
    setSelectedDocument(document)
    // TODO: Implementovat zobrazení detailu dokumentu
    toast.info(`Zobrazuji detail dokumentu: ${document.original_filename}`)
  }

  const handleDownloadDocument = async (document: any) => {
    try {
      console.log('📄 Downloading document:', document.id)
      // TODO: Implementovat stažení dokumentu
      toast.info(`Stahování dokumentu: ${document.original_filename}`)
    } catch (error) {
      console.error('📄 Error downloading document:', error)
      toast.error('Chyba při stahování dokumentu')
    }
  }

  const handleDeleteDocument = async (document: any) => {
    try {
      console.log('📄 Deleting document:', document.id)
      const documentName = document.original_filename || document.filename || 'Neznámý dokument'
      const confirmed = window.confirm(`Opravdu chcete smazat dokument "${documentName}"?`)

      if (confirmed) {
        const response = await apiClient.deleteDocument(document.id)
        if (response.success) {
          setDocuments(prev => prev.filter(d => d.id !== document.id))
          toast.success('Dokument byl úspěšně smazán')
        } else {
          toast.error('Chyba při mazání dokumentu')
        }
      }
    } catch (error) {
      console.error('📄 Error deleting document:', error)
      toast.error('Chyba při mazání dokumentu')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    console.log('📄 File selected for upload:', file.name)

    try {
      setUploading(true)
      toast.info(`Nahrávám dokument: ${file.name}`)

      const response = await apiClient.uploadDocument(file)
      if (response.success) {
        toast.success('Dokument byl úspěšně nahrán')
        // Znovu načteme dokumenty
        const documentsResponse = await apiClient.getDocuments()
        if (Array.isArray(documentsResponse)) {
          setDocuments(documentsResponse)
        }
      } else {
        toast.error('Chyba při nahrávání dokumentu')
      }
    } catch (error) {
      console.error('📄 Error uploading document:', error)
      toast.error('Chyba při nahrávání dokumentu')
    } finally {
      setUploading(false)
      // Vyčistíme input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dokumenty</h2>
          <p className="text-muted-foreground">Přehled všech naskenovaných dokumentů</p>
        </div>
        <Button onClick={handleUploadClick} disabled={uploading}>
          <Plus className="w-4 h-4 mr-2" />
          {uploading ? 'Nahrávám...' : 'Nahrát dokument'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
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
            <p className="text-sm text-gray-400 mt-2">Nahrajte svůj první dokument pomocí tlačítka &quot;Nahrát dokument&quot;</p>
          </div>
        ) : (
          documents.map((document, i) => {
            const structuredData = document.structured_data || {}

            // Extrakce dodavatele a zákazníka
            const vendor = structuredData.vendor?.name || 'Neznámý dodavatel'
            const customer = structuredData.customer?.name || 'Neznámý zákazník'

            // Extrakce částky - zkusíme různé možnosti
            const amount = structuredData.totals?.total ||
                          structuredData.total_amount ||
                          structuredData.amount ||
                          structuredData.total
            const currency = structuredData.currency || 'CZK'

            // Extrakce data a čísla faktury
            const date = structuredData.date || document.created_at
            const invoiceNumber = structuredData.invoice_number || structuredData.receipt_number

            // Určení typu dokumentu (příjem/výdaj) na základě vendor/customer
            // Pokud vendor je Askela s.r.o., je to odchozí faktura (příjem)
            // Pokud customer je Askela s.r.o., je to příchozí faktura (výdaj)
            const isAskelaVendor = vendor?.toLowerCase().includes('askela')
            const isAskelaCustomer = customer?.toLowerCase().includes('askela')

            let documentType = 'Neznámý'
            let typeColor = 'bg-gray-100 text-gray-800'

            if (isAskelaVendor) {
              documentType = 'Příjem' // Askela vydává fakturu = příjem
              typeColor = 'bg-green-100 text-green-800'
            } else if (isAskelaCustomer) {
              documentType = 'Výdaj' // Askela dostává fakturu = výdaj
              typeColor = 'bg-red-100 text-red-800'
            }

            return (
              <Card key={document.id || i} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleDocumentClick(document)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium">
                          {invoiceNumber ? `Faktura ${invoiceNumber}` : document.original_filename}
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          {vendor}
                          {amount && (
                            <span className="ml-2 font-medium">
                              {amount.toLocaleString('cs-CZ')} {currency}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(date).toLocaleDateString('cs-CZ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={typeColor}>
                        {documentType}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {document.status === 'completed' ? 'Zpracováno' : document.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleDocumentClick(document)
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            Zobrazit detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadDocument(document)
                          }}>
                            <Download className="w-4 h-4 mr-2" />
                            Stáhnout
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDocument(document)
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Smazat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  message?: string
}

interface ExtractedField {
  id: string
  field: string
  value: string
  confidence: number
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
  validated?: boolean
  aresEnriched?: boolean
}

interface ProcessedDocument {
  id: string
  fileName: string
  fileUrl: string
  extractedData: ExtractedField[]
  aresData?: {
    vendor?: any
    customer?: any
  }
  processingSteps: ProcessingStep[]
  status: 'processing' | 'completed' | 'error'
}

function ScanningPage() {
  const { user } = useAuth()
  const [document, setDocument] = React.useState<ProcessedDocument | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [showOverlay, setShowOverlay] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('preview')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const processingSteps: ProcessingStep[] = [
    { id: 'upload', name: 'Nahrávání souboru', status: 'pending', progress: 0 },
    { id: 'ocr', name: 'OCR zpracování', status: 'pending', progress: 0 },
    { id: 'extraction', name: 'Extrakce dat', status: 'pending', progress: 0 },
    { id: 'ares', name: 'ARES validace', status: 'pending', progress: 0 },
    { id: 'validation', name: 'Finální validace', status: 'pending', progress: 0 }
  ]

  // State for bulk processing
  const [processingFiles, setProcessingFiles] = useState<Array<{
    id: string
    file: File
    status: 'pending' | 'processing' | 'completed' | 'error'
    progress: number
    result?: any
    error?: string
  }>>([])

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // Check if user is authenticated
    if (!user) {
      alert('Pro nahrávání dokumentů se musíte přihlásit')
      return
    }

    // Handle single file (existing behavior)
    if (acceptedFiles.length === 1) {
      const file = acceptedFiles[0]

    setIsProcessing(true)
    setActiveTab('preview')

    // Initialize document with processing steps
    const newDocument: ProcessedDocument = {
      id: Date.now().toString(),
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      extractedData: [],
      processingSteps: processingSteps.map(step => ({ ...step })),
      status: 'processing'
    }
    setDocument(newDocument)

    try {
      // Step 1: Upload
      updateProcessingStep('upload', 'processing', 50, 'Nahrávání souboru...')
      await new Promise(resolve => setTimeout(resolve, 500))
      updateProcessingStep('upload', 'completed', 100, 'Soubor nahrán')

      // Step 2: OCR Processing
      updateProcessingStep('ocr', 'processing', 30, 'Rozpoznávání textu...')

      // Import apiClient dynamically to avoid SSR issues
      const { apiClient } = await import('@/lib/api-client')

      const response = await apiClient.processDocument(file, {
        mode: 'cost_effective',
        max_cost_czk: 5.0,
        enable_ares_enrichment: true
      })

      if (!response.success) {
        throw new Error(response.error?.message || 'Zpracování selhalo')
      }

      updateProcessingStep('ocr', 'completed', 100, 'Text rozpoznán')
      updateProcessingStep('extraction', 'processing', 60, 'Extrakce dat...')

      // Convert response data to ExtractedField format
      const extractedFields = convertResponseToFields(response.data.structured_data)

      setDocument(prev => prev ? {
        ...prev,
        extractedData: extractedFields,
        aresData: {
          vendor: response.data.structured_data.vendor,
          customer: response.data.structured_data.customer,
          _ares_enrichment: response.data.structured_data._ares_enrichment
        }
      } : null)

      updateProcessingStep('extraction', 'completed', 100, 'Data extrahována')
      updateProcessingStep('ares', 'processing', 80, 'ARES validace...')

      // Simulate ARES processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateProcessingStep('ares', 'completed', 100, 'ARES data doplněna')
      updateProcessingStep('validation', 'completed', 100, 'Validace dokončena')

      setDocument(prev => prev ? { ...prev, status: 'completed' } : null)

    } catch (error) {
      console.error('Processing error:', error)
      updateProcessingStep('ocr', 'error', 0, `Chyba: ${error.message}`)
      setDocument(prev => prev ? { ...prev, status: 'error' } : null)
    } finally {
      setIsProcessing(false)
    }
    } else {
      // Handle multiple files (bulk processing)
      console.log('📄 Bulk processing:', acceptedFiles.length, 'files')

      // Initialize processing files state
      const fileItems = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'pending' as const,
        progress: 0
      }))

      setProcessingFiles(fileItems)
      setIsProcessing(true)
      setActiveTab('bulk') // Switch to bulk processing tab

      try {
        const { apiClient } = await import('@/lib/api-client')

        // Process files sequentially to avoid overwhelming the server
        for (const fileItem of fileItems) {
          setProcessingFiles(prev => prev.map(f =>
            f.id === fileItem.id ? { ...f, status: 'processing', progress: 10 } : f
          ))

          try {
            const response = await apiClient.processDocument(fileItem.file, {
              mode: 'cost_effective',
              max_cost_czk: 5.0,
              enable_ares_enrichment: true
            })

            setProcessingFiles(prev => prev.map(f =>
              f.id === fileItem.id ? {
                ...f,
                status: response.success ? 'completed' : 'error',
                progress: 100,
                result: response.success ? response.data : undefined,
                error: response.success ? undefined : response.error?.message
              } : f
            ))
          } catch (error) {
            setProcessingFiles(prev => prev.map(f =>
              f.id === fileItem.id ? {
                ...f,
                status: 'error',
                progress: 100,
                error: String(error)
              } : f
            ))
          }
        }

        console.log('✅ Bulk processing completed')

      } catch (error) {
        console.error('❌ Bulk processing failed:', error)
        setProcessingFiles(prev => prev.map(f => ({ ...f, status: 'error', error: String(error) })))
      } finally {
        setIsProcessing(false)
      }
    }
  }, [])

  const updateProcessingStep = (stepId: string, status: ProcessingStep['status'], progress: number, message?: string) => {
    setDocument(prev => {
      if (!prev) return null
      return {
        ...prev,
        processingSteps: prev.processingSteps.map(step =>
          step.id === stepId ? { ...step, status, progress, message } : step
        )
      }
    })
  }

  const convertResponseToFields = (data: any): ExtractedField[] => {
    console.log('🔍 Converting response data:', data)
    const fields: ExtractedField[] = []
    let fieldId = 1

    // Define field order for better sorting
    const fieldOrder = [
      'document_type', 'invoice_number', 'date', 'due_date',
      'amount', 'total_amount', 'subtotal', 'tax_amount',
      'currency', 'variable_symbol', 'bank_account'
    ]

    // Convert ordered fields first
    fieldOrder.forEach(fieldName => {
      if (data[fieldName] !== undefined && data[fieldName] !== null && data[fieldName] !== '') {
        console.log(`📊 Field ${fieldName}:`, data[fieldName])

        // Handle object values (especially for amounts)
        let displayValue = data[fieldName];

        // Format amount fields properly
        if (fieldName.includes('amount') || fieldName.includes('total') || fieldName.includes('subtotal') || fieldName.includes('tax')) {
          displayValue = formatAmount(displayValue);
        } else if (typeof displayValue === 'object' && displayValue !== null) {
          if (displayValue.value !== undefined) {
            displayValue = displayValue.value;
          } else if (displayValue.amount !== undefined) {
            displayValue = displayValue.amount;
          } else {
            // For other objects, try to extract meaningful value
            displayValue = JSON.stringify(displayValue);
          }
        }

        fields.push({
          id: `${fieldName}_${fieldId++}`,
          field: fieldName,
          value: String(displayValue),
          confidence: 0.95,
          validated: false
        })
      }
    })

    // Add any additional fields not in the ordered list
    Object.keys(data).forEach(fieldName => {
      if (!fieldOrder.includes(fieldName) &&
          !fieldName.startsWith('_') &&
          fieldName !== 'vendor' &&
          fieldName !== 'customer' &&
          fieldName !== 'items' &&
          data[fieldName] !== undefined &&
          data[fieldName] !== null &&
          data[fieldName] !== '') {

        // Handle object values
        let displayValue = data[fieldName];

        // Check if this is a complex object that should be expanded
        let expandedFields: Array<{label: string, value: string}> = [];

        // Handle amount fields with multiple values
        if ((fieldName.includes('amount') || fieldName.includes('total') || fieldName.includes('subtotal') || fieldName.includes('tax')) &&
            typeof displayValue === 'object' && displayValue !== null) {
          expandedFields = extractAmountFields(displayValue);
        }

        // Handle item fields
        if ((fieldName.includes('item') || fieldName.includes('polozka')) &&
            typeof displayValue === 'object' && displayValue !== null) {
          expandedFields = extractItemFields(displayValue);
        }

        // If we have expanded fields, add them separately
        if (expandedFields.length > 1) {
          expandedFields.forEach(expandedField => {
            fields.push({
              id: `${fieldName}_${expandedField.label}_${fieldId++}`,
              field: `${fieldName}.${expandedField.label}`,
              value: expandedField.value,
              confidence: 0.9,
              position: { x: 0, y: 0, width: 0, height: 0, page: 1 }
            });
          });
          return; // Skip adding the original field
        }

        // Format single amount fields properly
        if (fieldName.includes('amount') || fieldName.includes('total') || fieldName.includes('subtotal') || fieldName.includes('tax')) {
          displayValue = formatAmount(displayValue);
        } else if (typeof displayValue === 'object' && displayValue !== null) {
          if (displayValue.value !== undefined) {
            displayValue = displayValue.value;
          } else if (displayValue.amount !== undefined) {
            displayValue = displayValue.amount;
          } else {
            displayValue = JSON.stringify(displayValue);
          }
        }

        fields.push({
          id: `${fieldName}_${fieldId++}`,
          field: fieldName,
          value: String(displayValue),
          confidence: 0.9,
          validated: false
        })
      }
    })

    // Handle items array if present
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any, index: number) => {
        Object.entries(item).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            fields.push({
              id: `item_${index}_${key}_${fieldId++}`,
              field: `item_${index}_${key}`,
              value: String(value),
              confidence: 0.9,
              validated: false
            })
          }
        })
      })
    }

    // Convert vendor data
    if (data.vendor && typeof data.vendor === 'object') {
      Object.entries(data.vendor).forEach(([key, value]) => {
        if (value && !key.startsWith('_') && value !== null && value !== '') {
          // Handle nested objects (like amount objects)
          let displayValue = value;
          if (typeof value === 'object' && value !== null) {
            if (value.value !== undefined) {
              displayValue = value.value;
            } else if (value.amount !== undefined) {
              displayValue = value.amount;
            } else {
              displayValue = JSON.stringify(value);
            }
          }

          fields.push({
            id: `vendor_${key}_${fieldId++}`,
            field: `vendor_${key}`,
            value: String(displayValue),
            confidence: 0.9,
            validated: false,
            aresEnriched: data._ares_enrichment?.notes?.some(note => note.includes('Vendor')) || false
          })
        }
      })
    }

    // Convert customer data
    if (data.customer && typeof data.customer === 'object') {
      Object.entries(data.customer).forEach(([key, value]) => {
        if (value && !key.startsWith('_') && value !== null && value !== '') {
          // Handle nested objects (like amount objects)
          let displayValue = value;
          if (typeof value === 'object' && value !== null) {
            if (value.value !== undefined) {
              displayValue = value.value;
            } else if (value.amount !== undefined) {
              displayValue = value.amount;
            } else {
              displayValue = JSON.stringify(value);
            }
          }

          fields.push({
            id: `customer_${key}_${fieldId++}`,
            field: `customer_${key}`,
            value: String(displayValue),
            confidence: 0.9,
            validated: false,
            aresEnriched: data._ares_enrichment?.notes?.some(note => note.includes('Customer')) || false
          })
        }
      })
    }

    return fields
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      onDrop(files)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing,
    multiple: true, // Enable multiple file selection
    maxFiles: 10   // Limit to 10 files per batch
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFieldUpdate = (fieldId: string, newValue: string) => {
    setDocument(prev => {
      if (!prev) return null
      return {
        ...prev,
        extractedData: prev.extractedData.map(field =>
          field.id === fieldId ? { ...field, value: newValue, validated: true } : field
        )
      }
    })
  }

  const handleSave = async () => {
    if (!document) return
    // TODO: Implement save functionality
    console.log('Saving document:', document)
  }

  const handleExport = async () => {
    if (!document) return
    // TODO: Implement export functionality
    console.log('Exporting document:', document)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Skenování dokumentů</h2>
        <p className="text-muted-foreground">Nahrajte faktury, účtenky nebo jiné dokumenty pro automatické zpracování</p>
      </div>

      {!document && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={`relative min-h-[400px] cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-400 border-dashed'
                  : 'bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-100 border-2 border-dashed border-gray-300 hover:border-blue-400'
              } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />

              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '30px 30px'
                }}></div>
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                {isDragActive ? (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-700 mb-2">Pusťte soubor zde</h3>
                    <p className="text-blue-600">Soubor bude okamžitě zpracován</p>
                  </div>
                ) : (
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Upload className="w-10 h-10 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Nahrajte svůj dokument
                    </h3>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Přetáhněte soubor sem nebo klikněte pro výběr.<br />
                      AI automaticky extrahuje všechna důležitá data.
                    </p>

                    {/* Feature Icons */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { icon: Zap, label: 'Rychlé zpracování', color: 'bg-yellow-500' },
                        { icon: Brain, label: 'AI extrakce', color: 'bg-purple-500' },
                        { icon: CheckCircle, label: 'ARES validace', color: 'bg-green-500' }
                      ].map((feature, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-2 shadow-md`}>
                            <feature.icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                            {feature.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* File Format Pills */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {['PDF', 'JPG', 'PNG'].map((format) => (
                        <span key={format} className="px-3 py-1 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium border border-gray-200/50 shadow-sm">
                          {format}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Maximální velikost: 10MB</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {document && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{document.fileName}</div>
                  <div className="text-sm text-gray-500 font-normal">Zpracování dokumentu</div>
                </div>
              </CardTitle>
              <Badge
                variant={
                  document.status === 'completed' ? 'default' :
                  document.status === 'error' ? 'destructive' :
                  'secondary'
                }
                className="px-3 py-1"
              >
                {document.status === 'processing' && (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Zpracovává se
                  </>
                )}
                {document.status === 'completed' && (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Dokončeno
                  </>
                )}
                {document.status === 'error' && (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Chyba
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {document.processingSteps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Connection Line */}
                  {index < document.processingSteps.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Step Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      step.status === 'completed' ? 'bg-green-100 border-green-500' :
                      step.status === 'processing' ? 'bg-blue-100 border-blue-500' :
                      step.status === 'error' ? 'bg-red-100 border-red-500' :
                      'bg-gray-100 border-gray-300'
                    }`}>
                      {step.status === 'processing' && (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      )}
                      {step.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {step.status === 'error' && (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      {step.status === 'pending' && (
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{step.name}</h4>
                        {step.status !== 'pending' && (
                          <span className="text-sm text-gray-500">{step.progress}%</span>
                        )}
                      </div>

                      {step.message && (
                        <p className="text-sm text-gray-600 mb-3">{step.message}</p>
                      )}

                      {step.status !== 'pending' && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              step.status === 'error' ? 'bg-red-500' :
                              step.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${step.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Header */}
      {document && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {document.fileName}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={document.status !== 'completed'}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Uložit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={document.status !== 'completed'}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {document.status === 'processing' && (
                <>
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  <span className="text-sm text-muted-foreground">Zpracovává se...</span>
                </>
              )}
              {document.status === 'completed' && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Zpracování dokončeno</span>
                </>
              )}
              {document.status === 'error' && (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Chyba při zpracování</span>
                </>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Main Content - PDF Preview and Data Editor */}
      {document && document.status === 'completed' && document.extractedData.length > 0 && (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* PDF Preview - Takes more space */}
          <div className="lg:col-span-3">
            <Card className="h-[700px]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {document.fileName}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOverlay(!showOverlay)}
                    >
                      {showOverlay ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {showOverlay ? 'Skrýt' : 'Zobrazit'} pole
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-full p-0">
                <div className="relative w-full h-full">
                  {/* PDF Viewer */}
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Náhled</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Dokument byl úspěšně zpracován
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">
                          Soubor: {document.fileName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Extrahováno: {document.extractedData.length} polí
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Field Overlays (Mock positions for demo) */}
                  {showOverlay && document.extractedData.map((field, index) => (
                    <div
                      key={field.id}
                      className={`absolute border-2 cursor-pointer transition-all hover:shadow-lg rounded ${
                        field.confidence >= 0.9
                          ? 'border-green-500 bg-green-100/20'
                          : field.confidence >= 0.7
                          ? 'border-yellow-500 bg-yellow-100/20'
                          : 'border-red-500 bg-red-100/20'
                      }`}
                      style={{
                        left: `${50 + (index % 3) * 150}px`,
                        top: `${100 + Math.floor(index / 3) * 40}px`,
                        width: '140px',
                        height: '25px',
                      }}
                      onClick={() => handleFieldUpdate(field.id, field.value)}
                      title={`${field.field}: ${field.value} (${Math.round(field.confidence * 100)}%)`}
                    >
                      <div className="text-xs p-1 truncate">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Rychlé akce
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowOverlay(!showOverlay)}
                >
                  {showOverlay ? <Eye className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showOverlay ? 'Skrýt pole' : 'Zobrazit pole'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleSave}
                  disabled={document.status !== 'completed'}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Uložit změny
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleExport}
                  disabled={document.status !== 'completed'}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportovat
                </Button>
              </CardContent>
            </Card>

            {/* Data Tabs */}
            <Card className="flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <CardHeader className="pb-2">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="preview" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Náhled
                    </TabsTrigger>
                    <TabsTrigger value="data" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      Data
                    </TabsTrigger>
                    <TabsTrigger value="ares" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      ARES
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="text-xs">
                      <Files className="w-3 h-3 mr-1" />
                      Hromadné
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <TabsContent value="preview" className="mt-0">
                    <div>
                      <h3 className="font-medium mb-2">Náhled dokumentu</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Interaktivní náhled s označenými poli
                      </p>
                      <div className="text-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>Vysoká přesnost (90%+)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span>Střední přesnost (70-90%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span>Nízká přesnost (&lt;70%)</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="data" className="mt-0">
                    <div>
                      <h3 className="font-medium mb-2">Editor dat</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upravte extrahovaná data podle potřeby
                      </p>
                      <div className="max-h-96 overflow-auto">
                        <ExtractedDataEditor
                          extractedData={document.extractedData}
                          onFieldUpdate={handleFieldUpdate}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ares" className="mt-0">
                    <div>
                      <h3 className="font-medium mb-2">ARES Validace</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Ověření a obohacení dat z ARES registru
                      </p>
                      <div className="max-h-96 overflow-auto">
                        <AresValidation
                          extractedData={document.extractedData}
                          aresData={document.aresData}
                          onDataUpdate={(updatedData) => {
                            setDocument(prev => prev ? { ...prev, aresData: updatedData } : null)
                          }}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bulk" className="mt-0">
                    <div>
                      <h3 className="font-medium mb-2">Hromadné zpracování</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Přehled zpracovávaných souborů
                      </p>
                      <div className="max-h-96 overflow-auto space-y-2">
                        {processingFiles.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Žádné soubory ke zpracování
                          </p>
                        ) : (
                          processingFiles.map((fileItem) => (
                            <div key={fileItem.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium truncate">{fileItem.file.name}</span>
                                <div className="flex items-center gap-2">
                                  {fileItem.status === 'pending' && (
                                    <Clock className="w-4 h-4 text-gray-400" />
                                  )}
                                  {fileItem.status === 'processing' && (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                  )}
                                  {fileItem.status === 'completed' && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                  {fileItem.status === 'error' && (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    fileItem.status === 'error' ? 'bg-red-500' :
                                    fileItem.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${fileItem.progress}%` }}
                                />
                              </div>
                              {fileItem.error && (
                                <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                              )}
                              {fileItem.result && (
                                <div className="text-xs text-green-600 mt-1">
                                  Zpracováno • Confidence: {(fileItem.result.confidence * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {document && document.status === 'completed' && (
        <div className="flex gap-4">
          <Button onClick={() => setDocument(null)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Nahrát další dokument
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Uložit data
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportovat
          </Button>
        </div>
      )}
    </div>
  )
}

function CompanySettingsPage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserCompany = async () => {
      try {
        const { apiClient } = await import('@/lib/api-client')
        const result = await apiClient.getUserCompanies()

        if (result.success && result.data && result.data.length > 0) {
          // Use the first company for now - in a multi-company app, user would select
          const firstCompany = result.data[0]
          setCompanyId(firstCompany.companies.id)
        } else {
          toast.error('Nenalezena žádná firma pro uživatele')
        }
      } catch (error) {
        console.error('Error loading user companies:', error)
        toast.error('Chyba při načítání firem uživatele')
      } finally {
        setLoading(false)
      }
    }

    loadUserCompany()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Načítání...</span>
      </div>
    )
  }

  if (!companyId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nepodařilo se načíst data firmy. Možná nemáte přístup k žádné firmě.
        </AlertDescription>
      </Alert>
    )
  }

  return <CompanySettings companyId={companyId} />
}

function TeamPage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserCompany = async () => {
      try {
        const { apiClient } = await import('@/lib/api-client')
        const result = await apiClient.getUserCompanies()

        if (result.success && result.data && result.data.length > 0) {
          // Use the first company for now - in a multi-company app, user would select
          const firstCompany = result.data[0]
          setCompanyId(firstCompany.companies.id)
        } else {
          toast.error('Nenalezena žádná firma pro uživatele')
        }
      } catch (error) {
        console.error('Error loading user companies:', error)
        toast.error('Chyba při načítání firem uživatele')
      } finally {
        setLoading(false)
      }
    }

    loadUserCompany()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Načítání...</span>
      </div>
    )
  }

  if (!companyId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nepodařilo se načíst data firmy. Možná nemáte přístup k žádné firmě.
        </AlertDescription>
      </Alert>
    )
  }

  return <UserManagement companyId={companyId} />
}

function ApprovalPage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserCompany = async () => {
      try {
        const { apiClient } = await import('@/lib/api-client')
        const result = await apiClient.getUserCompanies()

        if (result.success && result.data && result.data.length > 0) {
          // Use the first company for now - in a multi-company app, user would select
          const firstCompany = result.data[0]
          setCompanyId(firstCompany.companies.id)
        } else {
          toast.error('Nenalezena žádná firma pro uživatele')
        }
      } catch (error) {
        console.error('Error loading user companies:', error)
        toast.error('Chyba při načítání firem uživatele')
      } finally {
        setLoading(false)
      }
    }

    loadUserCompany()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Načítání...</span>
      </div>
    )
  }

  if (!companyId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nepodařilo se načíst data firmy. Možná nemáte přístup k žádné firmě.
        </AlertDescription>
      </Alert>
    )
  }

  return <ApprovalWorkflow companyId={companyId} />
}

interface ComprehensiveDashboardProps {
  initialSection?: string
}

export function ComprehensiveDashboard({ initialSection = "dashboard" }: ComprehensiveDashboardProps) {
  const [activeSection, setActiveSection] = useState(initialSection)

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
        return <AIAssistantEnhanced section="ai-chat" />
      case "ai-overview":
        return <AIAssistantEnhanced section="ai-overview" />
      case "ai-analytics":
        return <AIAssistantEnhanced section="ai-analytics" />
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
