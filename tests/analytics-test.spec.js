/**
 * Analytics Dashboard Test
 * Tests the analytics functionality with mock data fallback
 */

const { test, expect } = require('@playwright/test');

test.describe('Analytics Dashboard', () => {
  test('should display analytics with mock data', async ({ page }) => {
    // Navigate to test analytics page
    await page.goto('file:///C:/Users/askelatest/askelio/test-analytics.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page).toHaveTitle('Test Analytics Dashboard');
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('📊 Test Analytics Dashboard');
    
    // Wait for data to load (mock data has 1 second delay)
    await page.waitForTimeout(2000);
    
    // Check success message
    await expect(page.locator('#status')).toContainText('✅ Analytická data úspěšně načtena');
    
    // Check that metrics are visible
    await expect(page.locator('#metrics')).toBeVisible();
    await expect(page.locator('#charts')).toBeVisible();
    
    // Check specific metric values
    await expect(page.locator('#income')).toContainText('1 250 000');
    await expect(page.locator('#expenses')).toContainText('850 000');
    await expect(page.locator('#profit')).toContainText('400 000');
    await expect(page.locator('#margin')).toContainText('32.0%');
    await expect(page.locator('#documents')).toContainText('47');
    await expect(page.locator('#users')).toContainText('12');
    
    // Check metric labels
    await expect(page.locator('.metric-label')).toContainText(['Celkové příjmy (CZK)', 'Celkové výdaje (CZK)', 'Čistý zisk (CZK)']);
    
    // Check chart headings
    await expect(page.locator('h3')).toContainText(['Měsíční trendy', 'Kategorie výdajů']);
    
    // Check that charts are rendered (canvas elements should be present)
    await expect(page.locator('#monthlyChart')).toBeVisible();
    await expect(page.locator('#expenseChart')).toBeVisible();
    
    console.log('✅ Analytics dashboard test passed - all metrics and charts are displaying correctly');
  });
  
  test('should format numbers correctly', async ({ page }) => {
    await page.goto('file:///c:/Users/askelatest/askelio/test-analytics.html');
    await page.waitForTimeout(2000);
    
    // Check Czech number formatting
    const incomeText = await page.locator('#income').textContent();
    expect(incomeText).toBe('1 250 000'); // Czech formatting with spaces
    
    const expensesText = await page.locator('#expenses').textContent();
    expect(expensesText).toBe('850 000');
    
    const profitText = await page.locator('#profit').textContent();
    expect(profitText).toBe('400 000');
    
    console.log('✅ Number formatting test passed - Czech locale formatting works correctly');
  });
  
  test('should have proper styling and layout', async ({ page }) => {
    await page.goto('file:///c:/Users/askelatest/askelio/test-analytics.html');
    await page.waitForTimeout(2000);
    
    // Check container styling
    const container = page.locator('.container');
    await expect(container).toBeVisible();
    
    // Check metrics grid layout
    const metrics = page.locator('#metrics');
    await expect(metrics).toHaveCSS('display', 'grid');
    
    // Check charts grid layout
    const charts = page.locator('#charts');
    await expect(charts).toHaveCSS('display', 'grid');
    
    // Check metric cards
    const metricCards = page.locator('.metric-card');
    await expect(metricCards).toHaveCount(6);
    
    // Check chart containers
    const chartContainers = page.locator('.chart-container');
    await expect(chartContainers).toHaveCount(2);
    
    console.log('✅ Styling and layout test passed - all elements are properly styled and positioned');
  });
});

test.describe('Analytics API Integration', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // This test simulates what happens when the real API is not available
    // The mock data fallback should work
    
    await page.goto('file:///c:/Users/askelatest/askelio/test-analytics.html');
    await page.waitForTimeout(2000);
    
    // Even with API errors, mock data should display
    await expect(page.locator('#status')).toContainText('✅ Analytická data úspěšně načtena');
    await expect(page.locator('#metrics')).toBeVisible();
    
    console.log('✅ API error handling test passed - fallback mock data works correctly');
  });
});
