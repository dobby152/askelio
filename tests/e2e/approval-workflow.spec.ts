import { test, expect } from '@playwright/test'

test.describe('Approval Workflow E2E Tests', () => {
  let companyId: string
  let authToken: string
  let approvalId: string

  const testUsers = {
    owner: { email: 'owner@workflow.test', password: 'TestPass123!', name: 'Workflow Owner' },
    manager: { email: 'manager@workflow.test', password: 'TestPass123!', name: 'Workflow Manager' },
    user: { email: 'user@workflow.test', password: 'TestPass123!', name: 'Workflow User' },
    accountant: { email: 'accountant@workflow.test', password: 'TestPass123!', name: 'Workflow Accountant' }
  }

  test.beforeAll(async ({ request }) => {
    // Setup test users and company
    for (const user of Object.values(testUsers)) {
      await request.post('/api/auth/register', {
        data: {
          email: user.email,
          password: user.password,
          full_name: user.name
        }
      })
    }

    // Login as owner and create company
    const authResponse = await request.post('/api/auth/login', {
      data: {
        email: testUsers.owner.email,
        password: testUsers.owner.password
      }
    })
    
    const authData = await authResponse.json()
    authToken = authData.access_token

    // Create test company
    const companyResponse = await request.post('/api/companies/', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Workflow Test Company',
        country: 'CZ',
        approval_workflow_enabled: true
      }
    })
    
    const companyData = await companyResponse.json()
    companyId = companyData.data.id

    // Invite other users to company
    await request.post(`/api/companies/${companyId}/users/invite`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { email: testUsers.manager.email, role_name: 'manager' }
    })
    
    await request.post(`/api/companies/${companyId}/users/invite`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { email: testUsers.user.email, role_name: 'user' }
    })
    
    await request.post(`/api/companies/${companyId}/users/invite`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { email: testUsers.accountant.email, role_name: 'accountant' }
    })
  })

  test.afterAll(async ({ request }) => {
    // Cleanup
    if (companyId) {
      await request.delete(`/api/companies/${companyId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
    }
  })

  test('should create multi-step approval workflow', async ({ page }) => {
    // Login as user who will request approval
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.user.email)
    await page.fill('[data-testid="password"]', testUsers.user.password)
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL('/dashboard')

    // Navigate to document upload
    await page.goto(`/companies/${companyId}/documents/upload`)
    
    // Upload document that requires approval
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'test-invoice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content for testing')
    })
    
    // Fill document details
    await page.fill('[data-testid="document-name"]', 'Test Invoice for Approval')
    await page.selectOption('[data-testid="document-type"]', 'invoice')
    await page.fill('[data-testid="supplier-name"]', 'Test Supplier Ltd.')
    await page.fill('[data-testid="total-amount"]', '15000')
    await page.selectOption('[data-testid="currency"]', 'CZK')
    
    // Submit for approval
    await page.click('[data-testid="submit-for-approval"]')
    
    // Verify approval workflow was created
    await expect(page.locator('[data-testid="approval-created-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="approval-workflow-info"]')).toContainText('2 steps')
    
    // Extract approval ID from the page
    approvalId = await page.locator('[data-testid="approval-id"]').textContent() || ''
  })

  test('should handle first approval step', async ({ page }) => {
    // Login as manager (first approver)
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.manager.email)
    await page.fill('[data-testid="password"]', testUsers.manager.password)
    await page.click('[data-testid="login-button"]')
    
    // Navigate to pending approvals
    await page.goto(`/companies/${companyId}/approvals`)
    await page.click('[data-testid="pending-tab"]')
    
    // Verify document appears in pending list
    await expect(page.locator('[data-testid="pending-approval-Test Invoice for Approval"]')).toBeVisible()
    await expect(page.locator('[data-testid="approval-step-1-2"]')).toContainText('Step 1 of 2')
    
    // View document details
    await page.click('[data-testid="view-document-Test Invoice for Approval"]')
    await expect(page.locator('[data-testid="document-preview"]')).toBeVisible()
    await expect(page.locator('[data-testid="document-details"]')).toContainText('Test Supplier Ltd.')
    await expect(page.locator('[data-testid="document-amount"]')).toContainText('15,000 CZK')
    
    // Close preview
    await page.click('[data-testid="close-preview"]')
    
    // Approve document
    await page.click('[data-testid="approve-Test Invoice for Approval"]')
    await expect(page.locator('[data-testid="approval-dialog"]')).toBeVisible()
    
    await page.fill('[data-testid="approval-comment"]', 'Invoice details verified, amount is correct. Approved for next step.')
    await page.click('[data-testid="confirm-approval"]')
    
    // Verify approval success
    await expect(page.locator('[data-testid="approval-success-toast"]')).toBeVisible()
    
    // Verify document moved to next step
    await page.reload()
    await expect(page.locator('[data-testid="pending-approval-Test Invoice for Approval"]')).not.toBeVisible()
    
    // Check in all approvals tab
    await page.click('[data-testid="all-tab"]')
    await expect(page.locator('[data-testid="approval-Test Invoice for Approval"]')).toBeVisible()
    await expect(page.locator('[data-testid="approval-status-Test Invoice for Approval"]')).toContainText('pending')
    await expect(page.locator('[data-testid="approval-progress-Test Invoice for Approval"]')).toContainText('2/2')
  })

  test('should handle second approval step', async ({ page }) => {
    // Login as accountant (second approver)
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.accountant.email)
    await page.fill('[data-testid="password"]', testUsers.accountant.password)
    await page.click('[data-testid="login-button"]')
    
    // Navigate to pending approvals
    await page.goto(`/companies/${companyId}/approvals`)
    await page.click('[data-testid="pending-tab"]')
    
    // Verify document appears for second approval
    await expect(page.locator('[data-testid="pending-approval-Test Invoice for Approval"]')).toBeVisible()
    await expect(page.locator('[data-testid="approval-step-2-2"]')).toContainText('Step 2 of 2')
    
    // View approval history
    await page.click('[data-testid="view-history-Test Invoice for Approval"]')
    await expect(page.locator('[data-testid="approval-history-dialog"]')).toBeVisible()
    
    // Verify first step was approved
    await expect(page.locator('[data-testid="step-1-status"]')).toContainText('approved')
    await expect(page.locator('[data-testid="step-1-approver"]')).toContainText('Workflow Manager')
    await expect(page.locator('[data-testid="step-1-comment"]')).toContainText('Invoice details verified')
    
    await page.click('[data-testid="close-history"]')
    
    // Final approval
    await page.click('[data-testid="approve-Test Invoice for Approval"]')
    await page.fill('[data-testid="approval-comment"]', 'Financial review completed. Invoice approved for processing.')
    await page.click('[data-testid="confirm-approval"]')
    
    // Verify final approval success
    await expect(page.locator('[data-testid="approval-success-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="workflow-completed-toast"]')).toBeVisible()
    
    // Verify document no longer in pending
    await page.reload()
    await expect(page.locator('[data-testid="pending-approval-Test Invoice for Approval"]')).not.toBeVisible()
    
    // Check final status in all approvals
    await page.click('[data-testid="all-tab"]')
    await expect(page.locator('[data-testid="approval-status-Test Invoice for Approval"]')).toContainText('approved')
    await expect(page.locator('[data-testid="approval-completed-Test Invoice for Approval"]')).toBeVisible()
  })

  test('should handle approval rejection', async ({ page }) => {
    // Create another document for rejection test
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.user.email)
    await page.fill('[data-testid="password"]', testUsers.user.password)
    await page.click('[data-testid="login-button"]')
    
    // Upload another document
    await page.goto(`/companies/${companyId}/documents/upload`)
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'reject-test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF for rejection test')
    })
    
    await page.fill('[data-testid="document-name"]', 'Invoice to Reject')
    await page.selectOption('[data-testid="document-type"]', 'invoice')
    await page.fill('[data-testid="supplier-name"]', 'Suspicious Supplier')
    await page.fill('[data-testid="total-amount"]', '999999')
    await page.click('[data-testid="submit-for-approval"]')
    
    // Login as manager to reject
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.manager.email)
    await page.fill('[data-testid="password"]', testUsers.manager.password)
    await page.click('[data-testid="login-button"]')
    
    await page.goto(`/companies/${companyId}/approvals`)
    
    // Reject the document
    await page.click('[data-testid="reject-Invoice to Reject"]')
    await expect(page.locator('[data-testid="rejection-dialog"]')).toBeVisible()
    
    await page.fill('[data-testid="rejection-comment"]', 'Amount is too high and supplier is not verified. Please provide additional documentation.')
    await page.click('[data-testid="confirm-rejection"]')
    
    // Verify rejection
    await expect(page.locator('[data-testid="rejection-success-toast"]')).toBeVisible()
    
    // Check status in all approvals
    await page.click('[data-testid="all-tab"]')
    await expect(page.locator('[data-testid="approval-status-Invoice to Reject"]')).toContainText('rejected')
    
    // Verify rejection details
    await page.click('[data-testid="view-details-Invoice to Reject"]')
    await expect(page.locator('[data-testid="rejection-reason"]')).toContainText('Amount is too high')
    await expect(page.locator('[data-testid="rejected-by"]')).toContainText('Workflow Manager')
  })

  test('should handle approval workflow notifications', async ({ page }) => {
    // Test email notifications (would require email testing setup)
    // For now, test in-app notifications
    
    // Login as user and create document
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.user.email)
    await page.fill('[data-testid="password"]', testUsers.user.password)
    await page.click('[data-testid="login-button"]')
    
    // Check notifications
    await page.click('[data-testid="notifications-bell"]')
    await expect(page.locator('[data-testid="notifications-dropdown"]')).toBeVisible()
    
    // Should see notification about previous approval/rejection
    await expect(page.locator('[data-testid="notification-approval-completed"]')).toBeVisible()
    await expect(page.locator('[data-testid="notification-approval-rejected"]')).toBeVisible()
    
    // Mark notifications as read
    await page.click('[data-testid="mark-all-read"]')
    await expect(page.locator('[data-testid="unread-count"]')).not.toBeVisible()
  })

  test('should handle approval workflow permissions', async ({ page }) => {
    // Test that users can only approve documents they're assigned to
    
    // Login as regular user (not an approver)
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.user.email)
    await page.fill('[data-testid="password"]', testUsers.user.password)
    await page.click('[data-testid="login-button"]')
    
    await page.goto(`/companies/${companyId}/approvals`)
    
    // Should not see approve/reject buttons for documents they can't approve
    await expect(page.locator('[data-testid="approve-button"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="reject-button"]')).not.toBeVisible()
    
    // Should only see view button
    await expect(page.locator('[data-testid="view-button"]')).toBeVisible()
    
    // Test direct API access is blocked
    const response = await page.evaluate(async () => {
      return fetch('/api/approvals/some-id/approve', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: 'Unauthorized approval attempt' })
      })
    })
    
    expect(response).toBe(403) // Forbidden
  })

  test('should handle approval workflow analytics', async ({ page }) => {
    // Login as owner to view analytics
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.owner.email)
    await page.fill('[data-testid="password"]', testUsers.owner.password)
    await page.click('[data-testid="login-button"]')
    
    await page.goto(`/companies/${companyId}/analytics`)
    
    // Check approval workflow metrics
    await expect(page.locator('[data-testid="total-approvals-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-approvals-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="approval-rate-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="avg-approval-time-metric"]')).toBeVisible()
    
    // Check approval workflow charts
    await expect(page.locator('[data-testid="approvals-over-time-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="approval-by-step-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="approver-performance-chart"]')).toBeVisible()
    
    // Test filtering by date range
    await page.click('[data-testid="date-filter"]')
    await page.click('[data-testid="last-7-days"]')
    
    // Verify charts updated
    await expect(page.locator('[data-testid="chart-loading"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="approvals-over-time-chart"]')).toBeVisible()
  })

  test('should handle bulk approval operations', async ({ page }) => {
    // Create multiple documents for bulk testing
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.user.email)
    await page.fill('[data-testid="password"]', testUsers.user.password)
    await page.click('[data-testid="login-button"]')
    
    // Upload multiple documents
    const documents = ['Bulk Doc 1', 'Bulk Doc 2', 'Bulk Doc 3']
    
    for (const docName of documents) {
      await page.goto(`/companies/${companyId}/documents/upload`)
      await page.setInputFiles('[data-testid="file-input"]', {
        name: `${docName}.pdf`,
        mimeType: 'application/pdf',
        buffer: Buffer.from(`Mock content for ${docName}`)
      })
      
      await page.fill('[data-testid="document-name"]', docName)
      await page.selectOption('[data-testid="document-type"]', 'invoice')
      await page.fill('[data-testid="supplier-name"]', 'Bulk Supplier')
      await page.fill('[data-testid="total-amount"]', '5000')
      await page.click('[data-testid="submit-for-approval"]')
    }
    
    // Login as manager for bulk approval
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.manager.email)
    await page.fill('[data-testid="password"]', testUsers.manager.password)
    await page.click('[data-testid="login-button"]')
    
    await page.goto(`/companies/${companyId}/approvals`)
    
    // Select multiple documents
    for (const docName of documents) {
      await page.check(`[data-testid="select-${docName}"]`)
    }
    
    // Bulk approve
    await page.click('[data-testid="bulk-approve"]')
    await expect(page.locator('[data-testid="bulk-approval-dialog"]')).toBeVisible()
    
    await page.fill('[data-testid="bulk-comment"]', 'Bulk approval for similar invoices from trusted supplier.')
    await page.click('[data-testid="confirm-bulk-approval"]')
    
    // Verify bulk approval success
    await expect(page.locator('[data-testid="bulk-success-toast"]')).toContainText('3 documents approved')
    
    // Verify all documents moved to next step
    for (const docName of documents) {
      await expect(page.locator(`[data-testid="approval-step-${docName}"]`)).toContainText('2/2')
    }
  })

  test('should handle approval workflow configuration', async ({ page }) => {
    // Login as owner to configure workflow
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.owner.email)
    await page.fill('[data-testid="password"]', testUsers.owner.password)
    await page.click('[data-testid="login-button"]')
    
    await page.goto(`/companies/${companyId}/settings`)
    await page.click('[data-testid="workflow-tab"]')
    
    // Test workflow configuration
    await page.click('[data-testid="configure-workflow"]')
    await expect(page.locator('[data-testid="workflow-config-dialog"]')).toBeVisible()
    
    // Add approval step
    await page.click('[data-testid="add-approval-step"]')
    await page.selectOption('[data-testid="step-approver"]', testUsers.owner.email)
    await page.fill('[data-testid="step-name"]', 'Final Owner Review')
    await page.check('[data-testid="step-required"]')
    
    // Set conditions
    await page.click('[data-testid="add-condition"]')
    await page.selectOption('[data-testid="condition-field"]', 'amount')
    await page.selectOption('[data-testid="condition-operator"]', 'greater_than')
    await page.fill('[data-testid="condition-value"]', '50000')
    
    await page.click('[data-testid="save-workflow-config"]')
    
    // Verify configuration saved
    await expect(page.locator('[data-testid="config-success-toast"]')).toBeVisible()
    
    // Test the new workflow with a high-value document
    await page.goto('/login')
    await page.fill('[data-testid="email"]', testUsers.user.email)
    await page.fill('[data-testid="password"]', testUsers.user.password)
    await page.click('[data-testid="login-button"]')
    
    await page.goto(`/companies/${companyId}/documents/upload`)
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'high-value.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('High value invoice')
    })
    
    await page.fill('[data-testid="document-name"]', 'High Value Invoice')
    await page.selectOption('[data-testid="document-type"]', 'invoice')
    await page.fill('[data-testid="total-amount"]', '75000')
    await page.click('[data-testid="submit-for-approval"]')
    
    // Verify 3-step workflow was created
    await expect(page.locator('[data-testid="approval-workflow-info"]')).toContainText('3 steps')
  })
})
