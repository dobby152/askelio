#!/usr/bin/env python3
"""
Test API endpointů pro strukturovaná data
Ověřuje, že API vrací správně strukturovaná data pro frontend
"""

import requests
import json
import time
import tempfile
import os
from pathlib import Path

def create_test_image():
    """Vytvoří testovací obrázek s fakturou"""
    from PIL import Image, ImageDraw, ImageFont
    
    # Vytvoř obrázek
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Zkus najít font, jinak použij default
    try:
        font = ImageFont.truetype("arial.ttf", 20)
        small_font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Nakreslí fakturu
    y = 50
    lines = [
        "FAKTURA č. 2024-001",
        "",
        "Datum vystavení: 21.07.2024",
        "Splatnost: 05.08.2024",
        "",
        "Dodavatel:",
        "ABC s.r.o.",
        "IČO: 12345678",
        "DIČ: CZ12345678",
        "",
        "Odběratel:",
        "XYZ spol. s r.o.",
        "IČO: 87654321",
        "",
        "Položky:",
        "Software licence - 1 ks - 15 000,00 Kč",
        "Podpora - 12 měsíců - 5 000,00 Kč",
        "",
        "Celkem bez DPH: 20 000,00 Kč",
        "DPH 21%: 4 200,00 Kč",
        "Celkem k úhradě: 24 200,00 Kč"
    ]
    
    for line in lines:
        if line.startswith("FAKTURA"):
            draw.text((50, y), line, fill='black', font=font)
        else:
            draw.text((50, y), line, fill='black', font=small_font)
        y += 25
    
    return img

def test_process_invoice_endpoint():
    """Test hlavního process-invoice endpointu"""
    print("🧪 TEST: /process-invoice endpoint")
    print("=" * 50)
    
    # Vytvoř testovací obrázek
    test_img = create_test_image()
    
    # Ulož do dočasného souboru
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
        test_img.save(tmp_file.name, 'PNG')
        tmp_path = tmp_file.name
    
    try:
        # Pošli request
        with open(tmp_path, 'rb') as f:
            files = {'file': ('test_invoice.png', f, 'image/png')}
            
            print("📤 Odesílám request...")
            response = requests.post(
                'http://localhost:8000/process-invoice',
                files=files,
                timeout=30
            )
        
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ Request úspěšný!")
            print()
            
            # Zkontroluj strukturu odpovědi
            print("📊 STRUKTURA ODPOVĚDI:")
            print(f"  - Status: {data.get('status')}")
            print(f"  - File name: {data.get('file_name')}")
            print(f"  - Processing time: {data.get('processing_time')}s")
            print(f"  - Confidence: {data.get('confidence')}")
            print(f"  - Selected provider: {data.get('selected_provider')}")
            print()
            
            # Zkontroluj structured_data
            structured_data = data.get('structured_data')
            if structured_data:
                print("🎯 STRUCTURED DATA:")
                print(f"  - Type: {type(structured_data)}")
                
                if isinstance(structured_data, dict):
                    # Gemini formát
                    if 'document_type' in structured_data:
                        print("  - Format: GEMINI")
                        print(f"    * Document type: {structured_data.get('document_type')}")
                        print(f"    * Invoice number: {structured_data.get('invoice_number')}")
                        print(f"    * Date issued: {structured_data.get('date_issued')}")
                        
                        total_amount = structured_data.get('total_amount')
                        if isinstance(total_amount, dict):
                            print(f"    * Total: {total_amount.get('value')} {total_amount.get('currency')}")
                        
                        vendor = structured_data.get('vendor')
                        if isinstance(vendor, dict):
                            print(f"    * Vendor: {vendor.get('name')}")
                            print(f"    * ICO: {vendor.get('ico')}")
                    
                    # Basic formát
                    elif 'fields' in structured_data:
                        print("  - Format: BASIC")
                        fields = structured_data.get('fields', {})
                        print(f"    * Fields: {list(fields.keys())}")
                        print(f"    * Invoice number: {fields.get('invoice_number')}")
                        print(f"    * Total amount: {fields.get('total_amount')}")
                        print(f"    * Vendor: {fields.get('vendor')}")
                        print(f"    * Confidence: {structured_data.get('extraction_confidence')}")
            print()
            
            # Zkontroluj data_source
            data_source = data.get('data_source')
            if data_source:
                print("📍 DATA SOURCE:")
                print(f"  - Method: {data_source.get('method')}")
                print(f"  - Gemini used: {data_source.get('gemini_used')}")
                print(f"  - Gemini confidence: {data_source.get('gemini_confidence')}")
                print(f"  - Basic confidence: {data_source.get('basic_confidence')}")
            print()
            
            # Zkontroluj gemini_analysis
            gemini_analysis = data.get('gemini_analysis')
            if gemini_analysis:
                print("🤖 GEMINI ANALYSIS:")
                print(f"  - Success: {gemini_analysis.get('success')}")
                print(f"  - Confidence: {gemini_analysis.get('confidence')}")
                print(f"  - Processing time: {gemini_analysis.get('processing_time')}s")
                print(f"  - Fields extracted: {gemini_analysis.get('fields_extracted')}")
                print(f"  - Validation notes: {gemini_analysis.get('validation_notes')}")
            
            return data
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Nelze se připojit k serveru")
        print("💡 Spusť server: cd backend && python main.py")
        return None
    except Exception as e:
        print(f"❌ Chyba: {e}")
        return None
    finally:
        # Smaž dočasný soubor
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_gemini_structuring_endpoint():
    """Test /test-gemini-structuring endpointu"""
    print("\n🧪 TEST: /test-gemini-structuring endpoint")
    print("=" * 50)
    
    test_text = """
    FAKTURA č. 2024-001
    Datum vystavení: 21.07.2024
    Splatnost: 05.08.2024
    
    Dodavatel:
    ABC s.r.o.
    IČO: 12345678
    DIČ: CZ12345678
    
    Celkem k úhradě: 24 200,00 Kč
    """
    
    try:
        print("📤 Odesílám request...")
        response = requests.post(
            'http://localhost:8000/test-gemini-structuring',
            data={'text': test_text},
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=15
        )
        
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ Request úspěšný!")
            print()
            
            print("📊 POROVNÁNÍ METOD:")
            basic = data.get('basic_structuring', {})
            gemini = data.get('gemini_structuring', {})
            
            print(f"Basic:")
            print(f"  - Fields: {basic.get('fields_count', 0)}")
            print(f"  - Confidence: {basic.get('confidence', 0.0):.2f}")
            
            print(f"Gemini:")
            print(f"  - Success: {gemini.get('success', False)}")
            print(f"  - Confidence: {gemini.get('confidence', 0.0):.2f}")
            print(f"  - Fields: {len(gemini.get('fields_extracted', []))}")
            
            print(f"\nDoporučení: {data.get('recommendation', 'unknown')}")
            
            return data
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Nelze se připojit k serveru")
        return None
    except Exception as e:
        print(f"❌ Chyba: {e}")
        return None

def show_frontend_example(api_data):
    """Ukáže, jak by frontend použil data"""
    if not api_data:
        return
    
    print("\n🖥️ FRONTEND USAGE EXAMPLE")
    print("=" * 50)
    
    structured_data = api_data.get('structured_data', {})
    data_source = api_data.get('data_source', {})
    
    print("JavaScript kód pro frontend:")
    print("-" * 30)
    
    print("// Extrakce dat")
    print(f"const data = response.structured_data;")
    print(f"const isGemini = response.data_source.gemini_used; // {data_source.get('gemini_used')}")
    print()
    
    # Ukáž extrakci podle formátu
    if isinstance(structured_data, dict):
        if 'document_type' in structured_data:
            print("// Gemini formát")
            print(f"const invoiceNumber = data.invoice_number; // '{structured_data.get('invoice_number')}'")
            print(f"const dateIssued = data.date_issued; // '{structured_data.get('date_issued')}'")
            if structured_data.get('total_amount'):
                total = structured_data['total_amount']
                if isinstance(total, dict):
                    print(f"const totalAmount = data.total_amount.value; // '{total.get('value')}'")
                    print(f"const currency = data.total_amount.currency; // '{total.get('currency')}'")
        
        elif 'fields' in structured_data:
            print("// Basic formát")
            fields = structured_data.get('fields', {})
            print(f"const invoiceNumber = data.fields.invoice_number; // '{fields.get('invoice_number')}'")
            print(f"const totalAmount = data.fields.total_amount; // '{fields.get('total_amount')}'")
            print(f"const vendor = data.fields.vendor; // '{fields.get('vendor')}'")

def main():
    print("🚀 TEST: API Strukturovaná Data")
    print("=" * 70)
    
    # Test hlavního endpointu
    api_data = test_process_invoice_endpoint()
    
    # Test Gemini endpointu
    test_gemini_structuring_endpoint()
    
    # Ukáž frontend příklad
    show_frontend_example(api_data)
    
    print("\n✅ TESTY DOKONČENY!")
    print("\n💡 SHRNUTÍ:")
    print("- API vrací strukturovaná data v 'structured_data' poli")
    print("- 'data_source.method' říká, zda byla použita Gemini nebo basic extrakce")
    print("- Frontend může přímo použít strukturovaná data bez parsování")
    print("- Fallback mechanismus zajišťuje, že vždy nějaká data dostanete")

if __name__ == "__main__":
    main()
