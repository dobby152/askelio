# Askelio Backend

FastAPI backend pro automatizované zpracování faktur a účtenek pomocí OCR technologií a AI.

## Funkce

- **Nahrání dokumentů**: Podpora PDF, PNG, JPG, JPEG, GIF, BMP, TIFF
- **OCR zpracování**: Hybridní přístup s Tesseract + Google Vision API
- **Kreditní systém**: Flexibilní platby za AI zpracování
- **Stripe integrace**: Bezpečné platby a webhooky
- **ERP export**: ISDOC a Pohoda XML formáty
- **API klíče**: Zabezpečený přístup pro externí systémy
- **Asynchronní zpracování**: Celery workers s Redis

## Technologie

- **FastAPI**: Moderní Python web framework
- **SQLAlchemy**: ORM pro PostgreSQL
- **Celery**: Asynchronní task queue
- **Redis**: Message broker a cache
- **Tesseract**: Open-source OCR
- **Google Vision API**: AI OCR pro vysokou přesnost
- **Stripe**: Platební systém
- **Supabase**: Autentizace (volitelné)

## Instalace

### 1. Požadavky

- Python 3.11+
- PostgreSQL 15+
- Redis
- Tesseract OCR

### 2. Nastavení prostředí

```bash
# Vytvoření virtuálního prostředí
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalace závislostí
pip install -r requirements.txt
```

### 3. Konfigurace

Zkopírujte `.env.example` do `.env` a nastavte proměnné:

```bash
cp .env.example .env
```

Klíčové proměnné:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `STRIPE_SECRET_KEY`: Stripe API klíč
- `GOOGLE_APPLICATION_CREDENTIALS`: Cesta k Google Cloud service account

### 4. Databáze

```bash
# Spuštění PostgreSQL a Redis (nebo použijte Docker)
# Vytvoření databáze 'askelio'
# Tabulky se vytvoří automaticky při prvním spuštění
```

### 5. Spuštění

```bash
# API server
uvicorn main:app --reload

# Celery worker (v novém terminálu)
celery -A ocr_processor worker --loglevel=info
```

## API Dokumentace

Po spuštění je dostupná na:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Hlavní endpointy

#### Autentizace
- `POST /auth/register` - Registrace uživatele
- `POST /auth/login` - Přihlášení
- `GET /auth/me` - Info o uživateli

#### Dokumenty
- `POST /documents/upload` - Nahrání dokumentu
- `GET /documents` - Seznam dokumentů
- `GET /documents/{id}` - Detail dokumentu

#### Kredity
- `GET /credits/balance` - Zůstatek kreditů
- `POST /credits/checkout` - Vytvoření Stripe checkout
- `POST /credits/webhook` - Stripe webhook

#### Integrace (vyžaduje API klíč)
- `POST /integrations/api-keys` - Vytvoření API klíče
- `GET /integrations/documents` - Seznam dokumentů pro export
- `GET /integrations/documents/{id}/export` - Export dokumentu
- `GET /integrations/formats` - Podporované formáty

## Workflow zpracování

1. **Nahrání**: Uživatel nahraje dokument přes API
2. **Validace**: Kontrola typu a velikosti souboru
3. **Uložení**: Soubor se uloží do storage
4. **Async zpracování**: Celery worker zpracuje dokument
5. **OCR**: Tesseract OCR s fallback na Google Vision
6. **Extrakce**: Strukturovaná data z textu
7. **Uložení výsledků**: Aktualizace databáze
8. **Notifikace**: Real-time update pro frontend

## Kreditní systém

- **Tesseract OCR**: Zdarma
- **AI OCR**: 1 kredit za dokument
- **Balíčky**: 100, 500, 1000 kreditů
- **Platby**: Stripe checkout sessions
- **Webhooky**: Automatické připsání kreditů

## ERP Integrace

### API klíče
```bash
# Vytvoření API klíče
curl -X POST "http://localhost:8000/integrations/api-keys" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "ERP integrace"}'
```

### Export dokumentů
```bash
# JSON export
curl -H "X-API-Key: YOUR_API_KEY" \
  "http://localhost:8000/integrations/documents/DOC_ID/export?format=json"

# ISDOC XML export
curl -H "X-API-Key: YOUR_API_KEY" \
  "http://localhost:8000/integrations/documents/DOC_ID/export?format=isdoc"

# Pohoda XML export
curl -H "X-API-Key: YOUR_API_KEY" \
  "http://localhost:8000/integrations/documents/DOC_ID/export?format=pohoda_xml"
```

## Monitoring a logy

Logy se ukládají do složky `logs/`:
- `askelio_YYYYMMDD.log` - Obecné logy
- `ocr_YYYYMMDD.log` - OCR zpracování
- `api_YYYYMMDD.log` - API volání

## Docker

```bash
# Spuštění celého stacku
docker-compose up -d

# Pouze backend
docker build -t askelio-backend .
docker run -p 8000:8000 askelio-backend
```

## Vývoj

### Struktura projektu
```
backend/
├── main.py              # FastAPI aplikace
├── database.py          # Databázová konfigurace
├── models.py            # SQLAlchemy modely
├── config.py            # Nastavení aplikace
├── auth_utils.py        # Autentizace
├── ocr_processor.py     # OCR zpracování
├── credit_service.py    # Správa kreditů
├── stripe_utils.py      # Stripe integrace
├── erp_exports.py       # ERP exporty
├── routers/             # API endpointy
│   ├── auth.py
│   ├── documents.py
│   ├── credits.py
│   └── integrations.py
└── sql/                 # SQL skripty
```

### Přidání nového exportního formátu

1. Rozšiřte `erp_exports.py` o nový exporter
2. Aktualizujte `ERPExportService.get_supported_formats()`
3. Přidejte handling do `integrations.py`

## Bezpečnost

- JWT tokeny pro autentizaci
- API klíče pro externí přístup
- Stripe webhook signature verification
- Input validace a sanitizace
- Rate limiting (doporučeno pro produkci)

## Produkční nasazení

1. **Environment**: Nastavte `ENVIRONMENT=production`
2. **Secrets**: Použijte silné tajné klíče
3. **Database**: Produkční PostgreSQL s backupy
4. **Redis**: Persistent Redis instance
5. **Storage**: Cloud storage (AWS S3, Google Cloud)
6. **Monitoring**: Sentry, DataDog, nebo podobné
7. **Load balancer**: Nginx nebo cloud load balancer
8. **SSL**: HTTPS certifikáty

## Licence

Proprietární software - Askelio Team
