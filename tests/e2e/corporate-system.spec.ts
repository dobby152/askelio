import { test, expect } from '@playwright/test'

// Test data
const testCompany = {
  name: 'Test Corporation s.r.o.',
  legal_name: 'Test Corporation společnost s ručením omezeným',
  registration_number: '12345678',
  tax_number: 'CZ12345678',
  email: 'info@testcorp.cz',
  phone: '+420 123 456 789',
  website: 'https://www.testcorp.cz',
  address_line1: 'Testovací 123',
  city: 'Praha',
  postal_code: '11000',
  country: 'CZ'
}

const testUsers = [
  {
    email: 'admin@testcorp.cz',
    role: 'admin',
    name: 'Test Admin'
  },
  {
    email: 'manager@testcorp.cz', 
    role: 'manager',
    name: 'Test Manager'
  },
  {
    email: 'user@testcorp.cz',
    role: 'user', 
    name: 'Test User'
  }
]

test.describe('Corporate System E2E Tests', () => {
  let companyId: string
  let authToken: string

  test.beforeAll(async ({ request }) => {
    // Setup: Create test user and authenticate
    const authResponse = await request.post('/api/auth/register', {
      data: {
        email: 'owner@testcorp.cz',
        password: 'TestPassword123!',
        full_name: 'Test Owner'
      }
    })
    
    expect(authResponse.ok()).toBeTruthy()
    const authData = await authResponse.json()
    authToken = authData.access_token
  })

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test company and users
    if (companyId) {
      await request.delete(`/api/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
    }
  })

  test('should create and configure a company', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'owner@testcorp.cz')
    await page.fill('[data-testid="password"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard')

    // Navigate to company creation
    await page.click('[data-testid="create-company-button"]')
    await expect(page).toHaveURL('/companies/create')

    // Fill company form
    await page.fill('[data-testid="company-name"]', testCompany.name)
    await page.fill('[data-testid="legal-name"]', testCompany.legal_name)
    await page.fill('[data-testid="registration-number"]', testCompany.registration_number)
    await page.fill('[data-testid="tax-number"]', testCompany.tax_number)
    await page.fill('[data-testid="email"]', testCompany.email)
    await page.fill('[data-testid="phone"]', testCompany.phone)
    await page.fill('[data-testid="website"]', testCompany.website)
    await page.fill('[data-testid="address-line1"]', testCompany.address_line1)
    await page.fill('[data-testid="city"]', testCompany.city)
    await page.fill('[data-testid="postal-code"]', testCompany.postal_code)

    // Submit form
    await page.click('[data-testid="create-company-submit"]')
    
    // Wait for success and extract company ID from URL
    await expect(page).toHaveURL(/\/companies\/[a-f0-9-]+\/settings/)
    companyId = page.url().match(/\/companies\/([a-f0-9-]+)\//)?.[1] || ''
    
    // Verify company was created
    await expect(page.locator('[data-testid="company-name-display"]')).toHaveText(testCompany.name)
  })

  test('should manage company settings', async ({ page }) => {
    // Navigate to company settings
    await page.goto(`/companies/${companyId}/settings`)
    
    // Test basic information tab
    await expect(page.locator('[data-testid="basic-tab"]')).toBeVisible()
    await page.click('[data-testid="basic-tab"]')
    
    // Update company information
    await page.fill('[data-testid="company-website"]', 'https://updated.testcorp.cz')
    await page.click('[data-testid="save-basic-info"]')
    
    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()

    // Test usage and limits tab
    await page.click('[data-testid="usage-tab"]')
    await expect(page.locator('[data-testid="users-usage"]')).toBeVisible()
    await expect(page.locator('[data-testid="documents-usage"]')).toBeVisible()
    await expect(page.locator('[data-testid="storage-usage"]')).toBeVisible()

    // Test plan upgrade tab
    await page.click('[data-testid="plan-tab"]')
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('Free')
    
    // Test upgrade to basic plan
    await page.click('[data-testid="upgrade-to-basic"]')
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('Basic')

    // Test workflow settings tab
    await page.click('[data-testid="workflow-tab"]')
    await page.check('[data-testid="enable-approval-workflow"]')
    await page.click('[data-testid="save-workflow-settings"]')
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  })

  test('should manage users and roles', async ({ page }) => {
    // Navigate to user management
    await page.goto(`/companies/${companyId}/users`)
    
    // Verify page loaded
    await expect(page.locator('[data-testid="user-management-title"]')).toBeVisible()
    
    // Test inviting users
    for (const user of testUsers) {
      await page.click('[data-testid="invite-user-button"]')
      await expect(page.locator('[data-testid="invite-dialog"]')).toBeVisible()
      
      await page.fill('[data-testid="invite-email"]', user.email)
      await page.selectOption('[data-testid="invite-role"]', user.role)
      await page.click('[data-testid="send-invitation"]')
      
      // Verify success
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
      await expect(page.locator('[data-testid="invite-dialog"]')).not.toBeVisible()
    }

    // Verify users appear in table
    for (const user of testUsers) {
      await expect(page.locator(`[data-testid="user-row-${user.email}"]`)).toBeVisible()
      await expect(page.locator(`[data-testid="user-role-${user.email}"]`)).toContainText(user.role)
    }

    // Test role change
    await page.click(`[data-testid="user-menu-${testUsers[0].email}"]`)
    await page.click('[data-testid="change-role"]')
    await page.selectOption('[data-testid="new-role-select"]', 'manager')
    await page.click('[data-testid="confirm-role-change"]')
    
    // Verify role changed
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    await expect(page.locator(`[data-testid="user-role-${testUsers[0].email}"]`)).toContainText('manager')

    // Test user removal
    await page.click(`[data-testid="user-menu-${testUsers[2].email}"]`)
    await page.click('[data-testid="remove-user"]')
    await page.click('[data-testid="confirm-removal"]')
    
    // Verify user removed
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    await expect(page.locator(`[data-testid="user-row-${testUsers[2].email}"]`)).not.toBeVisible()
  })

  test('should handle document approval workflow', async ({ page }) => {
    // Navigate to approval workflow
    await page.goto(`/companies/${companyId}/approvals`)
    
    // Verify page loaded
    await expect(page.locator('[data-testid="approval-workflow-title"]')).toBeVisible()
    
    // Check pending approvals tab
    await page.click('[data-testid="pending-tab"]')
    await expect(page.locator('[data-testid="pending-approvals-table"]')).toBeVisible()
    
    // Simulate document upload that requires approval (this would normally be done through document upload)
    // For testing, we'll create a mock approval via API
    const mockApproval = await page.evaluate(async (companyId) => {
      const response = await fetch('/api/approvals/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          document_id: 'test-doc-123',
          document_name: 'Test Invoice.pdf',
          document_type: 'invoice',
          company_id: companyId,
          approvers: [
            { email: 'admin@testcorp.cz', step: 1 },
            { email: 'manager@testcorp.cz', step: 2 }
          ]
        })
      })
      return response.json()
    }, companyId)

    // Refresh page to see new approval
    await page.reload()
    
    // Verify approval appears in pending list
    await expect(page.locator('[data-testid="approval-Test Invoice.pdf"]')).toBeVisible()
    
    // Test approval action
    await page.click('[data-testid="approve-Test Invoice.pdf"]')
    await expect(page.locator('[data-testid="approval-dialog"]')).toBeVisible()
    
    await page.fill('[data-testid="approval-comment"]', 'Document looks good, approved.')
    await page.click('[data-testid="confirm-approval"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    
    // Check all approvals tab
    await page.click('[data-testid="all-tab"]')
    await expect(page.locator('[data-testid="all-approvals-table"]')).toBeVisible()
    
    // Verify approval appears with correct status
    await expect(page.locator('[data-testid="approval-status-Test Invoice.pdf"]')).toContainText('approved')
    
    // Test approval detail view
    await page.click('[data-testid="approval-detail-Test Invoice.pdf"]')
    await expect(page.locator('[data-testid="approval-detail-dialog"]')).toBeVisible()
    
    // Verify approval steps and comments
    await expect(page.locator('[data-testid="approval-step-1"]')).toContainText('approved')
    await expect(page.locator('[data-testid="approval-comment-1"]')).toContainText('Document looks good, approved.')
    
    await page.click('[data-testid="close-detail-dialog"]')
  })

  test('should display analytics and usage statistics', async ({ page }) => {
    // Navigate to analytics
    await page.goto(`/companies/${companyId}/analytics`)
    
    // Verify analytics dashboard loaded
    await expect(page.locator('[data-testid="analytics-title"]')).toBeVisible()
    
    // Check key metrics cards
    await expect(page.locator('[data-testid="total-documents-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-approvals-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-users-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="storage-used-metric"]')).toBeVisible()
    
    // Test date range filter
    await page.click('[data-testid="date-range-picker"]')
    await page.click('[data-testid="last-30-days"]')
    
    // Verify charts updated
    await expect(page.locator('[data-testid="documents-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="approvals-chart"]')).toBeVisible()
    
    // Test export functionality
    await page.click('[data-testid="export-analytics"]')
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible()
    
    await page.selectOption('[data-testid="export-format"]', 'csv')
    await page.click('[data-testid="confirm-export"]')
    
    // Verify export started
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  })

  test('should handle plan limits and restrictions', async ({ page }) => {
    // Test user limit on free plan
    await page.goto(`/companies/${companyId}/users`)
    
    // Try to invite more users than plan allows (assuming free plan has limit)
    const freeUserLimit = 5 // Assuming free plan limit
    
    for (let i = 0; i < freeUserLimit + 1; i++) {
      await page.click('[data-testid="invite-user-button"]')
      await page.fill('[data-testid="invite-email"]', `user${i}@testcorp.cz`)
      await page.selectOption('[data-testid="invite-role"]', 'user')
      await page.click('[data-testid="send-invitation"]')
      
      if (i >= freeUserLimit) {
        // Should show limit exceeded error
        await expect(page.locator('[data-testid="error-toast"]')).toContainText('limit')
      } else {
        await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
      }
    }
    
    // Test document upload limit
    await page.goto(`/companies/${companyId}/documents`)
    
    // Try to upload documents beyond monthly limit
    // This would require actual file upload simulation
    
    // Test storage limit
    // This would require uploading large files to test storage limits
    
    // Verify upgrade prompts appear when limits are reached
    await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible()
  })

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/companies/**', route => route.abort())
    
    await page.goto(`/companies/${companyId}/settings`)
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    
    // Restore network
    await page.unroute('**/api/companies/**')
    
    // Test invalid data handling
    await page.goto(`/companies/${companyId}/settings`)
    await page.fill('[data-testid="company-email"]', 'invalid-email')
    await page.click('[data-testid="save-basic-info"]')
    
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
    
    // Test unauthorized access
    await page.evaluate(() => localStorage.removeItem('token'))
    await page.goto(`/companies/${companyId}/settings`)
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto(`/companies/${companyId}/settings`)
    
    // Verify mobile navigation works
    await page.click('[data-testid="mobile-menu-toggle"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test mobile-specific UI elements
    await expect(page.locator('[data-testid="mobile-tabs"]')).toBeVisible()
    
    // Test touch interactions
    await page.tap('[data-testid="usage-tab"]')
    await expect(page.locator('[data-testid="usage-content"]')).toBeVisible()
    
    // Verify responsive tables
    await page.goto(`/companies/${companyId}/users`)
    await expect(page.locator('[data-testid="mobile-user-cards"]')).toBeVisible()
  })

  test('should maintain data consistency across sessions', async ({ page, context }) => {
    // Create data in first session
    await page.goto(`/companies/${companyId}/settings`)
    await page.fill('[data-testid="company-phone"]', '+420 987 654 321')
    await page.click('[data-testid="save-basic-info"]')
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    
    // Open new tab/session
    const newPage = await context.newPage()
    await newPage.goto(`/companies/${companyId}/settings`)
    
    // Verify data persisted
    await expect(newPage.locator('[data-testid="company-phone"]')).toHaveValue('+420 987 654 321')
    
    // Test concurrent modifications
    await page.fill('[data-testid="company-phone"]', '+420 111 222 333')
    await newPage.fill('[data-testid="company-phone"]', '+420 444 555 666')
    
    await page.click('[data-testid="save-basic-info"]')
    await newPage.click('[data-testid="save-basic-info"]')
    
    // Verify conflict handling (last write wins or proper conflict resolution)
    await page.reload()
    const finalValue = await page.locator('[data-testid="company-phone"]').inputValue()
    expect(['+420 111 222 333', '+420 444 555 666']).toContain(finalValue)
  })
})
