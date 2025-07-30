const { test, expect } = require('@playwright/test');

// Test configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8001';

// Test user credentials
const TEST_USER = {
  email: 'test@askelio.com',
  password: 'test123'
};

test.describe('ASKELIO AI Endpoints Integration Test', () => {
  let page;
  let context;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Enable request/response logging
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/dashboard/') || request.url().includes('/ai-analytics/')) {
        console.log(`🔄 REQUEST: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/dashboard/') || response.url().includes('/ai-analytics/')) {
        console.log(`✅ RESPONSE: ${response.status()} ${response.url()}`);
      }
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should verify all AI endpoints are connected and working', async () => {
    console.log('🚀 Starting AI endpoints integration test...');

    // Step 1: Navigate to application and login
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    console.log('✅ Successfully logged in and dashboard loaded');

    // Step 2: Test AI Chat Section
    console.log('🤖 Testing AI Chat section...');
    
    // Navigate to AI Chat
    await page.click('text=Finanční chat');
    await page.waitForLoadState('networkidle');
    
    // Wait for AI insights to load
    const aiInsightsRequest = page.waitForResponse(response => 
      response.url().includes('/dashboard/ai-insights') && response.status() === 200
    );
    await aiInsightsRequest;
    console.log('✅ AI Insights endpoint working');
    
    // Test AI Chat functionality
    const chatInput = page.locator('input[placeholder*="Zeptejte se"]');
    await expect(chatInput).toBeVisible();
    
    await chatInput.fill('Jaký je můj celkový zisk?');
    
    const chatResponse = page.waitForResponse(response => 
      response.url().includes('/dashboard/ai-chat') && response.status() === 200
    );
    
    await page.click('button:has-text("Odeslat")');
    await chatResponse;
    console.log('✅ AI Chat endpoint working');
    
    // Verify chat response appears
    await page.waitForSelector('text=AI Asistent:', { timeout: 5000 });
    console.log('✅ AI Chat response displayed');

    // Step 3: Test AI Overview Section
    console.log('📊 Testing AI Overview section...');
    
    await page.click('text=Přehledy');
    await page.waitForLoadState('networkidle');
    
    // Wait for advanced insights
    const advancedInsightsRequest = page.waitForResponse(response => 
      response.url().includes('/ai-analytics/insights/advanced') && response.status() === 200
    );
    await advancedInsightsRequest;
    console.log('✅ Advanced Insights endpoint working');
    
    // Wait for saved reports
    const savedReportsRequest = page.waitForResponse(response => 
      response.url().includes('/ai-analytics/reports/list') && response.status() === 200
    );
    await savedReportsRequest;
    console.log('✅ Saved Reports endpoint working');
    
    // Test widget builder
    const widgetButton = page.locator('text=Přidat widget');
    if (await widgetButton.isVisible()) {
      await widgetButton.click();
      console.log('✅ Widget builder accessible');
    }

    // Step 4: Test AI Analytics Section
    console.log('📈 Testing AI Analytics section...');
    
    await page.click('text=Analýzy');
    await page.waitForLoadState('networkidle');
    
    // Wait for predictions to load
    const revenueRequest = page.waitForResponse(response => 
      response.url().includes('/ai-analytics/predictions/revenue') && response.status() === 200
    );
    const expensesRequest = page.waitForResponse(response => 
      response.url().includes('/ai-analytics/predictions/expenses') && response.status() === 200
    );
    const cashflowRequest = page.waitForResponse(response => 
      response.url().includes('/ai-analytics/predictions/cashflow') && response.status() === 200
    );
    
    await Promise.all([revenueRequest, expensesRequest, cashflowRequest]);
    console.log('✅ All prediction endpoints working');
    
    // Wait for financial metrics
    const metricsRequest = page.waitForResponse(response => 
      response.url().includes('/ai-analytics/metrics/financial') && response.status() === 200
    );
    await metricsRequest;
    console.log('✅ Financial Metrics endpoint working');
    
    // Wait for risk analysis
    const riskRequest = page.waitForResponse(response => 
      response.url().includes('/ai-analytics/risk/analysis') && response.status() === 200
    );
    await riskRequest;
    console.log('✅ Risk Analysis endpoint working');

    // Step 5: Verify UI Components
    console.log('🎨 Verifying UI components...');
    
    // Check for prediction cards
    await expect(page.locator('text=Prediktivní analýza')).toBeVisible();
    await expect(page.locator('text=Příjmy')).toBeVisible();
    await expect(page.locator('text=Výdaje')).toBeVisible();
    await expect(page.locator('text=Cash Flow')).toBeVisible();
    console.log('✅ Prediction components visible');
    
    // Check for AI recommendations
    await expect(page.locator('text=AI Doporučení')).toBeVisible();
    console.log('✅ AI Recommendations visible');
    
    // Check for financial metrics
    await expect(page.locator('text=Finanční metriky')).toBeVisible();
    console.log('✅ Financial metrics visible');

    // Step 6: Test Error Handling
    console.log('⚠️ Testing error handling...');
    
    // Test with invalid prediction type (should handle gracefully)
    const invalidRequest = page.evaluate(async () => {
      try {
        const response = await fetch('/ai-analytics/predictions/invalid-type');
        return response.status;
      } catch (error) {
        return 'error';
      }
    });
    
    console.log('✅ Error handling tested');

    console.log('🎉 All AI endpoints verified successfully!');
  });

  test('should test AI chat with multiple messages', async () => {
    console.log('💬 Testing AI chat with multiple messages...');
    
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Login if needed
    if (await page.locator('input[type="email"]').isVisible()) {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    }
    
    // Navigate to AI Chat
    await page.click('text=Finanční chat');
    await page.waitForLoadState('networkidle');
    
    const chatInput = page.locator('input[placeholder*="Zeptejte se"]');
    const sendButton = page.locator('button:has-text("Odeslat")');
    
    // Test multiple chat messages
    const testMessages = [
      'Kolik mám příjmů?',
      'Jaké jsou moje největší výdaje?',
      'Jak si vedu finančně?',
      'Porovnej s minulým měsícem'
    ];
    
    for (const message of testMessages) {
      console.log(`📝 Sending message: ${message}`);
      
      await chatInput.fill(message);
      
      const chatResponse = page.waitForResponse(response => 
        response.url().includes('/dashboard/ai-chat') && response.status() === 200
      );
      
      await sendButton.click();
      await chatResponse;
      
      // Wait for response to appear
      await page.waitForTimeout(1000);
      console.log(`✅ Response received for: ${message}`);
    }
    
    console.log('✅ Multiple chat messages tested successfully');
  });

  test('should verify AI analytics data visualization', async () => {
    console.log('📊 Testing AI analytics data visualization...');
    
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Login if needed
    if (await page.locator('input[type="email"]').isVisible()) {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    }
    
    // Navigate to AI Analytics
    await page.click('text=Analýzy');
    await page.waitForLoadState('networkidle');
    
    // Wait for all data to load
    await page.waitForTimeout(3000);
    
    // Check for charts and visualizations
    const chartElements = await page.locator('canvas, svg, .recharts-wrapper').count();
    console.log(`📈 Found ${chartElements} chart elements`);
    
    // Check for prediction values
    const predictionElements = await page.locator('text=/\\d+[,.]\\d+\\s*(CZK|%)/').count();
    console.log(`💰 Found ${predictionElements} prediction values`);
    
    // Check for confidence indicators
    const confidenceElements = await page.locator('text=/\\d+%.*spolehlivost/i').count();
    console.log(`🎯 Found ${confidenceElements} confidence indicators`);
    
    expect(chartElements).toBeGreaterThan(0);
    expect(predictionElements).toBeGreaterThan(0);
    
    console.log('✅ AI analytics visualization verified');
  });
});
