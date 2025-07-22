#!/usr/bin/env python3
"""
Demo script pro Gemini AI strukturování dat
Ukazuje novou funkcionalnost bez potřeby spuštění serveru
"""

import os
import sys
import json
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

def demo_basic_structuring():
    """Demo základního strukturování"""
    print("🔍 ZÁKLADNÍ REGEX STRUKTUROVÁNÍ")
    print("=" * 50)
    
    from invoice_processor import InvoiceProcessor
    
    # Sample Czech invoice text
    sample_text = """
    FAKTURA č. 2024-001
    Datum vystavení: 21.07.2024
    Splatnost: 05.08.2024
    
    Dodavatel:
    ABC s.r.o.
    IČO: 12345678
    DIČ: CZ12345678
    
    Celkem bez DPH: 20 000,00 Kč
    DPH 21%: 4 200,00 Kč
    Celkem k úhradě: 24 200,00 Kč
    """
    
    try:
        processor = InvoiceProcessor()
        basic_result = processor._structure_invoice_data(sample_text)
        
        print("📋 Vstupní text:")
        print(sample_text.strip())
        print()
        
        print("📊 Základní strukturování:")
        print(f"   - Extrahovaná pole: {len(basic_result.get('fields', {}))}")
        print(f"   - Confidence: {basic_result.get('extraction_confidence', 0.0):.2f}")
        print()
        
        print("🔍 Detaily polí:")
        for field, value in basic_result.get('fields', {}).items():
            print(f"   - {field}: {value}")
        print()
        
        return basic_result, sample_text
        
    except Exception as e:
        print(f"❌ Chyba při základním strukturování: {e}")
        return None, None

def demo_gemini_fallback(basic_result, sample_text):
    """Demo Gemini fallback strukturování"""
    print("🤖 GEMINI AI STRUKTUROVÁNÍ (FALLBACK)")
    print("=" * 50)
    
    from gemini_decision_engine import GeminiDecisionEngine
    
    try:
        gemini_engine = GeminiDecisionEngine()
        
        print(f"Gemini dostupný: {gemini_engine.is_available}")
        print(f"API klíč nakonfigurován: {bool(os.getenv('GOOGLE_API_KEY'))}")
        print()
        
        # Test Gemini strukturování (bude použit fallback kvůli API limitu)
        gemini_result = gemini_engine.structure_and_validate_data(
            sample_text, basic_result, "invoice"
        )
        
        print("📊 Gemini strukturování:")
        print(f"   - Úspěch: {gemini_result.success}")
        print(f"   - Confidence: {gemini_result.confidence_score:.2f}")
        print(f"   - Čas zpracování: {gemini_result.processing_time:.2f}s")
        print(f"   - Pole extrahována: {len(gemini_result.fields_extracted)}")
        print()
        
        print("📝 Validační poznámky:")
        print(f"   {gemini_result.validation_notes}")
        print()
        
        if gemini_result.comparison_with_basic:
            comp = gemini_result.comparison_with_basic
            print("🔄 Porovnání s základním:")
            print(f"   - Základní pole: {comp.get('basic_fields_count', 0)}")
            print(f"   - Gemini pole: {comp.get('gemini_fields_count', 0)}")
            if comp.get('differences'):
                print(f"   - Rozdíly: {len(comp['differences'])}")
        print()
        
        print("🏗️ Strukturovaná data:")
        structured = gemini_result.structured_data
        if structured.get('document_type'):
            print(f"   - Typ: {structured['document_type']}")
        if structured.get('invoice_number'):
            print(f"   - Číslo faktury: {structured['invoice_number']}")
        if structured.get('date_issued'):
            print(f"   - Datum: {structured['date_issued']}")
        if structured.get('total_amount', {}).get('value'):
            amount = structured['total_amount']
            print(f"   - Celkem: {amount.get('value')} {amount.get('currency', '')}")
        if structured.get('vendor', {}).get('name'):
            print(f"   - Dodavatel: {structured['vendor']['name']}")
        print()
        
        return gemini_result
        
    except Exception as e:
        print(f"❌ Chyba při Gemini strukturování: {e}")
        return None

def demo_comparison():
    """Demo porovnání základního a Gemini strukturování"""
    print("⚖️ POROVNÁNÍ METOD")
    print("=" * 50)
    
    basic_result, sample_text = demo_basic_structuring()
    if not basic_result:
        return
    
    print()
    gemini_result = demo_gemini_fallback(basic_result, sample_text)
    if not gemini_result:
        return
    
    print("📈 SHRNUTÍ:")
    print("-" * 30)
    
    basic_fields = len(basic_result.get('fields', {}))
    gemini_fields = len([k for k, v in gemini_result.structured_data.items() if v is not None])
    
    print(f"Základní metoda:")
    print(f"   - Pole: {basic_fields}")
    print(f"   - Confidence: {basic_result.get('extraction_confidence', 0.0):.2f}")
    print()
    
    print(f"Gemini AI metoda:")
    print(f"   - Pole: {gemini_fields}")
    print(f"   - Confidence: {gemini_result.confidence_score:.2f}")
    print(f"   - Úspěch: {gemini_result.success}")
    print()
    
    if gemini_result.success and gemini_result.confidence_score > basic_result.get('extraction_confidence', 0.0):
        print("🏆 DOPORUČENÍ: Použít Gemini AI strukturování")
    else:
        print("🏆 DOPORUČENÍ: Použít základní strukturování")

def demo_api_response_format():
    """Demo formátu API odpovědi"""
    print("\n📡 FORMÁT API ODPOVĚDI")
    print("=" * 50)
    
    # Simulace API odpovědi s novými poli
    api_response = {
        "status": "success",
        "file_name": "faktura-2024-001.pdf",
        "processing_time": 2.45,
        "confidence": 0.95,
        "extracted_text": "FAKTURA č. 2024-001...",
        "selected_provider": "google_vision",
        
        "structured_data": {
            "document_type": "invoice",
            "invoice_number": "2024-001",
            "date_issued": "2024-07-21",
            "total_amount": {
                "value": "24200.00",
                "currency": "CZK"
            },
            "vendor": {
                "name": "ABC s.r.o.",
                "ico": "12345678"
            }
        },
        
        "gemini_structuring": {
            "used": True,
            "confidence": 0.95,
            "validation_notes": "Opraveno datum formátu, přidáno IČO",
            "fields_extracted": ["invoice_number", "date_issued", "total_amount", "vendor"],
            "comparison_with_basic": {
                "basic_fields_count": 3,
                "gemini_fields_count": 8,
                "improvements": ["Standardizace data", "Extrakce IČO"],
                "differences": [
                    {
                        "field": "date",
                        "basic": "21.07.2024",
                        "gemini": "2024-07-21"
                    }
                ]
            }
        }
    }
    
    print("JSON odpověď s novými Gemini poli:")
    print(json.dumps(api_response, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    print("🚀 DEMO: Gemini AI Strukturování Dat")
    print("=" * 60)
    print()
    
    try:
        demo_comparison()
        demo_api_response_format()
        
        print("\n✅ Demo dokončeno!")
        print("\n💡 KLÍČOVÉ VÝHODY:")
        print("   - Gemini AI opravuje chyby základní extrakce")
        print("   - Standardizuje formáty dat (data, měny)")
        print("   - Extrahuje více polí než regex")
        print("   - Poskytuje fallback při nedostupnosti")
        print("   - Transparentní porovnání metod")
        
    except Exception as e:
        print(f"❌ Chyba v demo: {e}")
        import traceback
        traceback.print_exc()
