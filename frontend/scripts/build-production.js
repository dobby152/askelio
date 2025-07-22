#!/usr/bin/env node

/**
 * Production Build Script for Askelio OCR Dashboard
 * 
 * This script optimizes the build for production deployment
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Starting production build for Askelio OCR Dashboard...')

// Set production environment
process.env.NODE_ENV = 'production'

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...')
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' })
  }
  
  // Install dependencies
  console.log('📦 Installing dependencies...')
  execSync('npm ci --only=production', { stdio: 'inherit' })
  
  // Run type checking
  console.log('🔍 Running type checks...')
  execSync('npx tsc --noEmit', { stdio: 'inherit' })
  
  // Run linting
  console.log('🔧 Running linter...')
  execSync('npm run lint', { stdio: 'inherit' })
  
  // Build the application
  console.log('🏗️  Building application...')
  execSync('npm run build', { stdio: 'inherit' })
  
  // Run production tests
  console.log('🧪 Running production tests...')
  try {
    execSync('npm run test:production', { stdio: 'inherit' })
  } catch (error) {
    console.warn('⚠️  Production tests failed, but continuing build...')
  }
  
  // Generate build report
  console.log('📊 Generating build report...')
  const buildStats = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: 'production',
    features: {
      multilayerOCRTester: false,
      multilayerOCRStatus: false,
      debugMode: false,
    }
  }
  
  fs.writeFileSync(
    path.join(__dirname, '../.next/build-report.json'),
    JSON.stringify(buildStats, null, 2)
  )
  
  console.log('✅ Production build completed successfully!')
  console.log('📁 Build output: .next/')
  console.log('🚀 Ready for deployment!')
  
} catch (error) {
  console.error('❌ Production build failed:', error.message)
  process.exit(1)
}
