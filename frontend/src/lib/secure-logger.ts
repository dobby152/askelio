/**
 * Secure Logger Utility
 * Prevents sensitive data from being logged to console
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
}

class SecureLogger {
  private sensitiveKeys = [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'auth',
    'secret',
    'key',
    'credential',
    'session'
  ]

  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Sanitize data by removing sensitive information
   */
  private sanitizeData(data: any): any {
    if (!data) return data

    if (typeof data === 'string') {
      // Check if string looks like a token (JWT pattern)
      if (data.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) {
        return '[REDACTED_TOKEN]'
      }
      return data
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item))
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {}
      
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase()
        
        if (this.sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = this.sanitizeData(value)
        }
      }
      
      return sanitized
    }

    return data
  }

  /**
   * Create log entry with sanitized data
   */
  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, data)
      console.debug(`[DEBUG] ${entry.message}`, entry.data || '')
    }
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    const entry = this.createLogEntry('info', message, data)
    console.info(`[INFO] ${entry.message}`, entry.data || '')
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, data)
    console.warn(`[WARN] ${entry.message}`, entry.data || '')
  }

  /**
   * Log error message
   */
  error(message: string, data?: any): void {
    const entry = this.createLogEntry('error', message, data)
    console.error(`[ERROR] ${entry.message}`, entry.data || '')
  }

  /**
   * Log authentication events with extra security
   */
  authEvent(event: string, details?: any): void {
    const sanitizedDetails = this.sanitizeData(details)
    this.info(`Auth Event: ${event}`, sanitizedDetails)
  }

  /**
   * Log API requests (without sensitive headers)
   */
  apiRequest(method: string, url: string, status?: number, error?: any): void {
    const logData = {
      method,
      url: url.replace(/\/\/.*@/, '//[REDACTED]@'), // Remove credentials from URL
      status,
      error: this.sanitizeData(error)
    }
    
    if (status && status >= 400) {
      this.warn(`API Request Failed: ${method} ${url}`, logData)
    } else {
      this.debug(`API Request: ${method} ${url}`, logData)
    }
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger()
export default secureLogger
