import { test, expect } from '@playwright/test';

test.describe('Landing Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section correctly', async ({ page }) => {
    // Check main heading
    await expect(page.locator('h1')).toContainText('Nejlepší platforma pro růst vašeho podnikání');

    // Check CTA buttons (use first() to avoid strict mode violation)
    await expect(page.getByRole('button', { name: /začít hned teď/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /rezervovat demo/i }).first()).toBeVisible();

    // Check social proof
    await expect(page.getByText(/připojte se k.*spokojených zákazníků/i)).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Check navigation links in header (use first() to avoid strict mode violation)
    await expect(page.getByRole('link', { name: 'Features' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Výhody' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ceny' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'FAQ' })).toBeVisible();

    // Test navigation functionality
    await page.getByRole('link', { name: 'Features' }).first().click();
    await expect(page.url()).toContain('#features');
  });

  test('should display features section', async ({ page }) => {
    // Scroll to features section
    await page.locator('#features').scrollIntoViewIfNeeded();

    // Check feature cards that actually exist on the page
    await expect(page.getByText('Rozlište se')).toBeVisible();
    await expect(page.getByText('Pozvedněte svou značku se zlatým odznakem')).toBeVisible();
    await expect(page.getByText('Askelio Pro')).toBeVisible();
    await expect(page.getByText('Crystalio')).toBeVisible();
  });

  test('should display benefits section', async ({ page }) => {
    // Scroll to benefits section
    await page.locator('#benefits').scrollIntoViewIfNeeded();

    // Check section heading
    await expect(page.getByText('Proč si vybrat nás?')).toBeVisible();

    // Check benefit cards (use heading role to avoid duplication)
    await expect(page.getByRole('heading', { name: 'Okamžité úspory' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Přehledy v reálném čase' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Flexibilní plány' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bezpečné transakce' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Adaptivní systémy' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Specializovaná podpora' })).toBeVisible();
  });

  test('should display testimonials section', async ({ page }) => {
    // Scroll to testimonials
    await page.locator('[data-testid="testimonials"]').scrollIntoViewIfNeeded();

    // Check section heading
    await expect(page.getByText('Milováno mysliteli')).toBeVisible();

    // Check testimonial cards
    await expect(page.getByText('Vysoce intuitivní a vyleštěné')).toBeVisible();
    // Use more specific selector for rating to avoid conflicts
    await expect(page.locator('.text-2xl.font-bold').filter({ hasText: '5' }).first()).toBeVisible();
  });

  test('should have working pricing toggle', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    // Check initial monthly pricing
    await expect(page.getByText('$12')).toBeVisible();
    await expect(page.getByText('$17')).toBeVisible();
    
    // Toggle to yearly pricing
    await page.getByText('Yearly').click();
    
    // Check yearly pricing (should be discounted)
    await expect(page.getByText('$9')).toBeVisible();
    await expect(page.getByText('$12')).toBeVisible();
    
    // Toggle back to monthly
    await page.getByText('Monthly').click();
    await expect(page.getByText('$12')).toBeVisible();
    await expect(page.getByText('$17')).toBeVisible();
  });

  test('should have working FAQ accordion', async ({ page }) => {
    // Scroll to FAQ section
    await page.locator('[data-testid="faq"]').scrollIntoViewIfNeeded();
    
    // Check FAQ heading
    await expect(page.getByText('Některé běžné FAQ')).toBeVisible();
    
    // Test FAQ accordion functionality
    const faqItem = page.getByText('Co dělá tento template jedinečným?');
    await faqItem.click();
    
    // Check if answer is visible after clicking
    await expect(page.getByText('Tento template je navržen')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if mobile navigation works (use first() to avoid strict mode violation)
    await expect(page.locator('nav').first()).toBeVisible();

    // Check if content is properly displayed on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('button', { name: /začít hned teď/i }).first()).toBeVisible();
  });

  test('should have working CTA buttons', async ({ page }) => {
    // Test main CTA button
    const ctaButton = page.getByRole('button', { name: /začít hned teď/i }).first();
    await expect(ctaButton).toBeVisible();

    // Test demo button
    const demoButton = page.getByRole('button', { name: /rezervovat demo/i }).first();
    await expect(demoButton).toBeVisible();
  });

  test('should load all images', async ({ page }) => {
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check if images are loaded
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toBeVisible();
    }
  });

  test('should have proper SEO elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Askelio/);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });
});
