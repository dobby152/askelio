# 🔐 Testovací Údaje pro Přihlášení

Byly přidány testovací údaje na přihlašovací stránku pro snadnější testování aplikace.

## 📋 Testovací Údaje

**Email:** `premium@askelio.cz`
**Heslo:** `PremiumTest123!`

## 🎯 Implementované Funkce

### 1. **Automatické Vyplnění Testovacích Údajů**
- Na přihlašovací stránce se zobrazuje modrý panel s testovacími údaji
- Panel je viditelný pouze ve vývojovém prostředí (`NODE_ENV === 'development'`)
- Tlačítko "Vyplnit" automaticky vyplní email a heslo

### 2. **Test ID Atributy**
Přidány `data-testid` atributy pro Playwright testy:
- `data-testid="email-input"` - Email input pole
- `data-testid="password-input"` - Heslo input pole  
- `data-testid="login-button"` - Přihlašovací tlačítko
- `data-testid="logout-button"` - Odhlašovací tlačítko (v Navbar)

### 3. **Vzhled Testovacího Panelu**
```tsx
{/* Test credentials section - only show in development */}
{process.env.NODE_ENV === 'development' && (
  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-blue-800 mb-1">Testovací údaje</h3>
        <p className="text-xs text-blue-600">
          Email: premium@askelio.cz<br />
          Heslo: PremiumTest123!
        </p>
      </div>
      <button
        type="button"
        onClick={fillTestCredentials}
        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
      >
        Vyplnit
      </button>
    </div>
  </div>
)}
```

## 🧪 Použití pro Testování

### Manuální Testování
1. Otevřete aplikaci ve vývojovém prostředí
2. Přejděte na `/auth/login`
3. Uvidíte modrý panel s testovacími údaji
4. Klikněte na "Vyplnit" pro automatické vyplnění
5. Klikněte na "Přihlásit se"

### Automatické Testování (Playwright)
```javascript
// Vyplnění testovacích údajů
await page.fill('[data-testid="email-input"]', 'premium@askelio.cz');
await page.fill('[data-testid="password-input"]', 'PremiumTest123!');
await page.click('[data-testid="login-button"]');

// Odhlášení
await page.click('[data-testid="logout-button"]');
```

## 🔒 Bezpečnost

- Testovací panel se zobrazuje **pouze ve vývojovém prostředí**
- V produkčním prostředí (`NODE_ENV === 'production'`) panel není viditelný
- Testovací údaje jsou určeny pouze pro vývoj a testování

## 📁 Upravené Soubory

1. **`frontend/src/app/auth/login/page.tsx`**
   - Přidán testovací panel s údaji
   - Přidána funkce `fillTestCredentials()`
   - Přidány `data-testid` atributy

2. **`frontend/src/components/Navbar.tsx`**
   - Přidán `data-testid="logout-button"` na odhlašovací tlačítko

3. **`tests/global-setup.js`**
   - Aktualizovány testovací údaje pro konzistenci

## ✅ Výhody

- **Rychlejší testování**: Není potřeba ručně vyplňovat údaje
- **Konzistentní údaje**: Stejné údaje napříč všemi testy
- **Bezpečné**: Zobrazuje se pouze ve vývojovém prostředí
- **Uživatelsky přívětivé**: Jasně označené a snadno použitelné
- **Automatizace**: Podporuje jak manuální, tak automatické testování

## 🎨 Vizuální Ukázka

Testovací panel se zobrazuje jako modrý box nad přihlašovacím formulářem:

```
┌─────────────────────────────────────────┐
│ 🔧 Testovací údaje                      │
│ Email: premium@askelio.cz               │
│ Heslo: PremiumTest123!          [Vyplnit]│
└─────────────────────────────────────────┘
```

---

**Status**: ✅ **IMPLEMENTOVÁNO** - Testovací údaje jsou nyní dostupné na přihlašovací stránce pro snadnější testování aplikace.
