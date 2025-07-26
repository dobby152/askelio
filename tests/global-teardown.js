/**
 * Global Teardown for Playwright Tests
 * Cleans up test environment
 */

const { chromium } = require('@playwright/test');

async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Clean up test data if needed
    await cleanupTestData(page);
    
    console.log('✅ Test environment cleanup complete');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

async function cleanupTestData(page) {
  try {
    console.log('🗑️ Cleaning up test data...');
    
    // Clear any test-specific data
    // Note: In a real environment, you might want to clean up test users,
    // test documents, etc. For now, we'll just clear localStorage
    
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await page.goto(frontendUrl);
    
    await page.evaluate(() => {
      // Clear all localStorage data
      localStorage.clear();
      
      // Clear all sessionStorage data
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    });
    
    console.log('✅ Test data cleanup complete');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

module.exports = globalTeardown;
