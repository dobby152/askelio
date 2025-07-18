# 🚀 Multilayer OCR System - Kompletní Dokumentace

## 📋 Přehled

Nový multilayer OCR systém pro Askelio je pokročilý systém pro rozpoznávání textu, který kombinuje několik OCR služeb s AI rozhodováním pro dosažení nejlepších možných výsledků.

## 🏗️ Architektura

### Hlavní komponenty

1. **MultilayerOCREngine** - Hlavní orchestrátor systému
2. **OCR Providers** - Různé OCR služby (Tesseract, Google Vision, Azure, PaddleOCR)
3. **AI Decision Engine** - Inteligentní výběr nejlepších výsledků
4. **Result Fusion Engine** - Kombinování výsledků z různých služeb
5. **Advanced Image Preprocessor** - Pokročilé předzpracování obrázků

### Struktura souborů

```
backend/multilayer_ocr/
├── __init__.py                           # Factory funkce a hlavní exporty
├── core/
│   ├── multilayer_ocr_engine.py         # Hlavní engine
│   ├── ocr_provider_base.py             # Abstraktní třída pro providery
│   └── ocr_result.py                    # Datové struktury
├── providers/
│   ├── tesseract_provider.py            # Tesseract OCR
│   ├── google_vision_provider.py        # Google Cloud Vision
│   ├── azure_computer_vision_provider.py # Azure Computer Vision
│   └── paddleocr_provider.py            # PaddleOCR (open source)
├── ai_decision/
│   └── ai_decision_engine.py            # AI rozhodovací systém
├── fusion/
│   └── result_fusion_engine.py          # Kombinování výsledků
└── preprocessing/
    └── advanced_image_preprocessor.py   # Pokročilé předzpracování
```

## 🔧 Konfigurace

### Základní konfigurace

```python
config = {
    'engine': {
        'max_workers': 5,
        'timeout': 300
    },
    'providers': {
        'tesseract': {
            'enabled': True,
            'tesseract_path': r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        },
        'google_vision': {
            'enabled': True,
            'credentials_path': 'backend/google-credentials.json'
        },
        'azure_vision': {
            'enabled': False,
            'subscription_key': 'your-azure-key',
            'endpoint': 'your-azure-endpoint'
        },
        'paddle_ocr': {
            'enabled': False,
            'lang': 'en',
            'use_gpu': False
        }
    },
    'ai_decision': {
        'provider_weights': {
            'google_vision': 1.0,
            'azure_computer_vision': 0.95,
            'paddle_ocr': 0.85,
            'tesseract': 0.75
        }
    },
    'fusion': {
        'similarity_threshold': 0.6,
        'confidence_threshold': 0.3
    }
}
```

## 🚀 Použití

### Základní použití

```python
from multilayer_ocr import create_multilayer_ocr_engine, ProcessingMethod

# Vytvoření engine
ocr_engine = create_multilayer_ocr_engine(config)

# Zpracování dokumentu
result = await ocr_engine.process_document(
    image_path="path/to/document.jpg",
    processing_methods=[ProcessingMethod.BASIC, ProcessingMethod.GENTLE]
)

# Výsledky
print(f"Nejlepší provider: {result.best_result.provider.value}")
print(f"Confidence: {result.final_confidence}")
print(f"Text: {result.best_result.text}")
print(f"Strukturovaná data: {result.best_result.structured_data}")
```

### API Endpoints

#### Nahrání a zpracování dokumentu
```
POST /documents/upload
```

#### Test multilayer OCR
```
POST /test-multilayer-ocr
```

#### Status OCR systému
```
GET /ocr/status
```

#### Informace o providerech
```
GET /ocr/providers
```

## 🧠 AI Decision Engine

AI Decision Engine používá několik kritérií pro výběr nejlepšího výsledku:

### Hodnotící kritéria

1. **Confidence Score** (25%) - Základní confidence od OCR providera
2. **Text Quality** (20%) - Kvalita extrahovaného textu
3. **Structured Data Completeness** (20%) - Úplnost strukturovaných dat
4. **Provider Reliability** (15%) - Historická spolehlivost providera
5. **Cross Validation** (15%) - Shoda s ostatními výsledky
6. **Language Consistency** (5%) - Jazyková konzistence

### Algoritmus rozhodování

1. **Comprehensive Scoring** - Každý výsledek dostane skóre na základě všech kritérií
2. **Cross Validation** - Porovnání výsledků mezi providery
3. **Consensus Analysis** - Analýza shody ve strukturovaných datech
4. **Adaptive Learning** - Učení z historických dat

## 🔄 Result Fusion

Result Fusion Engine kombinuje nejlepší části z různých OCR výsledků:

### Fusion strategie

1. **Text Fusion** - Kombinování textu pomocí konsenzu
2. **Structured Data Fusion** - Hlasování pro strukturovaná data
3. **Confidence Fusion** - Váhovaný průměr confidence scores

### Typy fusion

- **Consensus-based** - Výběr na základě shody
- **Confidence-weighted** - Váhování podle confidence
- **Longest Common Subsequence** - Hledání společných částí

## 🖼️ Image Preprocessing

Advanced Image Preprocessor nabízí několik metod předzpracování:

### Processing Methods

1. **NONE** - Žádné předzpracování
2. **BASIC** - Základní: grayscale, denoise, contrast enhancement
3. **GENTLE** - Jemné: minimální změny, zachování kvality
4. **AGGRESSIVE** - Agresivní: maximální vylepšení pro obtížné obrázky
5. **CUSTOM** - Pokročilé techniky s unsharp masking

### Techniky

- **Noise Reduction** - Odstranění šumu
- **Contrast Enhancement** - CLAHE algoritmus
- **Skew Correction** - Korekce natočení
- **Adaptive Binarization** - Adaptivní prahování
- **Morphological Operations** - Morfologické operace

## 📊 OCR Providers

### Tesseract OCR
- **Typ**: Open source, lokální
- **Výhody**: Rychlý, offline, zdarma
- **Nevýhody**: Nižší přesnost u složitých dokumentů
- **Confidence**: Max 85%

### Google Cloud Vision
- **Typ**: Cloud API
- **Výhody**: Velmi vysoká přesnost, pokročilé funkce
- **Nevýhody**: Vyžaduje internet, platební
- **Confidence**: Max 95%

### Azure Computer Vision
- **Typ**: Cloud API
- **Výhody**: Vysoká přesnost, Read API
- **Nevýhody**: Vyžaduje internet, platební
- **Confidence**: Max 90%

### PaddleOCR
- **Typ**: Open source, lokální
- **Výhody**: Dobrá podpora více jazyků, zdarma
- **Nevýhody**: Větší závislosti, pomalejší
- **Confidence**: Max 90%

## 🧪 Testování

### Spuštění testů

```bash
cd backend
python test_multilayer_ocr.py
```

### Test suite obsahuje

1. **Základní funkcionalita** - Test celého multilayer systému
2. **Individuální providery** - Test každého providera zvlášť
3. **Performance benchmark** - Měření výkonu různých konfigurací

## 📈 Monitoring a Analytics

### Metriky

- **Processing Time** - Doba zpracování
- **Provider Success Rate** - Úspěšnost providerů
- **Confidence Scores** - Distribuce confidence
- **Fusion Success Rate** - Úspěšnost fusion

### Logging

Systém loguje:
- Výběr providerů
- AI rozhodování
- Fusion aplikace
- Chyby a varování

## 🔧 Optimalizace

### Performance optimalizace

1. **Paralelní zpracování** - Současné spouštění více providerů
2. **Timeout management** - Ochrana před dlouhými operacemi
3. **Resource pooling** - Efektivní využití zdrojů
4. **Caching** - Ukládání výsledků preprocessing

### Memory management

- Automatické čištění dočasných souborů
- Optimalizace velikosti obrázků
- Garbage collection pro velké objekty

## 🚨 Error Handling

### Typy chyb

1. **Provider Errors** - Chyby jednotlivých OCR služeb
2. **Network Errors** - Problémy s připojením
3. **File Errors** - Problémy se soubory
4. **Configuration Errors** - Chybná konfigurace

### Fallback mechanismy

- Automatické přepnutí na jiný provider
- Graceful degradation při chybách
- Retry logika pro dočasné chyby

## 📋 Požadavky

### Python balíčky

```
# Core OCR
pytesseract==0.3.10
pillow==10.1.0
pdf2image==1.16.3

# Advanced processing
opencv-python==4.8.1.78
opencv-contrib-python==4.8.1.78
scikit-image==0.21.0
numpy==1.24.3

# Cloud providers
google-cloud-vision==3.4.5
# azure-cognitiveservices-vision-computervision==0.9.0
# paddleocr==2.7.3
```

### Systémové požadavky

- **Tesseract OCR** - Nainstalovaný lokálně
- **Poppler** - Pro PDF zpracování
- **Google Cloud credentials** - Pro Google Vision
- **Azure credentials** - Pro Azure Computer Vision

## 🔄 Migrace ze starého systému

### Kroky migrace

1. **Backup** současného systému
2. **Instalace** nových závislostí
3. **Konfigurace** providerů
4. **Testování** na vzorových dokumentech
5. **Postupné nasazení**

### Kompatibilita

Nový systém je zpětně kompatibilní s API endpoints, ale vrací rozšířené informace.

## 🎯 Budoucí vylepšení

### Plánované funkce

1. **Machine Learning Model** - Vlastní model pro provider selection
2. **Real-time Learning** - Učení z uživatelského feedbacku
3. **Document Type Optimization** - Optimalizace pro různé typy dokumentů
4. **Batch Processing** - Hromadné zpracování dokumentů
5. **Advanced Caching** - Inteligentní cache systém

### Rozšíření providerů

- **AWS Textract** - Amazon OCR služba
- **EasyOCR** - Další open source alternativa
- **Custom Models** - Vlastní trénované modely

## 📞 Podpora

Pro technickou podporu nebo dotazy kontaktujte vývojový tým Askelio.

---

*Dokumentace vytvořena pro Askelio Multilayer OCR System v1.0.0*
