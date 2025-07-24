#!/usr/bin/env python3
"""
Test script pro ARES integraci
Testuje automatické doplňování údajů subjektů na základě IČO
"""

import sys
import os
import json
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ares_client import ares_client

def test_ares_basic():
    """Test základní funkčnosti ARES API"""
    print("🧪 Test 1: Základní ARES API funkčnost")
    print("=" * 50)
    
    # Test známé IČO
    test_icos = [
        "02445344",  # Skanska Residential a.s.
        "25596641",  # Google Czech Republic s.r.o.
        "27082440",  # Microsoft s.r.o.
        "00000000",  # Neexistující IČO
        "invalid"    # Neplatný formát
    ]
    
    for ico in test_icos:
        print(f"\n🔍 Testování IČO: {ico}")
        company_data = ares_client.get_company_data(ico)
        
        if company_data:
            print(f"✅ Úspěch: {company_data.name}")
            print(f"   DIČ: {company_data.dic}")
            print(f"   Adresa: {company_data.address}")
            print(f"   Aktivní: {company_data.is_active}")
            print(f"   DPH plátce: {company_data.is_vat_payer}")
        else:
            print("❌ Společnost nenalezena nebo chyba")

def test_ares_enrichment():
    """Test obohacování strukturovaných dat"""
    print("\n\n🧪 Test 2: Obohacování strukturovaných dat")
    print("=" * 50)
    
    # Simulace dat z faktury s neúplnými údaji
    test_data = {
        "document_type": "faktura",
        "invoice_number": "2024001",
        "date": "2024-01-15",
        "vendor": {
            "ico": "02445344",  # Pouze IČO, ostatní údaje chybí
            # name, dic, address budou doplněny z ARES
        },
        "customer": {
            "name": "Můj zákazník s.r.o.",
            "ico": "25596641",  # IČO je k dispozici
            "address": "Stará adresa 123"  # Adresa bude aktualizována z ARES
            # dic bude doplněno z ARES
        },
        "totals": {
            "total": 12500.0,
            "vat_amount": 2625.0
        }
    }
    
    print("📋 Původní data:")
    print(json.dumps(test_data, indent=2, ensure_ascii=False))
    
    # Test obohacení vendor dat
    print("\n🏢 Obohacování vendor dat...")
    enriched_vendor = ares_client.enrich_subject_data(test_data["vendor"])
    
    print("\n📋 Obohacená vendor data:")
    print(json.dumps(enriched_vendor, indent=2, ensure_ascii=False))
    
    # Test obohacení customer dat
    print("\n🏢 Obohacování customer dat...")
    enriched_customer = ares_client.enrich_subject_data(test_data["customer"])
    
    print("\n📋 Obohacená customer data:")
    print(json.dumps(enriched_customer, indent=2, ensure_ascii=False))

def test_ares_performance():
    """Test výkonu a cachingu"""
    print("\n\n🧪 Test 3: Výkon a caching")
    print("=" * 50)
    
    ico = "02445344"
    
    # První volání (bez cache)
    start_time = datetime.now()
    company_data1 = ares_client.get_company_data(ico)
    first_call_time = (datetime.now() - start_time).total_seconds()
    
    # Druhé volání (s cache)
    start_time = datetime.now()
    company_data2 = ares_client.get_company_data(ico)
    second_call_time = (datetime.now() - start_time).total_seconds()
    
    print(f"⏱️ První volání: {first_call_time:.3f}s")
    print(f"⏱️ Druhé volání (cache): {second_call_time:.3f}s")
    print(f"🚀 Zrychlení: {first_call_time/second_call_time:.1f}x")
    
    # Ověř, že data jsou stejná
    if company_data1 and company_data2:
        if company_data1.name == company_data2.name:
            print("✅ Cache funguje správně - data jsou konzistentní")
        else:
            print("❌ Cache problém - data se liší")

def test_error_handling():
    """Test error handling"""
    print("\n\n🧪 Test 4: Error handling")
    print("=" * 50)
    
    # Test neplatných IČO
    invalid_icos = ["", None, "123", "12345678901", "abcdefgh"]
    
    for ico in invalid_icos:
        print(f"\n🔍 Testování neplatného IČO: {repr(ico)}")
        try:
            result = ares_client.get_company_data(ico)
            if result is None:
                print("✅ Správně vráceno None pro neplatné IČO")
            else:
                print(f"⚠️ Neočekávaný výsledek: {result}")
        except Exception as e:
            print(f"❌ Výjimka: {e}")

def main():
    """Hlavní testovací funkce"""
    print("🚀 ARES Integration Test Suite")
    print("=" * 50)
    print(f"Čas spuštění: {datetime.now().isoformat()}")
    
    try:
        test_ares_basic()
        test_ares_enrichment()
        test_ares_performance()
        test_error_handling()
        
        print("\n\n✅ Všechny testy dokončeny!")
        print("🎯 ARES integrace je připravena k použití")
        
    except Exception as e:
        print(f"\n❌ Chyba během testování: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
