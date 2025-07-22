#!/usr/bin/env python3
"""
Test script for all 5 OCR methods integration
Tests Google Vision, Azure Computer Vision, Tesseract, EasyOCR, and PaddleOCR
"""

import os
import sys
import json
import time
from pathlib import Path

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ocr_manager import OCRManager
from PIL import Image, ImageDraw, ImageFont
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_test_image():
    """Create a simple test image with text"""
    # Create a white image
    img = Image.new('RGB', (800, 400), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font, fallback to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()
    
    # Add test text
    test_text = """Test Invoice
Invoice Number: INV-2024-001
Date: 2024-07-21
Amount: $1,234.56
Customer: Test Company Ltd.
Description: Software License"""
    
    draw.text((50, 50), test_text, fill='black', font=font)
    
    # Save test image
    test_image_path = "test_ocr_image.png"
    img.save(test_image_path)
    logger.info(f"Created test image: {test_image_path}")
    return test_image_path

def test_all_ocr_methods():
    """Test all OCR methods"""
    logger.info("Starting OCR methods integration test")
    
    # Create test image
    test_image_path = create_test_image()
    
    try:
        # Initialize OCR Manager
        logger.info("Initializing OCR Manager...")
        ocr_manager = OCRManager()
        
        # Check available providers
        available_providers = ocr_manager.get_available_providers()
        provider_status = ocr_manager.get_provider_status()
        
        logger.info(f"Available providers: {available_providers}")
        logger.info(f"Provider status: {json.dumps(provider_status, indent=2)}")
        
        if not available_providers:
            logger.error("No OCR providers are available!")
            return False
        
        # Test each provider individually
        results = {}
        
        for provider in ['google_vision', 'azure_computer_vision', 'tesseract', 'easy_ocr', 'paddle_ocr']:
            if provider in available_providers:
                logger.info(f"\n--- Testing {provider} ---")
                start_time = time.time()
                
                try:
                    result = ocr_manager._process_with_provider(provider, test_image_path)
                    results[provider] = {
                        'success': result.success,
                        'text': result.text[:200] + "..." if len(result.text) > 200 else result.text,
                        'confidence': result.confidence,
                        'processing_time': result.processing_time,
                        'error_message': result.error_message
                    }
                    
                    if result.success:
                        logger.info(f"✅ {provider} - Success! Confidence: {result.confidence:.2f}, Time: {result.processing_time:.2f}s")
                        logger.info(f"Text preview: {result.text[:100]}...")
                    else:
                        logger.error(f"❌ {provider} - Failed: {result.error_message}")
                        
                except Exception as e:
                    logger.error(f"❌ {provider} - Exception: {str(e)}")
                    results[provider] = {
                        'success': False,
                        'text': '',
                        'confidence': 0.0,
                        'processing_time': time.time() - start_time,
                        'error_message': str(e)
                    }
            else:
                logger.info(f"⏭️  {provider} - Not available (not initialized)")
                results[provider] = {
                    'success': False,
                    'text': '',
                    'confidence': 0.0,
                    'processing_time': 0.0,
                    'error_message': 'Provider not initialized'
                }
        
        # Test sequential processing
        logger.info(f"\n--- Testing Sequential Processing ---")
        sequential_results = ocr_manager.process_image_sequential(test_image_path)
        
        logger.info(f"Sequential processing completed with {len(sequential_results)} results")
        for i, result in enumerate(sequential_results):
            logger.info(f"Result {i+1}: {result.provider} - Success: {result.success}, Confidence: {result.confidence:.2f}")
        
        # Save detailed results
        detailed_results = {
            'test_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'available_providers': available_providers,
            'provider_status': provider_status,
            'individual_results': results,
            'sequential_results': [
                {
                    'provider': r.provider,
                    'success': r.success,
                    'confidence': r.confidence,
                    'processing_time': r.processing_time,
                    'text_length': len(r.text),
                    'error_message': r.error_message
                } for r in sequential_results
            ]
        }
        
        with open('ocr_test_results.json', 'w', encoding='utf-8') as f:
            json.dump(detailed_results, f, indent=2, ensure_ascii=False)
        
        logger.info(f"\nDetailed results saved to: ocr_test_results.json")
        
        # Summary
        successful_providers = [p for p, r in results.items() if r['success']]
        logger.info(f"\n=== SUMMARY ===")
        logger.info(f"Total providers tested: {len(results)}")
        logger.info(f"Successful providers: {len(successful_providers)} - {successful_providers}")
        logger.info(f"Failed providers: {len(results) - len(successful_providers)}")
        
        return len(successful_providers) > 0
        
    except Exception as e:
        logger.error(f"Test failed with exception: {str(e)}")
        return False
        
    finally:
        # Clean up test image
        if os.path.exists(test_image_path):
            os.remove(test_image_path)
            logger.info(f"Cleaned up test image: {test_image_path}")

if __name__ == "__main__":
    success = test_all_ocr_methods()
    if success:
        logger.info("✅ OCR integration test completed successfully!")
        sys.exit(0)
    else:
        logger.error("❌ OCR integration test failed!")
        sys.exit(1)
