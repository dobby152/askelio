# 🌐 Vercel Environment Variables - Aktuální nastavení

Pro váš Vercel projekt `askelio-pi` nastavte tyto environment variables:

## 📋 Rychlé nastavení

Jděte na [Vercel Dashboard](https://vercel.com/dashboard) → Váš projekt → Settings → Environment Variables

## 🔧 Environment Variables (kopírujte přesně)

### **Pro všechna prostředí (Production, Preview, Development):**

```bash
# Backend API URL - AKTUALIZUJTE s vaší Render.com URL
NEXT_PUBLIC_API_URL=https://your-render-service-name.onrender.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://nfmjqnojvjjapszgwcfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzEyMjEsImV4cCI6MjA2OTA0NzIyMX0.e7BkuYECKj6uhtt34yjxIs02UyzdTbeysGK85p4gb0I

# Environment
NEXT_PUBLIC_ENVIRONMENT=production

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_OCR=true
NEXT_PUBLIC_ENABLE_MEMORY=true

# Optional: Monitoring (pokud chcete)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id_here
```

## 📝 Jednotlivé proměnné:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-render-service-name.onrender.com` | All |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nfmjqnojvjjapszgwcfd.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | All |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` | All |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `true` | All |
| `NEXT_PUBLIC_ENABLE_OCR` | `true` | All |
| `NEXT_PUBLIC_ENABLE_MEMORY` | `true` | All |

## ⚠️ DŮLEŽITÉ:

1. **NEXT_PUBLIC_API_URL**: Nahraďte `your-render-service-name` skutečným názvem vašeho Render.com service
2. **Všechny proměnné**: Nastavte pro **Production**, **Preview** i **Development**
3. **Po nastavení**: Redeploy váš Vercel projekt

## 🔍 Jak najít vaši Render.com URL:

1. Jděte na [Render.com Dashboard](https://dashboard.render.com)
2. Vyberte váš backend service
3. URL bude ve formátu: `https://service-name-xyz.onrender.com`
4. Zkopírujte a použijte jako `NEXT_PUBLIC_API_URL`

## ✅ Checklist:

- [ ] Všechny proměnné nastaveny ve Vercel
- [ ] NEXT_PUBLIC_API_URL aktualizováno s Render.com URL
- [ ] Projekt redeployed
- [ ] Frontend se připojuje k backendu
- [ ] Supabase autentizace funguje

## 🎯 Po nastavení:

1. **Redeploy** Vercel projekt
2. **Testujte** na `https://askelio-pi.vercel.app`
3. **Zkontrolujte** browser console pro chyby
4. **Otestujte** login/registraci
