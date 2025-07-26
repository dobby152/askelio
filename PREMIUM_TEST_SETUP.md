# 🚀 Premium Test Account Setup

Vytvořil jsem ti kompletní systém pro testování premium funkcí! Tady jsou všechny potřebné informace:

## 📋 Supabase Projekt Info

**Projekt:** askelio-auth  
**ID:** nfmjqnojvjjapszgwcfd  
**URL:** https://nfmjqnojvjjapszgwcfd.supabase.co  
**Region:** eu-central-1  

### 🔑 API Klíče

**Anon Key (pro frontend):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzEyMjEsImV4cCI6MjA2OTA0NzIyMX0.e7BkuYECKj6uhtt34yjxIs02UyzdTbeysGK85p4gb0I
```

**Service Role Key (pro backend):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ3MTIyMSwiZXhwIjoyMDY5MDQ3MjIxfQ.NWDs7PzWFh2QHKuBOXX-jzLJCJH5nKrG8T62rIqYh88
```

## 🛠️ Jak vytvořit premium test účet

### Krok 1: Aktualizuj .env soubory

**Backend (.env):**
```env
SUPABASE_URL=https://nfmjqnojvjjapszgwcfd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzEyMjEsImV4cCI6MjA2OTA0NzIyMX0.e7BkuYECKj6uhtt34yjxIs02UyzdTbeysGK85p4gb0I
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ3MTIyMSwiZXhwIjoyMDY5MDQ3MjIxfQ.NWDs7PzWFh2QHKuBOXX-jzLJCJH5nKrG8T62rIqYh88
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://nfmjqnojvjjapszgwcfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzEyMjEsImV4cCI6MjA2OTA0NzIyMX0.e7BkuYECKj6uhtt34yjxIs02UyzdTbeysGK85p4gb0I
```

### Krok 2: Spusť migrace

1. Jdi na https://nfmjqnojvjjapszgwcfd.supabase.co
2. Přihlaš se do Supabase Dashboard
3. Jdi na SQL Editor
4. Spusť postupně všechny migrace ze složky `database/migrations/`:
   - `001_create_users_table.sql`
   - `002_create_user_memories.sql` 
   - `003_create_credit_transactions.sql`
   - `004_create_documents_table.sql`
   - `005_create_user_sessions.sql`

### Krok 3: Vytvoř premium účet

1. **Registruj se přes web nebo Supabase Auth:**
   - Email: `premium@askelio.cz`
   - Heslo: `PremiumTest123!`

2. **Spusť upgrade script:**
   - Otevři `database/create_premium_test_account.sql`
   - Spusť v Supabase SQL Editor

3. **Otestuj funkce:**
   - Spusť `database/test_premium_features.sql`

## 🎯 Co získáš s premium účtem

### 💰 Kredity
- **500 kreditů** na start
- **50 bonus kreditů** navíc
- Celkem: **550 kreditů**
- Aktuální zůstatek po testech: **~549 kreditů**

### 🚀 Premium funkce
- **10,000 API calls/hour** (vs 100 free)
- **Prioritní zpracování**
- **Pokročilé AI modely**
- **Rozšířené statistiky**
- **Premium podpora**

### 📊 Test transakce
- Purchase: +500 kreditů (premium subscription)
- Usage: -0.15 kreditů (Claude 3.5 Sonnet)
- Usage: -0.08 kreditů (GPT-4o)
- Usage: -0.25 kreditů (Claude 3.5 Sonnet)
- Bonus: +50 kreditů (welcome bonus)

## 🧪 Testovací scénáře

### 1. Test autentifikace
```bash
# Přihlaš se s premium účtem
Email: premium@askelio.cz
Heslo: PremiumTest123!
```

### 2. Test dashboard komponent
- **CreditBalance**: Zobrazí 549+ kreditů
- **DocumentHistory**: Ukáže testovací dokumenty
- **UserProfile**: Premium badge a statistiky

### 3. Test API rate limitů
```javascript
// Premium má 10,000 req/hour vs 100 free
const rateLimits = {
  free: 100,
  basic: 1000, 
  premium: 10000
}
```

### 4. Test credit systému
```javascript
// Zkus zpracovat dokument
const cost = await sdk.estimateProcessingCost('invoice', 3, 'accuracy_first')
const result = await sdk.processDocument(file, options)
```

## 🔧 Troubleshooting

### Problém s migrací?
```sql
-- Zkontroluj tabulky
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Problém s účtem?
```sql
-- Zkontroluj uživatele
SELECT * FROM public.users WHERE email = 'premium@askelio.cz';
```

### Problém s kredity?
```sql
-- Zkontroluj transakce
SELECT * FROM public.credit_transactions 
WHERE user_id = (SELECT id FROM public.users WHERE email = 'premium@askelio.cz')
ORDER BY created_at DESC;
```

## 🎉 Ready to test!

Máš teď kompletní premium testovací prostředí s:
- ✅ Supabase databází s RLS
- ✅ Premium účtem s 549+ kredity  
- ✅ Funkčním credit systémem
- ✅ Memory systémem
- ✅ Dashboard komponentami
- ✅ API rate limiting
- ✅ Kompletní autentifikací

**Enjoy testing! 🚀**
