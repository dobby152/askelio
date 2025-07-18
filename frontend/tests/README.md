# Dashboard Testing Guide

Tento dokument popisuje kompletní testovací strategii pro Askelio OCR Dashboard vytvořený pomocí v0.dev a testovaný s Playwright.

## 📋 Přehled testů

### 1. Základní testy (`dashboard.spec.ts`)
- **Layout a navigace**: Testuje základní rozložení, sidebar, header
- **Statistické karty**: Ověřuje zobrazení a funkčnost stat karet
- **Grafy a vizualizace**: Testuje charts, tooltips, interaktivitu
- **Upload area**: Testuje nahrávání souborů
- **Tabulka dokumentů**: Testuje zobrazení a akce s dokumenty
- **Responsive design**: Testuje na různých velikostech obrazovky
- **Performance**: Měří rychlost načítání
- **Accessibility**: Testuje přístupnost

### 2. Interaktivní testy (`dashboard-interactions.spec.ts`)
- **File upload**: Drag & drop, validace, progress
- **Chart interactions**: Hover efekty, tooltips, klikání
- **Search a filtry**: Vyhledávání dokumentů
- **Theme switching**: Přepínání světlého/tmavého režimu
- **Notifikace**: Toast zprávy, error handling
- **Export funkcionalita**: Stahování dat
- **Performance monitoring**: Testuje výkon při interakcích
- **Error recovery**: Testuje zotavení z chyb

### 3. Visual regression testy (`dashboard-visual.spec.ts`)
- **Full page screenshots**: Celé stránky na různých zařízeních
- **Component screenshots**: Jednotlivé komponenty
- **Theme screenshots**: Světlý vs tmavý režim
- **Interactive states**: Hover stavy, focus stavy
- **Chart visuals**: Vzhled grafů a vizualizací
- **Error states**: Vzhled chybových stavů
- **Responsive breakpoints**: Všechny breakpointy
- **Animation frames**: Zachycení animací

## 🚀 Spuštění testů

### Základní příkazy

```bash
# Všechny testy
npm run test

# Dashboard testy s helper scriptem
npm run test:dashboard help

# Základní dashboard testy
npm run test:dashboard basic

# Interaktivní testy
npm run test:dashboard interactions

# Visual regression testy
npm run test:dashboard visual

# Všechny dashboard testy
npm run test:dashboard all
```

### Specifické testy

```bash
# Mobile testy
npm run test:dashboard mobile

# Tablet testy
npm run test:dashboard tablet

# Desktop testy
npm run test:dashboard desktop

# Cross-browser testy
npm run test:dashboard crossbrowser

# Performance testy
npm run test:dashboard performance

# Accessibility testy
npm run test:dashboard accessibility

# Upload testy
npm run test:dashboard upload

# Chart testy
npm run test:dashboard charts
```

### Debug a development

```bash
# Debug mode (krok za krokem)
npm run test:dashboard debug

# Headed mode (viditelný browser)
npm run test:dashboard headed

# Update visual baselines
npm run test:dashboard update-visuals

# Zobrazit report
npm run test:dashboard report
```

## 🏗️ Struktura testů

```
tests/
├── dashboard.spec.ts              # Základní funkčnost
├── dashboard-interactions.spec.ts # Interaktivní funkce
├── dashboard-visual.spec.ts       # Visual regression
├── utils/
│   └── dashboard-helpers.ts       # Test utility funkce
└── README.md                      # Tento soubor
```

## 🛠️ Test Utilities

### DashboardHelpers třída

```typescript
import { DashboardHelpers } from './utils/dashboard-helpers';

test('example test', async ({ page }) => {
  const dashboard = new DashboardHelpers(page);
  
  await dashboard.waitForDashboardLoad();
  await dashboard.verifyDashboardSections();
  await dashboard.uploadFile('test.pdf', 'application/pdf', 'content');
});
```

### Dostupné helper metody

- `waitForDashboardLoad()` - Čeká na načtení dashboardu
- `uploadFile()` - Nahraje testovací soubor
- `toggleTheme()` - Přepne téma
- `searchDocuments()` - Vyhledá dokumenty
- `verifyStatsCards()` - Ověří statistické karty
- `verifyCharts()` - Ověří grafy
- `checkAccessibility()` - Testuje přístupnost
- `measureLoadPerformance()` - Měří výkon

## 📱 Responsive Testing

Testy pokrývají tyto breakpointy:

- **Mobile**: 375x667 (iPhone)
- **Mobile Large**: 414x896 (iPhone Plus)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1280x720 (Standard)
- **Desktop Large**: 1920x1080 (Full HD)
- **Desktop XL**: 2560x1440 (2K)

## 🎨 Visual Regression

### Screenshot strategie

1. **Full page**: Celé stránky na různých zařízeních
2. **Components**: Jednotlivé komponenty izolovaně
3. **States**: Různé stavy (hover, focus, error)
4. **Themes**: Světlý a tmavý režim
5. **Animations**: Klíčové snímky animací

### Threshold nastavení

- **Strict mode**: 0.1 (velmi přísné)
- **Standard**: 0.3 (výchozí)
- **Relaxed**: 0.5 (pro animace)

## 🔧 Konfigurace

### Playwright config highlights

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 60000,
  expect: { 
    timeout: 10000,
    threshold: 0.3 
  },
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
});
```

## 📊 Test Coverage

### Funkční pokrytí

- ✅ Layout a navigace
- ✅ Statistické karty
- ✅ Grafy a vizualizace
- ✅ File upload (drag & drop)
- ✅ Search a filtry
- ✅ Theme switching
- ✅ Mobile responsiveness
- ✅ Error handling
- ✅ Performance
- ✅ Accessibility

### Browser pokrytí

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari/WebKit
- ✅ Mobile Chrome
- ✅ Mobile Safari
- ✅ Microsoft Edge

## 🐛 Debugging

### Časté problémy

1. **Timeout chyby**
   ```bash
   # Zvyšte timeout
   npm run test:dashboard basic -- --timeout=90000
   ```

2. **Visual regression failures**
   ```bash
   # Update baselines
   npm run test:dashboard update-visuals
   ```

3. **Flaky testy**
   ```bash
   # Spusťte s retry
   npm run test:dashboard basic -- --retries=3
   ```

### Debug tipy

- Použijte `--headed` pro viditelný browser
- Použijte `--debug` pro step-by-step debugging
- Zkontrolujte screenshots v `test-results/`
- Použijte `page.pause()` pro breakpointy

## 📈 CI/CD Integration

### GitHub Actions example

```yaml
- name: Run Dashboard Tests
  run: |
    npm run test:dashboard all
    
- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 🔄 Maintenance

### Pravidelné úkoly

1. **Týdně**: Spusťte všechny testy
2. **Po změnách UI**: Update visual baselines
3. **Před release**: Full regression testing
4. **Měsíčně**: Review a cleanup test kódu

### Update workflow

```bash
# 1. Spusťte testy
npm run test:dashboard all

# 2. Pokud visual testy failují, update baselines
npm run test:dashboard update-visuals

# 3. Commitněte změny
git add test-results/
git commit -m "Update visual test baselines"
```

## 📚 Další zdroje

- [Playwright Documentation](https://playwright.dev/)
- [v0.dev Dashboard](https://v0.dev/chat/flCiisBiIQj)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Visual Testing Guide](https://playwright.dev/docs/test-screenshots)

## 🤝 Contributing

Při přidávání nových testů:

1. Použijte `DashboardHelpers` pro common operace
2. Přidejte fallback selektory pro robustnost
3. Dokumentujte nové test cases
4. Update visual baselines pokud je potřeba
5. Testujte na všech podporovaných browserech
