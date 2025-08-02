# 🚀 Askelio Backend - Google Cloud Run Deployment Guide

Tento návod vás provede nasazením Askelio backendu na Google Cloud Run.

## 📋 Předpoklady

1. **Google Cloud Account** s aktivním projektem
2. **gcloud CLI** nainstalované a nakonfigurované
3. **Docker** (volitelné, Cloud Build to zvládne)
4. **Aktivní Supabase projekt** s databází

## 🛠️ Krok za krokem

### 1. Příprava Google Cloud projektu

```bash
# Nastavte váš projekt ID
export PROJECT_ID="your-project-id"

# Spusťte setup script
./setup-cloud-run.sh $PROJECT_ID europe-west1
```

### 2. Konfigurace environment variables

1. Zkopírujte `.env.production.template` a vyplňte hodnoty:

```bash
cp .env.production.template .env.production
```

2. **Důležité proměnné k nastavení:**
   - `SUPABASE_ANON_KEY` - z vašeho Supabase projektu
   - `SUPABASE_SERVICE_ROLE_KEY` - z vašeho Supabase projektu  
   - `DATABASE_URL` - PostgreSQL connection string z Supabase
   - `OPENROUTER_API_KEY` - pro LLM modely
   - `CORS_ORIGINS` - vaše Vercel domény

### 3. Deployment

```bash
# Spusťte deployment
./deploy.sh $PROJECT_ID europe-west1
```

### 4. Nastavení environment variables v Cloud Run

Po úspěšném deploymentu nastavte environment variables:

```bash
# Základní konfigurace
gcloud run services update askelio-backend \
  --region=europe-west1 \
  --set-env-vars="ENVIRONMENT=production,PORT=8080"

# Supabase konfigurace
gcloud run services update askelio-backend \
  --region=europe-west1 \
  --set-env-vars="SUPABASE_URL=https://nfmjqnojvjjapszgwcfd.supabase.co,SUPABASE_ANON_KEY=your_key"

# CORS konfigurace
gcloud run services update askelio-backend \
  --region=europe-west1 \
  --set-env-vars="CORS_ORIGINS=https://askelio.vercel.app,https://askelio-git-main.vercel.app"
```

### 5. Testování

```bash
# Získejte URL služby
SERVICE_URL=$(gcloud run services describe askelio-backend --region=europe-west1 --format="value(status.url)")

# Testujte health check
curl $SERVICE_URL/health

# Testujte API dokumentaci
open $SERVICE_URL/docs
```

## 🔧 Konfigurace

### Důležité soubory

- `Dockerfile` - Multi-stage build pro optimalizaci
- `cloudbuild.yaml` - Cloud Build konfigurace
- `.dockerignore` - Optimalizace Docker buildu
- `.env.production.template` - Template pro produkční proměnné

### Cloud Run nastavení

- **Memory**: 2Gi (pro OCR a ML modely)
- **CPU**: 2 (pro rychlé zpracování)
- **Max instances**: 10 (škálování podle zátěže)
- **Min instances**: 0 (úspora nákladů)
- **Timeout**: 300s (pro dlouhé OCR operace)

## 🔐 Bezpečnost

### Service Account
Automaticky se vytvoří service account s oprávněními:
- `roles/vision.admin` - pro Google Vision API
- `roles/storage.admin` - pro Cloud Storage
- `roles/secretmanager.secretAccessor` - pro tajné klíče

### CORS
CORS je nakonfigurován pouze pro vaše Vercel domény:
- `https://askelio.vercel.app`
- `https://askelio-git-main.vercel.app`
- Preview deployments: `https://askelio-*.vercel.app`

## 📊 Monitoring

### Health Checks
- **Endpoint**: `/health`
- **System Status**: `/api/v1/system/status`
- **Interval**: 30s

### Logs
```bash
# Zobrazit logy
gcloud run services logs read askelio-backend --region=europe-west1

# Sledovat logy v reálném čase
gcloud run services logs tail askelio-backend --region=europe-west1
```

## 🔄 CI/CD

Pro automatické deployments můžete nastavit GitHub Actions nebo Cloud Build triggers:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: google-github-actions/setup-gcloud@v0
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
      - run: |
          cd backend
          gcloud builds submit --config=cloudbuild.yaml
```

## 🆘 Troubleshooting

### Časté problémy

1. **Build fails** - Zkontrolujte Dockerfile a dependencies
2. **Service won't start** - Zkontrolujte environment variables
3. **CORS errors** - Ověřte CORS_ORIGINS nastavení
4. **OCR fails** - Zkontrolujte Google Vision API oprávnění

### Užitečné příkazy

```bash
# Zobrazit informace o službě
gcloud run services describe askelio-backend --region=europe-west1

# Aktualizovat službu
gcloud run services update askelio-backend --region=europe-west1 --memory=4Gi

# Smazat službu
gcloud run services delete askelio-backend --region=europe-west1
```

## 💰 Náklady

Odhadované měsíční náklady pro střední zátěž:
- **Cloud Run**: $10-30/měsíc
- **Google Vision API**: $5-15/měsíc  
- **Cloud Storage**: $1-5/měsíc
- **Cloud Build**: $2-10/měsíc

**Celkem**: ~$20-60/měsíc (závisí na využití)
