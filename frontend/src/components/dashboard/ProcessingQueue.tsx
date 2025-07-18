'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Loader2,
  Pause,
  Play,
  X
} from 'lucide-react'

interface QueueItem {
  id: string
  file_name: string
  status: 'queued' | 'processing' | 'completed' | 'error' | 'paused'
  progress: number
  estimated_time?: number
  error_message?: string
  created_at: string
}

interface ProcessingQueueProps {
  userId: string
  onQueueUpdate?: (queue: QueueItem[]) => void
}

export function ProcessingQueue({ userId, onQueueUpdate }: ProcessingQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQueue()
    // Real-time updates every 5 seconds
    const interval = setInterval(fetchQueue, 5000)
    return () => clearInterval(interval)
  }, [userId])

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/documents/queue', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setQueue(data)
        if (onQueueUpdate) {
          onQueueUpdate(data)
        }
      } else {
        // Mock data for development
        const mockQueue: QueueItem[] = [
          {
            id: '1',
            file_name: 'Faktura_ABC_2025.pdf',
            status: 'processing',
            progress: 75,
            estimated_time: 45,
            created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            file_name: 'Receipt_Store_XY.jpg',
            status: 'queued',
            progress: 0,
            estimated_time: 120,
            created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            file_name: 'Invoice_Supplier_Z.pdf',
            status: 'queued',
            progress: 0,
            estimated_time: 90,
            created_at: new Date().toISOString()
          }
        ]
        setQueue(mockQueue)
        if (onQueueUpdate) {
          onQueueUpdate(mockQueue)
        }
      }
    } catch (error) {
      console.error('Error fetching queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const pauseProcessing = async (itemId: string) => {
    try {
      await fetch(`/api/documents/${itemId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      fetchQueue()
    } catch (error) {
      console.error('Error pausing processing:', error)
    }
  }

  const resumeProcessing = async (itemId: string) => {
    try {
      await fetch(`/api/documents/${itemId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      fetchQueue()
    } catch (error) {
      console.error('Error resuming processing:', error)
    }
  }

  const cancelProcessing = async (itemId: string) => {
    try {
      await fetch(`/api/documents/${itemId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      fetchQueue()
    } catch (error) {
      console.error('Error canceling processing:', error)
    }
  }

  const formatEstimatedTime = (seconds?: number) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'paused':
        return <Pause className="w-4 h-4 text-gray-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Zpracovává se'
      case 'queued':
        return 'Ve frontě'
      case 'completed':
        return 'Dokončeno'
      case 'error':
        return 'Chyba'
      case 'paused':
        return 'Pozastaveno'
      default:
        return 'Neznámý'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-blue-600'
      case 'queued':
        return 'text-yellow-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'paused':
        return 'text-gray-600'
      default:
        return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <Clock className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Fronta zpracování</h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="w-32 h-4 bg-gray-200 rounded"></div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Clock className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Fronta zpracování</h2>
        </div>
        <span className="text-sm text-gray-500">
          {queue.filter(item => item.status === 'processing' || item.status === 'queued').length} aktivních
        </span>
      </div>

      <div className="space-y-4">
        {queue.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Žádné dokumenty se momentálně nezpracovávají</p>
          </div>
        ) : (
          queue.map((item) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900 truncate max-w-xs">{item.file_name}</h3>
                    <div className="flex items-center mt-1">
                      {getStatusIcon(item.status)}
                      <span className={`text-sm ml-1 ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.status === 'processing' && (
                    <button
                      onClick={() => pauseProcessing(item.id)}
                      className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                      title="Pozastavit"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  
                  {item.status === 'paused' && (
                    <button
                      onClick={() => resumeProcessing(item.id)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Pokračovat"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  
                  {(item.status === 'queued' || item.status === 'paused') && (
                    <button
                      onClick={() => cancelProcessing(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Zrušit"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  
                  <span className="text-sm text-gray-500">
                    {formatEstimatedTime(item.estimated_time)}
                  </span>
                </div>
              </div>
              
              {item.status === 'processing' && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              )}
              
              {item.status === 'processing' && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{item.progress}% dokončeno</span>
                  <span>Zbývá ~{formatEstimatedTime(item.estimated_time)}</span>
                </div>
              )}
              
              {item.error_message && (
                <p className="text-sm text-red-600 mt-2">{item.error_message}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
