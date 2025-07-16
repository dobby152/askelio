# Askelio - Automatizace zpracování faktur

Askelio je SaaS platforma pro automatizované vytěžování dat z faktur a účtenek pomocí OCR technologií a AI.

## Architektura

- **Frontend**: Next.js s TypeScript
- **Backend**: Python FastAPI
- **Databáze**: PostgreSQL
- **Asynchronní úlohy**: Celery + Redis
- **Storage**: Supabase Storage
- **Autentizace**: Supabase Auth
- **Platby**: Stripe

## Struktura projektu

```
askelio/
├── frontend/          # Next.js aplikace
├── backend/           # FastAPI aplikace
├── docs/             # Dokumentace
├── docker-compose.yml # Development environment
└── README.md
```

## Rychlý start

### Požadavky

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis
- Docker (volitelné)

### Development setup

1. **Klonování repozitáře**
```bash
git clone https://github.com/dobby152/askelio.git
cd askelio
```

2. **Backend setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend setup**
```bash
cd frontend
npm install
```

4. **Databáze setup**
```bash
# Spustit PostgreSQL a Redis
# Vytvořit databázi 'askelio'
# Spustit migrace (bude implementováno)
```

5. **Spuštění aplikace**
```bash
# Backend (v backend/ složce)
uvicorn main:app --reload

# Frontend (v frontend/ složce)
npm run dev

# Celery worker (v backend/ složce)
celery -A worker worker --loglevel=info
```

## Funkce

### MVP (Minimální životaschopný produkt)
- [ ] Nahrání dokumentů (PDF, obrázky)
- [ ] OCR zpracování (Tesseract + AI fallback)
- [ ] Kreditní systém
- [ ] Základní export dat
- [ ] Uživatelská autentizace

### Post-MVP
- [ ] Integrace s ERP systémy (Pohoda, Money S3)
- [ ] API pro externí systémy
- [ ] Pokročilé exporty (ISDOC, XML)
- [ ] Webhooky
- [ ] Analytika a reporting

## Technické detaily

Podrobné technické informace najdete v dokumentaci:
- [Technické provedení](./Technické%20Provedení.md)
- [Executive Summary](./Executive%20Summary.md)

## Licence

Proprietární software - Askelio Team
