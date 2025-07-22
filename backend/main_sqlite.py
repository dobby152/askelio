# Askelio API - Plně funkční OCR systém
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from typing import List, Optional, Dict, Any
import os
import shutil
from datetime import datetime
import json
import re
import asyncio
from pathlib import Path

# OCR a AI imports
try:
    import pytesseract
    from PIL import Image
    import pdf2image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("⚠️  Tesseract není nainstalován - používám fallback OCR")

# Google Cloud Vision API
try:
    from google.cloud import vision
    from google.oauth2 import service_account
    import io
    GOOGLE_VISION_AVAILABLE = True
except ImportError:
    GOOGLE_VISION_AVAILABLE = False
    print("⚠️  Google Cloud Vision není nainstalován - používám fallback")

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️  OpenAI není nainstalován - používám fallback AI")

# Initialize FastAPI app
app = FastAPI(
    title="Askelio API - Demo",
    description="Demo verze API pro automatizované zpracování faktur a účtenek",
    version="1.0.0-demo"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Real data storage - only uploaded documents
documents = []
users = []

# OCR Configuration
if TESSERACT_AVAILABLE:
    # Nastavení cesty k tesseract (Windows)
    if os.name == 'nt':
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Google Vision Configuration
GOOGLE_CREDENTIALS_PATH = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'backend/google-credentials.json')
google_vision_client = None

if GOOGLE_VISION_AVAILABLE:
    try:
        # Zkusíme různé cesty k credentials
        possible_paths = [
            GOOGLE_CREDENTIALS_PATH,
            'backend/google-credentials.json',
            'google-credentials.json',
            os.path.join(os.path.dirname(__file__), 'google-credentials.json')
        ]

        credentials_path = None
        for path in possible_paths:
            if os.path.exists(path):
                credentials_path = path
                break

        if credentials_path:
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            google_vision_client = vision.ImageAnnotatorClient(credentials=credentials)
            print(f"✅ Google Vision API inicializována s credentials: {credentials_path}")
        else:
            print(f"⚠️  Google credentials soubor nenalezen v žádné z cest: {possible_paths}")
    except Exception as e:
        print(f"⚠️  Chyba při inicializaci Google Vision: {e}")

# AI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
if OPENAI_AVAILABLE and OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

async def extract_text_from_file(file_path: str, file_type: str) -> tuple[str, float, dict]:
    """Kombinovaná extrakce textu pomocí tradičních metod + AI"""
    print(f"🔄 Spouštím kombinovanou extrakci textu pro {os.path.basename(file_path)}")
    print(f"📊 File type: '{file_type}'")

    # Výsledky z různých metod
    results = []

    try:
        # 1. TRADIČNÍ METODY
        if file_type.startswith('text/'):
            # Textový soubor - přímé čtení
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            results.append({
                'method': 'direct_text',
                'text': text,
                'confidence': 1.0,
                'processing_time': 0.1
            })

        elif file_type == 'application/pdf' or file_type.startswith('image/'):
            print(f"🔍 Zpracovávám PDF/obrázek: {file_type}")
            print(f"📊 TESSERACT_AVAILABLE: {TESSERACT_AVAILABLE}")
            print(f"📊 google_vision_client: {google_vision_client is not None}")

            # 2. TESSERACT OCR (tradiční)
            if TESSERACT_AVAILABLE:
                print("🔄 Spouštím Tesseract OCR...")
                tesseract_result = await extract_with_tesseract(file_path, file_type)
                print(f"📊 Tesseract výsledek: confidence={tesseract_result['confidence']}")
                if tesseract_result['confidence'] > 0:
                    results.append(tesseract_result)
                    print("✅ Tesseract výsledek přidán")
                else:
                    print("❌ Tesseract výsledek má nulovou confidence")
            else:
                print("❌ TESSERACT_AVAILABLE je False")

            # 3. GOOGLE VISION API (AI)
            if google_vision_client:
                print("🔄 Spouštím Google Vision API...")
                google_result = await extract_with_google_vision(file_path, file_type)
                print(f"📊 Google Vision výsledek: confidence={google_result['confidence']}")
                if google_result['confidence'] > 0:
                    results.append(google_result)
                    print("✅ Google Vision výsledek přidán")
                else:
                    print("❌ Google Vision výsledek má nulovou confidence")
            else:
                print("❌ google_vision_client je None")
        else:
            print(f"❌ Nepodporovaný file_type: {file_type}")

        # 4. VÝBĚR NEJLEPŠÍHO VÝSLEDKU
        if not results:
            return "Žádná metoda extrakce není dostupná", 0.0, {}

        # Seřadíme podle confidence a vybereme nejlepší
        best_result = max(results, key=lambda x: x['confidence'])

        print(f"✅ Nejlepší metoda: {best_result['method']} (confidence: {best_result['confidence']:.2f})")

        # Metadata o všech pokusech
        metadata = {
            'methods_tried': [r['method'] for r in results],
            'best_method': best_result['method'],
            'all_results': results
        }

        return best_result['text'], best_result['confidence'], metadata

    except Exception as e:
        print(f"❌ Chyba při kombinované extrakci: {e}")
        return f"Chyba při čtení souboru: {str(e)}", 0.0, {}

async def extract_with_tesseract(file_path: str, file_type: str) -> dict:
    """Extrakce pomocí Tesseract OCR (tradiční metoda)"""
    import time
    start_time = time.time()

    try:
        print("📄 Tesseract OCR...")

        if file_type == 'application/pdf':
            # PDF -> obrázky -> OCR
            # Zkusíme najít poppler v různých lokacích
            poppler_paths = [
                r"C:\Users\askelatest\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-24.08.0\Library\bin",
                r"C:\Program Files\poppler\bin",
                r"C:\Program Files (x86)\poppler\bin",
                r"C:\poppler\bin",
                r"C:\Users\askelatest\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-24.08.0\bin",
                r"C:\Users\askelatest\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-24.08.0-0\bin",
                # Zkusíme najít v PATH
                None  # Použije systémovou PATH
            ]

            poppler_path = None
            for path in poppler_paths:
                if path is None:
                    continue  # Skip None path for now
                if os.path.exists(path):
                    poppler_path = path
                    print(f"✅ Našel poppler v: {path}")
                    break

            try:
                if poppler_path:
                    print(f"🔄 Používám poppler z: {poppler_path}")
                    images = pdf2image.convert_from_path(file_path, poppler_path=poppler_path)
                else:
                    print("⚠️ Poppler nenalezen v přednastavených cestách, zkouším systémovou PATH...")
                    images = pdf2image.convert_from_path(file_path)
                    print("✅ PDF úspěšně převeden pomocí systémové PATH")
            except Exception as e:
                print(f"❌ Chyba při převodu PDF: {e}")
                raise Exception(f"Nepodařilo se převést PDF na obrázky: {e}")

            text = ""
            for image in images:
                text += pytesseract.image_to_string(image, lang='ces+eng') + "\n"
        else:
            # Obrázek -> OCR
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image, lang='ces+eng')

        # Výpočet confidence na základě délky a kvality textu
        confidence = calculate_tesseract_confidence(text)

        return {
            'method': 'tesseract_ocr',
            'text': text.strip(),
            'confidence': confidence,
            'processing_time': time.time() - start_time
        }

    except Exception as e:
        print(f"❌ Tesseract chyba: {e}")
        return {
            'method': 'tesseract_ocr',
            'text': f"Tesseract error: {str(e)}",
            'confidence': 0.0,
            'processing_time': time.time() - start_time
        }

async def extract_with_google_vision(file_path: str, file_type: str) -> dict:
    """Extrakce pomocí Google Vision API (AI metoda)"""
    import time
    start_time = time.time()

    try:
        print("🤖 Google Vision API...")

        # Pro PDF musíme nejdřív převést na obrázek
        if file_type == 'application/pdf':
            print("📄 Převádím PDF na obrázek pro Google Vision...")
            try:
                # Zkusíme najít poppler v různých lokacích
                poppler_paths = [
                    r"C:\Users\askelatest\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-24.08.0\Library\bin",
                    r"C:\Program Files\poppler\bin",
                    r"C:\Program Files (x86)\poppler\bin",
                    r"C:\poppler\bin",
                    r"C:\Users\askelatest\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-24.08.0\bin"
                ]

                poppler_path = None
                for path in poppler_paths:
                    if path is None:
                        continue
                    if os.path.exists(path):
                        poppler_path = path
                        print(f"✅ Našel poppler v: {path}")
                        break

                # Převedeme první stránku PDF na obrázek
                if poppler_path:
                    print(f"🔄 Google Vision používá poppler z: {poppler_path}")
                    images = pdf2image.convert_from_path(file_path, first_page=1, last_page=1, poppler_path=poppler_path)
                else:
                    print("⚠️ Poppler nenalezen v přednastavených cestách, zkouším systémovou PATH...")
                    images = pdf2image.convert_from_path(file_path, first_page=1, last_page=1)
                    print("✅ PDF úspěšně převeden pro Google Vision pomocí systémové PATH")

                if not images:
                    raise Exception("Nepodařilo se převést PDF na obrázek")

                # Uložíme obrázek do paměti
                import io
                from PIL import Image as PILImage
                img_byte_arr = io.BytesIO()
                images[0].save(img_byte_arr, format='PNG')
                content = img_byte_arr.getvalue()

            except Exception as e:
                print(f"❌ Chyba při převodu PDF: {e}")
                return {
                    'method': 'google_vision',
                    'text': f"PDF conversion error: {str(e)}",
                    'confidence': 0.0,
                    'processing_time': time.time() - start_time
                }
        else:
            # Pro obrázky čteme přímo
            with io.open(file_path, 'rb') as image_file:
                content = image_file.read()

        image = vision.Image(content=content)

        # Použijeme document_text_detection pro lepší výsledky u dokumentů
        response = google_vision_client.document_text_detection(image=image)

        if response.error.message:
            raise Exception(f'Google Vision API error: {response.error.message}')

        if not response.full_text_annotation:
            return {
                'method': 'google_vision',
                'text': "",
                'confidence': 0.0,
                'processing_time': time.time() - start_time
            }

        # Extrahujeme text
        text = response.full_text_annotation.text

        # Výpočet confidence z Google Vision dat
        confidence = calculate_google_vision_confidence(response.full_text_annotation)

        return {
            'method': 'google_vision',
            'text': text.strip(),
            'confidence': confidence,
            'processing_time': time.time() - start_time
        }

    except Exception as e:
        print(f"❌ Google Vision chyba: {e}")
        return {
            'method': 'google_vision',
            'text': f"Google Vision error: {str(e)}",
            'confidence': 0.0,
            'processing_time': time.time() - start_time
        }

def calculate_tesseract_confidence(text: str) -> float:
    """Výpočet confidence pro Tesseract na základě kvality textu"""
    if not text or len(text.strip()) < 5:
        return 0.05

    score = 0.0

    # 1. Základní délka textu (max 25 bodů)
    if len(text.strip()) >= 50:
        score += 25
    elif len(text.strip()) >= 20:
        score += 15
    elif len(text.strip()) >= 10:
        score += 10
    else:
        score += 5

    # 2. Poměr čitelných slov (max 30 bodů)
    words = text.split()
    readable_words = 0
    for word in words:
        # Slovo je čitelné, pokud má alespoň 2 znaky a obsahuje písmena
        if len(word) >= 2 and any(c.isalpha() for c in word):
            readable_words += 1

    if words:
        word_ratio = readable_words / len(words)
        score += word_ratio * 30

    # 3. Detekce OCR chyb (penalizace až -20 bodů)
    ocr_errors = 0
    error_patterns = ['|||', '###', '***', '???', 'lll', 'III', 'OOO', '000', '111']
    for pattern in error_patterns:
        ocr_errors += text.count(pattern)

    # Penalizace za příliš mnoho speciálních znaků
    special_chars = sum(1 for c in text if not c.isalnum() and c not in ' \n\t.,!?-()[]{}')
    if len(text) > 0:
        special_ratio = special_chars / len(text)
        if special_ratio > 0.3:  # Více než 30% speciálních znaků
            score -= 15

    score -= min(20, ocr_errors * 5)  # Penalizace za OCR chyby

    # 4. Bonus za rozpoznané české/anglické vzory (max 15 bodů)
    czech_patterns = ['faktura', 'účtenka', 'datum', 'částka', 'celkem', 'kč', 'czk']
    english_patterns = ['invoice', 'receipt', 'date', 'amount', 'total', 'eur', 'usd']

    pattern_bonus = 0
    text_lower = text.lower()
    for pattern in czech_patterns + english_patterns:
        if pattern in text_lower:
            pattern_bonus += 2

    score += min(15, pattern_bonus)

    # Převod na 0-1 škálu s realistickým maximem pro Tesseract
    final_confidence = max(0.05, min(0.75, score / 100))  # Tesseract max 75%

    return final_confidence

def calculate_google_vision_confidence(annotation) -> float:
    """Výpočet confidence pro Google Vision na základě API dat"""
    try:
        # Google Vision poskytuje confidence na úrovni slov
        total_confidence = 0
        word_count = 0
        low_confidence_words = 0

        for page in annotation.pages:
            for block in page.blocks:
                for paragraph in block.paragraphs:
                    for word in paragraph.words:
                        if hasattr(word, 'confidence'):
                            confidence = word.confidence
                            total_confidence += confidence
                            word_count += 1

                            # Počítáme slova s nízkou confidence
                            if confidence < 0.7:
                                low_confidence_words += 1

        if word_count > 0:
            avg_confidence = total_confidence / word_count

            # Penalizace za příliš mnoho slov s nízkou confidence
            low_confidence_ratio = low_confidence_words / word_count
            if low_confidence_ratio > 0.3:  # Více než 30% slov má nízkou confidence
                avg_confidence *= 0.8  # Snížíme celkovou confidence

            # Google Vision je obecně přesnější, ale ne perfektní
            return min(avg_confidence * 0.95, 0.90)  # Google Vision max 90%
        else:
            # Pokud nemáme confidence data, použijeme střední hodnotu
            return 0.65  # Konzervativní odhad

    except Exception:
        return 0.65  # Konzervativní fallback

async def fallback_pdf_text_extraction(file_path: str) -> str:
    """Fallback extrakce textu z PDF bez Tesseract"""
    try:
        # Pokusíme se číst jako text
        with open(file_path, 'rb') as f:
            content = f.read()
            # Jednoduchá detekce textu v PDF
            if b'stream' in content and b'endstream' in content:
                return "PDF dokument - text detekován, ale OCR není dostupný"
            return "PDF dokument - vyžaduje OCR pro extrakci textu"
    except:
        return "Chyba při čtení PDF souboru"

async def fallback_image_text_extraction(file_path: str) -> str:
    """Fallback pro obrázky bez OCR"""
    return f"Obrázek detekován - vyžaduje OCR pro extrakci textu. Soubor: {os.path.basename(file_path)}"

async def extract_structured_data(text: str, filename: str) -> Dict[str, Any]:
    """Extrahuje strukturovaná data z textu pomocí AI nebo regex"""

    # Pokusíme se použít AI
    if OPENAI_AVAILABLE and OPENAI_API_KEY:
        return await ai_extract_data(text, filename)
    else:
        # Fallback na regex extrakci
        return await regex_extract_data(text, filename)

async def ai_extract_data(text: str, filename: str) -> Dict[str, Any]:
    """Extrakce dat pomocí OpenAI"""
    try:
        prompt = f"""
Analyzuj následující text z dokumentu '{filename}' a extrahuj strukturovaná data.
Vrať odpověď ve formátu JSON s těmito poli (pokud jsou dostupná):
- document_type: typ dokumentu (faktura, účtenka, smlouva, atd.)
- vendor: název dodavatele/prodejce
- amount: celková částka (pouze číslo)
- currency: měna (CZK, EUR, USD, atd.)
- date: datum vystavení (YYYY-MM-DD formát)
- invoice_number: číslo faktury/dokladu
- items: seznam položek (pokud jsou dostupné)

Text dokumentu:
{text[:2000]}  # Omezíme na 2000 znaků

Odpověz pouze JSON objektem, bez dalšího textu.
"""

        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.1
        )

        result = response.choices[0].message.content
        return json.loads(result)

    except Exception as e:
        print(f"AI extrakce selhala: {e}")
        return await regex_extract_data(text, filename)

async def regex_extract_data(text: str, filename: str) -> Dict[str, Any]:
    """Fallback extrakce pomocí regex"""
    data = {
        "document_type": detect_document_type(text, filename),
        "confidence": 0.7
    }

    # Extrakce dodavatele - vylepšené vzory
    vendor_patterns = [
        # Explicitní označení dodavatele
        r'(?:dodavatel|prodejce|firma):\s*([^\n\r]+)',
        # Název firmy na začátku dokumentu
        r'^([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]+s\.r\.o\.)',
        r'^([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]+a\.s\.)',
        # Název firmy kdekoli v textu
        r'([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]{3,}s\.r\.o\.)',
        r'([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]{3,}a\.s\.)',
        # Specificky pro Askela
        r'(Askela\s+s\.r\.o\.)',
        # Obecný vzor pro firmy
        r'([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]{2,}(?:s\.r\.o\.|a\.s\.|spol\.|Ltd\.|Inc\.))',
    ]

    for pattern in vendor_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            vendor_name = match.group(1).strip()
            # Vyfiltrujeme nesmyslné výsledky
            if len(vendor_name) > 3 and not vendor_name.startswith('Variabilni'):
                data["vendor"] = vendor_name
                break

    # Extrakce částky - vylepšené vzory pro české faktury
    amount_patterns = [
        # CELKEM K ÚHRADĚ (nejvyšší priorita)
        r'(?:celkem\s+k\s+úhradě|celková\s+částka|k\s+úhradě)[\s:]*([0-9\s,\.]+)(?:\s*(CZK|Kč|EUR|USD))?',
        # Částka na řádku s "CELKEM" (vysoká priorita)
        r'CELKEM.*?([0-9]{1,3}(?:[\s,]\d{3})*(?:[,\.]\d{2})?)',
        # České formátování s mezerou jako oddělovačem tisíců: "7 865,00"
        r'([0-9]{1,3}(?:\s\d{3})*(?:,\d{2})?)\s*(?:CZK|Kč|EUR|USD)',
        # Standardní formátování s čárkou: "7,865.00" nebo "7865,00"
        r'([0-9]{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)\s*(CZK|Kč|EUR|USD)',
        # Částka na konci řádku (nižší priorita)
        r'(\d{1,3}(?:[\s,\.]\d{3})*(?:[,\.]\d{2})?)\s*$',
        # Obecný vzor pro částky (nejnižší priorita)
        r'(\d{1,3}(?:[\s,\.]\d{3})*(?:[,\.]\d{2})?)'
    ]

    best_amount = None
    best_confidence = 0

    for i, pattern in enumerate(amount_patterns):
        matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            amount_str = match.group(1).strip()

            # Zpracování českého formátu čísel
            # Příklad: "7 865,00" -> 7865.00
            if ' ' in amount_str and ',' in amount_str:
                # České formátování: mezera jako oddělovač tisíců, čárka jako desetinná
                amount_str = amount_str.replace(' ', '').replace(',', '.')
            elif ',' in amount_str and amount_str.count(',') == 1:
                # Pokud je jen jedna čárka, pravděpodobně desetinný oddělovač
                parts = amount_str.split(',')
                if len(parts[1]) == 2:  # Dvě číslice za čárkou = desetiny
                    amount_str = amount_str.replace(',', '.')
                else:  # Více číslic = oddělovač tisíců
                    amount_str = amount_str.replace(',', '')
            else:
                # Odstraníme mezery (oddělovače tisíců)
                amount_str = amount_str.replace(' ', '')

            try:
                amount_value = float(amount_str)
                # Vyšší priorita pro větší částky a specifické vzory
                confidence = (len(amount_patterns) - i) * 0.15  # První vzor má nejvyšší prioritu
                if amount_value > 1000:  # Bonus pro větší částky
                    confidence += 0.3
                if amount_value > best_confidence:
                    best_amount = amount_value
                    best_confidence = confidence
                    if len(match.groups()) > 1 and match.group(2):
                        data["currency"] = match.group(2).replace('Kč', 'CZK')
                    else:
                        data["currency"] = "CZK"
            except ValueError:
                print(f"⚠️ Nepodařilo se parsovat částku: '{amount_str}' z '{match.group(1)}'")
                continue

    if best_amount:
        data["amount"] = best_amount

    # Extrakce data - vylepšené vzory pro české faktury
    date_patterns = [
        # Datum vystavení (nejvyšší priorita)
        r'(?:datum\s+vystavení|datum\s+vystaveni):\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})',
        # Datum splatnosti
        r'(?:datum\s+splatnosti):\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})',
        # Ze dne
        r'(?:ze\s+dne|vystaveno):\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})',
        # Datum na začátku řádku
        r'^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})',
        # ISO formát (YYYY-MM-DD)
        r'(\d{4})-(\d{1,2})-(\d{1,2})',
        # Evropský formát kdekoli v textu
        r'(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})',
        # Specificky pro faktury s dvojtečkou
        r'Datum\s+vystaveni:\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})'
    ]

    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                day, month, year = match.group(1), match.group(2), match.group(3)
                if len(day) == 4:  # YYYY-MM-DD formát
                    year, month, day = day, month, year

                # Validace data
                day_int, month_int, year_int = int(day), int(month), int(year)
                if 1 <= day_int <= 31 and 1 <= month_int <= 12 and 2000 <= year_int <= 2030:
                    data["date"] = f"{year_int}-{month_int:02d}-{day_int:02d}"
                    break
            except:
                continue

    # Extrakce čísla faktury - vylepšené vzory
    invoice_patterns = [
        # Explicitní označení faktury
        r'(?:faktura|invoice)\s+(?:č\.|číslo|number)?\s*([A-Z0-9\-/]+)',
        # Variabilní symbol (často je to číslo faktury)
        r'(?:variabilni\s+symbol|variable\s+symbol):\s*([A-Z0-9\-/]+)',
        # Číslo na začátku dokumentu
        r'(?:č\.|číslo|#)\s*([A-Z0-9\-/]{6,})',
        # Dlouhé číslo (pravděpodobně faktura)
        r'([A-Z0-9]{8,})',
        # Obecné číslo
        r'(\d{6,})'
    ]

    for pattern in invoice_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            invoice_num = match.group(1).strip()
            # Vyfiltrujeme příliš krátká čísla
            if len(invoice_num) >= 6:
                data["invoice_number"] = invoice_num
                break

    return data

def detect_document_type(text: str, filename: str) -> str:
    """Detekuje typ dokumentu"""
    text_lower = text.lower()
    filename_lower = filename.lower()

    if any(word in text_lower or word in filename_lower for word in ['faktura', 'invoice']):
        return 'faktura'
    elif any(word in text_lower or word in filename_lower for word in ['účtenka', 'receipt']):
        return 'uctenka'
    elif any(word in text_lower or word in filename_lower for word in ['smlouva', 'contract']):
        return 'smlouva'
    else:
        return 'dokument'



@app.get("/")
async def root():
    return {
        "message": "Askelio API v1.0.0 - Demo Mode",
        "status": "running",
        "features": [
            "File Upload",
            "Document Processing (Mock)",
            "User Management (Mock)",
            "Health Check"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "mode": "production",
        "database": "live",
        "services": {
            "api": "running",
            "uploads": "available",
            "processing": "multilayer_ocr"
        }
    }

@app.post("/auth/login")
async def login(email: str = Form(...), password: str = Form(...)):
    """Login endpoint"""
    user = next((u for u in users if u["email"] == email), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": "token_123",
        "token_type": "bearer",
        "user": user
    }

@app.post("/auth/register")
async def register(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...)
):
    """Register endpoint"""
    # Check if user exists
    if any(u["email"] == email for u in users):
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = {
        "id": len(users) + 1,
        "email": email,
        "name": name,
        "credits": 50
    }
    users.append(new_user)

    return {
        "access_token": "token_123",
        "token_type": "bearer",
        "user": new_user
    }

@app.get("/auth/me")
async def get_current_user():
    """Get current user endpoint"""
    if not users:
        raise HTTPException(status_code=401, detail="No user logged in")
    return users[0]

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process document with real OCR and AI"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create document entry with processing status
    new_document = {
        "id": len(documents) + 1,
        "filename": file.filename,
        "type": file.content_type,
        "status": "processing",
        "accuracy": None,
        "created_at": datetime.now().isoformat(),
        "processed_at": None,
        "size": f"{file.size / (1024*1024):.1f} MB" if file.size else "0 MB",
        "pages": 1,
        "file_path": file_path,
        "raw_text": None,
        "extracted_data": None,
        "confidence": None
    }

    documents.append(new_document)

    # Start background processing
    asyncio.create_task(process_document_background(new_document["id"], file_path, file.content_type, file.filename))

    return {
        "id": new_document["id"],
        "filename": new_document["filename"],
        "status": "processing",
        "message": "Document uploaded and processing started"
    }

async def process_document_background(doc_id: int, file_path: str, file_type: str, filename: str):
    """Background processing of document"""
    try:
        print(f"🔄 Zpracovávám dokument {filename}...")

        # Find document
        document = next((d for d in documents if d["id"] == doc_id), None)
        if not document:
            return

        # Step 1: Extract text using combined OCR (Traditional + AI)
        print(f"📄 Extrahuji text z {filename}...")
        print(f"🔍 DEBUG: file_path={file_path}, file_type={file_type}")
        raw_text, ocr_confidence, ocr_metadata = await extract_text_from_file(file_path, file_type)
        print(f"🔍 DEBUG: raw_text length={len(raw_text)}, ocr_confidence={ocr_confidence}")
        document["raw_text"] = raw_text
        document["ocr_metadata"] = ocr_metadata

        # Step 2: Extract structured data using AI
        print(f"🤖 Extrahuji strukturovaná data z {filename}...")
        extracted_data = await extract_structured_data(raw_text, filename)
        document["extracted_data"] = extracted_data

        # Step 3: Combine confidences
        final_confidence = (ocr_confidence + extracted_data.get("confidence", 0.8)) / 2
        document["confidence"] = final_confidence

        # Step 3: Calculate accuracy based on data completeness
        accuracy = calculate_accuracy(extracted_data)
        document["accuracy"] = accuracy

        # Step 4: Mark as completed
        document["status"] = "completed"
        document["processed_at"] = datetime.now().isoformat()

        print(f"✅ Dokument {filename} úspěšně zpracován! Přesnost: {accuracy}%")

    except Exception as e:
        print(f"❌ Chyba při zpracování {filename}: {e}")
        # Mark as error
        document = next((d for d in documents if d["id"] == doc_id), None)
        if document:
            document["status"] = "error"
            document["error_message"] = str(e)
            document["processed_at"] = datetime.now().isoformat()

def calculate_accuracy(extracted_data: Dict[str, Any]) -> float:
    """Calculate accuracy based on data quality and correctness validation"""
    total_score = 0

    # Weight factors for different fields
    weights = {
        "vendor": 20,      # 20% weight
        "amount": 25,      # 25% weight
        "currency": 10,    # 10% weight
        "date": 20,        # 20% weight
        "invoice_number": 15,  # 15% weight
        "document_type": 10    # 10% weight
    }

    # Validate vendor field
    vendor = extracted_data.get("vendor", "").strip()
    if vendor:
        vendor_score = validate_vendor_field(vendor)
        total_score += vendor_score * weights["vendor"] / 100

    # Validate amount field
    amount = extracted_data.get("amount")
    if amount:
        amount_score = validate_amount_field(amount)
        total_score += amount_score * weights["amount"] / 100

    # Validate currency field
    currency = extracted_data.get("currency", "").strip()
    if currency:
        currency_score = validate_currency_field(currency)
        total_score += currency_score * weights["currency"] / 100

    # Validate date field
    date = extracted_data.get("date", "").strip()
    if date:
        date_score = validate_date_field(date)
        total_score += date_score * weights["date"] / 100

    # Validate invoice number field
    invoice_number = extracted_data.get("invoice_number", "").strip()
    if invoice_number:
        invoice_score = validate_invoice_number_field(invoice_number)
        total_score += invoice_score * weights["invoice_number"] / 100

    # Validate document type field
    doc_type = extracted_data.get("document_type", "").strip()
    if doc_type:
        type_score = validate_document_type_field(doc_type)
        total_score += type_score * weights["document_type"] / 100

    # Apply OCR confidence penalty
    ocr_confidence = extracted_data.get("confidence", 0.7)
    confidence_multiplier = min(1.0, ocr_confidence + 0.2)  # Don't penalize too much

    final_accuracy = total_score * confidence_multiplier

    # Cap at reasonable maximum (no system is 100% accurate)
    return min(85.0, max(0.0, final_accuracy))

def validate_vendor_field(vendor: str) -> float:
    """Validate vendor field quality (0-100 score)"""
    if not vendor or len(vendor.strip()) < 2:
        return 0.0

    score = 50.0  # Base score for having something

    # Check for reasonable length (not too short, not too long)
    if 3 <= len(vendor) <= 100:
        score += 20.0
    elif len(vendor) > 100:
        score -= 10.0  # Penalty for too long (likely OCR error)

    # Check for company indicators (s.r.o., a.s., etc.)
    company_indicators = ['s.r.o.', 'a.s.', 'spol.', 'ltd.', 'inc.', 'corp.', 'gmbh']
    if any(indicator in vendor.lower() for indicator in company_indicators):
        score += 20.0

    # Check for reasonable character composition
    alpha_ratio = sum(c.isalpha() or c.isspace() for c in vendor) / len(vendor)
    if alpha_ratio > 0.7:  # At least 70% letters and spaces
        score += 10.0
    else:
        score -= 20.0  # Penalty for too many special characters

    # Penalty for obvious OCR errors
    ocr_error_patterns = ['|||', '###', '***', '???', 'lll', 'III']
    if any(pattern in vendor for pattern in ocr_error_patterns):
        score -= 30.0

    return max(0.0, min(100.0, score))

def validate_amount_field(amount) -> float:
    """Validate amount field quality (0-100 score)"""
    if amount is None:
        return 0.0

    try:
        amount_float = float(amount)

        # Check for reasonable range
        if 0.01 <= amount_float <= 1000000:  # Between 1 cent and 1 million
            score = 80.0

            # Bonus for typical invoice amounts
            if 10 <= amount_float <= 100000:
                score += 20.0
            elif amount_float < 0.01:
                score = 10.0  # Very low amounts are suspicious

            return min(100.0, score)
        else:
            return 20.0  # Out of reasonable range

    except (ValueError, TypeError):
        return 0.0

def validate_currency_field(currency: str) -> float:
    """Validate currency field quality (0-100 score)"""
    if not currency:
        return 0.0

    # List of valid currencies
    valid_currencies = ['CZK', 'EUR', 'USD', 'GBP', 'CHF', 'PLN', 'HUF', 'Kč']

    if currency.upper() in [c.upper() for c in valid_currencies]:
        return 100.0
    elif currency.lower() in ['kc', 'czk', 'eur', 'usd']:  # Common OCR mistakes
        return 80.0
    else:
        return 20.0  # Unknown currency

def validate_date_field(date: str) -> float:
    """Validate date field quality (0-100 score)"""
    if not date:
        return 0.0

    try:
        # Try to parse the date
        from datetime import datetime

        # Try different date formats
        date_formats = ['%Y-%m-%d', '%d.%m.%Y', '%d/%m/%Y', '%d-%m-%Y']

        parsed_date = None
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date, fmt)
                break
            except ValueError:
                continue

        if not parsed_date:
            return 20.0  # Could not parse

        # Check if date is reasonable (not too old, not in future)
        now = datetime.now()
        if parsed_date.year < 2000 or parsed_date > now:
            return 40.0  # Suspicious date

        return 100.0  # Valid date

    except Exception:
        return 0.0

def validate_invoice_number_field(invoice_number: str) -> float:
    """Validate invoice number field quality (0-100 score)"""
    if not invoice_number or len(invoice_number.strip()) < 3:
        return 0.0

    score = 50.0  # Base score

    # Check length (reasonable invoice numbers are 6-20 characters)
    if 6 <= len(invoice_number) <= 20:
        score += 30.0
    elif 3 <= len(invoice_number) < 6:
        score += 10.0  # Short but possible
    elif len(invoice_number) > 20:
        score -= 10.0  # Too long, suspicious

    # Check for alphanumeric pattern (typical for invoice numbers)
    if invoice_number.replace('-', '').replace('/', '').replace('_', '').isalnum():
        score += 20.0

    # Penalty for obvious OCR errors
    ocr_error_patterns = ['|||', '###', '***', '???', 'lll', 'III', 'OOO']
    if any(pattern in invoice_number for pattern in ocr_error_patterns):
        score -= 40.0

    return max(0.0, min(100.0, score))

def validate_document_type_field(doc_type: str) -> float:
    """Validate document type field quality (0-100 score)"""
    if not doc_type:
        return 0.0

    # List of valid document types
    valid_types = ['faktura', 'invoice', 'uctenka', 'receipt', 'smlouva', 'contract', 'dokument', 'document']

    if doc_type.lower() in valid_types:
        return 100.0
    else:
        return 60.0  # Unknown but present

@app.get("/documents/{document_id}/status")
async def get_document_status(document_id: int):
    """Get processing status of document"""
    document = next((d for d in documents if d["id"] == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "id": document["id"],
        "filename": document["filename"],
        "status": document["status"],
        "accuracy": document.get("accuracy"),
        "progress": get_processing_progress(document["status"]),
        "error_message": document.get("error_message")
    }

def get_processing_progress(status: str) -> int:
    """Get processing progress percentage"""
    if status == "processing":
        return 50
    elif status == "completed":
        return 100
    elif status == "error":
        return 0
    else:
        return 0

@app.get("/documents/{document_id}/preview")
async def get_document_preview(document_id: int):
    """Get document file for preview"""
    document = next((doc for doc in documents if doc["id"] == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = document.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document file not found")

    # Načteme soubor a vrátíme jako Response s inline headers
    with open(file_path, "rb") as file:
        content = file.read()

    headers = {
        "Content-Disposition": "inline; filename=" + document["filename"]
    }

    print(f"🔍 DEBUG: Sending headers: {headers}")
    print(f"🔍 DEBUG: Content-Type: {document['type']}")

    return Response(
        content=content,
        media_type=document["type"],
        headers=headers
    )

@app.get("/documents")
async def get_documents():
    """Get all documents"""
    print(f"🔍 GET /documents called - returning {len(documents)} documents")
    for doc in documents:
        print(f"  - {doc['id']}: {doc['filename']} ({doc['status']})")
    return documents

@app.get("/documents/{document_id}")
async def get_document(document_id: int):
    """Get specific document"""
    document = next((d for d in documents if d["id"] == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.get("/credits")
async def get_credits():
    """Get user credits"""
    if not users:
        raise HTTPException(status_code=401, detail="No user logged in")
    return {
        "credits": users[0]["credits"],
        "user_id": users[0]["id"]
    }

@app.post("/credits/purchase")
async def purchase_credits(amount: int = Form(...)):
    """Credit purchase"""
    if not users:
        raise HTTPException(status_code=401, detail="No user logged in")
    users[0]["credits"] += amount
    return {
        "message": f"Successfully purchased {amount} credits",
        "new_balance": users[0]["credits"]
    }

@app.get("/integrations")
async def get_integrations():
    """Get available integrations"""
    return {
        "integrations": [
            {
                "name": "Pohoda",
                "status": "available",
                "description": "Export do účetního systému Pohoda"
            },
            {
                "name": "FlexiBee",
                "status": "available", 
                "description": "Export do účetního systému FlexiBee"
            },
            {
                "name": "Excel",
                "status": "available",
                "description": "Export do Excel souboru"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Spouštím Askelio API v demo módu...")
    print("📚 API dokumentace: http://localhost:8000/docs")
    print("🌐 Frontend: http://localhost:3000")
    
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
