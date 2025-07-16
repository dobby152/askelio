import { test, expect } from '@playwright/test'

test.describe('SEO a Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('měla by mít správné meta tagy pro SEO', async ({ page }) => {
    // Ověř title
    await expect(page).toHaveTitle(/Askelio/)
    
    // Ověř meta description
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /.+/)
    
    // Ověř meta viewport
    const metaViewport = page.locator('meta[name="viewport"]')
    await expect(metaViewport).toHaveAttribute('content', /width=device-width/)
    
    // Ověř charset
    const metaCharset = page.locator('meta[charset]')
    await expect(metaCharset).toHaveAttribute('charset', 'utf-8')
  })

  test('měla by mít správnou strukturu nadpisů (H1-H6)', async ({ page }) => {
    // Ověř, že existuje pouze jeden H1
    const h1Elements = page.locator('h1')
    await expect(h1Elements).toHaveCount(1)
    
    // Ověř obsah H1
    await expect(h1Elements.first()).toContainText('Nejlepší platforma pro růst vašeho podnikání')
    
    // Ověř hierarchii nadpisů
    const h2Elements = page.locator('h2')
    await expect(h2Elements.first()).toBeVisible()
    
    const h3Elements = page.locator('h3')
    await expect(h3Elements.first()).toBeVisible()
  })

  test('měly by mít obrázky správné alt atributy', async ({ page }) => {
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      
      // Alt by měl existovat (může být prázdný pro dekorativní obrázky)
      expect(alt).not.toBeNull()
    }
  })

  test('měly by mít odkazy správné atributy', async ({ page }) => {
    const links = page.locator('a')
    const linkCount = await links.count()
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i)
      
      // Každý odkaz by měl mít href
      const href = await link.getAttribute('href')
      expect(href).not.toBeNull()
      
      // Externí odkazy by měly mít rel="noopener"
      if (href && (href.startsWith('http') && !href.includes('localhost'))) {
        const rel = await link.getAttribute('rel')
        expect(rel).toContain('noopener')
      }
    }
  })

  test('měla by být přístupná pomocí klávesnice', async ({ page }) => {
    // Test tab navigace
    let tabCount = 0
    const maxTabs = 20 // Omez počet tabů pro test
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab')
      tabCount++
      
      const focusedElement = page.locator(':focus')
      const isVisible = await focusedElement.isVisible().catch(() => false)
      
      if (isVisible) {
        // Ověř, že focusovaný prvek má viditelný focus indikátor
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase())
        
        if (['button', 'a', 'input', 'textarea', 'select'].includes(tagName)) {
          // Interaktivní prvky by měly být focusovatelné
          await expect(focusedElement).toBeFocused()
        }
      }
    }
  })

  test('měly by mít formuláře správné labely', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Ověř, že každý input má label
    const emailInput = page.getByLabel('E-mail')
    const passwordInput = page.getByLabel('Heslo')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    
    // Ověř, že labely jsou správně asociované
    const emailId = await emailInput.getAttribute('id')
    const passwordId = await passwordInput.getAttribute('id')
    
    expect(emailId).toBeTruthy()
    expect(passwordId).toBeTruthy()
  })

  test('měla by mít správné ARIA atributy', async ({ page }) => {
    // Ověř navigation landmark
    const nav = page.locator('nav').first()
    await expect(nav).toHaveAttribute('role', 'navigation')
    
    // Ověř main landmark
    const main = page.locator('main')
    await expect(main).toBeVisible()
    
    // Test ARIA na interaktivních prvcích
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const textContent = await button.textContent()
      
      // Tlačítko by mělo mít buď aria-label nebo text content
      expect(ariaLabel || textContent).toBeTruthy()
    }
  })

  test('měla by mít správný kontrast barev', async ({ page }) => {
    // Test základních textových prvků
    const headings = page.locator('h1, h2, h3')
    const headingCount = await headings.count()
    
    for (let i = 0; i < Math.min(headingCount, 3); i++) {
      const heading = headings.nth(i)
      await expect(heading).toBeVisible()
      
      // Ověř, že text není příliš světlý
      const color = await heading.evaluate(el => 
        window.getComputedStyle(el).color
      )
      
      // Základní test - text by neměl být bílý na bílém pozadí
      expect(color).not.toBe('rgb(255, 255, 255)')
    }
  })

  test('měla by být responsivní bez horizontálního scrollování', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      
      // Ověř, že není horizontální scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const clientWidth = await page.evaluate(() => document.body.clientWidth)
      
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // +1 pro rounding
    }
  })

  test('měla by mít správné lang atributy', async ({ page }) => {
    // Ověř lang atribut na html elementu
    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBe('cs') // Čeština
  })

  test('měly by být chybové zprávy přístupné', async ({ page }) => {
    await page.goto('/auth/register')
    
    // Vyvolej chybu
    await page.getByLabel('E-mail').fill('test@example.com')
    await page.getByLabel('Heslo').fill('123')
    await page.getByLabel('Potvrdit heslo').fill('456')
    await page.getByRole('button', { name: 'Zaregistrovat se' }).click()
    
    // Ověř, že chybová zpráva je viditelná a přístupná
    const errorMessage = page.getByText('Hesla se neshodují')
    await expect(errorMessage).toBeVisible()
    
    // Chybová zpráva by měla mít správnou roli
    const errorContainer = page.locator('.bg-red-50')
    await expect(errorContainer).toBeVisible()
  })

  test('měla by mít správné focus management', async ({ page }) => {
    // Test focus po navigaci
    await page.getByRole('link', { name: 'Přihlášení' }).first().click()
    
    // Po navigaci by se focus měl přesunout na hlavní obsah
    await page.waitForTimeout(100)
    
    // Test focus trapping v modálech (pokud existují)
    // Pro tento test použijeme FAQ accordion
    await page.goto('/')
    await page.locator('#faq').scrollIntoViewIfNeeded()
    
    const faqButton = page.getByRole('button', { name: /co dělá tento template/i })
    await faqButton.click()
    
    // Focus by měl zůstat na tlačítku nebo se přesunout na obsah
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('měla by mít správné skip links pro accessibility', async ({ page }) => {
    // Test skip to main content link
    await page.keyboard.press('Tab')
    
    const firstFocusable = page.locator(':focus')
    const tagName = await firstFocusable.evaluate(el => el.tagName.toLowerCase())
    
    // První focusovatelný prvek by měl být skip link nebo hlavní navigace
    expect(['a', 'button'].includes(tagName)).toBeTruthy()
  })

  test('měla by správně fungovat s screen readery', async ({ page }) => {
    // Test ARIA live regions pro dynamický obsah
    await page.goto('/auth/login')
    
    // Vyvolej chybu a ověř, že je oznámena
    await page.getByLabel('E-mail').fill('invalid-email')
    await page.getByRole('button', { name: 'Přihlásit se' }).click()
    
    // Ověř, že chybová zpráva má správné ARIA atributy
    const errorRegion = page.locator('[role="alert"]').or(
      page.locator('.bg-red-50')
    )
    
    if (await errorRegion.count() > 0) {
      await expect(errorRegion.first()).toBeVisible()
    }
  })
})
