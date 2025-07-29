/**
 * Legacy Analytics Test (DEPRECATED)
 * This test is kept for reference but should be replaced with ai-analytics.spec.js
 * Tests the old mock analytics HTML page
 */

const { test, expect } = require('@playwright/test');

test.describe('Legacy Analytics Dashboard (DEPRECATED)', () => {
  test.skip('should display analytics with mock data', async ({ page }) => {
    // DEPRECATED: This test uses hardcoded file path and tests mock HTML
    // Use ai-analytics.spec.js for testing real application analytics

    console.log('⚠️ This test is deprecated. Use ai-analytics.spec.js instead.');
  });

  test.skip('should format numbers correctly', async ({ page }) => {
    // DEPRECATED: This test uses hardcoded file path and tests mock HTML
    // Use ai-analytics.spec.js for testing real application analytics

    console.log('⚠️ This test is deprecated. Use ai-analytics.spec.js instead.');
  });
});
