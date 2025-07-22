# Gemini AI Data Structuring

## Přehled

Rozšířili jsme váš OCR systém o pokročilou vrstvu Gemini AI pro strukturování a validaci dat. Gemini AI nyní nejen vybírá nejlepší OCR výsledek, ale také inteligentně strukturuje extrahovaná data do standardizovaného formátu.

## Nové Funkce

### 🤖 Gemini Data Structuring
- **Inteligentní extrakce**: Gemini AI analyzuje OCR text a extrahuje strukturovaná data
- **Validace**: Kontroluje a opravuje chyby v základní regex extrakci
- **Porovnání**: Porovnává výsledky s základním strukturováním
- **Standardizace**: Převádí data do konzistentního formátu

### 📊 Rozšířené Strukturované Výstupy
- **Detailní faktury**: Číslo faktury, data, částky, DPH
- **Informace o dodavateli**: Název, IČO, DIČ, adresa
- **Položky**: Detailní rozpis položek s cenami
- **Měny**: Automatická detekce a standardizace měn
- **Daně**: Extrakce DPH a dalších daňových informací

## Architektura

```
OCR Text → Basic Regex → Gemini AI → Structured Data
                ↓              ↓
         Basic Structure → Comparison → Final Result
```

### Workflow
1. **OCR Processing**: 5 OCR providerů zpracuje dokument
2. **Gemini Selection**: Gemini vybere nejlepší OCR výsledek
3. **Basic Structuring**: Regex extrakce základních polí
4. **Gemini Structuring**: AI analýza a strukturování
5. **Validation**: Porovnání a validace výsledků
6. **Final Output**: Nejlepší strukturovaná data

## API Endpointy

### Hlavní Processing
```http
POST /process-invoice
```
Nyní vrací rozšířené informace o Gemini strukturování:

```json
{
  "status": "success",
  "structured_data": { ... },
  "gemini_structuring": {
    "used": true,
    "confidence": 0.95,
    "validation_notes": "Opraveno datum formátu, přidáno IČO",
    "fields_extracted": ["invoice_number", "date_issued", "total_amount"],
    "comparison_with_basic": {
      "basic_fields_count": 3,
      "gemini_fields_count": 8,
      "improvements": [...],
      "differences": [...]
    }
  }
}
```

### Testovací Endpoint
```http
POST /test-gemini-structuring
Content-Type: application/x-www-form-urlencoded

text=FAKTURA č. 2024-001...
```

## Strukturovaný Výstup

### Formát Dat
```json
{
  "structured_data": {
    "document_type": "invoice",
    "invoice_number": "2024-001",
    "date_issued": "2024-07-21",
    "due_date": "2024-08-05",
    "total_amount": {
      "value": "24200.00",
      "currency": "CZK"
    },
    "vendor": {
      "name": "ABC s.r.o.",
      "ico": "12345678",
      "dic": "CZ12345678",
      "address": "..."
    },
    "customer": {
      "name": "XYZ spol. s r.o.",
      "ico": "87654321"
    },
    "line_items": [
      {
        "description": "Software licence",
        "quantity": "1",
        "unit_price": "15000.00",
        "total_price": "15000.00"
      }
    ],
    "tax_info": {
      "vat_rate": "21",
      "vat_amount": "4200.00",
      "total_without_vat": "20000.00"
    }
  }
}
```

## Testování

### Spuštění Testů
```bash
cd backend
python test_gemini_structuring.py
```

### Test přes API
```bash
# Test s ukázkovým textem
curl -X POST "http://localhost:8000/test-gemini-structuring" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=FAKTURA č. 2024-001
Datum: 21.07.2024
Celkem: 24 200,00 Kč
Dodavatel: ABC s.r.o.
IČO: 12345678"
```

## Konfigurace

### Environment Variables
```bash
GOOGLE_API_KEY=your_gemini_api_key_here
```

### Gemini Model
- **Model**: `gemini-1.5-flash`
- **Funkce**: OCR analýza + Data strukturování
- **Fallback**: Základní regex extrakce

## Výhody

### 🎯 Přesnost
- **Vyšší přesnost**: Gemini AI opravuje chyby regex extrakce
- **Kontextové porozumění**: Rozumí struktuře dokumentů
- **Inteligentní validace**: Kontroluje logiku dat

### 🚀 Flexibilita
- **Více formátů**: Podporuje různé formáty faktur
- **Jazyky**: Čeština i angličtina
- **Adaptabilita**: Učí se z různých typů dokumentů

### 🔍 Transparentnost
- **Porovnání**: Vidíte rozdíl mezi základní a AI extrakcí
- **Validační poznámky**: Gemini vysvětluje své rozhodnutí
- **Confidence skóre**: Míra jistoty pro každé pole

## Monitoring

### Metriky
- **Úspěšnost Gemini**: Procento úspěšných strukturování
- **Zlepšení**: Počet polí navíc oproti základní extrakci
- **Čas zpracování**: Doba Gemini analýzy
- **Confidence**: Průměrná jistota extrakce

### Logy
```
INFO: Gemini AI structuring completed with confidence: 0.95
INFO: Using Gemini structured data with confidence: 0.95
INFO: Gemini AI selected provider: google_vision with confidence: 0.95
```

## Troubleshooting

### Časté Problémy
1. **Gemini nedostupný**: Fallback na základní strukturování
2. **Nízká confidence**: Kombinace základní + Gemini extrakce
3. **API limit**: Rate limiting pro Gemini API

### Řešení
- Zkontrolujte `GOOGLE_API_KEY`
- Ověřte síťové připojení
- Sledujte API kvóty v Google Cloud Console
