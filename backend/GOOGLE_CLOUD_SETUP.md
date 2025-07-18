# Google Cloud Vision API Setup

## Přehled
Askelio používá Google Cloud Vision API pro pokročilé OCR zpracování dokumentů. Tato funkce poskytuje vyšší přesnost než standardní Tesseract OCR, zejména pro složité dokumenty.

## Nastavení

### 1. Google Cloud Project
- **Project ID:** `crested-guru-465410-h3`
- **Project Name:** My First Project

### 2. Service Account
- **Název:** Askelio Vision API
- **Email:** `askelio-vision-api@crested-guru-465410-h3.iam.gserviceaccount.com`
- **Role:** VisionAI Editor
- **Popis:** Service account for Askelio application to access Google Cloud Vision API for OCR processing of invoices and receipts

### 3. API Klíč
Stažený JSON soubor obsahuje:
- **Soubor:** `crested-guru-465410-h3-59c6a1dbbe93.json`
- **Umístění:** `backend/google-credentials.json`

## Instalace

### Krok 1: Vytvořit google-credentials.json
1. Zkopírujte template soubor:
   ```bash
   cp backend/google-credentials-template.json backend/google-credentials.json
   ```
2. Otevřete stažený soubor s vašimi Google Cloud credentials
3. Zkopírujte celý obsah
4. Nahraďte obsah souboru `backend/google-credentials.json`

### Krok 2: Ověření konfigurace
Soubor `.env` už obsahuje správnou konfiguraci:
```
GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json
```

### Krok 3: Test funkčnosti
Spusťte backend a zkuste nahrát dokument. Systém automaticky:
1. Nejprve použije Tesseract OCR (zdarma)
2. Pokud je confidence < 80%, použije Google Vision API (1 kredit)
3. Vybere nejlepší výsledek

## Funkce

### OCR Processing Flow
1. **Tesseract OCR** - Základní zpracování (zdarma)
2. **Google Vision API** - Pokročilé zpracování (1 kredit)
3. **Automatický výběr** - Nejlepší výsledek na základě confidence score

### Podporované formáty
- PDF dokumenty
- Obrázky (JPG, PNG, TIFF)
- Faktury a účtenky
- Česká a anglická lokalizace

### Extrakce dat
Systém automaticky extrahuje:
- Číslo faktury
- Datum
- Celková částka
- Název dodavatele
- IČO/DIČ
- Položky faktury

## Bezpečnost

### Ochrana API klíče
- ✅ Soubor je v .gitignore
- ✅ Používá se service account (ne osobní účet)
- ✅ Minimální oprávnění (pouze Vision AI)
- ⚠️ Nikdy nevkládejte klíč do veřejných repozitářů

### Monitoring
- Google automaticky deaktivuje klíče nalezené ve veřejných repozitářích
- Můžete sledovat využití v Google Cloud Console

## Troubleshooting

### Chyba: "Google Vision API not configured"
1. Zkontrolujte, že soubor `google-credentials.json` existuje
2. Ověřte, že obsahuje správný JSON (ne placeholder)
3. Restartujte backend aplikaci

### Chyba: "Permission denied"
1. Ověřte, že service account má roli "VisionAI Editor"
2. Zkontrolujte, že Vision API je povoleno v projektu

### Chyba: "Quota exceeded"
1. Zkontrolujte limity v Google Cloud Console
2. Zvažte upgrade na placený plán

## Náklady

### Google Cloud Vision API
- **Text Detection:** $1.50 za 1000 požadavků
- **Document Text Detection:** $1.50 za 1000 požadavků
- **Měsíční free tier:** 1000 požadavků zdarma

### Askelio kredity
- **AI OCR zpracování:** 1 kredit za dokument
- **Tesseract OCR:** zdarma (neomezeno)

## Kontakt
Pro technickou podporu kontaktujte: askelatest@gmail.com
