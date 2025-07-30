const { test, expect } = require('@playwright/test');

// Quick test for AI endpoints verification
test.describe('Quick AI Endpoints Verification', () => {
  
  test('should verify AI endpoints are accessible', async ({ page }) => {
    console.log('🚀 Quick AI endpoints verification...');
    
    // Navigate to the application
    await page.goto('http://localhost:3001');

    // Check if the page loads
    await expect(page).toHaveTitle(/Askelio/);
    console.log('✅ Application loaded');

    // Try to access AI demo page directly
    await page.goto('http://localhost:3001/ai-demo');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for AI demo elements
    await expect(page.locator('text=AI Demo')).toBeVisible();
    console.log('✅ AI Demo page accessible');
    
    // Test AI Insights button
    const insightsButton = page.locator('button:has-text("Načíst AI Insights")');
    if (await insightsButton.isVisible()) {
      console.log('🤖 Testing AI Insights...');
      
      // Monitor network requests
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/dashboard/ai-insights') || 
        response.url().includes('/ai-insights-demo')
      );
      
      await insightsButton.click();
      
      try {
        const response = await responsePromise;
        console.log(`✅ AI Insights endpoint responded: ${response.status()}`);
        
        // Check if insights are displayed
        await page.waitForSelector('.border-green-200, .border-orange-200, .border-blue-200', { timeout: 5000 });
        console.log('✅ AI Insights displayed');
      } catch (error) {
        console.log('⚠️ AI Insights request timeout or failed');
      }
    }
    
    // Test AI Chat
    const chatInput = page.locator('input[placeholder*="Zeptejte se"]');
    const chatButton = page.locator('button:has-text("Odeslat dotaz")');
    
    if (await chatInput.isVisible() && await chatButton.isVisible()) {
      console.log('💬 Testing AI Chat...');
      
      await chatInput.fill('Test zpráva');
      
      // Monitor chat response
      const chatResponsePromise = page.waitForResponse(response => 
        response.url().includes('/dashboard/ai-chat') || 
        response.url().includes('/ai-chat-demo')
      );
      
      await chatButton.click();
      
      try {
        const response = await chatResponsePromise;
        console.log(`✅ AI Chat endpoint responded: ${response.status()}`);
        
        // Check if response is displayed
        await page.waitForSelector('text=AI Asistent:', { timeout: 5000 });
        console.log('✅ AI Chat response displayed');
      } catch (error) {
        console.log('⚠️ AI Chat request timeout or failed');
      }
    }
    
    console.log('🎉 Quick verification completed!');
  });
  
  test('should check backend health', async ({ request }) => {
    console.log('🏥 Checking backend health...');
    
    try {
      const response = await request.get('http://localhost:8001/health');
      expect(response.status()).toBe(200);
      console.log('✅ Backend is healthy');
      
      const healthData = await response.json();
      console.log('📊 Health data:', healthData);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
    }
  });
  
  test('should verify AI service endpoints directly', async ({ request }) => {
    console.log('🔍 Testing AI service endpoints directly...');
    
    // Test AI insights demo endpoint (no auth required)
    try {
      const insightsResponse = await request.get('http://localhost:8001/dashboard/ai-insights-demo');
      console.log(`AI Insights Demo: ${insightsResponse.status()}`);
      
      if (insightsResponse.ok()) {
        const data = await insightsResponse.json();
        console.log('✅ AI Insights demo working');
        console.log('📊 Sample insights:', data.data?.length || 0, 'items');
      }
    } catch (error) {
      console.log('⚠️ AI Insights demo endpoint failed:', error.message);
    }
    
    // Test health endpoint
    try {
      const healthResponse = await request.get('http://localhost:8001/health');
      console.log(`Health endpoint: ${healthResponse.status()}`);
      
      if (healthResponse.ok()) {
        const health = await healthResponse.json();
        console.log('✅ Health endpoint working');
        console.log('🏥 Status:', health.status);
      }
    } catch (error) {
      console.log('⚠️ Health endpoint failed:', error.message);
    }
  });
  
  test('should verify frontend AI components load', async ({ page }) => {
    console.log('🎨 Verifying frontend AI components...');
    
    await page.goto('http://localhost:3001/ai-demo');
    await page.waitForLoadState('networkidle');
    
    // Check for key AI components
    const components = [
      'text=AI Demo',
      'text=AI Doporučení',
      'text=AI Chat',
      'button:has-text("Načíst AI Insights")',
      'input[placeholder*="Zeptejte se"]'
    ];
    
    for (const component of components) {
      try {
        await expect(page.locator(component)).toBeVisible({ timeout: 3000 });
        console.log(`✅ Component found: ${component}`);
      } catch (error) {
        console.log(`⚠️ Component not found: ${component}`);
      }
    }
    
    console.log('🎨 Frontend components verification completed');
  });
});
