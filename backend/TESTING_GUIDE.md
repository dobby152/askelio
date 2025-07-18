# Askelio - Průvodce testováním

## Přehled
Tento průvodce vás provede testováním Google Vision API integrace v Askelio aplikaci.

## Předpoklady

### 1. Nastavení Google Cloud credentials
```bash
# Zkopírujte stažený JSON soubor do backend složky
cp ~/Downloads/crested-guru-465410-h3-59c6a1dbbe93.json backend/google-credentials.json

# Nebo nahraďte placeholder v existujícím souboru
# Otevřete backend/google-credentials.json a nahraďte obsah
```

### 2. Ověření konfigurace
```bash
cd backend
python test_google_vision.py
```

Očekávaný výstup:
```
🚀 Spouštění testů Google Vision API

🔍 Testování konfigurace Google Vision API...
📁 GOOGLE_APPLICATION_CREDENTIALS: google-credentials.json
✅ Soubor s credentials existuje: google-credentials.json
✅ Credentials byly úspěšně načteny
📋 Project ID: crested-guru-465410-h3
✅ Google Vision client byl úspěšně inicializován

🔍 Testování našeho Google Vision client...
✅ Google Vision client je inicializován

==================================================
📊 VÝSLEDKY TESTŮ:
   Konfigurace: ✅ OK
   Client:      ✅ OK

🎉 Všechny testy prošly! Google Vision API je připravena k použití.
```

## Testování OCR funkcionality

### 1. Spuštění backend serveru
```bash
cd backend
python main.py
```

Server běží na: http://localhost:8000

### 2. Test přes API endpoint

#### Pomocí curl:
```bash
# Test s obrázkem
curl -X POST "http://localhost:8000/test-vision" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_invoice.png"

# Test s PDF
curl -X POST "http://localhost:8000/test-vision" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_invoice.pdf"
```

#### Pomocí Python requests:
```python
import requests

# Test endpoint
url = "http://localhost:8000/test-vision"

# Nahrajte testovací soubor
with open("test_invoice.png", "rb") as f:
    files = {"file": f}
    response = requests.post(url, files=files)
    print(response.json())
```

### 3. Očekávaná odpověď
```json
{
  "status": "success",
  "google_vision_available": true,
  "file_name": "test_invoice.png",
  "extracted_text": "FAKTURA\nČíslo: 2025-001\nDodavatel:\nAskelio s.r.o...",
  "confidence": 0.95,
  "text_length": 1234,
  "structured_data_summary": {
    "pages": 1,
    "blocks": 15,
    "paragraphs": 25,
    "words": 150
  }
}
```

## Testování přes frontend

### 1. Spuštění frontend aplikace
```bash
cd frontend
npm run dev
```

Frontend běží na: http://localhost:3000

### 2. Test nahrávání dokumentu
1. Otevřete http://localhost:3000/dashboard
2. Přetáhněte testovací soubor do upload oblasti
3. Sledujte zpracování v real-time

### 3. Ověření výsledků
- Dokument se zobrazí v seznamu "Nedávné dokumenty"
- Status se změní z "Zpracovává se" na "Dokončeno"
- Můžete zobrazit extrahovaná data

## Vytvoření testovacích souborů

### 1. PDF z HTML
```bash
# Pomocí wkhtmltopdf (pokud je nainstalován)
wkhtmltopdf test_invoice.html test_invoice.pdf

# Nebo otevřete test_invoice.html v prohlížeči a uložte jako PDF
```

### 2. Obrázek z PDF
```bash
# Pomocí ImageMagick
convert test_invoice.pdf test_invoice.png

# Nebo použijte online konvertor
```

### 3. Testovací faktury
V složce `test_documents/` najdete různé typy testovacích dokumentů:
- Česká faktura (test_invoice_cz.pdf)
- Anglická faktura (test_invoice_en.pdf)
- Účtenka (test_receipt.jpg)
- Složitý dokument (test_complex.pdf)

## Řešení problémů

### Chyba: "Google Vision API not configured"
```bash
# Zkontrolujte .env soubor
cat .env | grep GOOGLE

# Zkontrolujte credentials soubor
ls -la google-credentials.json

# Spusťte test
python test_google_vision.py
```

### Chyba: "Permission denied"
```bash
# Ověřte obsah credentials souboru
head -5 google-credentials.json

# Zkontrolujte project ID
grep project_id google-credentials.json
```

### Chyba: "Quota exceeded"
- Zkontrolujte využití v Google Cloud Console
- Ověřte, že máte aktivní billing account
- Zkontrolujte API limity

### Nízká přesnost OCR
1. Zkontrolujte kvalitu vstupního obrázku
2. Ověřte, že text je čitelný
3. Zkuste jiný formát souboru (PDF vs PNG)

## Monitoring a ladění

### 1. Logy aplikace
```bash
# Backend logy
tail -f backend/logs/app.log

# Celery worker logy
tail -f backend/logs/celery.log
```

### 2. Google Cloud Console
- Sledujte API calls v Cloud Console
- Zkontrolujte billing a usage
- Ověřte service account permissions

### 3. Databáze
```sql
-- Zkontrolujte zpracované dokumenty
SELECT * FROM documents ORDER BY created_at DESC LIMIT 10;

-- Zkontrolujte credit transakce
SELECT * FROM credit_transactions ORDER BY created_at DESC LIMIT 10;
```

## Výkonnostní testy

### 1. Hromadné nahrávání
```python
import asyncio
import aiohttp

async def upload_multiple_files():
    files = ["test1.pdf", "test2.jpg", "test3.png"]
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for file in files:
            task = upload_file(session, file)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        return results
```

### 2. Měření rychlosti
- Tesseract OCR: ~2-5 sekund
- Google Vision API: ~1-3 sekundy
- Celkové zpracování: ~3-8 sekund

## Kontakt
Pro technickou podporu: askelatest@gmail.com
