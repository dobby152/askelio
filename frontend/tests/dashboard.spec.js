/**
 * Dashboard Tests
 * Tests main dashboard functionality and navigation
 */

const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.click('text=Vyplnit testovací údaje');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard overview', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Dashboard/);
    
    // Check main dashboard elements
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check financial overview cards
    await expect(page.locator('text=Celkové příjmy')).toBeVisible();
    await expect(page.locator('text=Celkové výdaje')).toBeVisible();
    await expect(page.locator('text=Čistý zisk')).toBeVisible();
    
    // Check that financial data is loading or displayed
    // Wait for data to load (might show "..." initially)
    await page.waitForTimeout(2000);
    
    // Verify financial metrics are displayed (not just "...")
    const incomeElement = page.locator('[data-testid="total-income"]');
    if (await incomeElement.isVisible()) {
      const incomeText = await incomeElement.textContent();
      expect(incomeText).not.toBe('...');
    }
  });

  test('should display AI assistant section', async ({ page }) => {
    // Check AI assistant section
    await expect(page.locator('text=AI ASISTENT')).toBeVisible();
    
    // Check AI assistant buttons
    await expect(page.locator('text=Analýzy')).toBeVisible();
    await expect(page.locator('text=Predikce')).toBeVisible();
    await expect(page.locator('text=Doporučení')).toBeVisible();
  });

  test('should navigate to analytics', async ({ page }) => {
    // Click on Analýzy button
    await page.click('text=Analýzy');
    
    // Wait for analytics modal/section to appear
    await expect(page.locator('text=AI Analýzy')).toBeVisible();
    
    // Check analytics tabs
    await expect(page.locator('text=Příjmy')).toBeVisible();
    await expect(page.locator('text=Výdaje')).toBeVisible();
    await expect(page.locator('text=Cash Flow')).toBeVisible();
  });

  test('should display recent documents section', async ({ page }) => {
    // Check recent documents section
    await expect(page.locator('text=Nedávné dokumenty')).toBeVisible();
    
    // Check if documents are displayed or loading state
    const documentsSection = page.locator('[data-testid="recent-documents"]');
    if (await documentsSection.isVisible()) {
      // Either shows documents or empty state
      const hasDocuments = await page.locator('.document-item').count() > 0;
      const hasEmptyState = await page.locator('text=Žádné dokumenty').isVisible();
      expect(hasDocuments || hasEmptyState).toBeTruthy();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that dashboard is still functional
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check that cards stack vertically on mobile
    const cards = page.locator('.grid');
    if (await cards.isVisible()) {
      const boundingBox = await cards.boundingBox();
      expect(boundingBox.width).toBeLessThan(400);
    }
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Reload page to see loading states
    await page.reload();
    
    // Check for loading indicators
    const loadingElements = page.locator('text=...');
    if (await loadingElements.count() > 0) {
      // Wait for loading to complete
      await page.waitForTimeout(3000);
      
      // Verify loading states are replaced with actual data
      const remainingLoading = await page.locator('text=...').count();
      expect(remainingLoading).toBeLessThan(await loadingElements.count());
    }
  });
});
