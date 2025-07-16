import { test, expect } from '@playwright/test'

test.describe('Navigace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('měla by mít funkční hlavní navigaci na desktopu', async ({ page }) => {
    // Ověř, že hlavní navigace je viditelná
    const nav = page.locator('nav').filter({ hasText: 'AskelioFeaturesVýhodyCenyFAQ' })
    await expect(nav).toBeVisible()
    
    // Ověř logo/název
    await expect(page.getByText('Askelio').first()).toBeVisible()
    
    // Ověř navigační odkazy
    await expect(page.getByRole('link', { name: 'Features' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Výhody' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ceny' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'FAQ' })).toBeVisible()
    
    // Ověř auth odkazy
    await expect(page.getByRole('link', { name: 'Přihlášení' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Registrace' }).first()).toBeVisible()
  })

  test('měla by mít funkční mobilní hamburger menu', async ({ page }) => {
    // Nastav mobilní viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Ověř, že hamburger tlačítko je viditelné
    const hamburgerButton = page.locator('button').filter({ hasText: /menu|hamburger/i }).or(
      page.locator('nav button').first()
    )
    await expect(hamburgerButton).toBeVisible()
    
    // Klikni na hamburger menu
    await hamburgerButton.click()
    
    // Ověř, že mobilní menu se otevřelo
    await expect(page.getByRole('link', { name: 'Features' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Výhody' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ceny' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'FAQ' })).toBeVisible()
    
    // Test zavření menu kliknutím na odkaz
    await page.getByRole('link', { name: 'Features' }).click()
    await expect(page.url()).toContain('#features')
  })

  test('měla by mít funkční smooth scroll navigaci', async ({ page }) => {
    // Test navigace na Features sekci
    await page.getByRole('link', { name: 'Features' }).first().click()
    await expect(page.url()).toContain('#features')
    
    // Test navigace na Výhody sekci
    await page.getByRole('link', { name: 'Výhody' }).first().click()
    await expect(page.url()).toContain('#benefits')
    
    // Test navigace na Ceny sekci
    await page.getByRole('link', { name: 'Ceny' }).first().click()
    await expect(page.url()).toContain('#pricing')
    
    // Test navigace na FAQ sekci
    await page.getByRole('link', { name: 'FAQ' }).click()
    await expect(page.url()).toContain('#faq')
  })

  test('měla by mít sticky navigaci při scrollování', async ({ page }) => {
    // Ověř, že navigace je na začátku viditelná
    const nav = page.locator('nav').filter({ hasText: 'AskelioFeaturesVýhodyCenyFAQ' })
    await expect(nav).toBeVisible()
    
    // Scrolluj dolů
    await page.evaluate(() => window.scrollTo(0, 1000))
    
    // Navigace by měla být stále viditelná (sticky/fixed)
    await expect(nav).toBeVisible()
    
    // Scrolluj zpět nahoru
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(nav).toBeVisible()
  })

  test('měla by mít funkční footer navigaci', async ({ page }) => {
    // Scrolluj na konec stránky
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // Ověř footer odkazy
    const footer = page.locator('footer')
    await expect(footer.getByRole('link', { name: 'Features' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Výhody' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Ceny' })).toBeVisible()
    
    // Test funkčnosti footer odkazů
    await footer.getByRole('link', { name: 'Features' }).click()
    await expect(page.url()).toContain('#features')
  })

  test('měla by správně zobrazovat breadcrumbs na auth stránkách', async ({ page }) => {
    // Přejdi na login stránku
    await page.goto('/auth/login')
    
    // Ověř, že je možné se vrátit na hlavní stránku
    await page.getByText('Askelio').first().click()
    await expect(page.url()).toBe('http://localhost:3000/')
    
    // Přejdi na registraci
    await page.goto('/auth/register')
    
    // Ověř návrat na hlavní stránku
    await page.getByText('Askelio').first().click()
    await expect(page.url()).toBe('http://localhost:3000/')
  })

  test('měla by mít správné hover efekty na navigačních prvcích', async ({ page }) => {
    // Test hover efektů na hlavních odkazech
    const featuresLink = page.getByRole('link', { name: 'Features' }).first()
    
    // Hover nad odkazem
    await featuresLink.hover()
    
    // Ověř, že odkaz má správné CSS třídy pro hover
    await expect(featuresLink).toHaveClass(/hover:text-gray-900|transition-colors/)
  })

  test('měla by být přístupná pomocí klávesnice', async ({ page }) => {
    // Test tab navigace
    await page.keyboard.press('Tab')
    
    // První focusovatelný prvek by měl být logo nebo první navigační odkaz
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Pokračuj v tab navigaci
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Test Enter na odkazu
    await page.keyboard.press('Enter')
    
    // URL by se měla změnit
    await expect(page.url()).not.toBe('http://localhost:3000/')
  })

  test('měla by správně fungovat na různých velikostech obrazovky', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 768, height: 1024 }, // iPad
      { width: 1024, height: 768 }, // Desktop malý
      { width: 1920, height: 1080 }, // Desktop velký
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      
      // Ověř, že navigace je funkční na každé velikosti
      const nav = page.locator('nav').first()
      await expect(nav).toBeVisible()
      
      // Na mobilních zařízeních by mělo být hamburger menu
      if (viewport.width < 768) {
        const hamburger = page.locator('nav button').first()
        await expect(hamburger).toBeVisible()
      } else {
        // Na desktopu by měly být viditelné navigační odkazy
        await expect(page.getByRole('link', { name: 'Features' }).first()).toBeVisible()
      }
    }
  })

  test('měla by mít správné ARIA atributy pro accessibility', async ({ page }) => {
    // Ověř navigation landmark
    const nav = page.locator('nav').first()
    await expect(nav).toHaveAttribute('role', 'navigation')
    
    // Ověř, že odkazy mají správné atributy
    const links = page.locator('nav a')
    const linkCount = await links.count()
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i)
      await expect(link).toHaveAttribute('href')
    }
  })
})
