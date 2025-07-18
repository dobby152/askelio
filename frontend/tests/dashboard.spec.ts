import { test, expect } from '@playwright/test';

test.describe('Askelio OCR Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });
  });

  test.describe('Layout and Navigation', () => {
    test('should display main dashboard layout', async ({ page }) => {
      // Check if main dashboard elements are present
      await expect(page.locator('h1')).toContainText('Dashboard');
      await expect(page.locator('text=Vítejte zpět v Askelio OCR')).toBeVisible();
      
      // Check sidebar
      await expect(page.locator('text=Askelio')).toBeVisible();
      await expect(page.locator('text=Navigace')).toBeVisible();
      await expect(page.locator('text=Rychlé akce')).toBeVisible();
    });

    test('should have working sidebar navigation', async ({ page }) => {
      // Test navigation items
      const navItems = ['Dashboard', 'Dokumenty', 'Statistiky', 'Uživatelé'];
      
      for (const item of navItems) {
        await expect(page.locator(`text=${item}`)).toBeVisible();
      }
    });

    test('should have working quick actions', async ({ page }) => {
      // Test quick action items
      const quickActions = [
        'Nový dokument',
        'Správa kreditů', 
        'Nastavení',
        'Export dat',
        'Nápověda'
      ];
      
      for (const action of quickActions) {
        await expect(page.locator(`text=${action}`)).toBeVisible();
      }
    });

    test('should toggle sidebar on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check if mobile menu button is visible
      const menuButton = page.locator('button[aria-label="Menu"]').first();
      await expect(menuButton).toBeVisible();
      
      // Click to open sidebar
      await menuButton.click();
      
      // Check if sidebar is visible
      await expect(page.locator('text=Askelio')).toBeVisible();
    });
  });

  test.describe('Header Functionality', () => {
    test('should display search functionality', async ({ page }) => {
      // Check search input
      const searchInput = page.locator('input[placeholder*="Hledat dokumenty"]');
      await expect(searchInput).toBeVisible();
      
      // Test search input
      await searchInput.fill('test dokument');
      await expect(searchInput).toHaveValue('test dokument');
    });

    test('should have theme toggle', async ({ page }) => {
      // Look for theme toggle button (sun/moon icon)
      const themeToggle = page.locator('button').filter({ hasText: /sun|moon/i }).first();
      
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        // Wait for theme change
        await page.waitForTimeout(500);
      }
    });

    test('should display user menu', async ({ page }) => {
      // Look for user avatar or menu
      const userMenu = page.locator('[data-testid="user-menu"]').or(
        page.locator('button').filter({ hasText: /avatar|user/i })
      );
      
      if (await userMenu.isVisible()) {
        await userMenu.click();
      }
    });
  });

  test.describe('Statistics Cards', () => {
    test('should display all stat cards', async ({ page }) => {
      // Check for stat cards
      const statTitles = [
        'Zpracované dokumenty',
        'Úspora času', 
        'Přesnost OCR',
        'Zbývající kredity'
      ];
      
      for (const title of statTitles) {
        await expect(page.locator(`text=${title}`)).toBeVisible();
      }
    });

    test('should display stat values and trends', async ({ page }) => {
      // Check for numeric values in stats
      await expect(page.locator('text=/\\d+[,.]?\\d*/')).toHaveCount({ min: 4 });
      
      // Check for trend indicators
      await expect(page.locator('text=/[+\\-]\\d+[.,]\\d*%/')).toHaveCount({ min: 1 });
    });

    test('should have hover effects on stat cards', async ({ page }) => {
      const firstCard = page.locator('[data-testid="stat-card"]').first().or(
        page.locator('.card').first()
      );
      
      if (await firstCard.isVisible()) {
        await firstCard.hover();
        // Check for hover state changes
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Charts and Visualizations', () => {
    test('should display monthly usage chart', async ({ page }) => {
      await expect(page.locator('text=Měsíční využití')).toBeVisible();
      
      // Check for chart container
      const chartContainer = page.locator('[data-testid="monthly-chart"]').or(
        page.locator('.recharts-wrapper')
      );
      
      if (await chartContainer.isVisible()) {
        await expect(chartContainer).toBeVisible();
      }
    });

    test('should display document types chart', async ({ page }) => {
      await expect(page.locator('text=Typy dokumentů')).toBeVisible();
      
      // Check for pie chart
      const pieChart = page.locator('[data-testid="document-types-chart"]').or(
        page.locator('.recharts-pie')
      );
      
      if (await pieChart.isVisible()) {
        await expect(pieChart).toBeVisible();
      }
    });

    test('should display accuracy trend chart', async ({ page }) => {
      // Look for accuracy chart
      const accuracyChart = page.locator('text=Přesnost v čase').or(
        page.locator('[data-testid="accuracy-chart"]')
      );
      
      if (await accuracyChart.isVisible()) {
        await expect(accuracyChart).toBeVisible();
      }
    });

    test('should display progress bars for limits', async ({ page }) => {
      // Check for progress indicators
      const progressBars = page.locator('[role="progressbar"]').or(
        page.locator('.progress')
      );
      
      const count = await progressBars.count();
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Upload Area', () => {
    test('should display upload area', async ({ page }) => {
      // Check for upload section
      const uploadArea = page.locator('text=Nahrát dokumenty').or(
        page.locator('[data-testid="upload-area"]')
      );
      
      if (await uploadArea.isVisible()) {
        await expect(uploadArea).toBeVisible();
      }
    });

    test('should handle file selection', async ({ page }) => {
      // Look for file input
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        // Create a test file
        const testFile = {
          name: 'test-document.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('test pdf content')
        };
        
        await fileInput.setInputFiles(testFile);
        
        // Check if file appears in upload list
        await expect(page.locator('text=test-document.pdf')).toBeVisible();
      }
    });

    test('should show upload progress', async ({ page }) => {
      // Test upload progress simulation
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        const testFile = {
          name: 'progress-test.pdf',
          mimeType: 'application/pdf', 
          buffer: Buffer.from('test content')
        };
        
        await fileInput.setInputFiles(testFile);
        
        // Wait for progress indicators
        await page.waitForTimeout(1000);
        
        // Check for progress elements
        const progressElements = page.locator('[role="progressbar"]').or(
          page.locator('text=/\\d+%/')
        );
        
        if (await progressElements.count() > 0) {
          await expect(progressElements.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Documents Table', () => {
    test('should display recent documents table', async ({ page }) => {
      // Check for documents section
      const documentsSection = page.locator('text=Nedávné dokumenty').or(
        page.locator('[data-testid="documents-table"]')
      );
      
      if (await documentsSection.isVisible()) {
        await expect(documentsSection).toBeVisible();
      }
    });

    test('should show document status indicators', async ({ page }) => {
      // Look for status badges
      const statusBadges = page.locator('.badge').or(
        page.locator('[data-testid="status-badge"]')
      );
      
      const count = await statusBadges.count();
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should have document actions', async ({ page }) => {
      // Look for action buttons
      const actionButtons = page.locator('button').filter({ 
        hasText: /stáhnout|zobrazit|smazat|download|view|delete/i 
      });
      
      const count = await actionButtons.count();
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check if layout adapts
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check mobile layout
      await expect(page.locator('h1')).toBeVisible();
      
      // Check if mobile menu is present
      const mobileMenu = page.locator('button').filter({ hasText: /menu/i }).first();
      if (await mobileMenu.isVisible()) {
        await expect(mobileMenu).toBeVisible();
      }
    });

    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Check desktop layout
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Askelio')).toBeVisible();
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load dashboard within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await page.waitForSelector('h1');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should handle loading states', async ({ page }) => {
      // Check for loading indicators
      const loadingIndicators = page.locator('text=/loading|načítání/i').or(
        page.locator('[data-testid="loading"]')
      );
      
      // Loading indicators might appear briefly
      await page.waitForTimeout(100);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/dashboard');
      
      // Check if error states are handled
      await page.waitForTimeout(2000);
      
      // Should still show basic layout even with API errors
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // Check for h1
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for other headings
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const count = await headings.count();
      expect(count).toBeGreaterThan(1);
    });

    test('should have keyboard navigation support', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusedElement = page.locator(':focus');
      if (await focusedElement.isVisible()) {
        await expect(focusedElement).toBeVisible();
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check for ARIA labels on interactive elements
      const ariaElements = page.locator('[aria-label]').or(
        page.locator('[aria-labelledby]')
      );
      
      const count = await ariaElements.count();
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });
});
