"use client"

import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Calendar,
  Plus,
  Settings,
  Save,
  Trash2,
  Edit,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Brain,
  Zap,
  Target,
  Lightbulb
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { dashboardAPI } from "@/lib/dashboard-api"

// Widget types
export interface Widget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'ai-insight' | 'forecast'
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: WidgetConfig
  data?: any
  aiEnabled?: boolean
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area'
  dataSource?: string
  timeRange?: string
  filters?: Record<string, any>
  metrics?: string[]
  aiAnalysis?: boolean
  forecastPeriod?: number
}

// Predefined widget templates
const WIDGET_TEMPLATES = [
  {
    id: 'revenue-trend',
    type: 'chart' as const,
    title: 'Trendy příjmů',
    icon: TrendingUp,
    description: 'Vývoj příjmů v čase s AI predikcí',
    defaultConfig: {
      chartType: 'line',
      dataSource: 'revenue',
      timeRange: '6months',
      aiAnalysis: true,
      forecastPeriod: 30
    }
  },
  {
    id: 'expense-breakdown',
    type: 'chart' as const,
    title: 'Rozložení výdajů',
    icon: PieChart,
    description: 'Kategorie výdajů s AI doporučeními',
    defaultConfig: {
      chartType: 'pie',
      dataSource: 'expenses',
      timeRange: '3months',
      aiAnalysis: true
    }
  },
  {
    id: 'cash-flow',
    type: 'chart' as const,
    title: 'Cash Flow',
    icon: BarChart3,
    description: 'Příjmy vs výdaje s trendy',
    defaultConfig: {
      chartType: 'bar',
      dataSource: 'cashflow',
      timeRange: '12months',
      aiAnalysis: true
    }
  },
  {
    id: 'ai-insights',
    type: 'ai-insight' as const,
    title: 'AI Doporučení',
    icon: Brain,
    description: 'Personalizovaná AI doporučení',
    defaultConfig: {
      aiAnalysis: true,
      metrics: ['revenue', 'expenses', 'profit']
    }
  },
  {
    id: 'forecast',
    type: 'forecast' as const,
    title: 'Predikce',
    icon: Target,
    description: 'AI predikce budoucích trendů',
    defaultConfig: {
      forecastPeriod: 90,
      aiAnalysis: true,
      dataSource: 'revenue'
    }
  },
  {
    id: 'key-metrics',
    type: 'metric' as const,
    title: 'Klíčové metriky',
    icon: DollarSign,
    description: 'Přehled hlavních finančních ukazatelů',
    defaultConfig: {
      metrics: ['totalRevenue', 'totalExpenses', 'profit', 'profitMargin']
    }
  }
]

interface WidgetBuilderProps {
  widgets: Widget[]
  onWidgetsChange: (widgets: Widget[]) => void
  onSaveDashboard: (name: string, widgets: Widget[]) => void
}

export function WidgetBuilder({ widgets, onWidgetsChange, onSaveDashboard }: WidgetBuilderProps) {
  const [isAddingWidget, setIsAddingWidget] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null)
  const [dashboardName, setDashboardName] = useState('')
  const [timeRange, setTimeRange] = useState('3months')
  const [aiEnabled, setAiEnabled] = useState(true)

  // Add new widget from template
  const addWidget = (templateId: string) => {
    const template = WIDGET_TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: template.type,
      title: template.title,
      position: { x: 0, y: 0, w: 6, h: 4 },
      config: { ...template.defaultConfig },
      aiEnabled: template.defaultConfig.aiAnalysis || false
    }

    onWidgetsChange([...widgets, newWidget])
    setIsAddingWidget(false)
    toast.success(`Widget "${template.title}" byl přidán`)
  }

  // Remove widget
  const removeWidget = (widgetId: string) => {
    onWidgetsChange(widgets.filter(w => w.id !== widgetId))
    toast.success('Widget byl odstraněn')
  }

  // Update widget configuration
  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    onWidgetsChange(widgets.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ))
  }

  // Save dashboard template
  const saveDashboard = () => {
    if (!dashboardName.trim()) {
      toast.error('Zadejte název dashboardu')
      return
    }
    
    onSaveDashboard(dashboardName, widgets)
    toast.success(`Dashboard "${dashboardName}" byl uložen`)
    setDashboardName('')
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Nastavení dashboardu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Časové období</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Poslední měsíc</SelectItem>
                  <SelectItem value="3months">Poslední 3 měsíce</SelectItem>
                  <SelectItem value="6months">Poslední 6 měsíců</SelectItem>
                  <SelectItem value="12months">Poslední rok</SelectItem>
                  <SelectItem value="custom">Vlastní období</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>AI analýzy</Label>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={aiEnabled} 
                  onCheckedChange={setAiEnabled}
                />
                <span className="text-sm">Povolit AI doporučení</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Uložit jako šablonu</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Název dashboardu"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                />
                <Button onClick={saveDashboard} size="sm">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Přidat widget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WIDGET_TEMPLATES.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addWidget(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <template.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{template.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.description}
                      </p>
                      {template.defaultConfig.aiAnalysis && (
                        <Badge variant="secondary" className="mt-2">
                          <Brain className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Widgets */}
      {widgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aktuální widgety ({widgets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      {widget.type === 'chart' && <BarChart3 className="h-4 w-4" />}
                      {widget.type === 'metric' && <DollarSign className="h-4 w-4" />}
                      {widget.type === 'ai-insight' && <Brain className="h-4 w-4" />}
                      {widget.type === 'forecast' && <Target className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{widget.title}</h4>
                      <p className="text-sm text-gray-600">
                        {widget.type} • {widget.config.timeRange || 'Výchozí období'}
                      </p>
                    </div>
                    {widget.aiEnabled && (
                      <Badge variant="secondary">
                        <Brain className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingWidget(widget)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeWidget(widget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
