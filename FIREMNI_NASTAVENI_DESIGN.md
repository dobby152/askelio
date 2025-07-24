# 🏢 DESIGNOVÉ ZADÁNÍ - Firemní Nastavení & Team Management

## 🎯 Cíl Projektu
Vytvořit kompletní firemní centrum pro správu týmu, schvalování faktur a nastavení společnosti s konzistentním designem.

---

## 📋 Hlavní Sekce

### 1. Moje Firma (Company Settings)

```
┌─────────────────────────────────────────────────────────┐
│ 🏢 Moje Firma                               [Upravit]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────┐  📋 Základní údaje                  │
│ │     LOGO        │  Askela s.r.o.                      │
│ │   [Nahrát]      │  IČO: 12345678                      │
│ └─────────────────┘  DIČ: CZ12345678                    │
│                      Plátce DPH: ✅ Ano                 │
│                                                         │
│ 📍 Adresa                                               │
│ Václavské náměstí 1                                     │
│ 110 00 Praha 1                                         │
│ Česká republika                                         │
│                                                         │
│ 📞 Kontakt                                              │
│ Email: info@askela.cz                                   │
│ Telefon: +420 123 456 789                              │
│ Web: www.askela.cz                                      │
│                                                         │
│ 🏦 Bankovní údaje                                       │
│ Účet: 123456789/0100                                    │
│ IBAN: CZ65 0100 0000 0012 3456 7890                    │
│ SWIFT: KOMBCZPP                                         │
│                                                         │
│ [💾 Uložit změny] [🔄 Obnovit z ARES]                 │
└─────────────────────────────────────────────────────────┘
```

### 2. Správa Týmu (Team Management)

```
┌─────────────────────────────────────────────────────────┐
│ 👥 Správa Týmu                          [+ Přidat člena]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔍 [Hledat členy...]                    [Filtry ▼]     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Jan Novák                           🟢 Online    │ │
│ │ jan.novak@askela.cz                                 │ │
│ │ 👑 Administrátor • Přidán 15.1.2024                │ │
│ │                                                     │ │
│ │ 🔐 Oprávnění:                                       │ │
│ │ ✅ Schvalování faktur    ✅ Správa týmu             │ │
│ │ ✅ Export dat           ✅ Nastavení firmy          │ │
│ │                                                     │ │
│ │ 📊 Aktivita: 47 dokumentů • 94% přesnost           │ │
│ │ [✏️ Upravit] [🔒 Oprávnění] [📧 Kontakt]          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Marie Svoboda                       🟡 Neaktivní │ │
│ │ marie.svoboda@askela.cz                             │ │
│ │ 📝 Účetní • Přidána 20.1.2024                      │ │
│ │                                                     │ │
│ │ 🔐 Oprávnění:                                       │ │
│ │ ✅ Schvalování faktur    ❌ Správa týmu             │ │
│ │ ✅ Export dat           ❌ Nastavení firmy          │ │
│ │                                                     │ │
│ │ 📊 Aktivita: 23 dokumentů • 96% přesnost           │ │
│ │ [✏️ Upravit] [🔒 Oprávnění] [📧 Kontakt]          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 📈 Statistiky týmu:                                    │
│ • Celkem členů: 5                                      │
│ • Aktivních: 3                                         │
│ • Průměrná přesnost: 95.2%                             │
│ • Zpracováno tento měsíc: 156 dokumentů                │
└─────────────────────────────────────────────────────────┘
```

### 3. Schvalování Faktur (Invoice Approval)

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Schvalování Faktur                   [Nastavení]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔔 Čekají na schválení (3)              [Vše] [Moje]   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📄 Invoice_2024_001.pdf                🔴 Vysoká   │ │
│ │ Askela s.r.o. → John Doe                           │ │
│ │ 💰 45,000 CZK • 📅 Splatnost: 3 dny               │ │
│ │                                                     │ │
│ │ 🎯 Přesnost: 98% • ✅ ARES validováno              │ │
│ │ 📋 Kategorie: Služby • 🏷️ Projekt: Web redesign   │ │
│ │                                                     │ │
│ │ 👤 Nahrál: Jan Novák • ⏰ Před 2 hodinami          │ │
│ │ 💬 Poznámka: "Urgentní platba za redesign"         │ │
│ │                                                     │ │
│ │ [✅ Schválit] [❌ Zamítnout] [👁 Detail] [💬 Komentář]│ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🧾 Receipt_Store_ABC.pdf               🟡 Střední  │ │
│ │ Store ABC → Company Ltd                             │ │
│ │ 💰 1,250 CZK • 📅 Splatnost: 7 dní                │ │
│ │                                                     │ │
│ │ 🎯 Přesnost: 89% • ⚠️ Vyžaduje kontrolu           │ │
│ │ 📋 Kategorie: Materiál • 🏷️ Projekt: Kancelář     │ │
│ │                                                     │ │
│ │ 👤 Nahrála: Marie Svoboda • ⏰ Včera               │ │
│ │ 💬 Poznámka: "Kancelářské potřeby"                 │ │
│ │                                                     │ │
│ │ [✅ Schválit] [❌ Zamítnout] [👁 Detail] [💬 Komentář]│ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 📊 Přehled schvalování:                                │
│ • Čekají: 3 • Schváleno dnes: 12 • Zamítnuto: 1       │
│ • Průměrný čas schválení: 2.3 hodiny                   │
└─────────────────────────────────────────────────────────┘
```

### 4. Workflow Nastavení

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Workflow Nastavení                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔄 Schvalovací proces                                   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💰 Částka faktury                                   │ │
│ │                                                     │ │
│ │ 📊 0 - 5,000 CZK                                    │ │
│ │ ✅ Automatické schválení                            │ │
│ │ 👤 Schvalovatel: Systém                             │ │
│ │                                                     │ │
│ │ 📊 5,001 - 25,000 CZK                               │ │
│ │ 👤 Vyžaduje schválení: Účetní                       │ │
│ │ ⏰ Lhůta: 24 hodin                                  │ │
│ │                                                     │ │
│ │ 📊 25,001 - 100,000 CZK                             │ │
│ │ 👥 Vyžaduje schválení: Účetní + Vedoucí             │ │
│ │ ⏰ Lhůta: 48 hodin                                  │ │
│ │                                                     │ │
│ │ 📊 Nad 100,000 CZK                                  │ │
│ │ 👑 Vyžaduje schválení: Administrátor                │ │
│ │ ⏰ Lhůta: 72 hodin                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 🔔 Notifikace                                           │
│ ✅ Email při novém dokumentu                            │
│ ✅ Email při schválení/zamítnutí                        │
│ ✅ Denní souhrn čekajících dokumentů                    │
│ ✅ Upozornění na blížící se splatnost                   │
│                                                         │
│ [💾 Uložit nastavení]                                  │
└─────────────────────────────────────────────────────────┘
```

### 5. Role a Oprávnění

```
┌─────────────────────────────────────────────────────────┐
│ 🔐 Role a Oprávnění                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👑 Administrátor                        [Upravit]   │ │
│ │                                                     │ │
│ │ ✅ Všechna oprávnění                                │ │
│ │ ✅ Správa týmu a rolí                               │ │
│ │ ✅ Nastavení firmy                                  │ │
│ │ ✅ Schvalování bez limitů                           │ │
│ │ ✅ Export všech dat                                 │ │
│ │ ✅ Přístup k auditním logům                         │ │
│ │                                                     │ │
│ │ 👥 Přiřazeno: Jan Novák                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📝 Účetní                               [Upravit]   │ │
│ │                                                     │ │
│ │ ✅ Schvalování do 25,000 CZK                        │ │
│ │ ✅ Export finančních dat                            │ │
│ │ ✅ Úprava kategorií dokumentů                       │ │
│ │ ❌ Správa týmu                                      │ │
│ │ ❌ Nastavení firmy                                  │ │
│ │ ❌ Mazání dokumentů                                 │ │
│ │                                                     │ │
│ │ 👥 Přiřazeno: Marie Svoboda, Petr Dvořák           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Uživatel                             [Upravit]   │ │
│ │                                                     │ │
│ │ ✅ Nahrávání dokumentů                              │ │
│ │ ✅ Zobrazení vlastních dokumentů                    │ │
│ │ ✅ Export vlastních dat                             │ │
│ │ ❌ Schvalování dokumentů                            │ │
│ │ ❌ Zobrazení cizích dokumentů                       │ │
│ │ ❌ Správa nastavení                                 │ │
│ │                                                     │ │
│ │ 👥 Přiřazeno: 12 uživatelů                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [+ Vytvořit novou roli]                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Konzistentní Design System

### Navigace (Rozšířená)

```
┌─────────────────┐
│ ASKELIO         │
│                 │
│ 📊 Dashboard    │
│ 📄 Dokumenty    │
│ 📤 Upload       │
│ 📈 Statistiky   │
│                 │
│ ─────────────── │
│ 🏢 FIRMA        │
│                 │
│ 🏢 Moje firma   │
│ 👥 Tým          │
│ ✅ Schvalování  │
│ 🔐 Oprávnění    │
│ ⚙️ Nastavení    │
│                 │
│ ─────────────── │
│                 │
│ 👤 John Doe     │
│ Premium Plan    │
│ 📊 89% využití  │
│                 │
│ [⚙️] [🔔] [❓]   │
│                 │
│ 🚪 Logout       │
└─────────────────┘
```

### Barevné Schéma
- **Primární:** `#3b82f6` (modrá) - hlavní akce
- **Schváleno:** `#10b981` (zelená) - pozitivní stavy
- **Čeká:** `#f59e0b` (oranžová) - upozornění
- **Zamítnuto:** `#ef4444` (červená) - negativní stavy
- **Administrátor:** `#8b5cf6` (fialová) - vysoká role
- **Účetní:** `#06b6d4` (tyrkysová) - střední role
- **Uživatel:** `#6b7280` (šedá) - základní role

### Ikony & Symboly
- **Firma:** 🏢 `Building`
- **Tým:** 👥 `Users`
- **Schválení:** ✅ `CheckCircle`
- **Čeká:** ⏰ `Clock`
- **Zamítnuto:** ❌ `XCircle`
- **Administrátor:** 👑 `Crown`
- **Oprávnění:** 🔐 `Lock`
- **Nastavení:** ⚙️ `Settings`

### Komponenty

#### Status Badge
```tsx
// Schváleno
<Badge className="bg-green-100 text-green-800">
  <CheckCircle className="w-3 h-3 mr-1" />
  Schváleno
</Badge>

// Čeká na schválení
<Badge className="bg-orange-100 text-orange-800">
  <Clock className="w-3 h-3 mr-1" />
  Čeká
</Badge>

// Zamítnuto
<Badge className="bg-red-100 text-red-800">
  <XCircle className="w-3 h-3 mr-1" />
  Zamítnuto
</Badge>
```

#### Role Badge
```tsx
// Administrátor
<Badge className="bg-purple-100 text-purple-800">
  <Crown className="w-3 h-3 mr-1" />
  Administrátor
</Badge>

// Účetní
<Badge className="bg-cyan-100 text-cyan-800">
  <Calculator className="w-3 h-3 mr-1" />
  Účetní
</Badge>
```

#### Priority Badge
```tsx
// Vysoká priorita
<Badge className="bg-red-100 text-red-800">
  🔴 Vysoká
</Badge>

// Střední priorita
<Badge className="bg-orange-100 text-orange-800">
  🟡 Střední
</Badge>

// Nízká priorita
<Badge className="bg-green-100 text-green-800">
  🟢 Nízká
</Badge>
```

---

## 📱 Responsive Design

### Mobile Layout
```
┌─────────────────┐
│ ☰ ASKELIO    🔔 │
├─────────────────┤
│ 🏢 Moje Firma   │
│                 │
│ Askela s.r.o.   │
│ IČO: 12345678   │
│ [Upravit]       │
├─────────────────┤
│ 👥 Tým (5)      │
│ 3 aktivní       │
│ [Spravovat]     │
├─────────────────┤
│ ✅ Schválení    │
│ 3 čekají        │
│ [Zobrazit]      │
└─────────────────┘
```

### Tablet Layout
```
┌─────────────────────────────────────┐
│ 🏢 Moje Firma              [Upravit]│
├─────────────────────────────────────┤
│ ┌─────────┐  Askela s.r.o.          │
│ │  LOGO   │  IČO: 12345678          │
│ │[Nahrát] │  DIČ: CZ12345678        │
│ └─────────┘  Plátce DPH: ✅         │
│                                     │
│ 📍 Václavské náměstí 1              │
│    110 00 Praha 1                   │
│                                     │
│ [💾 Uložit] [🔄 ARES]              │
└─────────────────────────────────────┘
```

---

## 🔄 Workflow Diagramy

### Schvalovací Proces
```
📄 Dokument nahrán
        ↓
🤖 Automatická analýza
        ↓
💰 Kontrola částky
        ↓
┌─────────────────────┐
│ < 5,000 CZK         │ → ✅ Auto-schváleno
├─────────────────────┤
│ 5,001-25,000 CZK    │ → 👤 Účetní
├─────────────────────┤
│ 25,001-100,000 CZK  │ → 👥 Účetní + Vedoucí
├─────────────────────┤
│ > 100,000 CZK       │ → 👑 Administrátor
└─────────────────────┘
        ↓
📧 Notifikace schvalovateli
        ↓
⏰ Čekání na rozhodnutí
        ↓
┌─────────────────────┐
│ ✅ Schváleno        │ → 📊 Do účetnictví
│ ❌ Zamítnuto        │ → 📧 Zpět nahrávači
│ ⏰ Timeout          │ → 🔔 Eskalace
└─────────────────────┘
```

---

## ✅ Implementační Checklist

### Backend Requirements
- [ ] User roles & permissions system
- [ ] Company settings API endpoints
- [ ] Approval workflow engine
- [ ] Email notification system
- [ ] Audit logging
- [ ] ARES integration for company data

### Frontend Components
- [ ] Company settings form
- [ ] Team management interface
- [ ] Approval queue with filters
- [ ] Role management system
- [ ] Workflow configuration
- [ ] Mobile-responsive design

### Security & Compliance
- [ ] Role-based access control (RBAC)
- [ ] Audit trail for all actions
- [ ] Data encryption at rest
- [ ] GDPR compliance features
- [ ] Session management
- [ ] API rate limiting

---

**🎯 VÝSLEDEK: Kompletní firemní ekosystém s profesionální správou týmu, schvalováním dokumentů a konzistentním designem napříč celou aplikací!** 🏢✨
