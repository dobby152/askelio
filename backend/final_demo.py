#!/usr/bin/env python3
"""
Finální demo kompletního OCR + Gemini AI workflow
Ukazuje celý proces od OCR po strukturování dat
"""

import os
import sys
import json
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

def demo_complete_workflow():
    """Demo kompletního workflow OCR + Gemini strukturování"""
    print("🚀 KOMPLETNÍ OCR + GEMINI AI WORKFLOW")
    print("=" * 60)
    
    from invoice_processor import InvoiceProcessor
    
    # Sample invoice text (simuluje OCR výstup)
    sample_text = """
    FAKTURA č. 2024-001
    Datum vystavení: 21.07.2024
    Splatnost: 05.08.2024
    
    Dodavatel:
    ABC s.r.o.
    IČO: 12345678
    DIČ: CZ12345678
    Adresa: Hlavní 123, Praha
    
    Odběratel:
    XYZ spol. s r.o.
    IČO: 87654321
    
    Položky:
    Software licence - 1 ks - 15 000,00 Kč
    Podpora - 12 měsíců - 5 000,00 Kč
    
    Celkem bez DPH: 20 000,00 Kč
    DPH 21%: 4 200,00 Kč
    Celkem k úhradě: 24 200,00 Kč
    """
    
    try:
        print("🔧 Inicializace systému...")
        processor = InvoiceProcessor()
        
        print(f"✅ OCR providery: {len(processor.ocr_manager.get_available_providers())}")
        print(f"✅ Gemini AI: {'Dostupný' if processor.gemini_engine.is_available else 'Nedostupný (fallback)'}")
        print()
        
        print("📄 VSTUPNÍ TEXT (simulace OCR):")
        print("-" * 40)
        print(sample_text.strip())
        print()
        
        print("🔍 KROK 1: Základní regex strukturování")
        print("-" * 40)
        basic_result = processor._structure_invoice_data(sample_text)
        
        print(f"Extrahovaná pole: {len(basic_result.get('fields', {}))}")
        print(f"Confidence: {basic_result.get('extraction_confidence', 0.0):.2f}")
        print("Pole:")
        for field, value in basic_result.get('fields', {}).items():
            print(f"  - {field}: {value}")
        print()
        
        print("🤖 KROK 2: Gemini AI strukturování")
        print("-" * 40)
        gemini_result = processor.gemini_engine.structure_and_validate_data(
            sample_text, basic_result, "invoice"
        )
        
        print(f"Úspěch: {gemini_result.success}")
        print(f"Confidence: {gemini_result.confidence_score:.2f}")
        print(f"Čas zpracování: {gemini_result.processing_time:.2f}s")
        print(f"Validační poznámky: {gemini_result.validation_notes}")
        print()
        
        if gemini_result.comparison_with_basic:
            comp = gemini_result.comparison_with_basic
            print("📊 POROVNÁNÍ METOD:")
            print(f"  - Základní pole: {comp.get('basic_fields_count', 0)}")
            print(f"  - Gemini pole: {comp.get('gemini_fields_count', 0)}")
            if comp.get('differences'):
                print(f"  - Rozdíly: {len(comp['differences'])}")
                for diff in comp['differences'][:3]:  # Show first 3 differences
                    print(f"    * {diff['field']}: '{diff['basic']}' → '{diff['gemini']}'")
        print()
        
        print("🏗️ FINÁLNÍ STRUKTUROVANÁ DATA:")
        print("-" * 40)
        
        # Use Gemini data if successful, otherwise basic
        if gemini_result.success and gemini_result.structured_data:
            final_data = gemini_result.structured_data
            data_source = "Gemini AI"
        else:
            final_data = basic_result
            data_source = "Základní regex"
        
        print(f"Zdroj dat: {data_source}")
        print()
        
        # Display structured data in readable format
        if isinstance(final_data, dict):
            if final_data.get('document_type'):
                print(f"📋 Typ dokumentu: {final_data['document_type']}")
            
            if final_data.get('invoice_number'):
                print(f"🔢 Číslo faktury: {final_data['invoice_number']}")
            
            if final_data.get('date_issued'):
                print(f"📅 Datum vystavení: {final_data['date_issued']}")
            elif final_data.get('fields', {}).get('date'):
                print(f"📅 Datum: {final_data['fields']['date']}")
            
            if final_data.get('total_amount'):
                if isinstance(final_data['total_amount'], dict):
                    amount = final_data['total_amount']
                    print(f"💰 Celková částka: {amount.get('value')} {amount.get('currency', '')}")
                else:
                    print(f"💰 Celková částka: {final_data['total_amount']}")
            elif final_data.get('fields', {}).get('total_amount'):
                print(f"💰 Celková částka: {final_data['fields']['total_amount']}")
            
            if final_data.get('vendor'):
                vendor = final_data['vendor']
                if isinstance(vendor, dict):
                    print(f"🏢 Dodavatel: {vendor.get('name', 'N/A')}")
                    if vendor.get('ico'):
                        print(f"   IČO: {vendor['ico']}")
                    if vendor.get('dic'):
                        print(f"   DIČ: {vendor['dic']}")
                else:
                    print(f"🏢 Dodavatel: {vendor}")
            elif final_data.get('fields', {}).get('vendor'):
                print(f"🏢 Dodavatel: {final_data['fields']['vendor']}")
            
            if final_data.get('line_items') and len(final_data['line_items']) > 0:
                print(f"📦 Položky: {len(final_data['line_items'])} ks")
                for i, item in enumerate(final_data['line_items'][:2], 1):  # Show first 2 items
                    if item.get('description'):
                        print(f"   {i}. {item['description']}")
                        if item.get('total_price'):
                            print(f"      Cena: {item['total_price']}")
        
        print()
        print("✅ WORKFLOW DOKONČEN!")
        
        return {
            'basic_result': basic_result,
            'gemini_result': gemini_result,
            'final_data': final_data,
            'data_source': data_source
        }
        
    except Exception as e:
        print(f"❌ Chyba ve workflow: {e}")
        import traceback
        traceback.print_exc()
        return None

def demo_api_format():
    """Demo formátu API odpovědi"""
    print("\n📡 FORMÁT API ODPOVĚDI")
    print("=" * 60)
    
    # Simulace kompletní API odpovědi
    api_response = {
        "status": "success",
        "file_name": "faktura-2024-001.pdf",
        "processing_time": 3.45,
        "confidence": 0.95,
        "extracted_text": "FAKTURA č. 2024-001\nDatum vystavení: 21.07.2024...",
        "selected_provider": "google_vision",
        
        "ai_decision": {
            "reasoning": "Google Vision poskytl nejkompletnější a nejpřesnější text s vysokou confidence",
            "quality_analysis": {
                "text_completeness": 0.95,
                "structure_quality": 0.90,
                "key_information_presence": 0.98
            },
            "gemini_used": True
        },
        
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
                "address": "Hlavní 123, Praha"
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
                },
                {
                    "description": "Podpora",
                    "quantity": "12",
                    "unit_price": "416.67",
                    "total_price": "5000.00"
                }
            ],
            "tax_info": {
                "vat_rate": "21",
                "vat_amount": "4200.00",
                "total_without_vat": "20000.00"
            }
        },
        
        "gemini_structuring": {
            "used": True,
            "confidence": 0.95,
            "validation_notes": "Standardizováno datum na ISO formát, extrahována všechna IČO/DIČ, rozpoznány položky faktury",
            "fields_extracted": [
                "invoice_number", "date_issued", "due_date", "total_amount", 
                "vendor", "customer", "line_items", "tax_info"
            ],
            "comparison_with_basic": {
                "basic_fields_count": 3,
                "gemini_fields_count": 12,
                "improvements": [
                    "Standardizace data na ISO formát",
                    "Extrakce IČO/DIČ pro dodavatele i odběratele",
                    "Rozpoznání a strukturování položek faktury",
                    "Extrakce daňových informací"
                ],
                "differences": [
                    {
                        "field": "date",
                        "basic": "21.07.2024",
                        "gemini": "2024-07-21"
                    },
                    {
                        "field": "total_amount",
                        "basic": "24",
                        "gemini": "24200.00"
                    }
                ]
            }
        },
        
        "ocr_summary": {
            "total_providers_used": 5,
            "successful_providers": 4,
            "provider_results": [
                {"provider": "google_vision", "success": True, "confidence": 0.95},
                {"provider": "azure_computer_vision", "success": True, "confidence": 0.88},
                {"provider": "tesseract", "success": True, "confidence": 0.82},
                {"provider": "easy_ocr", "success": True, "confidence": 0.79},
                {"provider": "paddle_ocr", "success": False, "confidence": 0.0}
            ]
        }
    }
    
    print("Kompletní JSON odpověď:")
    print(json.dumps(api_response, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    print("🎯 FINÁLNÍ DEMO: OCR + Gemini AI Strukturování")
    print("=" * 70)
    
    try:
        # Run complete workflow demo
        result = demo_complete_workflow()
        
        if result:
            # Show API format
            demo_api_format()
            
            print("\n🎉 SHRNUTÍ VÝHOD:")
            print("=" * 50)
            print("✅ 5 OCR providerů pro maximální přesnost")
            print("✅ Gemini AI pro inteligentní výběr nejlepšího OCR")
            print("✅ Gemini AI pro pokročilé strukturování dat")
            print("✅ Automatické opravy a standardizace")
            print("✅ Transparentní porovnání metod")
            print("✅ Fallback mechanismus při nedostupnosti AI")
            print("✅ Detailní validační poznámky")
            print("✅ Strukturovaný výstup připravený pro ERP systémy")
            
    except Exception as e:
        print(f"❌ Chyba v demo: {e}")
        import traceback
        traceback.print_exc()
