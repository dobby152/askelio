"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Clock, 
  Target, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  MessageSquare,
  Euro,
  Receipt,
  Building,
  Calculator,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { FinancialAIChat } from "./financial-ai-chat"

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

interface EnhancedStatsData {
  processedDocuments: number
  timeSaved: number
  accuracy: number
  remainingCredits: number
  financialData: FinancialData
  trends: {
    documents: number
    timeSaved: number
    accuracy: number
    credits: number
    revenue: number
    expenses: number
    profit: number
  }
}

export function EnhancedStatsCards() {
  const [stats, setStats] = useState<EnhancedStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiChatOpen, setAiChatOpen] = useState(false)

  useEffect(() => {
    fetchEnhancedStats()
  }, [])

  const fetchEnhancedStats = async () => {
    try {
      console.log('🚀 EnhancedStatsCards: Fetching enhanced stats...')
      const [documents, credits] = await Promise.all([
        apiClient.getDocuments(),
        apiClient.getCreditBalance()
      ])

      // Calculate enhanced stats from real data
      const processedDocs = documents.length
      const completedDocs = documents.filter((doc: any) => doc.status === 'completed').length
      const avgAccuracy = completedDocs > 0
        ? documents
            .filter((doc: any) => doc.status === 'completed' && doc.confidence_score)
            .reduce((sum: number, doc: any) => sum + doc.confidence_score, 0) / completedDocs
        : 0

      // Calculate financial data
      const financialData = calculateFinancialData(documents)

      setStats({
        processedDocuments: processedDocs,
        timeSaved: processedDocs * 0.5,
        accuracy: avgAccuracy,
        remainingCredits: credits,
        financialData,
        trends: {
          documents: 12.5,
          timeSaved: 8.1,
          accuracy: 0.3,
          credits: -5.2,
          revenue: 15.3,
          expenses: -8.7,
          profit: 23.8
        }
      })
    } catch (error) {
      console.error('💥 EnhancedStatsCards: Error fetching stats:', error)
      setStats({
        processedDocuments: 0,
        timeSaved: 0,
        accuracy: 0,
        remainingCredits: 0,
        financialData: {
          totalRevenue: 0,
          totalExpenses: 0,
          monthlyRevenue: 0,
          monthlyExpenses: 0,
          netProfit: 0,
          topVendors: [],
          revenueByMonth: [],
          vatSummary: { totalVat: 0, vatByRate: [] },
          averageInvoiceValue: 0,
          largestTransaction: 0,
          documentsByType: { invoices: 0, receipts: 0, other: 0 }
        },
        trends: {
          documents: 0,
          timeSaved: 0,
          accuracy: 0,
          credits: 0,
          revenue: 0,
          expenses: 0,
          profit: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateFinancialData = (documents: any[]): FinancialData => {
    const completedDocs = documents.filter(doc => doc.status === 'completed' && doc.final_extracted_data)
    
    let totalRevenue = 0
    let totalExpenses = 0
    let totalVat = 0
    let invoiceCount = 0
    let receiptCount = 0
    let otherCount = 0
    let largestTransaction = 0
    const vendorMap = new Map()
    const monthlyData = new Map()
    const vatRates = new Map()

    completedDocs.forEach(doc => {
      const data = doc.final_extracted_data
      if (!data) return

      // Extract amount
      const amount = data.totals?.total || data.amount || 0
      const vatAmount = data.totals?.vat_amount || 0
      const vendorName = data.vendor?.name || 'Neznámý dodavatel'
      
      // Track largest transaction
      if (amount > largestTransaction) {
        largestTransaction = amount
      }

      // Determine document type and categorize
      const docType = data.document_type?.toLowerCase() || ''
      if (docType.includes('faktura') || docType.includes('invoice')) {
        totalRevenue += amount
        invoiceCount++
      } else if (docType.includes('účtenka') || docType.includes('receipt')) {
        totalExpenses += amount
        receiptCount++
      } else {
        otherCount++
      }

      totalVat += vatAmount

      // Track vendors
      if (vendorMap.has(vendorName)) {
        const vendor = vendorMap.get(vendorName)
        vendor.amount += amount
        vendor.count += 1
      } else {
        vendorMap.set(vendorName, { name: vendorName, amount, count: 1 })
      }

      // Track monthly data
      const month = new Date(doc.created_at).toLocaleDateString('cs-CZ', { month: 'short' })
      if (monthlyData.has(month)) {
        const monthly = monthlyData.get(month)
        if (docType.includes('faktura') || docType.includes('invoice')) {
          monthly.revenue += amount
        } else if (docType.includes('účtenka') || docType.includes('receipt')) {
          monthly.expenses += amount
        }
      } else {
        monthlyData.set(month, {
          month,
          revenue: (docType.includes('faktura') || docType.includes('invoice')) ? amount : 0,
          expenses: (docType.includes('účtenka') || docType.includes('receipt')) ? amount : 0
        })
      }

      // Track VAT rates
      const vatRate = data.totals?.vat_rate || 21
      if (vatRates.has(vatRate)) {
        vatRates.set(vatRate, vatRates.get(vatRate) + vatAmount)
      } else {
        vatRates.set(vatRate, vatAmount)
      }
    })

    const averageInvoiceValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0

    return {
      totalRevenue,
      totalExpenses,
      monthlyRevenue: totalRevenue, // This would need proper date filtering
      monthlyExpenses: totalExpenses, // This would need proper date filtering
      netProfit: totalRevenue - totalExpenses,
      topVendors: Array.from(vendorMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 5),
      revenueByMonth: Array.from(monthlyData.values()),
      vatSummary: {
        totalVat,
        vatByRate: Array.from(vatRates.entries()).map(([rate, amount]) => ({ rate, amount }))
      },
      averageInvoiceValue,
      largestTransaction,
      documentsByType: {
        invoices: invoiceCount,
        receipts: receiptCount,
        other: otherCount
      }
    }
  }

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatTrend = (value: number) => {
    const isPositive = value >= 0
    return {
      value: `${isPositive ? '+' : ''}${value.toFixed(1)}%`,
      isPositive,
      icon: isPositive ? ArrowUpRight : ArrowDownRight
    }
  }

  return (
    <>
      {/* Enhanced Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Basic Stats */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Zpracované dokumenty</CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.processedDocuments}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{stats.trends.documents}%
              </Badge>
              <span className="text-xs text-gray-500">tento měsíc</span>
            </div>
            <Progress value={75} className="mt-3 h-2" />
            <p className="text-xs text-gray-500 mt-1">75% z měsíčního cíle</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Celkové příjmy</CardTitle>
            <Euro className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.financialData.totalRevenue)}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{stats.trends.revenue}%
              </Badge>
              <span className="text-xs text-gray-500">vs minulý měsíc</span>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Průměr na fakturu: {formatCurrency(stats.financialData.averageInvoiceValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setAiChatOpen(true)}
          size="lg"
          className="rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          <Sparkles className="w-4 h-4 mr-1" />
          AI Finanční Asistent
        </Button>
      </div>

      {/* AI Chat Dialog */}
      <FinancialAIChat
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        financialData={stats.financialData}
        documents={[]} // Would pass actual documents here
      />
    </>
  )
}
