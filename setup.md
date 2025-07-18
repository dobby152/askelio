# 🚀 ASKELIO - KOMPLETNÍ SETUP GUIDE

## 📋 PŘEHLED ARCHITEKTURY

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Databáze      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │     Redis       │              │
         └──────────────│   (Celery)      │──────────────┘
                        │   Port: 6379    │
                        └─────────────────┘
```

## 🛠️ RYCHLÝ START

### 1. 📦 INSTALACE DOCKER DESKTOP
- Stáhněte z: https://www.docker.com/products/docker-desktop/
- Nainstalujte a spusťte Docker Desktop

### 2. 🚀 SPUŠTĚNÍ CELÉHO STACKU
```bash
# Klonování a příprava
cd C:\Users\User\Desktop\askelio

# Spuštění všech služeb
docker-compose up -d

# Kontrola stavu
docker-compose ps
```

### 3. 🌐 PŘÍSTUP K APLIKACI
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

### 4. 🔑 DEMO PŘIHLAŠOVACÍ ÚDAJE
- **Email**: askelatest@gmail.com
- **Heslo**: Fanda12312
- **Demo kredity**: 100

## 🔧 DETAILNÍ KONFIGURACE

### Backend (.env)
```env
# Databáze
DATABASE_URL=postgresql://askelio:askelio_dev_password@localhost:5432/askelio

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=askelio-super-secret-jwt-key-development-only
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=fr.fiala152@gmail.com
SMTP_PASSWORD=Fanda12312312?

# Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

### Frontend (.env.local)
```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Development
NODE_ENV=development
```

## 🧪 TESTOVÁNÍ

### Backend API Test
```bash
curl http://localhost:8000/health
```

### Upload Test
```bash
curl -X POST -F "file=@test.pdf" http://localhost:8000/documents/upload
```

### Frontend Test
```bash
# Otevřete v prohlížeči
http://localhost:3000
```

## 📁 STRUKTURA PROJEKTU

```
askelio/
├── frontend/                 # Next.js aplikace
│   ├── src/
│   │   ├── app/             # App Router
│   │   ├── components/      # React komponenty
│   │   └── lib/            # Utility funkce
│   ├── .env.local          # Frontend konfigurace
│   └── package.json
├── backend/                 # FastAPI aplikace
│   ├── main.py             # Hlavní aplikace
│   ├── database.py         # Databázové modely
│   ├── worker.py           # Celery worker
│   ├── sql/init.sql        # Databázová inicializace
│   ├── uploads/            # Nahrané soubory
│   ├── .env               # Backend konfigurace
│   └── requirements.txt
└── docker-compose.yml      # Orchestrace služeb
```

## 🔍 TROUBLESHOOTING

### Docker problémy
```bash
# Restart služeb
docker-compose restart

# Vyčištění
docker-compose down -v
docker-compose up -d

# Logy
docker-compose logs backend
docker-compose logs postgres
```

### Port konflikty
```bash
# Kontrola portů
netstat -an | findstr :3000
netstat -an | findstr :8000
netstat -an | findstr :5432
```

### Databáze problémy
```bash
# Připojení k databázi
docker exec -it askelio-postgres psql -U askelio -d askelio

# Reset databáze
docker-compose down -v
docker-compose up -d postgres
```

## 🎯 DALŠÍ KROKY

1. **Supabase Auth** - Nastavit autentifikaci
2. **Google Cloud Vision** - OCR funkcionalita
3. **Stripe** - Platební systém
4. **Production Deploy** - Nasazení na server

## 📞 PODPORA

Pokud máte problémy:
1. Zkontrolujte Docker Desktop běží
2. Ověřte porty nejsou obsazené
3. Zkontrolujte logy: `docker-compose logs`
4. Restart: `docker-compose restart`
