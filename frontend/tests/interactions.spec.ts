import { test, expect } from '@playwright/test'

test.describe('Interaktivní prvky a animace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('měly by fungovat CTA tlačítka v hero sekci', async ({ page }) => {
    // Test hlavního CTA tlačítka
    const mainCTA = page.getByRole('button', { name: /začít hned teď/i }).first()
    await expect(mainCTA).toBeVisible()
    await expect(mainCTA).toBeEnabled()
    
    // Test demo tlačítka
    const demoButton = page.getByRole('button', { name: /rezervovat demo/i }).first()
    await expect(demoButton).toBeVisible()
    await expect(demoButton).toBeEnabled()
    
    // Test hover efektů
    await mainCTA.hover()
    await demoButton.hover()
  })

  test('měl by fungovat pricing toggle', async ({ page }) => {
    // Scrolluj na pricing sekci
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    
    // Najdi toggle tlačítka
    const monthlyButton = page.getByRole('button', { name: 'Monthly' })
    const yearlyButton = page.getByRole('button', { name: /yearly/i })
    
    await expect(monthlyButton).toBeVisible()
    await expect(yearlyButton).toBeVisible()
    
    // Test přepínání
    await yearlyButton.click()
    
    // Ověř, že se ceny změnily (měly by být nižší pro yearly)
    await expect(page.getByText('$9')).toBeVisible() // Yearly cena pro Starter
    
    // Přepni zpět na monthly
    await monthlyButton.click()
    await expect(page.getByText('$12')).toBeVisible() // Monthly cena pro Starter
  })

  test('měl by fungovat FAQ accordion', async ({ page }) => {
    // Scrolluj na FAQ sekci
    await page.locator('#faq').scrollIntoViewIfNeeded()
    
    // Najdi první FAQ otázku
    const firstQuestion = page.getByRole('button', { name: /co dělá tento template jedinečným/i })
    await expect(firstQuestion).toBeVisible()
    
    // Klikni na otázku
    await firstQuestion.click()
    
    // Ověř, že se odpověď zobrazila
    await expect(page.getByText(/tento template je navržen/i)).toBeVisible()
    
    // Klikni znovu pro zavření
    await firstQuestion.click()
    
    // Test další otázky
    const secondQuestion = page.getByRole('button', { name: /mohu přizpůsobit template/i })
    await secondQuestion.click()
  })

  test('měly by mít karty hover efekty', async ({ page }) => {
    // Test hover efektů na benefit kartách
    await page.locator('#benefits').scrollIntoViewIfNeeded()
    
    const benefitCards = page.locator('.group').filter({ hasText: 'Okamžité úspory' })
    await expect(benefitCards.first()).toBeVisible()
    
    // Hover nad kartou
    await benefitCards.first().hover()
    
    // Test hover efektů na pricing kartách
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    
    const pricingCards = page.locator('.group').filter({ hasText: 'Starter' })
    await expect(pricingCards.first()).toBeVisible()
    
    await pricingCards.first().hover()
  })

  test('měly by fungovat testimonials animace', async ({ page }) => {
    // Scrolluj na testimonials
    await page.locator('[data-testid="testimonials"]').scrollIntoViewIfNeeded()
    
    // Ověř, že testimonials jsou viditelné
    await expect(page.getByText('Vysoce intuitivní a vyleštěné')).toBeVisible()
    
    // Test hover efektů na testimonial kartách
    const testimonialCard = page.locator('.group').filter({ hasText: 'Alex Jonas' })
    await expect(testimonialCard.first()).toBeVisible()
    
    await testimonialCard.first().hover()
    
    // Ověř rating hvězdičky
    const stars = page.locator('.fill-yellow-400')
    await expect(stars.first()).toBeVisible()
  })

  test('měly by mít tlačítka správné focus stavy', async ({ page }) => {
    // Test focus na CTA tlačítkách
    const mainCTA = page.getByRole('button', { name: /začít hned teď/i }).first()
    
    await mainCTA.focus()
    await expect(mainCTA).toBeFocused()
    
    // Test keyboard aktivace
    await page.keyboard.press('Enter')
  })

  test('měly by být animace plynulé a bez chyb', async ({ page }) => {
    // Test smooth scroll
    await page.getByRole('link', { name: 'Features' }).first().click()
    await page.waitForTimeout(1000) // Počkej na dokončení animace
    
    await page.getByRole('link', { name: 'Výhody' }).first().click()
    await page.waitForTimeout(1000)
    
    await page.getByRole('link', { name: 'Ceny' }).first().click()
    await page.waitForTimeout(1000)
    
    // Ověř, že stránka je stále funkční po animacích
    await expect(page.getByRole('heading', { name: 'Flexibilní cenové plány' })).toBeVisible()
  })

  test('měly by fungovat všechny CTA tlačítka na stránce', async ({ page }) => {
    // Najdi všechna "Začít hned teď" tlačítka
    const ctaButtons = page.getByRole('button', { name: /začít hned teď/i })
    const buttonCount = await ctaButtons.count()
    
    expect(buttonCount).toBeGreaterThan(0)
    
    // Test každého tlačítka
    for (let i = 0; i < buttonCount; i++) {
      const button = ctaButtons.nth(i)
      await expect(button).toBeVisible()
      await expect(button).toBeEnabled()
      
      // Test hover efektu
      await button.hover()
    }
  })

  test('měly by mít formulářové prvky správnou validaci', async ({ page }) => {
    // Přejdi na kontaktní formulář (pokud existuje) nebo newsletter
    // Pro tento test použijeme auth formuláře
    await page.goto('/auth/register')
    
    // Test HTML5 validace
    const emailInput = page.getByLabel('E-mail')
    const passwordInput = page.getByLabel('Heslo')
    
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
    await expect(emailInput).toHaveAttribute('type', 'email')
    
    // Test neplatného emailu
    await emailInput.fill('neplatny-email')
    await passwordInput.fill('heslo123')
    await page.getByRole('button', { name: 'Zaregistrovat se' }).click()
    
    // Prohlížeč by měl zobrazit validační zprávu
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(isValid).toBe(false)
  })

  test('měly by být interaktivní prvky přístupné pomocí klávesnice', async ({ page }) => {
    // Test tab navigace přes interaktivní prvky
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Test aktivace pomocí Enter/Space
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Pokud je to tlačítko, test Enter
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase())
    if (tagName === 'button') {
      await page.keyboard.press('Enter')
    }
  })

  test('měly by mít loading stavy správně implementované', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Vyplň formulář
    await page.getByLabel('E-mail').fill('test@example.com')
    await page.getByLabel('Heslo').fill('heslo123')
    
    // Klikni na submit
    const submitButton = page.getByRole('button', { name: 'Přihlásit se' })
    await submitButton.click()
    
    // Ověř loading stav
    await expect(submitButton).toBeDisabled()
    
    // Počkej na dokončení (nebo timeout)
    await page.waitForTimeout(2000)
  })

  test('měly by být animace optimalizované pro výkon', async ({ page }) => {
    // Test, že animace neblokují interakci
    await page.getByRole('link', { name: 'Features' }).first().click()
    
    // Během animace by měly být ostatní prvky stále interaktivní
    const logo = page.getByText('Askelio').first()
    await expect(logo).toBeVisible()
    await logo.click()
    
    // Ověř, že klik fungoval
    await expect(page.url()).toBe('http://localhost:3000/')
  })
})
