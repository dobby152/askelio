import { test, expect } from '@playwright/test';

test.describe('Dashboard Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Wait for charts and dynamic content to load
    await page.waitForTimeout(2000);
  });

  test.describe('Full Page Screenshots', () => {
    test('should match dashboard layout on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Wait for all content to load
      await page.waitForLoadState('networkidle');
      
      // Hide dynamic elements that change frequently
      await page.addStyleTag({
        content: `
          .recharts-tooltip,
          [data-testid="timestamp"],
          .timestamp {
            visibility: hidden !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot('dashboard-desktop.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('should match dashboard layout on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.waitForLoadState('networkidle');
      
      await page.addStyleTag({
        content: `
          .recharts-tooltip,
          [data-testid="timestamp"],
          .timestamp {
            visibility: hidden !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('should match dashboard layout on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.waitForLoadState('networkidle');
      
      await page.addStyleTag({
        content: `
          .recharts-tooltip,
          [data-testid="timestamp"],
          .timestamp {
            visibility: hidden !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('Component Screenshots', () => {
    test('should match statistics cards layout', async ({ page }) => {
      const statsSection = page.locator('[data-testid="stats-cards"]').or(
        page.locator('.stats-cards').first()
      ).or(
        page.locator('text=Zpracované dokumenty').locator('..').locator('..')
      );

      if (await statsSection.isVisible()) {
        await expect(statsSection).toHaveScreenshot('stats-cards.png', {
          threshold: 0.2
        });
      } else {
        // Fallback: screenshot the area where stats should be
        const statsArea = page.locator('h1').locator('xpath=following-sibling::*[1]');
        if (await statsArea.isVisible()) {
          await expect(statsArea).toHaveScreenshot('stats-area.png', {
            threshold: 0.2
          });
        }
      }
    });

    test('should match charts section layout', async ({ page }) => {
      const chartsSection = page.locator('[data-testid="charts-section"]').or(
        page.locator('.charts-section')
      ).or(
        page.locator('text=Měsíční využití').locator('..').locator('..')
      );

      if (await chartsSection.isVisible()) {
        // Hide tooltips and dynamic elements
        await page.addStyleTag({
          content: `
            .recharts-tooltip {
              display: none !important;
            }
          `
        });

        await expect(chartsSection).toHaveScreenshot('charts-section.png', {
          threshold: 0.3
        });
      }
    });

    test('should match upload area layout', async ({ page }) => {
      const uploadArea = page.locator('[data-testid="upload-area"]').or(
        page.locator('.upload-area')
      ).or(
        page.locator('text=Nahrát').locator('..').locator('..')
      );

      if (await uploadArea.isVisible()) {
        await expect(uploadArea).toHaveScreenshot('upload-area.png', {
          threshold: 0.2
        });
      }
    });

    test('should match sidebar layout', async ({ page }) => {
      const sidebar = page.locator('[data-testid="sidebar"]').or(
        page.locator('.sidebar')
      ).or(
        page.locator('text=Askelio').locator('..').locator('..')
      );

      if (await sidebar.isVisible()) {
        await expect(sidebar).toHaveScreenshot('sidebar.png', {
          threshold: 0.2
        });
      }
    });

    test('should match header layout', async ({ page }) => {
      const header = page.locator('header').or(
        page.locator('[data-testid="header"]')
      ).or(
        page.locator('input[placeholder*="Hledat"]').locator('..').locator('..')
      );

      if (await header.isVisible()) {
        await expect(header).toHaveScreenshot('header.png', {
          threshold: 0.2
        });
      }
    });
  });

  test.describe('Theme Screenshots', () => {
    test('should match light theme appearance', async ({ page }) => {
      // Ensure light theme is active
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });

      await page.waitForTimeout(500);

      await page.addStyleTag({
        content: `
          .recharts-tooltip,
          [data-testid="timestamp"],
          .timestamp {
            visibility: hidden !important;
          }
        `
      });

      await expect(page).toHaveScreenshot('dashboard-light-theme.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('should match dark theme appearance', async ({ page }) => {
      // Ensure dark theme is active
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      await page.waitForTimeout(500);

      await page.addStyleTag({
        content: `
          .recharts-tooltip,
          [data-testid="timestamp"],
          .timestamp {
            visibility: hidden !important;
          }
        `
      });

      await expect(page).toHaveScreenshot('dashboard-dark-theme.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('Interactive State Screenshots', () => {
    test('should match hover states', async ({ page }) => {
      const firstCard = page.locator('.card').first().or(
        page.locator('[data-testid="stat-card"]').first()
      );

      if (await firstCard.isVisible()) {
        await firstCard.hover();
        await page.waitForTimeout(300);

        await expect(firstCard).toHaveScreenshot('card-hover-state.png', {
          threshold: 0.2
        });
      }
    });

    test('should match mobile menu open state', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const menuButton = page.locator('button').filter({ hasText: /menu/i }).first();
      
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('mobile-menu-open.png', {
          fullPage: true,
          threshold: 0.3
        });
      }
    });

    test('should match file upload states', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        const testFile = {
          name: 'visual-test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('visual test content')
        };

        await fileInput.setInputFiles(testFile);
        await page.waitForTimeout(1000);

        const uploadArea = page.locator('[data-testid="upload-area"]').or(
          page.locator('.upload-area')
        ).or(
          page.locator('text=visual-test.pdf').locator('..').locator('..')
        );

        if (await uploadArea.isVisible()) {
          await expect(uploadArea).toHaveScreenshot('upload-with-file.png', {
            threshold: 0.3
          });
        }
      }
    });
  });

  test.describe('Chart Visual Tests', () => {
    test('should match bar chart appearance', async ({ page }) => {
      const barChart = page.locator('.recharts-bar-chart').or(
        page.locator('[data-testid="monthly-chart"]')
      ).or(
        page.locator('text=Měsíční využití').locator('..').locator('..')
      );

      if (await barChart.isVisible()) {
        await page.addStyleTag({
          content: `
            .recharts-tooltip {
              display: none !important;
            }
          `
        });

        await expect(barChart).toHaveScreenshot('bar-chart.png', {
          threshold: 0.3
        });
      }
    });

    test('should match pie chart appearance', async ({ page }) => {
      const pieChart = page.locator('.recharts-pie-chart').or(
        page.locator('[data-testid="document-types-chart"]')
      ).or(
        page.locator('text=Typy dokumentů').locator('..').locator('..')
      );

      if (await pieChart.isVisible()) {
        await page.addStyleTag({
          content: `
            .recharts-tooltip {
              display: none !important;
            }
          `
        });

        await expect(pieChart).toHaveScreenshot('pie-chart.png', {
          threshold: 0.3
        });
      }
    });

    test('should match line chart appearance', async ({ page }) => {
      const lineChart = page.locator('.recharts-line-chart').or(
        page.locator('[data-testid="accuracy-chart"]')
      ).or(
        page.locator('text=Přesnost').locator('..').locator('..')
      );

      if (await lineChart.isVisible()) {
        await page.addStyleTag({
          content: `
            .recharts-tooltip {
              display: none !important;
            }
          `
        });

        await expect(lineChart).toHaveScreenshot('line-chart.png', {
          threshold: 0.3
        });
      }
    });
  });

  test.describe('Error State Screenshots', () => {
    test('should match error notification appearance', async ({ page }) => {
      // Trigger an error by uploading invalid file
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        const invalidFile = {
          name: 'error-visual.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('invalid content')
        };

        await fileInput.setInputFiles(invalidFile);
        await page.waitForTimeout(1000);

        // Look for error notification
        const errorNotification = page.locator('.toast').or(
          page.locator('[role="alert"]')
        ).or(
          page.locator('text=/nepodporovaný/i').locator('..')
        );

        if (await errorNotification.isVisible()) {
          await expect(errorNotification).toHaveScreenshot('error-notification.png', {
            threshold: 0.2
          });
        }
      }
    });

    test('should match loading state appearance', async ({ page }) => {
      // Reload page and capture loading state
      await page.reload();
      
      // Try to capture loading state quickly
      await page.waitForTimeout(100);
      
      const loadingElements = page.locator('text=/loading|načítání/i').or(
        page.locator('[data-testid="loading"]')
      ).or(
        page.locator('.loading')
      );

      if (await loadingElements.count() > 0) {
        await expect(loadingElements.first()).toHaveScreenshot('loading-state.png', {
          threshold: 0.2
        });
      }
    });
  });

  test.describe('Responsive Breakpoint Screenshots', () => {
    const breakpoints = [
      { name: 'xs', width: 320, height: 568 },
      { name: 'sm', width: 640, height: 800 },
      { name: 'md', width: 768, height: 1024 },
      { name: 'lg', width: 1024, height: 768 },
      { name: 'xl', width: 1280, height: 800 },
      { name: '2xl', width: 1536, height: 864 }
    ];

    for (const breakpoint of breakpoints) {
      test(`should match layout at ${breakpoint.name} breakpoint`, async ({ page }) => {
        await page.setViewportSize({ 
          width: breakpoint.width, 
          height: breakpoint.height 
        });

        await page.waitForTimeout(500);

        await page.addStyleTag({
          content: `
            .recharts-tooltip,
            [data-testid="timestamp"],
            .timestamp {
              visibility: hidden !important;
            }
          `
        });

        await expect(page).toHaveScreenshot(`dashboard-${breakpoint.name}.png`, {
          fullPage: true,
          threshold: 0.3
        });
      });
    }
  });

  test.describe('Animation Screenshots', () => {
    test('should capture chart animation frames', async ({ page }) => {
      // Reload to trigger chart animations
      await page.reload();
      await page.waitForSelector('h1');

      // Wait for charts to start animating
      await page.waitForTimeout(500);

      const chartContainer = page.locator('.recharts-wrapper').first();
      
      if (await chartContainer.isVisible()) {
        // Capture animation at different stages
        await expect(chartContainer).toHaveScreenshot('chart-animation-start.png', {
          threshold: 0.4
        });

        await page.waitForTimeout(1000);

        await expect(chartContainer).toHaveScreenshot('chart-animation-mid.png', {
          threshold: 0.4
        });

        await page.waitForTimeout(1000);

        await expect(chartContainer).toHaveScreenshot('chart-animation-end.png', {
          threshold: 0.4
        });
      }
    });
  });
});
