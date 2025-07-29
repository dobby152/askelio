"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowUpRight, ArrowDownLeft, HelpCircle, AlertTriangle } from "lucide-react"

interface InvoiceDirectionBadgeProps {
  direction: 'incoming' | 'outgoing' | 'unknown'
  confidence?: number
  requiresManualReview?: boolean
  className?: string
}

export function InvoiceDirectionBadge({ 
  direction, 
  confidence, 
  requiresManualReview = false,
  className = "" 
}: InvoiceDirectionBadgeProps) {
  const getDirectionInfo = () => {
    switch (direction) {
      case 'incoming':
        return {
          label: 'Příchozí',
          description: 'Přijatá faktura (výdaj)',
          icon: ArrowDownLeft,
          variant: 'destructive' as const,
          color: 'text-red-600'
        }
      case 'outgoing':
        return {
          label: 'Odchozí',
          description: 'Odeslaná faktura (příjem)',
          icon: ArrowUpRight,
          variant: 'default' as const,
          color: 'text-green-600'
        }
      case 'unknown':
      default:
        return {
          label: 'Neznámý',
          description: 'Směr faktury nebyl rozpoznán',
          icon: HelpCircle,
          variant: 'secondary' as const,
          color: 'text-gray-600'
        }
    }
  }

  const directionInfo = getDirectionInfo()
  const Icon = directionInfo.icon

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600'
    if (conf >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatConfidence = (conf: number) => {
    return `${Math.round(conf * 100)}%`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 ${className}`}>
            <Badge variant={directionInfo.variant} className="flex items-center gap-1">
              <Icon className="w-3 h-3" />
              {directionInfo.label}
              {requiresManualReview && (
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
              )}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p className="font-medium">{directionInfo.description}</p>
            {confidence !== undefined && (
              <p className="text-sm">
                Spolehlivost: <span className={getConfidenceColor(confidence)}>
                  {formatConfidence(confidence)}
                </span>
              </p>
            )}
            {requiresManualReview && (
              <p className="text-sm text-yellow-600">
                ⚠️ Vyžaduje manuální kontrolu
              </p>
            )}
            <div className="text-xs text-muted-foreground">
              {direction === 'incoming' && '📥 Tato faktura představuje výdaj'}
              {direction === 'outgoing' && '📤 Tato faktura představuje příjem'}
              {direction === 'unknown' && '❓ Směr faktury nebyl automaticky rozpoznán'}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface FinancialCategoryBadgeProps {
  category: 'revenue' | 'expense' | 'unknown'
  amount?: number
  currency?: string
  className?: string
}

export function FinancialCategoryBadge({ 
  category, 
  amount, 
  currency = 'CZK',
  className = "" 
}: FinancialCategoryBadgeProps) {
  const getCategoryInfo = () => {
    switch (category) {
      case 'revenue':
        return {
          label: 'Příjem',
          description: 'Tržby z prodeje',
          variant: 'default' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        }
      case 'expense':
        return {
          label: 'Výdaj',
          description: 'Náklady na nákup',
          variant: 'destructive' as const,
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        }
      case 'unknown':
      default:
        return {
          label: 'Neznámý',
          description: 'Kategorie nebyla určena',
          variant: 'secondary' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        }
    }
  }

  const categoryInfo = getCategoryInfo()

  const formatAmount = (amt: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency
    }).format(amt)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-2 ${className}`}>
            <Badge variant={categoryInfo.variant}>
              {categoryInfo.label}
            </Badge>
            {amount !== undefined && (
              <span className={`text-sm font-medium ${categoryInfo.color}`}>
                {formatAmount(amount)}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{categoryInfo.description}</p>
            {amount !== undefined && (
              <p className="text-sm">
                Částka: {formatAmount(amount)}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface DirectionConfidenceIndicatorProps {
  confidence: number
  method?: string
  className?: string
}

export function DirectionConfidenceIndicator({ 
  confidence, 
  method,
  className = "" 
}: DirectionConfidenceIndicatorProps) {
  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.9) return { level: 'Velmi vysoká', color: 'bg-green-500', textColor: 'text-green-700' }
    if (conf >= 0.8) return { level: 'Vysoká', color: 'bg-green-400', textColor: 'text-green-600' }
    if (conf >= 0.6) return { level: 'Střední', color: 'bg-yellow-400', textColor: 'text-yellow-700' }
    if (conf >= 0.4) return { level: 'Nízká', color: 'bg-orange-400', textColor: 'text-orange-700' }
    return { level: 'Velmi nízká', color: 'bg-red-400', textColor: 'text-red-700' }
  }

  const confidenceInfo = getConfidenceLevel(confidence)
  const percentage = Math.round(confidence * 100)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-2 ${className}`}>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: confidenceInfo.color.replace('bg-', '') }} />
              <span className={`text-xs ${confidenceInfo.textColor}`}>
                {percentage}%
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Spolehlivost rozpoznání: {confidenceInfo.level}</p>
            <p className="text-sm">Přesnost: {percentage}%</p>
            {method && (
              <p className="text-xs text-muted-foreground">
                Metoda: {method}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
