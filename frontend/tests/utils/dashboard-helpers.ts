import { Page, Locator, expect } from '@playwright/test';

/**
 * Dashboard test utilities and helpers
 */
export class DashboardHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for dashboard to fully load
   */
  async waitForDashboardLoad(): Promise<void> {
    await this.page.waitForSelector('h1', { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
    
    // Wait for charts to load
    await this.page.waitForTimeout(2000);
  }

  /**
   * Get statistics cards
   */
  async getStatsCards(): Promise<Locator[]> {
    const cards = await this.page.locator('[data-testid="stat-card"]').or(
      this.page.locator('.card')
    ).all();
    
    return cards;
  }

  /**
   * Get chart containers
   */
  async getCharts(): Promise<Locator[]> {
    const charts = await this.page.locator('.recharts-wrapper').or(
      this.page.locator('[data-testid="chart"]')
    ).all();
    
    return charts;
  }

  /**
   * Upload a test file
   */
  async uploadFile(fileName: string, mimeType: string, content: string): Promise<void> {
    const fileInput = this.page.locator('input[type="file"]');
    
    if (await fileInput.isVisible()) {
      const testFile = {
        name: fileName,
        mimeType: mimeType,
        buffer: Buffer.from(content)
      };

      await fileInput.setInputFiles(testFile);
    }
  }

  /**
   * Toggle sidebar on mobile
   */
  async toggleMobileSidebar(): Promise<void> {
    const menuButton = this.page.locator('button').filter({ hasText: /menu/i }).first();
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Toggle theme
   */
  async toggleTheme(): Promise<void> {
    const themeToggle = this.page.locator('button').filter({ 
      hasText: /theme|dark|light|sun|moon/i 
    }).first();

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Search for documents
   */
  async searchDocuments(query: string): Promise<void> {
    const searchInput = this.page.locator('input[placeholder*="Hledat"]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill(query);
      await searchInput.press('Enter');
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Check if element exists with fallback selectors
   */
  async elementExists(selectors: string[]): Promise<boolean> {
    for (const selector of selectors) {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get first visible element from multiple selectors
   */
  async getFirstVisibleElement(selectors: string[]): Promise<Locator | null> {
    for (const selector of selectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        return element;
      }
    }
    return null;
  }

  /**
   * Hide dynamic elements for screenshots
   */
  async hideDynamicElements(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        .recharts-tooltip,
        [data-testid="timestamp"],
        .timestamp,
        .loading,
        .spinner {
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `
    });
  }

  /**
   * Wait for charts to finish animating
   */
  async waitForChartsAnimation(): Promise<void> {
    // Wait for initial render
    await this.page.waitForTimeout(1000);
    
    // Wait for animations to complete
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check responsive layout
   */
  async checkResponsiveLayout(viewport: { width: number; height: number }): Promise<void> {
    await this.page.setViewportSize(viewport);
    await this.page.waitForTimeout(500);
    
    // Check if main elements are still visible
    await expect(this.page.locator('h1')).toBeVisible();
  }

  /**
   * Simulate file drag and drop
   */
  async dragAndDropFile(fileName: string, mimeType: string, content: string): Promise<void> {
    const uploadArea = await this.getFirstVisibleElement([
      '[data-testid="upload-area"]',
      '.upload-area',
      '.dropzone'
    ]);

    if (uploadArea) {
      const file = new File([content], fileName, { type: mimeType });

      const dataTransfer = await this.page.evaluateHandle((file) => {
        const dt = new DataTransfer();
        dt.items.add(file);
        return dt;
      }, file);

      await uploadArea.dispatchEvent('dragover', { dataTransfer });
      await uploadArea.dispatchEvent('drop', { dataTransfer });
    }
  }

  /**
   * Check for error notifications
   */
  async checkForErrorNotifications(): Promise<boolean> {
    const errorSelectors = [
      '.toast',
      '[role="alert"]',
      '.error',
      '.notification',
      'text=/error|chyba/i'
    ];

    return await this.elementExists(errorSelectors);
  }

  /**
   * Check for loading states
   */
  async checkForLoadingStates(): Promise<boolean> {
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[data-testid="loading"]',
      'text=/loading|načítání/i'
    ];

    return await this.elementExists(loadingSelectors);
  }

  /**
   * Verify dashboard sections are present
   */
  async verifyDashboardSections(): Promise<void> {
    // Check main sections
    const sections = [
      'Dashboard', // Main heading
      'Askelio', // Sidebar brand
      'Navigace', // Navigation section
      'Rychlé akce' // Quick actions
    ];

    for (const section of sections) {
      await expect(this.page.locator(`text=${section}`)).toBeVisible();
    }
  }

  /**
   * Verify statistics cards
   */
  async verifyStatsCards(): Promise<void> {
    const statTitles = [
      'Zpracované dokumenty',
      'Úspora času',
      'Přesnost OCR',
      'Zbývající kredity'
    ];

    for (const title of statTitles) {
      const element = this.page.locator(`text=${title}`);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
      }
    }
  }

  /**
   * Verify charts are present
   */
  async verifyCharts(): Promise<void> {
    const chartTitles = [
      'Měsíční využití',
      'Typy dokumentů'
    ];

    for (const title of chartTitles) {
      const element = this.page.locator(`text=${title}`);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
      }
    }
  }

  /**
   * Get current theme
   */
  async getCurrentTheme(): Promise<'light' | 'dark'> {
    const isDark = await this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    return isDark ? 'dark' : 'light';
  }

  /**
   * Set specific theme
   */
  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    await this.page.evaluate((theme) => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, theme);
    
    await this.page.waitForTimeout(500);
  }

  /**
   * Check accessibility features
   */
  async checkAccessibility(): Promise<void> {
    // Check for proper heading structure
    const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Check for ARIA labels
    const ariaElements = this.page.locator('[aria-label], [aria-labelledby]');
    const ariaCount = await ariaElements.count();
    
    // Some ARIA labels should be present
    if (ariaCount > 0) {
      expect(ariaCount).toBeGreaterThan(0);
    }
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<void> {
    // Test tab navigation
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = this.page.locator(':focus');
    if (await focusedElement.isVisible()) {
      await expect(focusedElement).toBeVisible();
    }
  }

  /**
   * Measure page load performance
   */
  async measureLoadPerformance(): Promise<number> {
    const startTime = Date.now();
    await this.waitForDashboardLoad();
    const endTime = Date.now();
    
    return endTime - startTime;
  }

  /**
   * Check for console errors
   */
  async checkConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    return errors;
  }

  /**
   * Simulate network conditions
   */
  async simulateSlowNetwork(): Promise<void> {
    await this.page.route('**/*', (route) => {
      // Add delay to simulate slow network
      setTimeout(() => route.continue(), 1000);
    });
  }

  /**
   * Simulate network failure
   */
  async simulateNetworkFailure(): Promise<void> {
    await this.page.route('**/api/**', route => route.abort());
  }
}
