#!/usr/bin/env python3
"""
Test script pro demonstraci strukturovaných dat pro frontend
Ukazuje, jak frontend dostane Gemini strukturovaná data
"""

import os
import sys
import json
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

def simulate_api_response():
    """Simulace API odpovědi s Gemini strukturovanými daty"""
    print("📡 SIMULACE API ODPOVĚDI PRO FRONTEND")
    print("=" * 60)
    
    from invoice_processor import InvoiceProcessor
    
    # Sample invoice text
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
        
        print("🔄 Zpracování dokumentu...")
        
        # Basic structuring
        basic_result = processor._structure_invoice_data(sample_text)
        
        # Gemini structuring
        gemini_result = processor.gemini_engine.structure_and_validate_data(
            sample_text, basic_result, "invoice"
        )
        
        # Determine which data to use (same logic as in main.py)
        if gemini_result.success and gemini_result.structured_data:
            structured_data = gemini_result.structured_data
            data_source = "gemini"
            confidence = gemini_result.confidence_score
        else:
            structured_data = basic_result
            data_source = "basic"
            confidence = basic_result.get("extraction_confidence", 0.0)
        
        # Simulate complete API response
        api_response = {
            "status": "success",
            "file_name": "faktura-2024-001.pdf",
            "processing_time": 2.45,
            "confidence": confidence,
            "extracted_text": sample_text.strip()[:200] + "...",
            "selected_provider": "google_vision",
            
            # 🎯 PRIMARY STRUCTURED DATA - This is what frontend will use
            "structured_data": structured_data,
            
            # Data source information
            "data_source": {
                "method": data_source,
                "gemini_used": gemini_result.success,
                "gemini_confidence": gemini_result.confidence_score if gemini_result.success else None,
                "basic_confidence": basic_result.get("extraction_confidence", 0.0)
            },
            
            # AI Decision details
            "ai_decision": {
                "reasoning": "Google Vision poskytl nejkompletnější text",
                "quality_analysis": {
                    "text_completeness": 0.95,
                    "structure_quality": 0.90
                },
                "gemini_used": True
            },
            
            # Gemini analysis details
            "gemini_analysis": {
                "success": gemini_result.success,
                "confidence": gemini_result.confidence_score,
                "validation_notes": gemini_result.validation_notes,
                "fields_extracted": gemini_result.fields_extracted,
                "processing_time": gemini_result.processing_time,
                "comparison_with_basic": gemini_result.comparison_with_basic,
                "error_message": gemini_result.error_message
            }
        }
        
        print("✅ Zpracování dokončeno!")
        print(f"📊 Použitá metoda: {data_source.upper()}")
        print(f"🎯 Confidence: {confidence:.2f}")
        print()
        
        return api_response
        
    except Exception as e:
        print(f"❌ Chyba při simulaci: {e}")
        return None

def show_frontend_data(api_response):
    """Ukáže, jak frontend bude pracovat se strukturovanými daty"""
    print("🖥️ JAK FRONTEND POUŽIJE DATA")
    print("=" * 60)
    
    if not api_response:
        print("❌ Žádná data k zobrazení")
        return
    
    structured_data = api_response.get("structured_data", {})
    data_source = api_response.get("data_source", {})
    
    print(f"📋 Zdroj dat: {data_source.get('method', 'unknown').upper()}")
    print(f"🤖 Gemini použito: {'✅' if data_source.get('gemini_used') else '❌'}")
    print()
    
    print("📊 STRUKTUROVANÁ DATA PRO FRONTEND:")
    print("-" * 40)
    
    # Show how frontend would extract data
    if isinstance(structured_data, dict):
        # Document info
        if structured_data.get('document_type'):
            print(f"📄 Typ: {structured_data['document_type']}")
        
        if structured_data.get('invoice_number'):
            print(f"🔢 Číslo faktury: {structured_data['invoice_number']}")
        elif structured_data.get('fields', {}).get('invoice_number'):
            print(f"🔢 Číslo faktury: {structured_data['fields']['invoice_number']}")
        
        # Dates
        if structured_data.get('date_issued'):
            print(f"📅 Datum vystavení: {structured_data['date_issued']}")
        elif structured_data.get('fields', {}).get('date'):
            print(f"📅 Datum: {structured_data['fields']['date']}")
        
        if structured_data.get('due_date'):
            print(f"⏰ Splatnost: {structured_data['due_date']}")
        
        # Amount
        if structured_data.get('total_amount'):
            if isinstance(structured_data['total_amount'], dict):
                amount = structured_data['total_amount']
                print(f"💰 Celkem: {amount.get('value')} {amount.get('currency', 'CZK')}")
            else:
                print(f"💰 Celkem: {structured_data['total_amount']}")
        elif structured_data.get('fields', {}).get('total_amount'):
            print(f"💰 Celkem: {structured_data['fields']['total_amount']}")
        
        # Vendor
        if structured_data.get('vendor'):
            vendor = structured_data['vendor']
            if isinstance(vendor, dict):
                print(f"🏢 Dodavatel: {vendor.get('name', 'N/A')}")
                if vendor.get('ico'):
                    print(f"   📋 IČO: {vendor['ico']}")
                if vendor.get('dic'):
                    print(f"   📋 DIČ: {vendor['dic']}")
                if vendor.get('address'):
                    print(f"   📍 Adresa: {vendor['address']}")
            else:
                print(f"🏢 Dodavatel: {vendor}")
        elif structured_data.get('fields', {}).get('vendor'):
            print(f"🏢 Dodavatel: {structured_data['fields']['vendor']}")
        
        # Customer
        if structured_data.get('customer') and isinstance(structured_data['customer'], dict):
            customer = structured_data['customer']
            if customer.get('name'):
                print(f"👤 Odběratel: {customer['name']}")
                if customer.get('ico'):
                    print(f"   📋 IČO: {customer['ico']}")
        
        # Line items
        if structured_data.get('line_items') and len(structured_data['line_items']) > 0:
            print(f"📦 Položky ({len(structured_data['line_items'])} ks):")
            for i, item in enumerate(structured_data['line_items'][:3], 1):  # Show first 3
                if item.get('description'):
                    print(f"   {i}. {item['description']}")
                    if item.get('quantity'):
                        print(f"      Množství: {item['quantity']}")
                    if item.get('total_price'):
                        print(f"      Cena: {item['total_price']}")
        
        # Tax info
        if structured_data.get('tax_info') and isinstance(structured_data['tax_info'], dict):
            tax = structured_data['tax_info']
            if tax.get('vat_rate'):
                print(f"📊 DPH: {tax['vat_rate']}%")
            if tax.get('vat_amount'):
                print(f"💸 DPH částka: {tax['vat_amount']}")
    
    print()

def show_json_response(api_response):
    """Ukáže kompletní JSON odpověď"""
    print("📄 KOMPLETNÍ JSON ODPOVĚĎ")
    print("=" * 60)
    
    if api_response:
        print(json.dumps(api_response, indent=2, ensure_ascii=False))
    else:
        print("❌ Žádná data k zobrazení")

def main():
    print("🎯 TEST: Strukturovaná Data pro Frontend")
    print("=" * 70)
    
    # Simulate API response
    api_response = simulate_api_response()
    
    if api_response:
        print()
        show_frontend_data(api_response)
        
        print()
        show_json_response(api_response)
        
        print("\n🎉 VÝHODY PRO FRONTEND:")
        print("=" * 50)
        print("✅ Strukturovaná data přímo připravená k použití")
        print("✅ Jasné označení zdroje dat (Gemini vs Basic)")
        print("✅ Standardizované formáty (ISO data, číselné hodnoty)")
        print("✅ Hierarchická struktura (dodavatel, odběratel, položky)")
        print("✅ Fallback mechanismus při nedostupnosti Gemini")
        print("✅ Detailní informace o kvalitě extrakce")
        
        print("\n💡 FRONTEND IMPLEMENTACE:")
        print("=" * 50)
        print("1. Použij 'structured_data' jako primární zdroj")
        print("2. Zkontroluj 'data_source.method' pro info o zdroji")
        print("3. Zobraz 'gemini_analysis.validation_notes' pro detaily")
        print("4. Použij fallback pro chybějící pole")

if __name__ == "__main__":
    main()
