#!/usr/bin/env python3
"""
Test script for Gemini AI data structuring functionality
Demonstrates the enhanced OCR + Gemini structuring pipeline
"""

import os
import sys
import json
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

from invoice_processor import InvoiceProcessor
from gemini_decision_engine import GeminiDecisionEngine

def test_gemini_structuring():
    """Test Gemini AI structuring with sample invoice text"""
    
    print("🧪 Testing Gemini AI Data Structuring")
    print("=" * 50)
    
    # Sample invoice text (Czech)
    sample_texts = [
        """
        FAKTURA č. 2024-001
        Datum vystavení: 21.07.2024
        Splatnost: 05.08.2024
        
        Dodavatel:
        ABC s.r.o.
        IČO: 12345678
        DIČ: CZ12345678
        
        Odběratel:
        XYZ spol. s r.o.
        IČO: 87654321
        
        Položky:
        Software licence - 1 ks - 15 000,00 Kč
        Podpora - 12 měsíců - 5 000,00 Kč
        
        Celkem bez DPH: 20 000,00 Kč
        DPH 21%: 4 200,00 Kč
        Celkem k úhradě: 24 200,00 Kč
        """,
        
        """
        Invoice #INV-2024-456
        Date: 2024-07-21
        Due Date: 2024-08-21
        
        From: Tech Solutions Ltd.
        To: Customer Corp.
        
        Items:
        - Consulting services: $2,500.00
        - Software development: $7,500.00
        
        Subtotal: $10,000.00
        Tax (10%): $1,000.00
        Total: $11,000.00
        """
    ]
    
    # Initialize processor
    try:
        processor = InvoiceProcessor()
        print(f"✅ Invoice processor initialized")
        print(f"   - OCR providers: {len(processor.ocr_manager.get_available_providers())}")
        print(f"   - Gemini available: {processor.gemini_engine.is_available}")
        print()
        
    except Exception as e:
        print(f"❌ Failed to initialize processor: {e}")
        return
    
    # Test each sample text
    for i, text in enumerate(sample_texts, 1):
        print(f"📄 Testing Sample {i}")
        print("-" * 30)
        
        try:
            # Basic structuring
            print("🔍 Basic regex structuring...")
            basic_result = processor._structure_invoice_data(text)
            print(f"   - Fields extracted: {len(basic_result.get('fields', {}))}")
            print(f"   - Confidence: {basic_result.get('extraction_confidence', 0.0):.2f}")
            
            # Gemini structuring
            print("🤖 Gemini AI structuring...")
            gemini_result = processor.gemini_engine.structure_and_validate_data(
                text, basic_result, "invoice"
            )
            
            print(f"   - Success: {gemini_result.success}")
            print(f"   - Confidence: {gemini_result.confidence_score:.2f}")
            print(f"   - Fields extracted: {len(gemini_result.fields_extracted)}")
            print(f"   - Processing time: {gemini_result.processing_time:.2f}s")
            
            # Show comparison
            if gemini_result.comparison_with_basic:
                comp = gemini_result.comparison_with_basic
                print(f"   - Basic vs Gemini fields: {comp.get('basic_fields_count', 0)} vs {comp.get('gemini_fields_count', 0)}")
                if comp.get('differences'):
                    print(f"   - Differences found: {len(comp['differences'])}")
            
            # Show structured data preview
            if gemini_result.success:
                structured = gemini_result.structured_data
                print("\n📋 Extracted Data Preview:")
                if structured.get('invoice_number'):
                    print(f"   - Invoice: {structured['invoice_number']}")
                if structured.get('date_issued'):
                    print(f"   - Date: {structured['date_issued']}")
                if structured.get('total_amount', {}).get('value'):
                    amount = structured['total_amount']
                    print(f"   - Total: {amount.get('value')} {amount.get('currency', '')}")
                if structured.get('vendor', {}).get('name'):
                    print(f"   - Vendor: {structured['vendor']['name']}")
            
            print(f"   - Validation notes: {gemini_result.validation_notes}")
            print()
            
        except Exception as e:
            print(f"❌ Error testing sample {i}: {e}")
            print()
    
    print("✅ Gemini structuring test completed!")

def test_gemini_connection():
    """Test Gemini AI connection"""
    print("🔗 Testing Gemini AI Connection")
    print("=" * 30)
    
    try:
        gemini_engine = GeminiDecisionEngine()
        test_result = gemini_engine.test_connection()
        
        print(f"Connection successful: {test_result['success']}")
        print(f"API key configured: {test_result.get('api_key_configured', False)}")
        if not test_result['success']:
            print(f"Error: {test_result['message']}")
        
        return test_result['success']
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Gemini AI Structuring Test Suite")
    print("=" * 50)
    
    # Test connection first
    if test_gemini_connection():
        print()
        test_gemini_structuring()
    else:
        print("❌ Gemini AI not available - skipping structuring tests")
        print("💡 Make sure GOOGLE_API_KEY is set in your environment")
