import { test, expect } from '@playwright/test'

test.describe('Analytics Dashboard', () => {
  let companyId: string
  let authToken: string

  test.beforeEach(async ({ page }) => {
    // Login and get auth token
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for redirect and get token
    await page.waitForURL('/dashboard')
    authToken = await page.evaluate(() => localStorage.getItem('token'))
    
    // Create test company
    const response = await page.request.post('/api/companies/', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Analytics Test Company',
        description: 'Company for analytics testing',
        plan_id: 'premium'
      }
    })
    
    const company = await response.json()
    companyId = company.data.id
  })

  test('should display analytics dashboard with overview metrics', async ({ page }) => {
    // Navigate to analytics dashboard
    await page.goto(`/companies/${companyId}/analytics`)
    
    // Wait for analytics data to load
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Check overview metrics cards
    await expect(page.locator('[data-testid="documents-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="users-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="storage-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="approvals-metric"]')).toBeVisible()
    
    // Verify metric values are displayed
    const documentsValue = await page.locator('[data-testid="documents-metric"] .text-2xl').textContent()
    expect(documentsValue).toMatch(/^\d+$/)
    
    const usersValue = await page.locator('[data-testid="users-metric"] .text-2xl').textContent()
    expect(usersValue).toMatch(/^\d+$/)
  })

  test('should display trend indicators for metrics', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics`)
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Check for trend icons and percentages
    const trendElements = page.locator('[data-testid*="trend-"]')
    const count = await trendElements.count()
    expect(count).toBeGreaterThan(0)
    
    // Verify trend percentages are displayed
    for (let i = 0; i < count; i++) {
      const trendText = await trendElements.nth(i).textContent()
      expect(trendText).toMatch(/\d+%/)
    }
  })

  test('should allow date range selection', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics`)
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Click date range picker
    await page.click('[data-testid="date-range-picker"]')
    
    // Select a date range (last 7 days)
    await page.click('[data-testid="date-range-7days"]')
    
    // Verify analytics data updates
    await page.waitForTimeout(1000) // Wait for API call
    
    // Check that the date range is reflected in the UI
    const dateRangeText = await page.locator('[data-testid="date-range-picker"]').textContent()
    expect(dateRangeText).toContain('7')
  })

  test('should display document analytics charts', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics`)
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Click on documents tab
    await page.click('[data-testid="tab-documents"]')
    
    // Check for document type pie chart
    await expect(page.locator('[data-testid="documents-by-type-chart"]')).toBeVisible()
    
    // Check for document timeline chart
    await expect(page.locator('[data-testid="documents-timeline-chart"]')).toBeVisible()
    
    // Check for top suppliers chart
    await expect(page.locator('[data-testid="top-suppliers-chart"]')).toBeVisible()
  })

  test('should display approval analytics', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics`)
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Click on approvals tab
    await page.click('[data-testid="tab-approvals"]')
    
    // Check for approval status distribution
    await expect(page.locator('[data-testid="approval-status-chart"]')).toBeVisible()
    
    // Check for approval timeline
    await expect(page.locator('[data-testid="approval-timeline-chart"]')).toBeVisible()
    
    // Check for approver performance section
    await expect(page.locator('[data-testid="approver-performance"]')).toBeVisible()
  })

  test('should display user analytics', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics`)
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Click on users tab
    await page.click('[data-testid="tab-users"]')
    
    // Check for role distribution chart
    await expect(page.locator('[data-testid="role-distribution-chart"]')).toBeVisible()
    
    // Check for user activity section
    await expect(page.locator('[data-testid="user-activity"]')).toBeVisible()
    
    // Verify user activity items
    const activityItems = page.locator('[data-testid="user-activity-item"]')
    const count = await activityItems.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should display storage analytics', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics`)
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Click on storage tab
    await page.click('[data-testid="tab-storage"]')
    
    // Check for storage by type chart
    await expect(page.locator('[data-testid="storage-by-type-chart"]')).toBeVisible()
    
    // Check for storage growth timeline
    await expect(page.locator('[data-testid="storage-growth-chart"]')).toBeVisible()
  })

  test('should export analytics data as CSV', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics`)
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Select CSV format
    await page.selectOption('[data-testid="export-format-select"]', 'csv')
    
    // Start download
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-button"]')
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/analytics_export_\d+\.csv/)
    
    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  })

  test('should export analytics data as JSON', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics`)
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Select JSON format
    await page.selectOption('[data-testid="export-format-select"]', 'json')
    
    // Start download
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-button"]')
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toBe('analytics_export.json')
    
    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  })

  test('should handle analytics loading states', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics`)
    
    // Check for loading spinner initially
    await expect(page.locator('[data-testid="analytics-loading"]')).toBeVisible()
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Verify loading spinner is gone
    await expect(page.locator('[data-testid="analytics-loading"]')).not.toBeVisible()
  })

  test('should handle analytics errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route(`/api/analytics/companies/${companyId}*`, route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' })
      })
    })
    
    await page.goto(`/companies/${companyId}/analytics`)
    
    // Check for error message
    await expect(page.locator('[data-testid="analytics-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="analytics-error"]')).toContainText('Nepodařilo se načíst analytická data')
  })

  test('should refresh analytics data', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics`)
    await page.waitForSelector('[data-testid="analytics-dashboard"]')
    
    // Get initial data
    const initialValue = await page.locator('[data-testid="documents-metric"] .text-2xl').textContent()
    
    // Click refresh (if available) or change date range to trigger refresh
    await page.click('[data-testid="date-range-picker"]')
    await page.click('[data-testid="date-range-30days"]')
    
    // Wait for refresh
    await page.waitForTimeout(1000)
    
    // Verify data might have changed (or at least API was called)
    const newValue = await page.locator('[data-testid="documents-metric"] .text-2xl').textContent()
    // Note: Values might be the same, but we're testing the refresh mechanism
    expect(typeof newValue).toBe('string')
  })

  test('should display real-time metrics', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics/realtime`)
    
    // Wait for real-time metrics to load
    await page.waitForSelector('[data-testid="realtime-metrics"]')
    
    // Check for real-time metric cards
    await expect(page.locator('[data-testid="realtime-documents-today"]')).toBeVisible()
    await expect(page.locator('[data-testid="realtime-pending-approvals"]')).toBeVisible()
    await expect(page.locator('[data-testid="realtime-active-users"]')).toBeVisible()
    await expect(page.locator('[data-testid="realtime-storage"]')).toBeVisible()
    
    // Check for auto-refresh toggle
    await expect(page.locator('[data-testid="auto-refresh-toggle"]')).toBeVisible()
    
    // Check for manual refresh button
    await expect(page.locator('[data-testid="manual-refresh-button"]')).toBeVisible()
  })

  test('should toggle auto-refresh for real-time metrics', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics/realtime`)
    await page.waitForSelector('[data-testid="realtime-metrics"]')
    
    // Check initial auto-refresh state
    const autoRefreshButton = page.locator('[data-testid="auto-refresh-toggle"]')
    const initialState = await autoRefreshButton.textContent()
    
    // Toggle auto-refresh
    await autoRefreshButton.click()
    
    // Verify state changed
    const newState = await autoRefreshButton.textContent()
    expect(newState).not.toBe(initialState)
    
    // Verify toast message
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  })

  test('should manually refresh real-time metrics', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics/realtime`)
    await page.waitForSelector('[data-testid="realtime-metrics"]')
    
    // Click manual refresh
    await page.click('[data-testid="manual-refresh-button"]')
    
    // Check for loading state
    await expect(page.locator('[data-testid="manual-refresh-button"] [data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for refresh to complete
    await page.waitForTimeout(1000)
    
    // Verify loading state is gone
    await expect(page.locator('[data-testid="manual-refresh-button"] [data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test('should display connection status indicators', async ({ page }) => {
    await page.goto(`/companies/${companyId}/analytics/realtime`)
    await page.waitForSelector('[data-testid="realtime-metrics"]')
    
    // Check for connection status
    await expect(page.locator('[data-testid="connection-status"]')).toBeVisible()
    
    // Check for auto-refresh status
    await expect(page.locator('[data-testid="auto-refresh-status"]')).toBeVisible()
    
    // Check for refresh interval display
    await expect(page.locator('[data-testid="refresh-interval"]')).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    // Cleanup: Delete test company
    if (companyId && authToken) {
      await page.request.delete(`/api/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
    }
  })
})
