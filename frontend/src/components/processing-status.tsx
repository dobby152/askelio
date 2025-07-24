'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Clock,
  Zap,
  Eye,
  Building2,
  FileCheck
} from 'lucide-react'

interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  message?: string
  duration?: number
}

interface ProcessingStatusProps {
  steps: ProcessingStep[]
  currentStep?: string
  className?: string
}

export function ProcessingStatus({ steps, currentStep, className }: ProcessingStatusProps) {
  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepColor = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'processing':
        return 'border-blue-200 bg-blue-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getStepBadge = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Dokončeno</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Zpracovává se...</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Chyba</Badge>
      default:
        return <Badge variant="outline">Čeká</Badge>
    }
  }

  const getStepDescription = (stepId: string) => {
    const descriptions: Record<string, string> = {
      'upload': 'Nahrávání souboru na server',
      'ocr': 'Optické rozpoznávání znaků (OCR)',
      'extraction': 'Extrakce strukturovaných dat',
      'ares': 'Validace a obohacení z ARES',
      'validation': 'Finální kontrola a validace'
    }
    return descriptions[stepId] || 'Zpracování'
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length
  const totalSteps = steps.length
  const overallProgress = (completedSteps / totalSteps) * 100

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Zpracování dokumentu</h3>
            <Badge variant="outline">
              {completedSteps}/{totalSteps} kroků
            </Badge>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="text-sm text-gray-600 mt-1">
            {overallProgress === 100 ? 'Zpracování dokončeno' : `${Math.round(overallProgress)}% dokončeno`}
          </p>
        </div>

        {/* Individual Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className={`p-4 rounded-lg border ${getStepColor(step)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStepIcon(step)}
                  <div>
                    <h4 className="font-medium">{step.name}</h4>
                    <p className="text-sm text-gray-600">{getStepDescription(step.id)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStepBadge(step)}
                  {step.duration && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {step.duration}s
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress bar for active step */}
              {step.status === 'processing' && (
                <div className="mt-3">
                  <Progress value={step.progress} className="h-1" />
                  {step.message && (
                    <p className="text-xs text-gray-600 mt-1">{step.message}</p>
                  )}
                </div>
              )}

              {/* Error message */}
              {step.status === 'error' && step.message && (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                  {step.message}
                </div>
              )}

              {/* Success message */}
              {step.status === 'completed' && step.message && (
                <p className="text-xs text-green-700 mt-1">{step.message}</p>
              )}

              {/* Connection line to next step */}
              {index < steps.length - 1 && (
                <div className="flex justify-center mt-2">
                  <div className="w-px h-4 bg-gray-300"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        {overallProgress === 100 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h4 className="font-medium text-green-800">Zpracování dokončeno</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-green-700">
                  Celkový čas: {steps.reduce((acc, step) => acc + (step.duration || 0), 0)}s
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-green-600" />
                <span className="text-green-700">Připraveno k editaci</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
