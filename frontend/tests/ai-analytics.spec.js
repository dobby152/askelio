/**
 * AI Analytics Tests
 * Tests AI analytics functionality including predictions, insights, and risk analysis
 */

const { test, expect } = require('@playwright/test');

test.describe('AI Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to analytics
    await page.goto('/auth/login');
    await page.click('text=Vyplnit testovací údaje');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Open AI Analytics
    await page.click('text=Analýzy');
    await expect(page.locator('text=AI Analýzy')).toBeVisible();
  });

  test('should display AI analytics modal', async ({ page }) => {
    // Check modal title
    await expect(page.locator('text=AI Analýzy')).toBeVisible();
    
    // Check tabs
    await expect(page.locator('text=Příjmy')).toBeVisible();
    await expect(page.locator('text=Výdaje')).toBeVisible();
    await expect(page.locator('text=Cash Flow')).toBeVisible();
    
    // Check close button
    await expect(page.locator('[data-testid="close-modal"]')).toBeVisible();
  });

  test('should display revenue predictions', async ({ page }) => {
    // Revenue tab should be active by default
    await expect(page.locator('text=Predikce na 30 dní')).toBeVisible();
    
    // Wait for AI data to load
    await page.waitForTimeout(3000);
    
    // Check prediction values are displayed
    const predictionValue = page.locator('[data-testid="revenue-prediction"]');
    if (await predictionValue.isVisible()) {
      const text = await predictionValue.textContent();
      expect(text).toMatch(/\d+.*CZK/); // Should contain numbers and CZK
    }
    
    // Check confidence level
    await expect(page.locator('text=Spolehlivost predikce')).toBeVisible();
    
    // Check trend indicator
    const trendElement = page.locator('[data-testid="revenue-trend"]');
    if (await trendElement.isVisible()) {
      const trendText = await trendElement.textContent();
      expect(trendText).toMatch(/(Růst|Pokles|Stabilní)/);
    }
  });

  test('should switch between prediction tabs', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Click on Výdaje tab
    await page.click('text=Výdaje');
    await expect(page.locator('text=Očekávané výdaje')).toBeVisible();
    
    // Click on Cash Flow tab
    await page.click('text=Cash Flow');
    await expect(page.locator('text=Očekávaný cash flow')).toBeVisible();
    
    // Go back to Příjmy tab
    await page.click('text=Příjmy');
    await expect(page.locator('text=Očekávané příjmy')).toBeVisible();
  });

  test('should display AI insights', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check AI insights section
    await expect(page.locator('text=AI Doporučení')).toBeVisible();
    
    // Check for insight cards
    const insightCards = page.locator('[data-testid="insight-card"]');
    if (await insightCards.count() > 0) {
      // Check first insight
      const firstInsight = insightCards.first();
      await expect(firstInsight).toBeVisible();
      
      // Should have title and description
      const insightText = await firstInsight.textContent();
      expect(insightText.length).toBeGreaterThan(10);
    }
  });

  test('should display financial metrics', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check financial metrics section
    await expect(page.locator('text=Finanční metriky')).toBeVisible();
    
    // Check profit margin
    await expect(page.locator('text=Zisková marže')).toBeVisible();
    
    // Check expense ratio
    await expect(page.locator('text=Poměr nákladů')).toBeVisible();
    
    // Check financial health
    await expect(page.locator('text=Finanční zdraví')).toBeVisible();
  });

  test('should display risk analysis', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check risk analysis section
    await expect(page.locator('text=Rizikové faktory')).toBeVisible();
    
    // Check for risk items
    const riskItems = page.locator('[data-testid="risk-item"]');
    if (await riskItems.count() > 0) {
      // Check risk levels (Vysoké, Střední, Nízké)
      const riskText = await page.locator('text=Vysoké, Střední, Nízké').textContent();
      expect(riskText).toMatch(/(Vysoké|Střední|Nízké)/);
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate error
    await page.route('**/ai-analytics/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    // Reload to trigger API calls
    await page.reload();
    await page.click('text=Analýzy');
    
    // Should show error state or fallback data
    await page.waitForTimeout(2000);
    
    // Check that UI doesn't break
    await expect(page.locator('text=AI Analýzy')).toBeVisible();
  });

  test('should close modal', async ({ page }) => {
    // Close modal using X button
    await page.click('[data-testid="close-modal"]');
    
    // Modal should be hidden
    await expect(page.locator('text=AI Analýzy')).not.toBeVisible();
    
    // Should be back on dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Analytics should still be functional
    await expect(page.locator('text=AI Analýzy')).toBeVisible();
    
    // Tabs should be responsive
    await expect(page.locator('text=Příjmy')).toBeVisible();
    await expect(page.locator('text=Výdaje')).toBeVisible();
    
    // Content should fit mobile screen
    const modal = page.locator('[data-testid="analytics-modal"]');
    if (await modal.isVisible()) {
      const boundingBox = await modal.boundingBox();
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    }
  });
});
