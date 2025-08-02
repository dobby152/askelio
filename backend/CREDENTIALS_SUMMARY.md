# 🔐 Askelio Backend - Credentials Summary

Přehled všech credentials a konfigurací pro produkční deployment.

## 🎯 **Základní informace**

- **Google Cloud Project**: `crested-guru-465410-h3`
- **Cloud Run Service**: `askelio-backend`
- **Region**: `europe-west1`
- **Service URL**: `https://askelio-backend-742213261617.europe-west1.run.app`
- **Vercel Frontend**: `https://askelio-pi.vercel.app`

## 🗄️ **Supabase (askelio-auth)**

- **Project ID**: `nfmjqnojvjjapszgwcfd`
- **URL**: `https://nfmjqnojvjjapszgwcfd.supabase.co`
- **Region**: `eu-central-1`
- **Status**: `ACTIVE_HEALTHY`

### API Keys
```bash
# Anon Key (public)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzEyMjEsImV4cCI6MjA2OTA0NzIyMX0.e7BkuYECKj6uhtt34yjxIs02UyzdTbeysGK85p4gb0I

# Service Role Key (secret)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ3MTIyMSwiZXhwIjoyMDY5MDQ3MjIxfQ.NWDs7PzWFh2QHKuBOXX-jzLJCJH5nKrG8T62rIqYh88
```

### Database Connection
```bash
# Database URL (need password from Supabase dashboard)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.nfmjqnojvjjapszgwcfd.supabase.co:5432/postgres
```

## ☁️ **Google Cloud Services**

### Service Account
- **Name**: `askelio-backend@crested-guru-465410-h3.iam.gserviceaccount.com`
- **Roles**:
  - `roles/vision.admin` (Google Vision API)
  - `roles/storage.admin` (Cloud Storage)
  - `roles/secretmanager.secretAccessor` (Secret Manager)

### APIs Enabled
- ✅ Cloud Run API
- ✅ Cloud Build API
- ✅ Container Registry API
- ✅ Google Vision API (for OCR)
- ✅ Cloud Storage API

## 🌐 **CORS Configuration**

```bash
CORS_ORIGINS=https://askelio-pi.vercel.app,https://askelio-pi-git-main.vercel.app
```

## 🚀 **Deployment Commands**

### 1. Set Environment Variables
```bash
cd backend
./set-env-vars.sh
```

### 2. Deploy Backend
```bash
cd backend
./deploy.sh
```

### 3. Setup Google Cloud Resources
```bash
cd backend
./setup-cloud-run.sh crested-guru-465410-h3
```

## ⚠️ **Manual Steps Required**

### 1. OpenRouter API Key ✅ CONFIGURED
```bash
# OpenRouter API key is already configured in the deployment scripts
OPENROUTER_API_KEY=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
```

### 2. Database Password
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/nfmjqnojvjjapszgwcfd/settings/database)
2. Get database password
3. Update environment variable:
```bash
gcloud run services update askelio-backend \
  --region=europe-west1 \
  --set-env-vars="DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.nfmjqnojvjjapszgwcfd.supabase.co:5432/postgres"
```

### 3. Update Vercel Environment Variables ✅ READY
See `VERCEL_ENV_VARS.md` for complete setup. Key variables:
```bash
NEXT_PUBLIC_API_URL=https://askelio-backend-742213261617.europe-west1.run.app
NEXT_PUBLIC_SUPABASE_URL=https://nfmjqnojvjjapszgwcfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📁 **Files Created**

- ✅ `backend/.env.production` - Production environment variables
- ✅ `backend/.env.production.template` - Template with your credentials
- ✅ `backend/set-env-vars.sh` - Script to set Cloud Run env vars
- ✅ `backend/deploy.sh` - Updated deployment script
- ✅ `backend/setup-cloud-run.sh` - Google Cloud setup script
- ✅ `backend/Dockerfile` - Optimized Docker configuration
- ✅ `backend/cloudbuild.yaml` - Cloud Build configuration
- ✅ `backend/GOOGLE_VISION_SETUP.md` - Google Vision API setup guide
- ✅ `backend/DEPLOYMENT.md` - Complete deployment guide

## 🔒 **Security Notes**

- ⚠️ **Never commit** `.env.production` to git
- ✅ Use Google Secret Manager for sensitive data in production
- ✅ Service account has minimal required permissions
- ✅ CORS is configured only for your Vercel domains
- ✅ HTTPS enforced in production

## 🧪 **Testing**

### Health Check
```bash
curl https://askelio-backend-742213261617.europe-west1.run.app/health
```

### API Documentation
```bash
open https://askelio-backend-742213261617.europe-west1.run.app/docs
```

## 📊 **Monitoring**

### Cloud Run Logs
```bash
gcloud run services logs read askelio-backend --region=europe-west1
```

### Real-time Logs
```bash
gcloud run services logs tail askelio-backend --region=europe-west1
```

## 🎉 **Next Steps**

1. ✅ Add OpenRouter API key
2. ✅ Get Supabase database password
3. ✅ Deploy your backend code
4. ✅ Update Vercel environment variables
5. ✅ Test the complete application

Your Askelio backend is ready for production! 🚀
