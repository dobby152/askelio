"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Plus, History, Zap } from "lucide-react"

export default function CreditsPage() {
  const creditHistory = [
    {
      id: 1,
      type: "Nákup",
      amount: "+1000",
      description: "Nákup kreditů - Pro plán",
      date: "2025-01-15",
      status: "Dokončeno"
    },
    {
      id: 2,
      type: "Spotřeba",
      amount: "-50",
      description: "Zpracování dokumentu - Faktura_2024_001.pdf",
      date: "2025-01-17",
      status: "Dokončeno"
    },
    {
      id: 3,
      type: "Spotřeba",
      amount: "-25",
      description: "Zpracování dokumentu - Smlouva_dodavatel.pdf",
      date: "2025-01-16",
      status: "Dokončeno"
    }
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Správa kreditů</h1>
            <p className="text-gray-600 dark:text-gray-400">Přehled a správa vašich kreditů</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Koupit kredity
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Aktuální stav */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span>Aktuální stav</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-600">2,450</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">zbývajících kreditů</p>
                <Progress value={49} className="w-full" />
                <p className="text-xs text-gray-500">49% z 5,000 kreditů</p>
              </div>
            </CardContent>
          </Card>

          {/* Měsíční využití */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5 text-green-600" />
                <span>Měsíční využití</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">1,550</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">spotřebováno tento měsíc</p>
                <Progress value={31} className="w-full" />
                <p className="text-xs text-gray-500">31% z měsíčního limitu</p>
              </div>
            </CardContent>
          </Card>

          {/* Průměrná spotřeba */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>Průměrná spotřeba</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-purple-600">25</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">kreditů na dokument</p>
                <p className="text-xs text-gray-500">Průměr za posledních 30 dní</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historie transakcí */}
        <Card>
          <CardHeader>
            <CardTitle>Historie transakcí</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {creditHistory.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === "Nákup" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}>
                      {transaction.type === "Nákup" ? <Plus className="w-5 h-5" /> : <History className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === "Nákup" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.amount}
                    </p>
                    <Badge variant="outline">{transaction.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
