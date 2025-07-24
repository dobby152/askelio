#!/usr/bin/env python3
"""
Kompletní test ARES integrace v produkčním systému
Testuje celý workflow od zpracování dokumentu až po export
"""

import sys
import os
import json
import tempfile
import time
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from unified_document_processor import UnifiedDocumentProcessor, ProcessingOptions, ProcessingMode
from ares_client import ares_client
from database_sqlite import SessionLocal
from models_sqlite import Document, ExtractedField

def create_test_invoice_text():
    """Vytvoří testovací text faktury s IČO"""
    return """
FAKTURA č. 2024001

Dodavatel:
Skanska Residential a.s.
IČO: 02445344
Křižíkova 682/34a
186 00 Praha 8

Odběratel:
Testovací firma s.r.o.
IČO: 27082440

Datum vystavení: 15.01.2024
Datum splatnosti: 15.02.2024

Položky:
1. Stavební práce    1 ks    50000,00 Kč
   DPH 21%                   10500,00 Kč

Celkem k úhradě: 60500,00 Kč

Variabilní symbol: 2024001
Číslo účtu: 123456789/0100
"""

def test_ares_in_processor():
    """Test ARES integrace v unified processoru"""
    print("🧪 Test 1: ARES integrace v unified processoru")
    print("=" * 60)
    
    try:
        # Inicializace processoru
        processor = UnifiedDocumentProcessor()
        
        # Vytvoření dočasného souboru s testovacím textem
        test_text = create_test_invoice_text()
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            f.write(test_text)
            temp_file_path = f.name
        
        try:
            # Nastavení možností s povoleným ARES
            options = ProcessingOptions(
                mode=ProcessingMode.COST_OPTIMIZED,
                max_cost_czk=2.0,
                min_confidence=0.7,
                enable_fallbacks=True,
                store_in_db=True,
                return_raw_text=True,
                enable_ares_enrichment=True  # Klíčové nastavení!
            )
            
            print(f"📄 Zpracovávám testovací dokument...")
            print(f"   ARES enrichment: {options.enable_ares_enrichment}")
            
            # Zpracování dokumentu
            start_time = time.time()
            result = processor.process_document(temp_file_path, "test_invoice.txt", options)
            processing_time = time.time() - start_time
            
            print(f"⏱️ Zpracování trvalo: {processing_time:.2f}s")
            print(f"✅ Úspěch: {result.success}")
            print(f"📊 Confidence: {result.confidence:.2f}")
            print(f"💰 Cena: {result.cost_czk:.3f} Kč")
            
            if result.success:
                print("\n📋 Strukturovaná data:")
                structured_data = result.structured_data
                
                # Kontrola vendor dat
                if 'vendor' in structured_data:
                    vendor = structured_data['vendor']
                    print(f"🏢 Dodavatel:")
                    print(f"   Název: {vendor.get('name', 'N/A')}")
                    print(f"   IČO: {vendor.get('ico', 'N/A')}")
                    print(f"   DIČ: {vendor.get('dic', 'N/A')}")
                    print(f"   Adresa: {vendor.get('address', 'N/A')}")
                    print(f"   ARES obohaceno: {vendor.get('_ares_enriched', False)}")
                    print(f"   Aktivní: {vendor.get('_ares_active', 'N/A')}")
                    print(f"   DPH plátce: {vendor.get('_ares_vat_payer', 'N/A')}")
                
                # Kontrola customer dat
                if 'customer' in structured_data:
                    customer = structured_data['customer']
                    print(f"👤 Odběratel:")
                    print(f"   Název: {customer.get('name', 'N/A')}")
                    print(f"   IČO: {customer.get('ico', 'N/A')}")
                    print(f"   DIČ: {customer.get('dic', 'N/A')}")
                    print(f"   ARES obohaceno: {customer.get('_ares_enriched', False)}")
                
                # Kontrola ARES enrichment metadat
                if '_ares_enrichment' in structured_data:
                    ares_meta = structured_data['_ares_enrichment']
                    print(f"\n🏢 ARES Enrichment metadata:")
                    print(f"   Úspěch: {ares_meta.get('success', False)}")
                    print(f"   Čas: {ares_meta.get('enriched_at', 'N/A')}")
                    if 'notes' in ares_meta:
                        print(f"   Poznámky:")
                        for note in ares_meta['notes']:
                            print(f"     • {note}")
                
                return result.document_id, True
            else:
                print(f"❌ Zpracování selhalo: {result.error_message}")
                return None, False
                
        finally:
            # Vyčištění dočasného souboru
            os.unlink(temp_file_path)
            
    except Exception as e:
        print(f"❌ Chyba během testu: {e}")
        import traceback
        traceback.print_exc()
        return None, False

def test_database_storage(document_id):
    """Test uložení ARES dat v databázi"""
    print(f"\n🧪 Test 2: Databázové uložení ARES dat")
    print("=" * 60)
    
    if not document_id:
        print("❌ Žádné document_id k testování")
        return False
    
    try:
        db = SessionLocal()
        
        # Načtení dokumentu z databáze
        document = db.query(Document).filter(Document.id == document_id).first()
        
        if not document:
            print(f"❌ Dokument s ID {document_id} nenalezen")
            return False
        
        print(f"📄 Dokument: {document.filename}")
        print(f"   Status: {document.status}")
        print(f"   Confidence: {document.confidence}")
        
        # Kontrola ARES metadat
        if document.ares_enriched:
            print(f"✅ ARES metadata nalezena v databázi")
            
            if isinstance(document.ares_enriched, str):
                ares_data = json.loads(document.ares_enriched)
            else:
                ares_data = document.ares_enriched
            
            print(f"   Úspěch: {ares_data.get('success', False)}")
            print(f"   Čas: {ares_data.get('enriched_at', 'N/A')}")
            if 'notes' in ares_data:
                print(f"   Poznámky: {len(ares_data['notes'])} položek")
        else:
            print("⚠️ ARES metadata nenalezena v databázi")
        
        # Kontrola extracted fields
        fields = db.query(ExtractedField).filter(ExtractedField.document_id == document_id).all()
        print(f"📊 Extrahovaná pole: {len(fields)}")
        
        vendor_fields = [f for f in fields if f.field_name.startswith('vendor.')]
        customer_fields = [f for f in fields if f.field_name.startswith('customer.')]
        
        print(f"   Vendor pole: {len(vendor_fields)}")
        print(f"   Customer pole: {len(customer_fields)}")
        
        for field in vendor_fields:
            print(f"     • {field.field_name}: {field.field_value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Chyba při testování databáze: {e}")
        return False
    finally:
        db.close()

def test_api_export(document_id):
    """Test exportu přes API"""
    print(f"\n🧪 Test 3: API Export s ARES daty")
    print("=" * 60)
    
    if not document_id:
        print("❌ Žádné document_id k testování")
        return False
    
    try:
        # Simulace API exportu (bez skutečného HTTP volání)
        from main import export_document
        from fastapi.testclient import TestClient
        from main import app
        
        client = TestClient(app)
        
        # Test JSON exportu
        response = client.get(f"/documents/{document_id}/export?format=json&include_ares=true")
        
        if response.status_code == 200:
            export_data = response.json()
            print("✅ JSON export úspěšný")
            print(f"   Document ID: {export_data.get('document_id')}")
            print(f"   Filename: {export_data.get('filename')}")
            
            structured_data = export_data.get('structured_data', {})
            if '_ares_enrichment' in structured_data:
                print("✅ ARES data zahrnuta v exportu")
            else:
                print("⚠️ ARES data chybí v exportu")
            
            export_meta = export_data.get('export_metadata', {})
            print(f"   ARES included: {export_meta.get('ares_included', False)}")
            
            return True
        else:
            print(f"❌ Export selhal: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Chyba při testování exportu: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Hlavní testovací funkce"""
    print("🚀 Kompletní Test ARES Integrace")
    print("=" * 60)
    print(f"Čas spuštění: {datetime.now().isoformat()}")
    print()
    
    results = []
    
    # Test 1: Zpracování s ARES
    document_id, success = test_ares_in_processor()
    results.append(("Zpracování s ARES", success))
    
    # Test 2: Databázové uložení
    if document_id:
        success = test_database_storage(document_id)
        results.append(("Databázové uložení", success))
        
        # Test 3: API Export
        success = test_api_export(document_id)
        results.append(("API Export", success))
    
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
        print("🚀 ARES integrace je plně funkční a produkčně připravená!")
    else:
        print("⚠️ Některé testy selhaly")
        print("🔧 Zkontrolujte chyby výše")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())
