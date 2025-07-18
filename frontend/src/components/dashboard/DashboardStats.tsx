'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  Zap,
  ArrowUpIcon,
  ArrowDownIcon
} from 'lucide-react'

interface StatsData {
  processedDocuments: number
  timeSaved: number
  accuracy: number
  remainingCredits: number
  trends: {
    documents: number
    timeSaved: number
    accuracy: number
    credits: number
  }
}

interface DashboardStatsProps {
  userId: string
}

export function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const fetchStats = async () => {
    try {
      const [documentsRes, creditsRes] = await Promise.all([
        fetch('/api/documents/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/credits/balance', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ])

      const documentsData = await documentsRes.json()
      const creditsData = await creditsRes.json()

      setStats({
        processedDocuments: documentsData.total || 0,
        timeSaved: documentsData.timeSaved || 0,
        accuracy: documentsData.averageAccuracy || 0,
        remainingCredits: creditsData.balance || 0,
        trends: {
          documents: documentsData.trend?.documents || 0,
          timeSaved: documentsData.trend?.timeSaved || 0,
          accuracy: documentsData.trend?.accuracy || 0,
          credits: creditsData.trend || 0
        }
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Fallback to mock data for development
      setStats({
        processedDocuments: 247,
        timeSaved: 15.2,
        accuracy: 98.5,
        remainingCredits: 1250,
        trends: {
          documents: 12,
          timeSaved: 8,
          accuracy: 0.3,
          credits: -45
        }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const statItems = [
    {
      title: "Zpracované dokumenty",
      value: stats.processedDocuments.toLocaleString(),
      change: stats.trends.documents,
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      color: "blue"
    },
    {
      title: "Úspora času",
      value: `${stats.timeSaved.toFixed(1)}h`,
      change: stats.trends.timeSaved,
      icon: <Clock className="w-6 h-6 text-green-600" />,
      color: "green"
    },
    {
      title: "Přesnost OCR",
      value: `${stats.accuracy.toFixed(1)}%`,
      change: stats.trends.accuracy,
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      color: "purple"
    },
    {
      title: "Zbývající kredity",
      value: stats.remainingCredits.toLocaleString(),
      change: stats.trends.credits,
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      color: "yellow"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((stat, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gray-50 rounded-xl">
              {stat.icon}
            </div>
            <div className="flex items-center">
              {stat.change > 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
              ) : stat.change < 0 ? (
                <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
              ) : null}
              <span className={`text-sm font-medium ${
                stat.change > 0 ? 'text-green-600' : 
                stat.change < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {stat.change > 0 ? '+' : ''}{stat.change}{stat.title.includes('čas') ? 'h' : stat.title.includes('Přesnost') ? '%' : ''}
              </span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
          <p className="text-sm text-gray-600">{stat.title}</p>
        </div>
      ))}
    </div>
  )
}
