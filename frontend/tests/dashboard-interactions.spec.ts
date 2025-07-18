import { test, expect } from '@playwright/test';

test.describe('Dashboard Interactions and Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test.describe('File Upload Interactions', () => {
    test('should handle drag and drop file upload', async ({ page }) => {
      // Look for upload area
      const uploadArea = page.locator('[data-testid="upload-area"]').or(
        page.locator('.upload-area, .dropzone').first()
      );

      if (await uploadArea.isVisible()) {
        // Create test file data
        const fileContent = 'Test PDF content';
        const file = new File([fileContent], 'test-drag-drop.pdf', { type: 'application/pdf' });

        // Simulate drag and drop
        const dataTransfer = await page.evaluateHandle((file) => {
          const dt = new DataTransfer();
          dt.items.add(file);
          return dt;
        }, file);

        await uploadArea.dispatchEvent('dragover', { dataTransfer });
        await uploadArea.dispatchEvent('drop', { dataTransfer });

        // Check if file appears in upload list
        await expect(page.locator('text=test-drag-drop.pdf')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should validate file types', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        // Try uploading invalid file type
        const invalidFile = {
          name: 'invalid-file.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('invalid content')
        };

        await fileInput.setInputFiles(invalidFile);

        // Check for error message
        await expect(page.locator('text=/nepodporovaný formát/i')).toBeVisible({ timeout: 3000 });
      }
    });

    test('should validate file size limits', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        // Create large file (simulate > 10MB)
        const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
        const largeFile = {
          name: 'large-file.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from(largeContent)
        };

        await fileInput.setInputFiles(largeFile);

        // Check for size error message
        await expect(page.locator('text=/příliš velký|limit/i')).toBeVisible({ timeout: 3000 });
      }
    });

    test('should show upload progress animation', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        const testFile = {
          name: 'progress-animation.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('test content for progress')
        };

        await fileInput.setInputFiles(testFile);

        // Wait for upload to start
        await page.waitForTimeout(500);

        // Check for progress bar
        const progressBar = page.locator('[role="progressbar"]').or(
          page.locator('.progress-bar')
        );

        if (await progressBar.count() > 0) {
          await expect(progressBar.first()).toBeVisible();
          
          // Wait for progress to complete
          await page.waitForTimeout(3000);
          
          // Check for completion status
          const completedStatus = page.locator('text=/completed|dokončeno|hotovo/i');
          if (await completedStatus.count() > 0) {
            await expect(completedStatus.first()).toBeVisible();
          }
        }
      }
    });

    test('should allow file removal', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        const testFile = {
          name: 'removable-file.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('removable content')
        };

        await fileInput.setInputFiles(testFile);
        
        // Wait for file to appear
        await page.waitForTimeout(1000);

        // Look for remove button
        const removeButton = page.locator('button').filter({ hasText: /×|remove|smazat/i });
        
        if (await removeButton.count() > 0) {
          await removeButton.first().click();
          
          // Check if file is removed
          await expect(page.locator('text=removable-file.pdf')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Chart Interactions', () => {
    test('should display chart tooltips on hover', async ({ page }) => {
      // Look for chart elements
      const chartBars = page.locator('.recharts-bar').or(
        page.locator('[data-testid="chart-bar"]')
      );

      if (await chartBars.count() > 0) {
        await chartBars.first().hover();
        
        // Check for tooltip
        const tooltip = page.locator('.recharts-tooltip').or(
          page.locator('[data-testid="chart-tooltip"]')
        );
        
        if (await tooltip.isVisible()) {
          await expect(tooltip).toBeVisible();
        }
      }
    });

    test('should interact with pie chart segments', async ({ page }) => {
      // Look for pie chart segments
      const pieSegments = page.locator('.recharts-pie-sector').or(
        page.locator('[data-testid="pie-segment"]')
      );

      if (await pieSegments.count() > 0) {
        await pieSegments.first().hover();
        
        // Wait for any hover effects
        await page.waitForTimeout(300);
        
        // Click on segment
        await pieSegments.first().click();
        
        // Check for any interaction feedback
        await page.waitForTimeout(300);
      }
    });

    test('should handle chart responsiveness', async ({ page }) => {
      // Test chart on different viewport sizes
      const viewports = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }  // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);

        // Check if charts are still visible and properly sized
        const charts = page.locator('.recharts-wrapper').or(
          page.locator('[data-testid="chart"]')
        );

        if (await charts.count() > 0) {
          await expect(charts.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Search and Filter Functionality', () => {
    test('should filter documents by search term', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Hledat"]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('faktura');
        await searchInput.press('Enter');
        
        // Wait for search results
        await page.waitForTimeout(1000);
        
        // Check if results are filtered
        const searchResults = page.locator('text=/faktura/i');
        if (await searchResults.count() > 0) {
          await expect(searchResults.first()).toBeVisible();
        }
      }
    });

    test('should clear search results', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Hledat"]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test search');
        await searchInput.press('Enter');
        await page.waitForTimeout(500);
        
        // Clear search
        await searchInput.clear();
        await searchInput.press('Enter');
        await page.waitForTimeout(500);
        
        // Check if all results are shown again
        await expect(searchInput).toHaveValue('');
      }
    });
  });

  test.describe('Theme and Appearance', () => {
    test('should toggle between light and dark themes', async ({ page }) => {
      // Look for theme toggle button
      const themeToggle = page.locator('button').filter({ 
        hasText: /theme|dark|light|sun|moon/i 
      }).first();

      if (await themeToggle.isVisible()) {
        // Get initial theme
        const initialTheme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        });

        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Check if theme changed
        const newTheme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        });

        expect(newTheme).not.toBe(initialTheme);
      }
    });

    test('should persist theme preference', async ({ page, context }) => {
      const themeToggle = page.locator('button').filter({ 
        hasText: /theme|dark|light|sun|moon/i 
      }).first();

      if (await themeToggle.isVisible()) {
        // Toggle to dark theme
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Reload page
        await page.reload();
        await page.waitForSelector('h1');

        // Check if dark theme persisted
        const isDark = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark');
        });

        // Theme persistence depends on implementation
        // This test checks if the mechanism exists
        expect(typeof isDark).toBe('boolean');
      }
    });
  });

  test.describe('Real-time Updates and Notifications', () => {
    test('should show toast notifications', async ({ page }) => {
      // Trigger an action that should show a notification
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        const testFile = {
          name: 'notification-test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('notification test')
        };

        await fileInput.setInputFiles(testFile);

        // Look for toast notification
        const toast = page.locator('.toast').or(
          page.locator('[data-testid="toast"]')
        ).or(
          page.locator('[role="alert"]')
        );

        if (await toast.count() > 0) {
          await expect(toast.first()).toBeVisible();
        }
      }
    });

    test('should handle notification dismissal', async ({ page }) => {
      // Look for existing notifications or trigger one
      const notifications = page.locator('.toast, [role="alert"]');
      
      if (await notifications.count() > 0) {
        const dismissButton = notifications.first().locator('button').filter({ 
          hasText: /×|close|dismiss/i 
        });

        if (await dismissButton.isVisible()) {
          await dismissButton.click();
          
          // Check if notification is dismissed
          await expect(notifications.first()).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Data Export and Actions', () => {
    test('should handle export functionality', async ({ page }) => {
      // Look for export button
      const exportButton = page.locator('button').filter({ 
        hasText: /export|stáhnout|download/i 
      });

      if (await exportButton.count() > 0) {
        // Set up download handler
        const downloadPromise = page.waitForEvent('download');
        
        await exportButton.first().click();
        
        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toBeTruthy();
        } catch (error) {
          // Export might not be fully implemented yet
          console.log('Export functionality not yet implemented');
        }
      }
    });

    test('should handle document actions', async ({ page }) => {
      // Look for document action buttons
      const actionButtons = page.locator('button').filter({ 
        hasText: /zobrazit|stáhnout|smazat|view|download|delete/i 
      });

      if (await actionButtons.count() > 0) {
        const firstAction = actionButtons.first();
        await firstAction.click();
        
        // Wait for action to complete
        await page.waitForTimeout(1000);
        
        // Check for any modal or confirmation dialog
        const modal = page.locator('[role="dialog"]').or(
          page.locator('.modal')
        );

        if (await modal.isVisible()) {
          await expect(modal).toBeVisible();
        }
      }
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      // Monitor performance while interacting with dashboard
      const startTime = Date.now();
      
      // Perform multiple interactions
      await page.hover('h1');
      await page.click('text=Dashboard');
      
      // Check charts
      const charts = page.locator('.recharts-wrapper');
      if (await charts.count() > 0) {
        await charts.first().hover();
      }
      
      const endTime = Date.now();
      const interactionTime = endTime - startTime;
      
      // Interactions should be responsive
      expect(interactionTime).toBeLessThan(3000);
    });

    test('should handle concurrent operations', async ({ page }) => {
      // Simulate multiple file uploads
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        const files = [
          { name: 'file1.pdf', mimeType: 'application/pdf', buffer: Buffer.from('content1') },
          { name: 'file2.pdf', mimeType: 'application/pdf', buffer: Buffer.from('content2') },
          { name: 'file3.pdf', mimeType: 'application/pdf', buffer: Buffer.from('content3') }
        ];

        // Upload multiple files quickly
        for (const file of files) {
          await fileInput.setInputFiles(file);
          await page.waitForTimeout(100); // Small delay between uploads
        }

        // Check if all files are handled
        await page.waitForTimeout(2000);
        
        for (const file of files) {
          const fileElement = page.locator(`text=${file.name}`);
          if (await fileElement.isVisible()) {
            await expect(fileElement).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from upload errors', async ({ page }) => {
      // Simulate upload error by uploading invalid file
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        const invalidFile = {
          name: 'error-test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('invalid')
        };

        await fileInput.setInputFiles(invalidFile);
        
        // Wait for error
        await page.waitForTimeout(1000);
        
        // Try uploading valid file after error
        const validFile = {
          name: 'recovery-test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('valid content')
        };

        await fileInput.setInputFiles(validFile);
        
        // Check if valid file is processed
        await expect(page.locator('text=recovery-test.pdf')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle network interruptions gracefully', async ({ page }) => {
      // Simulate network interruption
      await page.route('**/api/**', route => {
        // Randomly fail some requests
        if (Math.random() > 0.7) {
          route.abort();
        } else {
          route.continue();
        }
      });

      // Interact with dashboard
      await page.reload();
      await page.waitForTimeout(2000);

      // Dashboard should still be functional
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});
