#!/usr/bin/env python3
"""
Quick test script to debug PDF processing
"""

import asyncio
import os
import sys

# Add current directory to path
sys.path.append('.')

# Import from main_simple
from main_simple import extract_text_from_file, TESSERACT_AVAILABLE, google_vision_client

async def test_pdf_processing():
    """Test PDF processing directly"""
    
    # Test file path
    test_file = "C:/Users/askelatest/Desktop/Zálohová_faktura_250800001.pdf"
    
    if not os.path.exists(test_file):
        print(f"❌ Test file not found: {test_file}")
        return
    
    print(f"🔍 Testing PDF processing...")
    print(f"📊 TESSERACT_AVAILABLE: {TESSERACT_AVAILABLE}")
    print(f"📊 google_vision_client: {google_vision_client is not None}")
    
    # Test extraction
    try:
        raw_text, ocr_confidence, ocr_metadata = await extract_text_from_file(test_file, 'application/pdf')
        
        print(f"\n📊 RESULTS:")
        print(f"Raw text length: {len(raw_text)}")
        print(f"OCR confidence: {ocr_confidence}")
        print(f"OCR metadata: {ocr_metadata}")
        print(f"Raw text preview: {raw_text[:200]}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_pdf_processing())
