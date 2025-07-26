'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, Users, HardDrive, Clock, 
  Loader2, RefreshCw, AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface RealtimeMetricsData {
  documents_today: number
  pending_approvals: number
  active_users: number
  storage_used_gb: number
  last_updated: string
}

interface RealtimeMetricsProps {
  companyId: string
  refreshInterval?: number // in seconds, default 30
}

export default function RealtimeMetrics({ companyId, refreshInterval = 30 }: RealtimeMetricsProps) {
  const [metrics, setMetrics] = useState<RealtimeMetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadMetrics()
    
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [companyId, refreshInterval, autoRefresh])

  const loadMetrics = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/analytics/companies/${companyId}/realtime`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setMetrics(result.data)
        setLastRefresh(new Date())
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Nepodařilo se načíst metriky')
      }
    } catch (error) {
      console.error('Error loading realtime metrics:', error)
      setError('Chyba při načítání metrik')
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = () => {
    setLoading(true)
    loadMetrics()
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
    if (!autoRefresh) {
      toast.success('Automatické obnovování zapnuto')
    } else {
      toast.success('Automatické obnovování vypnuto')
    }
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real-time metriky</h2>
          <p className="text-muted-foreground">
            Aktuální stav vaší firmy
            {lastRefresh && (
              <span className="ml-2">
                • Poslední aktualizace: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAutoRefresh}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Obnovit
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dokumenty dnes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.documents_today || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Nové dokumenty za dnešek
            </p>
          </CardContent>
          {loading && (
            <div className="absolute top-2 right-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            </div>
          )}
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Čekající schválení</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.pending_approvals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Dokumenty čekající na schválení
            </p>
            {(metrics?.pending_approvals || 0) > 0 && (
              <Badge variant="destructive" className="mt-2">
                Vyžaduje pozornost
              </Badge>
            )}
          </CardContent>
          {loading && (
            <div className="absolute top-2 right-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            </div>
          )}
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivní uživatelé</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.active_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Uživatelé s přístupem
            </p>
          </CardContent>
          {loading && (
            <div className="absolute top-2 right-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            </div>
          )}
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Využité úložiště</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.storage_used_gb?.toFixed(2) || '0.00'} GB
            </div>
            <p className="text-xs text-muted-foreground">
              Celkové využití úložiště
            </p>
            {(metrics?.storage_used_gb || 0) > 10 && (
              <Badge variant="secondary" className="mt-2">
                Vysoké využití
              </Badge>
            )}
          </CardContent>
          {loading && (
            <div className="absolute top-2 right-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            </div>
          )}
        </Card>
      </div>

      {/* Status indicators */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`} />
            <span>{error ? 'Chyba připojení' : 'Připojeno'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
          </div>
        </div>
        <div>
          Obnovování každých {refreshInterval}s
        </div>
      </div>
    </div>
  )
}
