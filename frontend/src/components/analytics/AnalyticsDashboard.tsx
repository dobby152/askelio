'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts'
import { 
  TrendingUp, TrendingDown, FileText, Users, HardDrive, Clock,
  CheckCircle, XCircle, Download, Calendar as CalendarIcon, BarChart3, Loader2, AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { DateRange } from 'react-day-picker'
import { addDays, format } from 'date-fns'

interface AnalyticsData {
  overview: {
    total_documents: number
    documents_this_period: number
    total_approvals: number
    pending_approvals: number
    active_users: number
    total_storage_gb: number
    avg_approval_time_hours: number
  }
  documents: {
    by_type: Array<{
      document_type: string
      count: number
      avg_amount: number
    }>
    timeline: Array<{
      date: string
      count: number
      total_amount: number
    }>
    top_suppliers: Array<{
      supplier_name: string
      document_count: number
      total_amount: number
    }>
  }
  approvals: {
    status_distribution: Array<{
      status: string
      count: number
      avg_time_hours: number
    }>
    approver_performance: Array<{
      approver_name: string
      approver_email: string
      total_approvals: number
      approved_count: number
      rejected_count: number
      avg_response_time_hours: number
    }>
    timeline: Array<{
      date: string
      total_created: number
      approved: number
      rejected: number
      pending: number
    }>
  }
  users: {
    user_activity: Array<{
      user_name: string
      user_email: string
      role: string
      documents_uploaded: number
      approvals_made: number
      last_document_upload: string
      last_approval_action: string
    }>
    role_distribution: Array<{
      role: string
      user_count: number
    }>
  }
  storage: {
    by_type: Array<{
      document_type: string
      file_count: number
      total_gb: number
      avg_file_size_mb: number
      max_file_size_mb: number
    }>
    growth_timeline: Array<{
      date: string
      daily_gb_added: number
      files_added: number
    }>
  }
  trends: Record<string, {
    current: number
    previous: number
    change_percent: number
    trend: 'up' | 'down' | 'stable'
  }>
}

interface AnalyticsDashboardProps {
  companyId: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AnalyticsDashboard({ companyId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  })
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')

  useEffect(() => {
    loadAnalytics()
  }, [companyId, dateRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange?.from) {
        params.append('start_date', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        params.append('end_date', dateRange.to.toISOString())
      }

      const response = await fetch(`/api/analytics/companies/${companyId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setAnalytics(result.data)
      } else {
        toast.error('Nepodařilo se načíst analytická data')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Chyba při načítání analytických dat')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      params.append('format', exportFormat)
      if (dateRange?.from) {
        params.append('start_date', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        params.append('end_date', dateRange.to.toISOString())
      }

      const response = await fetch(`/api/analytics/companies/${companyId}/export?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        
        if (exportFormat === 'csv') {
          // Download CSV file
          const blob = new Blob([result.data], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = result.filename || 'analytics_export.csv'
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          // Download JSON file
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'analytics_export.json'
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
        
        toast.success('Export byl úspěšně stažen')
      } else {
        toast.error('Nepodařilo se exportovat data')
      }
    } catch (error) {
      console.error('Error exporting analytics:', error)
      toast.error('Chyba při exportu dat')
    } finally {
      setExporting(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nepodařilo se načíst analytická data
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analýzy a statistiky</h1>
          <p className="text-muted-foreground">
            Přehled výkonnosti a trendů vaší firmy
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Vyberte období</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportuji...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dokumenty</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.total_documents}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(analytics.trends.total_documents?.trend || 'stable')}
              <span className={`ml-1 ${getTrendColor(analytics.trends.total_documents?.trend || 'stable')}`}>
                {analytics.trends.total_documents?.change_percent || 0}% od minulého období
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivní uživatelé</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.active_users}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(analytics.trends.active_users?.trend || 'stable')}
              <span className={`ml-1 ${getTrendColor(analytics.trends.active_users?.trend || 'stable')}`}>
                {analytics.trends.active_users?.change_percent || 0}% od minulého období
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Úložiště</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.total_storage_gb} GB</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(analytics.trends.total_storage_gb?.trend || 'stable')}
              <span className={`ml-1 ${getTrendColor(analytics.trends.total_storage_gb?.trend || 'stable')}`}>
                {analytics.trends.total_storage_gb?.change_percent || 0}% od minulého období
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Čekající schválení</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.pending_approvals}</div>
            <div className="text-xs text-muted-foreground">
              Průměrný čas: {analytics.overview.avg_approval_time_hours}h
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Dokumenty</TabsTrigger>
          <TabsTrigger value="approvals">Schvalování</TabsTrigger>
          <TabsTrigger value="users">Uživatelé</TabsTrigger>
          <TabsTrigger value="storage">Úložiště</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Dokumenty podle typu</CardTitle>
                <CardDescription>Rozložení dokumentů podle jejich typu</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.documents.by_type}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ document_type, count }) => `${document_type}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.documents.by_type.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Časová osa dokumentů</CardTitle>
                <CardDescription>Počet dokumentů v čase</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.documents.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd.MM.yyyy')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top dodavatelé</CardTitle>
              <CardDescription>Dodavatelé s nejvyšším objemem dokumentů</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.documents.top_suppliers.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="supplier_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Status schválení</CardTitle>
                <CardDescription>Rozložení podle statusu schválení</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.approvals.status_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.approvals.status_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Časová osa schvalování</CardTitle>
                <CardDescription>Vývoj schvalování v čase</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.approvals.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd.MM.yyyy')}
                    />
                    <Line type="monotone" dataKey="approved" stroke="#00C49F" name="Schváleno" />
                    <Line type="monotone" dataKey="rejected" stroke="#FF8042" name="Zamítnuto" />
                    <Line type="monotone" dataKey="pending" stroke="#FFBB28" name="Čeká" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Výkonnost schvalovatelů</CardTitle>
              <CardDescription>Statistiky jednotlivých schvalovatelů</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.approvals.approver_performance.map((approver, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{approver.approver_name}</div>
                      <div className="text-sm text-muted-foreground">{approver.approver_email}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{approver.total_approvals}</div>
                        <div className="text-xs text-muted-foreground">Celkem</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{approver.approved_count}</div>
                        <div className="text-xs text-muted-foreground">Schváleno</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{approver.rejected_count}</div>
                        <div className="text-xs text-muted-foreground">Zamítnuto</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{approver.avg_response_time_hours.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground">Průměrný čas</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Rozložení rolí</CardTitle>
                <CardDescription>Počet uživatelů podle rolí</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.users.role_distribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="user_count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktivita uživatelů</CardTitle>
                <CardDescription>Nejaktivnější uživatelé</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.users.user_activity.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{user.user_name}</div>
                        <div className="text-sm text-muted-foreground">{user.role}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {user.documents_uploaded} dokumentů
                        </Badge>
                        <Badge variant="outline">
                          {user.approvals_made} schválení
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Úložiště podle typu</CardTitle>
                <CardDescription>Využití úložiště podle typu dokumentů</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.storage.by_type}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="document_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_gb" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Růst úložiště</CardTitle>
                <CardDescription>Denní přírůstek dat</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.storage.growth_timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd.MM.yyyy')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="daily_gb_added" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
