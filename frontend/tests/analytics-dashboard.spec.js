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
    
    // Check chart headings
    await expect(page.locator('h3')).toContainText(['Měsíční trendy', 'Kategorie výdajů']);
    
    // Check that charts are rendered (canvas elements should be present)
    await expect(page.locator('#monthlyChart')).toBeVisible();
    await expect(page.locator('#expenseChart')).toBeVisible();
    
    console.log('✅ Analytics dashboard test passed - all metrics and charts are displaying correctly');
  });
  
  test('should format numbers correctly', async ({ page }) => {
    await page.goto('file:///C:/Users/askelatest/askelio/test-analytics.html');
    await page.waitForTimeout(2000);

    // Check Czech number formatting (using toContainText instead of exact match)
    await expect(page.locator('#income')).toContainText('1 250 000');
    await expect(page.locator('#expenses')).toContainText('850 000');
    await expect(page.locator('#profit')).toContainText('400 000');

    console.log('✅ Number formatting test passed - Czech locale formatting works correctly');
  });
});
