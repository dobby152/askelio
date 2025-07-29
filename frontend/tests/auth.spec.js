/**
 * Authentication Tests
 * Tests login, logout, and authentication flows
 */

const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
  });

  test('should display login form', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Askelio/);
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check "Vyplnit testovací údaje" button
    await expect(page.locator('text=Vyplnit testovací údaje')).toBeVisible();
  });

  test('should login with test credentials', async ({ page }) => {
    // Click "Vyplnit testovací údaje" button
    await page.click('text=Vyplnit testovací údaje');
    
    // Verify test credentials are filled
    await expect(page.locator('input[type="email"]')).toHaveValue('test@askelio.com');
    await expect(page.locator('input[type="password"]')).toHaveValue('test123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=Neplatné přihlašovací údaje')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.click('text=Vyplnit testovací údaje');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Find and click logout button (might be in a dropdown or menu)
    // This will depend on your UI implementation
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Odhlásit se');
    
    // Verify redirect to login
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });
});
