#!/usr/bin/env python3
"""
Test pouze ARES obohacení na strukturovaných datech
Testuje _enrich_with_ares metodu přímo
"""

import sys
import os
import json
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from unified_document_processor import UnifiedDocumentProcessor, ProcessingOptions
from ares_client import ares_client

def test_ares_enrichment_direct():
    """Test přímého ARES obohacení"""
    print("🧪 Test: Přímé ARES obohacení strukturovaných dat")
    print("=" * 60)
    
    # Simulace extrahovaných dat z faktury
    test_data = {
        "document_type": "faktura",
        "invoice_number": "2024001",
        "date": "2024-01-15",
        "vendor": {
            "ico": "02445344",  # Skanska - známé IČO
            # name, dic, address budou doplněny z ARES
        },
        "customer": {
            "name": "Existující zákazník s.r.o.",
            "ico": "27082440",  # Alza - známé IČO
            "address": "Stará adresa 123"
            # dic bude doplněno z ARES
        },
        "totals": {
            "total": 60500.0,
            "vat_amount": 10500.0
        }
    }
    
    print("📋 Původní data:")
    print(json.dumps(test_data, indent=2, ensure_ascii=False))
    
    try:
        # Inicializace processoru
        processor = UnifiedDocumentProcessor()
        
        # Nastavení možností
        options = ProcessingOptions(enable_ares_enrichment=True)
        
        print(f"\n🏢 Spouštím ARES obohacení...")
        
        # Přímé volání ARES obohacení
        enriched_data = processor._enrich_with_ares(test_data, options)
        
        print("\n📋 Obohacená data:")
        print(json.dumps(enriched_data, indent=2, ensure_ascii=False))
        
        # Analýza výsledků
        print(f"\n📊 Analýza obohacení:")
        
        # Vendor analýza
        vendor = enriched_data.get('vendor', {})
        print(f"🏢 Dodavatel (IČO: {vendor.get('ico', 'N/A')}):")
        print(f"   Název: {vendor.get('name', 'CHYBÍ')} {'✅' if vendor.get('name') else '❌'}")
        print(f"   DIČ: {vendor.get('dic', 'CHYBÍ')} {'✅' if vendor.get('dic') else '❌'}")
        print(f"   Adresa: {vendor.get('address', 'CHYBÍ')} {'✅' if vendor.get('address') else '❌'}")
        print(f"   ARES obohaceno: {vendor.get('_ares_enriched', False)} {'✅' if vendor.get('_ares_enriched') else '❌'}")
        print(f"   Aktivní: {vendor.get('_ares_active', 'N/A')}")
        print(f"   DPH plátce: {vendor.get('_ares_vat_payer', 'N/A')}")
        
        # Customer analýza
        customer = enriched_data.get('customer', {})
        print(f"👤 Odběratel (IČO: {customer.get('ico', 'N/A')}):")
        print(f"   Název: {customer.get('name', 'CHYBÍ')} {'✅' if customer.get('name') else '❌'}")
        print(f"   DIČ: {customer.get('dic', 'CHYBÍ')} {'✅' if customer.get('dic') else '❌'}")
        print(f"   Adresa: {customer.get('address', 'CHYBÍ')} {'✅' if customer.get('address') else '❌'}")
        print(f"   ARES obohaceno: {customer.get('_ares_enriched', False)} {'✅' if customer.get('_ares_enriched') else '❌'}")
        
        # ARES metadata analýza
        ares_meta = enriched_data.get('_ares_enrichment', {})
        if ares_meta:
            print(f"🏢 ARES Enrichment metadata:")
            print(f"   Úspěch: {ares_meta.get('success', False)} {'✅' if ares_meta.get('success') else '❌'}")
            print(f"   Čas: {ares_meta.get('enriched_at', 'N/A')}")
            if 'notes' in ares_meta:
                print(f"   Poznámky ({len(ares_meta['notes'])}):")
                for note in ares_meta['notes']:
                    print(f"     • {note}")
            if 'error' in ares_meta:
                print(f"   Chyba: {ares_meta['error']}")
        else:
            print("❌ ARES metadata chybí")
        
        # Hodnocení úspěšnosti
        vendor_enriched = vendor.get('_ares_enriched', False)
        customer_enriched = customer.get('_ares_enriched', False)
        has_metadata = bool(ares_meta)
        
        success_score = 0
        if vendor_enriched: success_score += 1
        if customer_enriched: success_score += 1
        if has_metadata: success_score += 1
        
        print(f"\n🎯 Hodnocení úspěšnosti:")
        print(f"   Vendor obohacen: {'✅' if vendor_enriched else '❌'}")
        print(f"   Customer obohacen: {'✅' if customer_enriched else '❌'}")
        print(f"   Metadata přítomna: {'✅' if has_metadata else '❌'}")
        print(f"   Celkové skóre: {success_score}/3")
        
        if success_score >= 2:
            print("✅ ARES obohacení úspěšné!")
            return True
        else:
            print("⚠️ ARES obohacení částečně úspěšné")
            return success_score > 0
            
    except Exception as e:
        print(f"❌ Chyba během ARES obohacení: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_ares_client_direct():
    """Test přímého ARES klienta"""
    print(f"\n🧪 Test: Přímý ARES klient")
    print("=" * 60)
    
    test_icos = [
        ("02445344", "Skanska Residential a.s."),
        ("27082440", "Alza.cz a.s."),
    ]
    
    success_count = 0
    
    for ico, expected_name in test_icos:
        print(f"\n🔍 Testování IČO: {ico}")
        
        try:
            company_data = ares_client.get_company_data(ico)
            
            if company_data:
                print(f"✅ Úspěch: {company_data.name}")
                print(f"   DIČ: {company_data.dic}")
                print(f"   Adresa: {company_data.address}")
                print(f"   Aktivní: {company_data.is_active}")
                print(f"   DPH plátce: {company_data.is_vat_payer}")
                
                if expected_name.lower() in company_data.name.lower():
                    print(f"✅ Název odpovídá očekávání")
                    success_count += 1
                else:
                    print(f"⚠️ Název neodpovídá: očekáváno '{expected_name}'")
            else:
                print("❌ Společnost nenalezena")
                
        except Exception as e:
            print(f"❌ Chyba: {e}")
    
    print(f"\n📊 ARES klient výsledky: {success_count}/{len(test_icos)} úspěšných")
    return success_count == len(test_icos)

def main():
    """Hlavní testovací funkce"""
    print("🚀 Test ARES Obohacení")
    print("=" * 60)
    print(f"Čas spuštění: {datetime.now().isoformat()}")
    print()
    
    results = []
    
    # Test 1: Přímý ARES klient
    success = test_ares_client_direct()
    results.append(("ARES klient", success))
    
    # Test 2: ARES obohacení
    success = test_ares_enrichment_direct()
    results.append(("ARES obohacení", success))
    
    # Shrnutí výsledků
    print(f"\n📊 Shrnutí testů:")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PROŠEL" if passed else "❌ SELHAL"
        print(f"{test_name:.<40} {status}")
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("🎉 Všechny testy prošly!")
        print("🚀 ARES obohacení je plně funkční!")
        print()
        print("💡 Další kroky:")
        print("   1. Nahrajte fakturu s IČO přes frontend")
        print("   2. Zkontrolujte automatické doplnění údajů")
        print("   3. Exportujte data a ověřte ARES informace")
    else:
        print("⚠️ Některé testy selhaly")
        print("🔧 Zkontrolujte chyby výše")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())
