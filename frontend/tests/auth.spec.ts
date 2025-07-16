import { test, expect } from '@playwright/test'

test.describe('Autentifikace', () => {
  test('měla by zobrazit přihlašovací stránku správně', async ({ page }) => {
    await page.goto('/auth/login')

    // Ověř URL
    await expect(page).toHaveURL('/auth/login')

    // Ověř nadpis
    await expect(page.getByRole('heading', { name: 'Přihlášení' })).toBeVisible()

    // Ověř popis
    await expect(page.getByText('Přihlaste se do svého účtu')).toBeVisible()

    // Ověř formulářové prvky
    await expect(page.getByText('E-mail')).toBeVisible()
    await expect(page.getByText('Heslo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Přihlásit se' })).toBeVisible()

    // Ověř placeholdery
    await expect(page.getByPlaceholder('vas@email.cz')).toBeVisible()

    // Ověř odkaz na registraci
    await expect(page.getByText('Nemáte účet?')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Zaregistrujte se' })).toBeVisible()
  })

  test('měla by zobrazit registrační stránku správně', async ({ page }) => {
    await page.goto('/auth/register')

    // Ověř URL
    await expect(page).toHaveURL('/auth/register')

    // Ověř nadpis
    await expect(page.getByRole('heading', { name: 'Registrace' })).toBeVisible()

    // Ověř popis
    await expect(page.getByText('Vytvořte si nový účet')).toBeVisible()

    // Ověř formulářové prvky
    await expect(page.getByText('E-mail')).toBeVisible()
    await expect(page.getByText('Heslo')).toBeVisible()
    await expect(page.getByText('Potvrdit heslo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zaregistrovat se' })).toBeVisible()

    // Ověř odkaz na přihlášení
    await expect(page.getByText('Už máte účet?')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Přihlaste se' })).toBeVisible()
  })

  test('měla by přepínat mezi přihlášením a registrací', async ({ page }) => {
    // Začni na přihlášení
    await page.goto('/auth/login')

    // Přejdi na registraci
    await page.getByRole('link', { name: 'Zaregistrujte se' }).click()
    await expect(page).toHaveURL('/auth/register')
    await expect(page.getByRole('heading', { name: 'Registrace' })).toBeVisible()

    // Vrať se na přihlášení
    await page.getByRole('link', { name: 'Přihlaste se' }).click()
    await expect(page).toHaveURL('/auth/login')
    await expect(page.getByRole('heading', { name: 'Přihlášení' })).toBeVisible()
  })

  test('měla by být responsivní na mobilních zařízeních', async ({ page }) => {
    // Nastav mobilní viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth/login')

    // Ověř, že formulář je viditelný a použitelný
    await expect(page.getByRole('heading', { name: 'Přihlášení' })).toBeVisible()
    await expect(page.getByText('E-mail')).toBeVisible()
    await expect(page.getByText('Heslo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Přihlásit se' })).toBeVisible()
  })
})
