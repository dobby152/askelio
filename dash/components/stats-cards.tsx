"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, Target, CreditCard, TrendingUp, TrendingDown } from "lucide-react"
// Přidaj import pro ExportDialog
import { ExportDialog } from "@/components/export-dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

const stats = [
  {
    title: "Zpracované dokumenty",
    value: "2,847",
    change: "+12.5%",
    trend: "up",
    icon: FileText,
    description: "Tento měsíc",
  },
  {
    title: "Úspora času",
    value: "156.2h",
    change: "+8.1%",
    trend: "up",
    icon: Clock,
    description: "Celkem ušetřeno",
  },
  {
    title: "Přesnost OCR",
    value: "98.7%",
    change: "+0.3%",
    trend: "up",
    icon: Target,
    description: "Průměrná přesnost",
  },
  {
    title: "Zbývající kredity",
    value: "2,450",
    change: "-15.2%",
    trend: "down",
    icon: CreditCard,
    description: "Z 5,000 kreditů",
  },
]

export function StatsCards() {
  return (
    <>
      {/* statistic cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={stat.trend === "up" ? "default" : "destructive"} className="text-xs">
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* floating quick-export button */}
      <div className="fixed bottom-6 right-6 z-50">
        <ExportDialog
          data={{
            statistics: {
              processedDocuments: 2847,
              timeSaved: 156.2,
              accuracy: 98.7,
              remainingCredits: 2450,
            },
          }}
          trigger={
            <Button size="lg" className="rounded-full shadow-lg">
              <Download className="w-5 h-5 mr-2" />
              Rychlý export
            </Button>
          }
        />
      </div>
    </>
  )
}
