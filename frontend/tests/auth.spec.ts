import { test, expect } from '@playwright/test'

test.describe('Autentifikace', () => {
  test('měla by zobrazit přihlašovací stránku správně', async ({ page }) => {
    await page.goto('/auth/login')

    // Ověř URL
    await expect(page).toHaveURL('/auth/login')

    // Ověř nadpis
    await expect(page.getByRole('heading', { name: 'Vítejte zpět' })).toBeVisible()

    // Ověř popis
    await expect(page.getByText('Přihlaste se do svého účtu Askelio')).toBeVisible()

    // Ověř formulářové prvky
    await expect(page.getByText('E-mailová adresa')).toBeVisible()
    await expect(page.getByLabel('Heslo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Přihlásit se' })).toBeVisible()

    // Ověř placeholdery
    await expect(page.getByPlaceholder('vas@email.cz')).toBeVisible()

    // Ověř odkaz na registraci
    await expect(page.getByText('Nemáte účet?')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Zaregistrujte se zdarma' })).toBeVisible()
  })

  test('měla by zobrazit registrační stránku správně', async ({ page }) => {
    await page.goto('/auth/register')

    // Ověř URL
    await expect(page).toHaveURL('/auth/register')

    // Ověř nadpis
    await expect(page.getByRole('heading', { name: 'Začněte zdarma' })).toBeVisible()

    // Ověř popis
    await expect(page.getByText('Vytvořte si účet Askelio během několika sekund')).toBeVisible()

    // Ověř formulářové prvky
    await expect(page.getByText('Celé jméno')).toBeVisible()
    await expect(page.getByText('E-mailová adresa')).toBeVisible()
    await expect(page.getByLabel('Heslo').first()).toBeVisible()
    await expect(page.getByLabel('Potvrdit heslo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Vytvořit účet zdarma' })).toBeVisible()

    // Ověř odkaz na přihlášení
    await expect(page.getByText('Už máte účet?')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Přihlaste se' })).toBeVisible()
  })

  test('měla by přepínat mezi přihlášením a registrací', async ({ page }) => {
    // Začni na přihlášení
    await page.goto('/auth/login')

    // Přejdi na registraci
    await page.getByRole('link', { name: 'Zaregistrujte se zdarma' }).click()
    await expect(page).toHaveURL('/auth/register')
    await expect(page.getByRole('heading', { name: 'Začněte zdarma' })).toBeVisible()

    // Vrať se na přihlášení
    await page.getByRole('link', { name: 'Přihlaste se' }).click()
    await expect(page).toHaveURL('/auth/login')
    await expect(page.getByRole('heading', { name: 'Vítejte zpět' })).toBeVisible()
  })

  test('měla by být responsivní na mobilních zařízeních', async ({ page }) => {
    // Nastav mobilní viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth/login')

    // Ověř, že formulář je viditelný a použitelný
    await expect(page.getByRole('heading', { name: 'Vítejte zpět' })).toBeVisible()
    await expect(page.getByText('E-mailová adresa')).toBeVisible()
    await expect(page.getByLabel('Heslo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Přihlásit se' })).toBeVisible()
  })
})
