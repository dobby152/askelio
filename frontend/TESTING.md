# 🎭 Askelio OCR Dashboard - Testing Guide

Kompletní testovací dokumentace pro Askelio OCR Dashboard vytvořený pomocí v0.dev a testovaný s Playwright.

## 🚀 Quick Start

```bash
# 1. Nainstalujte závislosti
npm install

# 2. Nainstalujte Playwright browsers
npx playwright install

# 3. Spusťte development server
npm run dev

# 4. V novém terminálu spusťte testy
npm run test:dashboard all
```

## 📋 Dostupné testy

### 🔧 Základní příkazy

```bash
# Zobrazit nápovědu
npm run test:dashboard help

# Všechny dashboard testy
npm run test:dashboard all

# Základní funkčnost
npm run test:dashboard basic

# Interaktivní funkce
npm run test:dashboard interactions

# Visual regression
npm run test:dashboard visual

# Kompletní integrace
npm run test dashboard-complete.spec.ts
```

### 📱 Device-specific testy

```bash
# Mobile testy
npm run test:dashboard mobile

# Tablet testy  
npm run test:dashboard tablet

# Desktop testy
npm run test:dashboard desktop

# Cross-browser
npm run test:dashboard crossbrowser
```

### 🎯 Specifické funkce

```bash
# Performance testy
npm run test:dashboard performance

# Accessibility testy
npm run test:dashboard accessibility

# Upload funkcionalita
npm run test:dashboard upload

# Grafy a vizualizace
npm run test:dashboard charts

# Responsive design
npm run test:dashboard responsive

# Error handling
npm run test:dashboard errors
```

### 🐛 Debug a development

```bash
# Debug mode (step-by-step)
npm run test:dashboard debug

# Headed mode (viditelný browser)
npm run test:dashboard headed

# Update visual baselines
npm run test:dashboard update-visuals

# Zobrazit test report
npm run test:dashboard report
```

## 📊 Test Coverage

### ✅ Testované komponenty

- **Layout & Navigation**
  - Sidebar s navigací a rychlými akcemi
  - Header s vyhledáváním a user menu
  - Responsive mobile menu

- **Dashboard Sections**
  - 📊 Statistické karty (4 karty s trendy)
  - 📈 Grafy (bar chart, pie chart, line chart)
  - 📤 Upload area (drag & drop)
  - 📋 Tabulka dokumentů s filtry
  - 🎯 Progress bars pro limity

- **Interaktivní funkce**
  - File upload s validací
  - Search a filtry
  - Theme switching (dark/light)
  - Hover efekty
  - Toast notifikace

- **Responsive Design**
  - Mobile (375px)
  - Tablet (768px)  
  - Desktop (1280px+)
  - Large Desktop (1920px+)

### 🌐 Browser Support

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari/WebKit
- ✅ Mobile Chrome
- ✅ Mobile Safari
- ✅ Microsoft Edge

## 🏗️ Test Structure

```
tests/
├── dashboard.spec.ts              # Základní funkčnost
├── dashboard-interactions.spec.ts # Interaktivní funkce
├── dashboard-visual.spec.ts       # Visual regression
├── dashboard-complete.spec.ts     # Kompletní integrace
├── utils/
│   └── dashboard-helpers.ts       # Test utility funkce
├── README.md                      # Detailní dokumentace
└── TESTING.md                     # Tento soubor
```

## 🛠️ Konfigurace

### Playwright Config

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 60000,
  expect: { 
    timeout: 10000,
    threshold: 0.3 
  },
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "playwright test",
    "test:dashboard": "node scripts/test-dashboard.js",
    "test:dashboard:all": "playwright test dashboard*.spec.ts",
    "test:update-snapshots": "playwright test --update-snapshots"
  }
}
```

## 📸 Visual Testing

### Screenshot Strategy

1. **Full Page**: Celé stránky na různých zařízeních
2. **Components**: Jednotlivé komponenty izolovaně  
3. **States**: Hover, focus, error stavy
4. **Themes**: Světlý a tmavý režim
5. **Animations**: Klíčové snímky animací

### Update Visual Baselines

```bash
# Po změnách UI
npm run test:dashboard update-visuals

# Specifické testy
npx playwright test dashboard-visual.spec.ts --update-snapshots

# Commitněte změny
git add test-results/
git commit -m "Update visual test baselines"
```

## 🔍 Debugging

### Časté problémy

1. **Timeout chyby**
   ```bash
   npm run test:dashboard basic -- --timeout=90000
   ```

2. **Visual regression failures**
   ```bash
   npm run test:dashboard update-visuals
   ```

3. **Flaky testy**
   ```bash
   npm run test:dashboard basic -- --retries=3
   ```

### Debug Tips

- Použijte `--headed` pro viditelný browser
- Použijte `--debug` pro step-by-step debugging
- Zkontrolujte screenshots v `test-results/`
- Použijte `page.pause()` pro breakpointy

## 📈 CI/CD Integration

### GitHub Actions

```yaml
name: Dashboard Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run Dashboard Tests
        run: npm run test:dashboard all
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🎯 Test Examples

### Základní test

```typescript
test('should display dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Dashboard');
  await expect(page.locator('text=Askelio')).toBeVisible();
});
```

### S helper funkcemi

```typescript
test('upload file test', async ({ page }) => {
  const dashboard = new DashboardHelpers(page);
  
  await dashboard.waitForDashboardLoad();
  await dashboard.uploadFile('test.pdf', 'application/pdf', 'content');
  await dashboard.verifyStatsCards();
});
```

### Visual test

```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    threshold: 0.3
  });
});
```

## 📊 Reporting

### HTML Report

```bash
# Generovat a zobrazit report
npm run test:dashboard report
```

### JSON Report

```bash
# Export do JSON
npx playwright test --reporter=json --output-file=results.json
```

### JUnit Report

```bash
# Pro CI/CD systémy
npx playwright test --reporter=junit --output-file=results.xml
```

## 🔄 Maintenance

### Týdně

- [ ] Spusťte všechny testy
- [ ] Zkontrolujte flaky testy
- [ ] Update dependencies

### Po změnách UI

- [ ] Spusťte visual testy
- [ ] Update baselines pokud je potřeba
- [ ] Commitněte změny

### Před release

- [ ] Full regression testing
- [ ] Cross-browser testing
- [ ] Performance testing
- [ ] Accessibility audit

## 🤝 Contributing

### Přidání nového testu

1. Vytvořte test v příslušném souboru
2. Použijte `DashboardHelpers` pro common operace
3. Přidejte fallback selektory
4. Dokumentujte test case
5. Update visual baselines pokud je potřeba

### Best Practices

- Používejte popisné názvy testů
- Přidejte komentáře pro složité testy
- Testujte edge cases
- Udržujte testy nezávislé
- Používejte data-testid pro stabilní selektory

## 📚 Další zdroje

- [Playwright Documentation](https://playwright.dev/)
- [v0.dev Dashboard](https://v0.dev/chat/askelio-ocr-dashboard-flCiisBiIQj)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Visual Testing Guide](https://playwright.dev/docs/test-screenshots)

## 🆘 Support

Pokud máte problémy s testy:

1. Zkontrolujte [FAQ v README.md](./tests/README.md)
2. Spusťte testy v debug módu
3. Zkontrolujte console logy
4. Vytvořte issue s detaily problému

---

**Happy Testing! 🎭✨**
