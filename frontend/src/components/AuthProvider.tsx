// Auth Provider component with backend API authentication
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { apiClient, AuthData } from '@/lib/api-client'
import { secureLogger } from '@/lib/secure-logger'

interface User {
  id: string
  email: string
  full_name?: string
  credit_balance: number
  subscription_tier: string
  subscription_expires_at?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  session: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  resetPassword: async () => ({ success: false }),
  updateProfile: async () => ({ success: false })
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const response = await apiClient.getUserProfile()
          if (response.success && response.data) {
            setUser(response.data)
          } else {
            // Only logout on authentication errors (401), not on server errors (500, 503, etc.)
            if (response.error === 'authentication_required' ||
                response.error === 'invalid_token' ||
                response.error === 'token_expired') {
              secureLogger.authEvent('Authentication failed, logging out', { error: response.error })
              await apiClient.logout()
            } else {
              // For other errors (server errors, network issues), keep user logged in
              secureLogger.warn('API error but keeping user logged in', { error: response.error, message: response.message })
              // Try to get user from stored token payload if available
              const storedUser = apiClient.getStoredUserData()
              if (storedUser) {
                setUser(storedUser)
              }
            }
          }
        }
      } catch (error) {
        secureLogger.error('Error checking auth', error)
        // Don't logout on network errors or unexpected exceptions
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)

      const response = await apiClient.login(email, password)

      if (!response.success) {
        return { success: false, error: response.message }
      }

      if (response.data?.user) {
        setUser(response.data.user)
        toast.success('Úspěšně přihlášen!')
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Neočekávaná chyba'
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true)

      const response = await apiClient.register(email, password, fullName)

      if (!response.success) {
        return { success: false, error: response.message }
      }

      if (response.data?.session) {
        setUser(response.data.user)
        toast.success('Účet byl úspěšně vytvořen!')
      } else {
        toast.success('Registrace úspěšná! Zkontrolujte svůj email pro potvrzení.')
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Neočekávaná chyba'
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)

      const response = await apiClient.logout()

      if (!response.success) {
        console.error('Error signing out:', response.error)
        toast.error('Chyba při odhlašování')
        return
      }

      setUser(null)
      toast.success('Úspěšně odhlášen')
    } catch (error) {
      console.error('Error in signOut:', error)
      toast.error('Chyba při odhlašování')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const response = await apiClient.resetPassword(email)

      if (!response.success) {
        return { success: false, error: response.message }
      }

      toast.success('Email pro obnovení hesla byl odeslán!')
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Neočekávaná chyba'
      return { success: false, error: message }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Export functions for backward compatibility
export const signIn = async (email: string, password: string) => {
  return apiClient.login(email, password)
}

export const signUp = async (email: string, password: string, fullName?: string) => {
  return apiClient.register(email, password, fullName)
}
