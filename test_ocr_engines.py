#!/usr/bin/env python3
"""
Test script to verify both OCR engines are working properly
"""

import sys
import os
import asyncio
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from main_simple import extract_with_tesseract, extract_with_google_vision

async def test_ocr_engines():
    """Test both OCR engines with a sample PDF"""
    
    print("🧪 Testing OCR Engines...")
    print("=" * 50)
    
    # Look for the uploaded PDF file
    uploads_dir = "uploads"
    pdf_files = []
    
    if os.path.exists(uploads_dir):
        for file in os.listdir(uploads_dir):
            if file.endswith('.pdf'):
                pdf_files.append(os.path.join(uploads_dir, file))
    
    if not pdf_files:
        print("❌ No PDF files found in uploads directory")
        return
    
    # Use the first PDF file found
    test_file = pdf_files[0]
    print(f"📄 Testing with file: {os.path.basename(test_file)}")
    print()
    
    # Test Tesseract
    print("🔍 Testing Tesseract OCR...")
    try:
        tesseract_result = await extract_with_tesseract(test_file, "application/pdf")
        print(f"   Method: {tesseract_result['method']}")
        print(f"   Confidence: {tesseract_result['confidence']:.2f}")
        print(f"   Text length: {len(tesseract_result['text'])} characters")
        print(f"   Processing time: {tesseract_result['processing_time']:.2f}s")
        if tesseract_result['confidence'] > 0:
            print("   ✅ Tesseract working!")
            print(f"   Preview: {tesseract_result['text'][:100]}...")
        else:
            print("   ❌ Tesseract failed")
            print(f"   Error: {tesseract_result['text']}")
    except Exception as e:
        print(f"   ❌ Tesseract exception: {e}")
    
    print()
    
    # Test Google Vision
    print("🤖 Testing Google Vision API...")
    try:
        google_result = await extract_with_google_vision(test_file, "application/pdf")
        print(f"   Method: {google_result['method']}")
        print(f"   Confidence: {google_result['confidence']:.2f}")
        print(f"   Text length: {len(google_result['text'])} characters")
        print(f"   Processing time: {google_result['processing_time']:.2f}s")
        if google_result['confidence'] > 0:
            print("   ✅ Google Vision working!")
            print(f"   Preview: {google_result['text'][:100]}...")
        else:
            print("   ❌ Google Vision failed")
            print(f"   Error: {google_result['text']}")
    except Exception as e:
        print(f"   ❌ Google Vision exception: {e}")
    
    print()
    print("=" * 50)
    print("🎯 Summary:")
    
    # Compare results
    try:
        tesseract_working = tesseract_result['confidence'] > 0
        google_working = google_result['confidence'] > 0
        
        if tesseract_working and google_working:
            print("   ✅ Both OCR engines are working!")
            print(f"   Tesseract confidence: {tesseract_result['confidence']:.2f}")
            print(f"   Google Vision confidence: {google_result['confidence']:.2f}")
            
            # Compare text lengths
            if len(google_result['text']) > len(tesseract_result['text']):
                print("   📊 Google Vision extracted more text")
            elif len(tesseract_result['text']) > len(google_result['text']):
                print("   📊 Tesseract extracted more text")
            else:
                print("   📊 Both extracted similar amounts of text")
                
        elif google_working:
            print("   ⚠️  Only Google Vision is working")
            print("   💡 Tesseract needs to be fixed")
        elif tesseract_working:
            print("   ⚠️  Only Tesseract is working")
            print("   💡 Google Vision needs to be fixed")
        else:
            print("   ❌ Neither OCR engine is working!")
            print("   💡 Both need to be fixed")
            
    except:
        print("   ❌ Could not compare results")

if __name__ == "__main__":
    asyncio.run(test_ocr_engines())
