/**
 * Production Configuration for Askelio OCR Dashboard
 * 
 * This file contains production-specific settings and optimizations
 */

export const PRODUCTION_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.askelio.com',
  
  // Performance Settings
  ENABLE_LAZY_LOADING: true,
  ENABLE_CODE_SPLITTING: true,
  ENABLE_COMPRESSION: true,
  
  // Feature Flags
  FEATURES: {
    // Disable development/testing features in production
    MULTILAYER_OCR_TESTER: false,
    MULTILAYER_OCR_STATUS: false,
    DEBUG_MODE: false,
    DEVELOPMENT_TOOLS: false,
    
    // Enable production features
    ANALYTICS: true,
    ERROR_REPORTING: true,
    PERFORMANCE_MONITORING: true,
    CACHING: true,
  },
  
  // UI Settings
  UI: {
    SHOW_LOADING_STATES: true,
    ENABLE_ANIMATIONS: true,
    OPTIMIZE_IMAGES: true,
    PRELOAD_CRITICAL_RESOURCES: true,
  },
  
  // Security Settings
  SECURITY: {
    ENABLE_CSP: true,
    SECURE_HEADERS: true,
    RATE_LIMITING: true,
  },
  
  // Monitoring
  MONITORING: {
    SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  }
}

// Environment check
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'

// Feature flag helper
export function isFeatureEnabled(feature: keyof typeof PRODUCTION_CONFIG.FEATURES): boolean {
  return PRODUCTION_CONFIG.FEATURES[feature] === true
}
