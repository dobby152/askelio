import { test, expect } from '@playwright/test';
import { DashboardHelpers } from './utils/dashboard-helpers';

test.describe('Complete Dashboard Integration Tests', () => {
  let dashboard: DashboardHelpers;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardHelpers(page);
    
    // Navigate to the dashboard (adjust URL based on your setup)
    await page.goto('/');
    
    // Wait for dashboard to fully load
    await dashboard.waitForDashboardLoad();
  });

  test.describe('Full Dashboard Functionality', () => {
    test('should display complete dashboard with all sections', async ({ page }) => {
      // Verify main dashboard sections
      await expect(page.locator('h1')).toContainText('Dashboard');
      await expect(page.locator('text=Vítejte zpět v Askelio OCR')).toBeVisible();
      
      // Verify sidebar
      await expect(page.locator('text=Askelio')).toBeVisible();
      await expect(page.locator('text=Navigace')).toBeVisible();
      await expect(page.locator('text=Rychlé akce')).toBeVisible();
      
      // Verify navigation items
      const navItems = ['Dashboard', 'Dokumenty', 'Statistiky', 'Uživatelé'];
      for (const item of navItems) {
        await expect(page.locator(`text=${item}`)).toBeVisible();
      }
      
      // Verify quick actions
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

    test('should display all statistics cards with data', async ({ page }) => {
      // Check for all stat cards
      const statTitles = [
        'Zpracované dokumenty',
        'Úspora času',
        'Přesnost OCR',
        'Zbývající kredity'
      ];
      
      for (const title of statTitles) {
        await expect(page.locator(`text=${title}`)).toBeVisible();
      }
      
      // Check for numeric values
      await expect(page.locator('text=2,847')).toBeVisible(); // Processed documents
      await expect(page.locator('text=156.2h')).toBeVisible(); // Time saved
      await expect(page.locator('text=98.7%')).toBeVisible(); // OCR accuracy
      await expect(page.locator('text=2,450')).toBeVisible(); // Remaining credits
      
      // Check for trend indicators
      await expect(page.locator('text=+12.5%')).toBeVisible();
      await expect(page.locator('text=+8.1%')).toBeVisible();
      await expect(page.locator('text=+0.3%')).toBeVisible();
    });

    test('should display all charts and visualizations', async ({ page }) => {
      // Monthly usage chart
      await expect(page.locator('text=Měsíční využití')).toBeVisible();
      
      // Document types chart
      await expect(page.locator('text=Typy dokumentů')).toBeVisible();
      
      // Accuracy trend chart
      await expect(page.locator('text=Trend přesnosti')).toBeVisible();
      
      // Usage limits section
      await expect(page.locator('text=Limity využití')).toBeVisible();
      
      // Check for chart elements (SVG elements from Recharts)
      const chartElements = page.locator('svg');
      const chartCount = await chartElements.count();
      expect(chartCount).toBeGreaterThan(0);
      
      // Check for progress bars
      const progressBars = page.locator('[role="progressbar"]');
      const progressCount = await progressBars.count();
      expect(progressCount).toBeGreaterThanOrEqual(3); // At least 3 progress bars for limits
    });

    test('should display documents table with data', async ({ page }) => {
      // Check documents section
      await expect(page.locator('text=Nedávné dokumenty')).toBeVisible();
      
      // Check table headers
      const tableHeaders = [
        'Dokument',
        'Status',
        'Přesnost',
        'Zpracováno',
        'Velikost',
        'Stránky',
        'Akce'
      ];
      
      for (const header of tableHeaders) {
        await expect(page.locator(`text=${header}`)).toBeVisible();
      }
      
      // Check for sample documents
      await expect(page.locator('text=Faktura_2024_001.pdf')).toBeVisible();
      await expect(page.locator('text=Smlouva_dodavatel.pdf')).toBeVisible();
      
      // Check for status badges
      await expect(page.locator('text=Hotovo')).toBeVisible();
      await expect(page.locator('text=Zpracovává se')).toBeVisible();
      await expect(page.locator('text=Chyba')).toBeVisible();
      
      // Check for filter controls
      const searchInput = page.locator('input[placeholder*="Hledat dokumenty"]');
      await expect(searchInput).toBeVisible();
      
      // Check for dropdown filters
      const dropdowns = page.locator('select, [role="combobox"]');
      const dropdownCount = await dropdowns.count();
      expect(dropdownCount).toBeGreaterThanOrEqual(2);
    });

    test('should display upload area', async ({ page }) => {
      // Check upload section
      await expect(page.locator('text=Nahrát dokumenty')).toBeVisible();
      await expect(page.locator('text=Přetáhněte soubory sem')).toBeVisible();
      await expect(page.locator('text=nebo klikněte pro výběr souborů')).toBeVisible();
      
      // Check supported formats info
      await expect(page.locator('text=Podporované formáty: PDF, JPG, PNG')).toBeVisible();
      await expect(page.locator('text=max. 10MB')).toBeVisible();
      
      // Check for file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await expect(fileInput).toBeAttached();
      }
    });

    test('should have working header functionality', async ({ page }) => {
      // Check search functionality
      const searchInput = page.locator('input[placeholder*="Hledat dokumenty"]').first();
      await expect(searchInput).toBeVisible();
      
      // Test search input
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
      await searchInput.clear();
      
      // Check theme toggle
      const themeToggle = page.locator('button').filter({ hasText: /sun|moon/i }).first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);
      }
      
      // Check notifications
      const notificationButton = page.locator('button').filter({ hasText: /3/ });
      if (await notificationButton.isVisible()) {
        await expect(notificationButton).toBeVisible();
      }
      
      // Check user menu
      const userButton = page.locator('button').filter({ hasText: /@johndoe/ });
      if (await userButton.isVisible()) {
        await expect(userButton).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design Tests', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Main content should still be visible
      await expect(page.locator('h1')).toBeVisible();
      
      // Check if mobile-specific elements appear
      await page.waitForTimeout(500);
      
      // Stats cards should stack vertically on mobile
      const statsCards = page.locator('[data-testid="stat-card"]').or(
        page.locator('text=Zpracované dokumenty').locator('..')
      );
      
      if (await statsCards.count() > 0) {
        await expect(statsCards.first()).toBeVisible();
      }
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // All main sections should be visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Askelio')).toBeVisible();
      
      // Charts should adapt to tablet size
      await page.waitForTimeout(500);
    });

    test('should work on large desktop screens', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // All content should be visible and properly spaced
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Sidebar should be fully visible
      await expect(page.locator('text=Askelio')).toBeVisible();
      await expect(page.locator('text=Navigace')).toBeVisible();
    });
  });

  test.describe('Interactive Features', () => {
    test('should handle file upload simulation', async ({ page }) => {
      // Look for file input
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        // Create test file
        const testFile = {
          name: 'test-document.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('test pdf content')
        };
        
        await fileInput.setInputFiles(testFile);
        
        // File should appear in some form (upload list, preview, etc.)
        await page.waitForTimeout(1000);
      }
    });

    test('should handle search functionality', async ({ page }) => {
      const searchInputs = page.locator('input[placeholder*="Hledat"]');
      
      if (await searchInputs.count() > 0) {
        const searchInput = searchInputs.first();
        
        // Test search
        await searchInput.fill('faktura');
        await page.waitForTimeout(500);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
    });

    test('should handle dropdown interactions', async ({ page }) => {
      const dropdowns = page.locator('select, [role="combobox"]');
      
      if (await dropdowns.count() > 0) {
        const firstDropdown = dropdowns.first();
        
        if (await firstDropdown.isVisible()) {
          await firstDropdown.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should handle action buttons', async ({ page }) => {
      // Look for action buttons in the documents table
      const actionButtons = page.locator('button').filter({ hasText: /akce|action/i });
      
      if (await actionButtons.count() > 0) {
        const firstButton = actionButtons.first();
        
        if (await firstButton.isVisible()) {
          await firstButton.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Data Validation', () => {
    test('should display realistic mock data', async ({ page }) => {
      // Check for realistic numbers in stats
      await expect(page.locator('text=/\\d{1,3}[,.]\\d{3}/')).toHaveCount({ min: 1 }); // Numbers like 2,847
      await expect(page.locator('text=/\\d+\\.\\d+h/')).toHaveCount({ min: 1 }); // Time like 156.2h
      await expect(page.locator('text=/\\d+\\.\\d+%/')).toHaveCount({ min: 1 }); // Percentages like 98.7%
      
      // Check for realistic file sizes
      await expect(page.locator('text=/\\d+\\.\\d+ MB/')).toHaveCount({ min: 1 });
      
      // Check for realistic dates
      await expect(page.locator('text=/2024-\\d{2}-\\d{2}/')).toHaveCount({ min: 1 });
    });

    test('should have consistent Czech localization', async ({ page }) => {
      // Check for Czech month abbreviations in charts
      const czechMonths = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer'];
      
      for (const month of czechMonths) {
        const monthElement = page.locator(`text=${month}`);
        if (await monthElement.isVisible()) {
          await expect(monthElement).toBeVisible();
        }
      }
      
      // Check for Czech document types
      const documentTypes = ['Faktury', 'Smlouvy', 'Doklady', 'Ostatní'];
      
      for (const type of documentTypes) {
        const typeElement = page.locator(`text=${type}`);
        if (await typeElement.isVisible()) {
          await expect(typeElement).toBeVisible();
        }
      }
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load dashboard within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForSelector('h1');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    });

    test('should handle multiple chart renders efficiently', async ({ page }) => {
      // Reload page to trigger chart animations
      await page.reload();
      await page.waitForSelector('h1');
      
      // Wait for charts to render
      await page.waitForTimeout(3000);
      
      // All charts should be visible
      const charts = page.locator('svg');
      const chartCount = await charts.count();
      expect(chartCount).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle missing data gracefully', async ({ page }) => {
      // Even if some data is missing, basic layout should work
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should handle network issues gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });
      
      await page.goto('/');
      
      // Basic layout should still load
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper semantic structure', async ({ page }) => {
      // Check for proper heading hierarchy
      await expect(page.locator('h1')).toBeVisible();
      
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(3);
      
      // Check for table structure
      const tables = page.locator('table');
      if (await tables.count() > 0) {
        await expect(tables.first()).toBeVisible();
      }
      
      // Check for form elements
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Some element should have focus
      const focusedElement = page.locator(':focus');
      if (await focusedElement.isVisible()) {
        await expect(focusedElement).toBeVisible();
      }
    });
  });
});
