#!/usr/bin/env python3
"""
Test script to verify the improved data extraction with the actual extracted text
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from main_simple import regex_extract_data

def test_with_actual_extracted_text():
    """Test with the actual text that was extracted from the PDF"""
    
    # This is the actual text extracted by Google Vision from the PDF
    actual_text = """Askela s.r.o.
Dodavatel:
Askela s.r.o.
Korunní 2569/108
101 00 Praha 10
IČ: 26757125
DIČ: CZ26757125
ZÁLOHOVÁ FAKTURA č. 250800001
Variabilní symbol:
Konstantní symbol:
Objednávka č.:
Odběratel:
250800001
0308
ze dne:
IČ:
DIČ:
60485981
CZ6712112066
Mobil: 00420605245919
E-mail: director@askela.cz
www.askela.cz
Číslo účtu:
Datum vystavení:
Datum splatnosti:
Forma úhrady:
Označení dodávky
Účtujeme Vám dle Vaší objednávky:
Vývoj a Tvorba webových stránek
CELKEM K ÚHRADĚ
Vystavil: Miroslav Feldman, DiS.
Dang Trung Luong
V ladech 121
149 00 Praha
1076545001 5500
Konečný příjemce:
17.06.2025
01.07.2025
Příkazem
Společnost zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C., vložka 91727
Převzal:
Razítko:
Ekonomický a informační systém POHODA
Množství
Sleva
Kč Celkem
1
7 865,00
7 865,00"""

    print("🧪 Testing improved data extraction with actual PDF text...")
    print("=" * 70)
    
    # Test the extraction
    import asyncio
    
    async def run_test():
        extracted_data = await regex_extract_data(actual_text, "Zálohová_faktura_250800001.pdf")
        
        print("📊 Extracted Data:")
        print(f"   Vendor: {extracted_data.get('vendor', 'NOT FOUND')}")
        print(f"   Amount: {extracted_data.get('amount', 'NOT FOUND')}")
        print(f"   Currency: {extracted_data.get('currency', 'NOT FOUND')}")
        print(f"   Date: {extracted_data.get('date', 'NOT FOUND')}")
        print(f"   Invoice Number: {extracted_data.get('invoice_number', 'NOT FOUND')}")
        print(f"   Document Type: {extracted_data.get('document_type', 'NOT FOUND')}")
        print(f"   Confidence: {extracted_data.get('confidence', 'NOT FOUND')}")
        
        print("\n" + "=" * 70)
        
        # Verify expected values
        expected = {
            'vendor': 'Askela s.r.o.',
            'amount': 7865.0,
            'currency': 'CZK',
            'date': '2025-06-17',
            'invoice_number': '250800001',
            'document_type': 'faktura'
        }
        
        print("✅ Verification:")
        all_correct = True
        for key, expected_value in expected.items():
            actual_value = extracted_data.get(key)
            if actual_value == expected_value:
                print(f"   ✅ {key}: {actual_value} (correct)")
            else:
                print(f"   ❌ {key}: {actual_value} (expected: {expected_value})")
                all_correct = False
        
        if all_correct:
            print("\n🎉 All data extracted correctly!")
        else:
            print("\n⚠️  Some data extraction issues found.")
        
        return extracted_data
    
    return asyncio.run(run_test())

if __name__ == "__main__":
    test_with_actual_extracted_text()
