'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'

// React Query configuration optimized for Askelio
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: how long data is considered fresh
        staleTime: 5 * 60 * 1000, // 5 minutes
        
        // Cache time: how long data stays in cache after becoming unused
        gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
        
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus for critical data
        refetchOnWindowFocus: true,
        
        // Refetch on reconnect
        refetchOnReconnect: true,
        
        // Background refetch interval for real-time data
        refetchInterval: false, // Disabled by default, enabled per query as needed
      },
      mutations: {
        // Retry mutations once on network errors
        retry: (failureCount, error: any) => {
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          return failureCount < 1
        },
        
        // Mutation retry delay
        retryDelay: 1000,
      },
    },
  })
}

interface ReactQueryProviderProps {
  children: ReactNode
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Create a stable query client instance
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

// Query keys factory for consistent key management
export const queryKeys = {
  // User-related queries
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    credits: () => [...queryKeys.user.all, 'credits'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
  },
  
  // Document-related queries
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.documents.lists(), filters] as const,
    details: () => [...queryKeys.documents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
    processing: () => [...queryKeys.documents.all, 'processing'] as const,
    processingStatus: (taskId: string) => [...queryKeys.documents.processing(), taskId] as const,
  },
  
  // Dashboard and analytics
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    activities: () => [...queryKeys.dashboard.all, 'activities'] as const,
    insights: () => [...queryKeys.dashboard.all, 'insights'] as const,
    analytics: (filters: Record<string, any>) => [...queryKeys.dashboard.all, 'analytics', filters] as const,
  },
  
  // Company-related queries
  company: {
    all: ['company'] as const,
    current: () => [...queryKeys.company.all, 'current'] as const,
    users: () => [...queryKeys.company.all, 'users'] as const,
    settings: () => [...queryKeys.company.all, 'settings'] as const,
  },
  
  // System status and health
  system: {
    all: ['system'] as const,
    status: () => [...queryKeys.system.all, 'status'] as const,
    health: () => [...queryKeys.system.all, 'health'] as const,
  },
} as const

// Common query options for different data types
export const queryOptions = {
  // Real-time data that should update frequently
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  },
  
  // Static data that rarely changes
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
  },
  
  // User-specific data
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  },
  
  // Document processing status (needs frequent updates)
  processing: {
    staleTime: 1000, // 1 second
    refetchInterval: 2000, // 2 seconds
    refetchOnWindowFocus: true,
  },
  
  // Analytics data (can be slightly stale)
  analytics: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  },
} as const

// Utility function to invalidate related queries
export const invalidateQueries = {
  user: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.all })
  },
  
  documents: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.documents.all })
  },
  
  dashboard: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
  },
  
  company: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.company.all })
  },
  
  all: (queryClient: QueryClient) => {
    queryClient.invalidateQueries()
  },
} as const

// Error handling utilities
export const handleQueryError = (error: any) => {
  console.error('Query error:', error)
  
  // You can add global error handling here
  // For example, show toast notifications, redirect to login, etc.
  
  if (error?.status === 401) {
    // Handle unauthorized errors
    console.warn('Unauthorized access - redirecting to login')
    // Redirect to login or refresh token
  }
  
  if (error?.status >= 500) {
    // Handle server errors
    console.error('Server error occurred')
    // Show error notification
  }
}

// Optimistic update helpers
export const optimisticUpdates = {
  // Update document in cache optimistically
  updateDocument: (queryClient: QueryClient, documentId: string, updates: any) => {
    queryClient.setQueryData(
      queryKeys.documents.detail(documentId),
      (oldData: any) => oldData ? { ...oldData, ...updates } : undefined
    )
  },
  
  // Add document to list optimistically
  addDocument: (queryClient: QueryClient, newDocument: any) => {
    queryClient.setQueryData(
      queryKeys.documents.lists(),
      (oldData: any) => oldData ? [newDocument, ...oldData] : [newDocument]
    )
  },
  
  // Update user credits optimistically
  updateCredits: (queryClient: QueryClient, creditChange: number) => {
    queryClient.setQueryData(
      queryKeys.user.credits(),
      (oldData: any) => oldData ? { ...oldData, balance: oldData.balance + creditChange } : undefined
    )
  },
} as const

export default ReactQueryProvider
