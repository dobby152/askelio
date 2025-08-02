# 🌐 Vercel Environment Variables pro Askelio Frontend

Nastavte tyto environment variables ve vašem Vercel projektu `askelio-pi`.

## 📋 Jak nastavit ve Vercel

1. Jděte na [Vercel Dashboard](https://vercel.com/dashboard)
2. Vyberte projekt `askelio-pi`
3. **Settings** → **Environment Variables**
4. Přidejte každou proměnnou níže

## 🔧 Environment Variables

### **Production, Preview & Development**

Nastavte pro všechna prostředí:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://askelio-backend-742213261617.europe-west1.run.app

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://nfmjqnojvjjapszgwcfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzEyMjEsImV4cCI6MjA2OTA0NzIyMX0.e7BkuYECKj6uhtt34yjxIs02UyzdTbeysGK85p4gb0I

# Environment
NEXT_PUBLIC_ENVIRONMENT=production

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_OCR=true
NEXT_PUBLIC_ENABLE_MEMORY=true
```

## 📝 Detailní nastavení

### 1. NEXT_PUBLIC_API_URL
- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://askelio-backend-742213261617.europe-west1.run.app`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

### 2. NEXT_PUBLIC_SUPABASE_URL
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://nfmjqnojvjjapszgwcfd.supabase.co`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

### 3. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzEyMjEsImV4cCI6MjA2OTA0NzIyMX0.e7BkuYECKj6uhtt34yjxIs02UyzdTbeysGK85p4gb0I`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

### 4. NEXT_PUBLIC_ENVIRONMENT
- **Name**: `NEXT_PUBLIC_ENVIRONMENT`
- **Value**: `production`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

### 5. NEXT_PUBLIC_ENABLE_ANALYTICS
- **Name**: `NEXT_PUBLIC_ENABLE_ANALYTICS`
- **Value**: `true`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

### 6. NEXT_PUBLIC_ENABLE_OCR
- **Name**: `NEXT_PUBLIC_ENABLE_OCR`
- **Value**: `true`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

### 7. NEXT_PUBLIC_ENABLE_MEMORY
- **Name**: `NEXT_PUBLIC_ENABLE_MEMORY`
- **Value**: `true`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

## 🔄 Po nastavení

1. **Redeploy** váš Vercel projekt
2. **Testujte** připojení k backendu
3. **Ověřte** Supabase autentizaci

## 🧪 Testování

Po nastavení environment variables:

```bash
# Test API připojení
curl https://askelio-pi.vercel.app/api/health

# Test Supabase připojení
# Otevřete browser console na https://askelio-pi.vercel.app
# Zkontrolujte, že se načítají správné environment variables
```

## ✅ Checklist

- [ ] `NEXT_PUBLIC_API_URL` nastaven
- [ ] `NEXT_PUBLIC_SUPABASE_URL` nastaven  
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` nastaven
- [ ] `NEXT_PUBLIC_ENVIRONMENT` nastaven
- [ ] Feature flags nastaveny
- [ ] Projekt redeployed
- [ ] Testování dokončeno

## 🎉 Hotovo!

Váš frontend je nyní připojen k produkčnímu backendu a Supabase databázi!
