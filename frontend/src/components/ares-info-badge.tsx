"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Building2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AresInfoBadgeProps {
  enriched?: boolean
  active?: boolean
  vatPayer?: boolean
  enrichmentData?: {
    enriched_at: string
    notes: string[]
    success: boolean
    error?: string
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AresInfoBadge({ 
  enriched = false, 
  active = true, 
  vatPayer = false, 
  enrichmentData,
  className,
  size = 'sm'
}: AresInfoBadgeProps) {
  if (!enriched && !enrichmentData) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  const getBadgeVariant = () => {
    if (enrichmentData?.error) return 'destructive'
    if (enriched || enrichmentData?.success) return 'default'
    return 'secondary'
  }

  const getBadgeContent = () => {
    if (enrichmentData?.error) {
      return (
        <>
          <AlertCircle className={cn(iconSizes[size], "mr-1")} />
          ARES Chyba
        </>
      )
    }
    
    if (enriched || enrichmentData?.success) {
      return (
        <>
          <Building2 className={cn(iconSizes[size], "mr-1")} />
          ARES
          {active && <CheckCircle className={cn(iconSizes[size], "ml-1 text-green-500")} />}
        </>
      )
    }

    return (
      <>
        <Clock className={cn(iconSizes[size], "mr-1")} />
        ARES Zpracovává
      </>
    )
  }

  const getTooltipContent = () => {
    if (enrichmentData?.error) {
      return (
        <div className="space-y-2">
          <div className="font-semibold text-red-400">ARES Chyba</div>
          <div className="text-sm">{enrichmentData.error}</div>
          {enrichmentData.enriched_at && (
            <div className="text-xs text-gray-400">
              Pokus: {new Date(enrichmentData.enriched_at).toLocaleString('cs-CZ')}
            </div>
          )}
        </div>
      )
    }

    if (enriched || enrichmentData?.success) {
      return (
        <div className="space-y-2">
          <div className="font-semibold text-blue-400">ARES Obohacení</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3 text-green-400" />
              <span>Údaje doplněny z ARES</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                "h-2 w-2 rounded-full",
                active ? "bg-green-400" : "bg-red-400"
              )} />
              <span>Společnost {active ? 'aktivní' : 'neaktivní'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                "h-2 w-2 rounded-full",
                vatPayer ? "bg-blue-400" : "bg-gray-400"
              )} />
              <span>{vatPayer ? 'Plátce DPH' : 'Neplátce DPH'}</span>
            </div>
          </div>
          
          {enrichmentData?.notes && enrichmentData.notes.length > 0 && (
            <div className="border-t border-gray-600 pt-2">
              <div className="text-xs font-medium text-gray-300 mb-1">Doplněné údaje:</div>
              <ul className="text-xs text-gray-400 space-y-0.5">
                {enrichmentData.notes.map((note, index) => (
                  <li key={index}>• {note.replace(/^✅\s*/, '')}</li>
                ))}
              </ul>
            </div>
          )}
          
          {enrichmentData?.enriched_at && (
            <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
              Obohaceno: {new Date(enrichmentData.enriched_at).toLocaleString('cs-CZ')}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="font-semibold text-yellow-400">ARES Zpracování</div>
        <div className="text-sm">Údaje se zpracovávají...</div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={getBadgeVariant()}
            className={cn(
              sizeClasses[size],
              "cursor-help transition-all hover:scale-105",
              className
            )}
          >
            {getBadgeContent()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs bg-gray-900 border-gray-700 text-white"
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Utility component for displaying ARES status in lists
export function AresStatusIndicator({ 
  enriched, 
  active, 
  vatPayer,
  className 
}: {
  enriched?: boolean
  active?: boolean
  vatPayer?: boolean
  className?: string
}) {
  if (!enriched) return null

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Building2 className="h-3 w-3 text-blue-500" />
      {active && <CheckCircle className="h-3 w-3 text-green-500" />}
      {vatPayer && <div className="h-2 w-2 rounded-full bg-blue-400" />}
    </div>
  )
}
