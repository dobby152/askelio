#!/usr/bin/env python3
"""
Test script for simplified OCR approach - Google Vision + Gemini only
"""

import os
import sys
import json
import time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ocr_manager import OCRManager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_test_invoice_image():
    """Create a simple test invoice image"""
    # Create image
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font_large = ImageFont.truetype("arial.ttf", 24)
        font_medium = ImageFont.truetype("arial.ttf", 18)
        font_small = ImageFont.truetype("arial.ttf", 14)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw invoice content
    y = 50
    draw.text((50, y), "FAKTURA", font=font_large, fill='black')
    y += 50
    
    draw.text((50, y), "Číslo faktury: 2024-001", font=font_medium, fill='black')
    y += 30
    draw.text((50, y), "Datum vystavení: 21.07.2024", font=font_medium, fill='black')
    y += 30
    draw.text((50, y), "Datum splatnosti: 05.08.2024", font=font_medium, fill='black')
    y += 50
    
    draw.text((50, y), "Dodavatel:", font=font_medium, fill='black')
    y += 25
    draw.text((70, y), "ABC s.r.o.", font=font_small, fill='black')
    y += 20
    draw.text((70, y), "IČO: 12345678", font=font_small, fill='black')
    y += 20
    draw.text((70, y), "DIČ: CZ12345678", font=font_small, fill='black')
    y += 50
    
    draw.text((50, y), "Odběratel:", font=font_medium, fill='black')
    y += 25
    draw.text((70, y), "XYZ spol. s r.o.", font=font_small, fill='black')
    y += 20
    draw.text((70, y), "IČO: 87654321", font=font_small, fill='black')
    y += 50
    
    draw.text((50, y), "Položky:", font=font_medium, fill='black')
    y += 25
    draw.text((70, y), "Software licence - 1 ks - 15 000,00 Kč", font=font_small, fill='black')
    y += 20
    draw.text((70, y), "Konzultace - 5 hod - 5 000,00 Kč", font=font_small, fill='black')
    y += 50
    
    draw.text((50, y), "Celkem bez DPH: 20 000,00 Kč", font=font_medium, fill='black')
    y += 25
    draw.text((50, y), "DPH 21%: 4 200,00 Kč", font=font_medium, fill='black')
    y += 25
    draw.text((50, y), "CELKEM K ÚHRADĚ: 24 200,00 Kč", font=font_large, fill='black')
    
    # Save test image
    test_image_path = "test_simplified_invoice.png"
    img.save(test_image_path)
    logger.info(f"Test invoice image created: {test_image_path}")
    return test_image_path

def test_simplified_ocr():
    """Test the simplified OCR approach"""
    logger.info("🚀 Testing Simplified OCR Approach")
    logger.info("=" * 60)
    
    # Create test image
    test_image_path = create_test_invoice_image()
    
    try:
        # Initialize OCR Manager
        logger.info("\n📋 Initializing OCR Manager")
        ocr_manager = OCRManager()
        
        logger.info(f"Available providers: {ocr_manager.get_available_providers()}")
        logger.info(f"Provider status: {ocr_manager.get_provider_status()}")
        logger.info(f"Gemini status: {ocr_manager.get_gemini_status()}")
        
        # Test simplified processing
        logger.info("\n🔄 Testing Simplified Processing")
        start_time = time.time()
        
        result = ocr_manager.process_image_with_structuring(test_image_path, "invoice")
        
        processing_time = time.time() - start_time
        
        logger.info(f"Processing completed in {processing_time:.2f}s")
        logger.info(f"Success: {result['success']}")
        
        if result['success']:
            logger.info(f"Provider: {result['provider']}")
            logger.info(f"OCR Confidence: {result['confidence']:.2f}")
            logger.info(f"Structuring Confidence: {result['structuring_confidence']:.2f}")
            logger.info(f"Fields extracted: {len(result['fields_extracted'])}")
            
            logger.info("\n📄 Raw Text (first 200 chars):")
            logger.info(result['raw_text'][:200] + "..." if len(result['raw_text']) > 200 else result['raw_text'])
            
            if result['structured_data']:
                logger.info("\n📊 Structured Data:")
                logger.info(json.dumps(result['structured_data'], indent=2, ensure_ascii=False))
            
            logger.info(f"\n💡 Structuring Notes: {result['structuring_notes']}")
            
        else:
            logger.error(f"Processing failed: {result.get('error', 'Unknown error')}")
        
        return result
        
    except Exception as e:
        logger.error(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    finally:
        # Clean up test image
        if os.path.exists(test_image_path):
            os.remove(test_image_path)
            logger.info(f"Cleaned up test image: {test_image_path}")

def test_status_endpoints():
    """Test status endpoints"""
    logger.info("\n🔍 Testing Status Endpoints")
    logger.info("=" * 40)
    
    try:
        ocr_manager = OCRManager()
        
        logger.info("Available providers:")
        for provider in ocr_manager.get_available_providers():
            logger.info(f"  ✅ {provider}")
        
        logger.info("\nProvider status:")
        status = ocr_manager.get_provider_status()
        for provider, available in status.items():
            status_icon = "✅" if available else "❌"
            logger.info(f"  {status_icon} {provider}: {available}")
        
        logger.info("\nGemini status:")
        gemini_status = ocr_manager.get_gemini_status()
        for key, value in gemini_status.items():
            logger.info(f"  {key}: {value}")
            
    except Exception as e:
        logger.error(f"Status test failed: {e}")

if __name__ == "__main__":
    print("🚀 SIMPLIFIED OCR TEST")
    print("=" * 60)
    print("Testing Google Vision + Gemini approach only")
    print()
    
    try:
        # Test status
        test_status_endpoints()
        
        # Test processing
        result = test_simplified_ocr()
        
        if result and result['success']:
            print("\n✅ SIMPLIFIED OCR TEST PASSED!")
            print("\n💡 KEY BENEFITS:")
            print("   - Single high-quality OCR provider (Google Vision)")
            print("   - Immediate data structuring with Gemini")
            print("   - Faster processing (no multiple providers)")
            print("   - Cleaner, more maintainable code")
            print("   - Direct structured output")
        else:
            print("\n❌ SIMPLIFIED OCR TEST FAILED!")
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
