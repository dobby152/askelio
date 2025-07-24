'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfidenceIndicatorProps {
  confidence: number
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
  showIcon?: boolean
  showTooltip?: boolean
  className?: string
}

export function ConfidenceIndicator({
  confidence,
  size = 'md',
  showProgress = false,
  showIcon = true,
  showTooltip = true,
  className
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100)
  
  const getConfidenceLevel = () => {
    if (confidence >= 0.9) return 'high'
    if (confidence >= 0.7) return 'medium'
    return 'low'
  }

  const getConfidenceColor = () => {
    const level = getConfidenceLevel()
    switch (level) {
      case 'high':
        return 'text-green-700 bg-green-100 border-green-300'
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300'
      case 'low':
        return 'text-red-700 bg-red-100 border-red-300'
    }
  }

  const getConfidenceIcon = () => {
    const level = getConfidenceLevel()
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
    
    switch (level) {
      case 'high':
        return <CheckCircle className={cn(iconSize, 'text-green-600')} />
      case 'medium':
        return <AlertTriangle className={cn(iconSize, 'text-yellow-600')} />
      case 'low':
        return <AlertCircle className={cn(iconSize, 'text-red-600')} />
    }
  }

  const getConfidenceText = () => {
    const level = getConfidenceLevel()
    switch (level) {
      case 'high':
        return 'Vysoká přesnost'
      case 'medium':
        return 'Střední přesnost'
      case 'low':
        return 'Nízká přesnost'
    }
  }

  const getConfidenceDescription = () => {
    const level = getConfidenceLevel()
    switch (level) {
      case 'high':
        return 'Extrahovaná data jsou velmi spolehlivá a pravděpodobně správná.'
      case 'medium':
        return 'Extrahovaná data jsou relativně spolehlivá, ale doporučujeme kontrolu.'
      case 'low':
        return 'Extrahovaná data mohou být nepřesná. Důrazně doporučujeme manuální kontrolu.'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-1.5 py-0.5'
      case 'lg':
        return 'text-base px-3 py-1.5'
      default:
        return 'text-sm px-2 py-1'
    }
  }

  const indicator = (
    <div className={cn('inline-flex items-center space-x-1', className)}>
      {showIcon && getConfidenceIcon()}
      <Badge className={cn(getConfidenceColor(), getSizeClasses())}>
        {percentage}%
      </Badge>
      {showProgress && (
        <div className="w-16">
          <Progress 
            value={percentage} 
            className={cn(
              'h-1.5',
              size === 'sm' && 'h-1',
              size === 'lg' && 'h-2'
            )}
          />
        </div>
      )}
    </div>
  )

  if (!showTooltip) {
    return indicator
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {getConfidenceIcon()}
              <span className="font-medium">{getConfidenceText()}</span>
            </div>
            <p className="text-xs text-gray-600">
              {getConfidenceDescription()}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span>Confidence:</span>
              <span className="font-mono">{confidence.toFixed(3)}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Utility component for displaying multiple confidence indicators
interface ConfidenceStatsProps {
  confidences: number[]
  className?: string
}

export function ConfidenceStats({ confidences, className }: ConfidenceStatsProps) {
  if (confidences.length === 0) return null

  const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
  const high = confidences.filter(c => c >= 0.9).length
  const medium = confidences.filter(c => c >= 0.7 && c < 0.9).length
  const low = confidences.filter(c => c < 0.7).length

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Celková přesnost</span>
        <ConfidenceIndicator confidence={average} size="sm" />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="font-semibold text-green-700">{high}</div>
          <div className="text-green-600">Vysoká</div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded">
          <div className="font-semibold text-yellow-700">{medium}</div>
          <div className="text-yellow-600">Střední</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <div className="font-semibold text-red-700">{low}</div>
          <div className="text-red-600">Nízká</div>
        </div>
      </div>
    </div>
  )
}
