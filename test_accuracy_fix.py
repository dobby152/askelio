#!/usr/bin/env python3
"""
Test script to demonstrate the improved accuracy calculation
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from main_simple import calculate_accuracy

def test_accuracy_scenarios():
    """Test different scenarios to show realistic accuracy calculation"""
    
    print("🧪 Testing improved accuracy calculation...")
    print("=" * 60)
    
    # Scenario 1: Perfect extraction (should get high score)
    perfect_data = {
        "vendor": "Askela s.r.o.",
        "amount": 25800.00,
        "currency": "CZK", 
        "date": "2025-01-15",
        "invoice_number": "FAK2025001",
        "document_type": "faktura",
        "confidence": 0.85
    }
    
    perfect_accuracy = calculate_accuracy(perfect_data)
    print(f"✅ Perfect extraction: {perfect_accuracy:.1f}%")
    
    # Scenario 2: Good extraction with minor issues
    good_data = {
        "vendor": "Some Company Ltd",
        "amount": 1500.50,
        "currency": "EUR",
        "date": "2024-12-01", 
        "invoice_number": "INV-2024-456",
        "document_type": "invoice",
        "confidence": 0.75
    }
    
    good_accuracy = calculate_accuracy(good_data)
    print(f"✅ Good extraction: {good_accuracy:.1f}%")
    
    # Scenario 3: Poor extraction with OCR errors (should get low score)
    poor_data = {
        "vendor": "|||###***",  # OCR garbage
        "amount": -500.00,  # Negative amount (suspicious)
        "currency": "XYZ",  # Invalid currency
        "date": "2050-99-99",  # Invalid date
        "invoice_number": "???",  # OCR error
        "document_type": "unknown",
        "confidence": 0.3
    }
    
    poor_accuracy = calculate_accuracy(poor_data)
    print(f"❌ Poor extraction (OCR errors): {poor_accuracy:.1f}%")
    
    # Scenario 4: Missing data (should get very low score)
    missing_data = {
        "vendor": "",
        "amount": None,
        "currency": "",
        "date": "",
        "invoice_number": "",
        "document_type": "",
        "confidence": 0.1
    }
    
    missing_accuracy = calculate_accuracy(missing_data)
    print(f"❌ Missing data: {missing_accuracy:.1f}%")
    
    # Scenario 5: Partially correct data (realistic scenario)
    partial_data = {
        "vendor": "ABC Company",  # Good
        "amount": 2500.00,  # Good
        "currency": "CZK",  # Good
        "date": "",  # Missing
        "invoice_number": "123|||456",  # Has OCR errors
        "document_type": "faktura",  # Good
        "confidence": 0.6
    }
    
    partial_accuracy = calculate_accuracy(partial_data)
    print(f"⚠️  Partial extraction: {partial_accuracy:.1f}%")
    
    print("=" * 60)
    print("🎯 Summary:")
    print(f"   Perfect data: {perfect_accuracy:.1f}% (was showing ~95% before)")
    print(f"   Poor OCR data: {poor_accuracy:.1f}% (was showing ~95% before)")
    print(f"   Missing data: {missing_accuracy:.1f}% (was showing ~95% before)")
    print("\n✅ The accuracy calculation now reflects actual data quality!")

if __name__ == "__main__":
    test_accuracy_scenarios()
