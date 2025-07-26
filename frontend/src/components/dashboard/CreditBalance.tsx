'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  History,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { toast } from 'sonner'

interface CreditTransaction {
  id: string
  amount: number
  transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment'
  description: string
  balance_after: number
  created_at: string
}

interface CreditBalanceData {
  current_balance: number
  total_purchased: number
  total_used: number
  recent_transactions: CreditTransaction[]
}

export function CreditBalance() {
  const [creditData, setCreditData] = useState<CreditBalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCreditBalance()
    }
  }, [user])

  const fetchCreditBalance = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock data for now - replace with actual API call
      const mockData: CreditBalanceData = {
        current_balance: user?.credit_balance || 10.0,
        total_purchased: user?.total_credits_purchased || 0.0,
        total_used: user?.total_credits_used || 0.0,
        recent_transactions: [
          {
            id: '1',
            amount: -0.15,
            transaction_type: 'usage',
            description: 'Zpracování faktury - invoice_001.pdf',
            balance_after: 9.85,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            amount: 10.0,
            transaction_type: 'bonus',
            description: 'Uvítací bonus pro nové uživatele',
            balance_after: 10.0,
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      }

      setCreditData(mockData)
    } catch (err) {
      setError('Nepodařilo se načíst informace o kreditech')
      console.error('Error fetching credit balance:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseCredits = () => {
    toast.info('Nákup kreditů bude brzy dostupný!')
    // TODO: Implement credit purchase flow
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'bonus':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'usage':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'refund':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <History className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'bonus':
        return 'text-green-600'
      case 'usage':
        return 'text-red-600'
      case 'refund':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? '+' : ''
    return `${sign}${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCreditStatus = (balance: number) => {
    if (balance <= 0) return { status: 'critical', color: 'destructive', message: 'Nedostatek kreditů' }
    if (balance <= 1) return { status: 'low', color: 'warning', message: 'Nízký stav kreditů' }
    if (balance <= 5) return { status: 'medium', color: 'secondary', message: 'Střední stav kreditů' }
    return { status: 'good', color: 'default', message: 'Dostatečný stav kreditů' }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Kredity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !creditData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Kredity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{error || 'Nepodařilo se načíst data'}</span>
          </div>
          <Button 
            onClick={fetchCreditBalance} 
            variant="outline" 
            size="sm" 
            className="mt-4"
          >
            Zkusit znovu
          </Button>
        </CardContent>
      </Card>
    )
  }

  const creditStatus = getCreditStatus(creditData.current_balance)
  const usagePercentage = creditData.total_purchased > 0 
    ? (creditData.total_used / creditData.total_purchased) * 100 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Kredity
          </div>
          <Badge variant={creditStatus.color as any}>
            {creditStatus.message}
          </Badge>
        </CardTitle>
        <CardDescription>
          Aktuální stav a historie transakcí
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Balance */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">
            {creditData.current_balance.toFixed(2)} Kč
          </div>
          <p className="text-sm text-muted-foreground">
            Dostupný zůstatek
          </p>
        </div>

        {/* Usage Progress */}
        {creditData.total_purchased > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Využití kreditů</span>
              <span>{usagePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Použito: {creditData.total_used.toFixed(2)} Kč</span>
              <span>Celkem: {creditData.total_purchased.toFixed(2)} Kč</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handlePurchaseCredits} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Koupit kredity
          </Button>
          <Button variant="outline" size="icon">
            <History className="h-4 w-4" />
          </Button>
        </div>

        {/* Recent Transactions */}
        {creditData.recent_transactions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Poslední transakce</h4>
            <div className="space-y-2">
              {creditData.recent_transactions.slice(0, 3).map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                      {formatAmount(transaction.amount)} Kč
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Zůstatek: {transaction.balance_after.toFixed(2)} Kč
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
