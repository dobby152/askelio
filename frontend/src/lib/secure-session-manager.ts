// Secure Session Manager - Fixes anonymous window persistence issue
'use client'

interface SessionData {
  access_token: string
  refresh_token: string
  expires_at: number
  user_data?: any
}

class SecureSessionManager {
  private static instance: SecureSessionManager
  private isPrivateMode: boolean | null = null
  private sessionId: string

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.detectPrivateMode()
  }

  static getInstance(): SecureSessionManager {
    if (!SecureSessionManager.instance) {
      SecureSessionManager.instance = new SecureSessionManager()
    }
    return SecureSessionManager.instance
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async detectPrivateMode(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    if (this.isPrivateMode !== null) {
      return this.isPrivateMode
    }

    try {
      // Test for private mode by trying to use localStorage
      const testKey = '__private_mode_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      
      // Additional checks for different browsers
      const isPrivate = (
        // Firefox private mode
        !window.indexedDB ||
        // Safari private mode
        (window.navigator.storage && !(await window.navigator.storage.estimate()).quota) ||
        // Chrome incognito detection
        ((window as any).webkitRequestFileSystem && !(window as any).webkitRequestFileSystem)
      )
      
      this.isPrivateMode = isPrivate
      return isPrivate
    } catch (e) {
      // If localStorage throws, we're likely in private mode
      this.isPrivateMode = true
      return true
    }
  }

  private getStorageKey(key: string): string {
    return `askelio_${key}_${this.sessionId}`
  }

  async setSession(sessionData: SessionData): Promise<void> {
    if (typeof window === 'undefined') return

    const isPrivate = await this.detectPrivateMode()
    
    try {
      if (isPrivate) {
        // In private mode, use sessionStorage only
        sessionStorage.setItem(this.getStorageKey('session'), JSON.stringify(sessionData))
        console.log('🔒 Session stored in sessionStorage (private mode detected)')
      } else {
        // In normal mode, use both for redundancy
        localStorage.setItem(this.getStorageKey('session'), JSON.stringify(sessionData))
        sessionStorage.setItem(this.getStorageKey('session'), JSON.stringify(sessionData))
        console.log('🔒 Session stored in localStorage and sessionStorage')
      }
    } catch (error) {
      console.error('Failed to store session:', error)
      // Fallback to sessionStorage only
      try {
        sessionStorage.setItem(this.getStorageKey('session'), JSON.stringify(sessionData))
      } catch (fallbackError) {
        console.error('Failed to store session in sessionStorage:', fallbackError)
      }
    }
  }

  async getSession(): Promise<SessionData | null> {
    if (typeof window === 'undefined') return null

    const isPrivate = await this.detectPrivateMode()
    
    try {
      let sessionStr: string | null = null
      
      if (isPrivate) {
        // In private mode, only check sessionStorage
        sessionStr = sessionStorage.getItem(this.getStorageKey('session'))
      } else {
        // In normal mode, prefer sessionStorage, fallback to localStorage
        sessionStr = sessionStorage.getItem(this.getStorageKey('session')) ||
                    localStorage.getItem(this.getStorageKey('session'))
      }
      
      if (!sessionStr) return null
      
      const sessionData = JSON.parse(sessionStr) as SessionData
      
      // Check if session is expired
      if (sessionData.expires_at && Date.now() > sessionData.expires_at * 1000) {
        await this.clearSession()
        return null
      }
      
      return sessionData
    } catch (error) {
      console.error('Failed to retrieve session:', error)
      return null
    }
  }

  async clearSession(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // Clear from both storages to be safe
      const keys = [
        this.getStorageKey('session'),
        'access_token',  // Legacy keys
        'refresh_token',
        'token_expires_at',
        'askelio_user_data'
      ]
      
      keys.forEach(key => {
        try {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        } catch (e) {
          // Ignore errors for individual key removal
        }
      })
      
      console.log('🔒 Session cleared from all storage')
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  async isSessionValid(): Promise<boolean> {
    const session = await this.getSession()
    return session !== null
  }

  // Get individual token for backward compatibility
  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession()
    return session?.access_token || null
  }

  async getRefreshToken(): Promise<string | null> {
    const session = await this.getSession()
    return session?.refresh_token || null
  }

  // Force session refresh (useful for logout)
  async forceSessionRefresh(): Promise<void> {
    this.sessionId = this.generateSessionId()
    await this.clearSession()
  }

  // Check if we're in private mode (public method)
  async checkPrivateMode(): Promise<boolean> {
    return await this.detectPrivateMode()
  }
}

export const secureSessionManager = SecureSessionManager.getInstance()
export default secureSessionManager
