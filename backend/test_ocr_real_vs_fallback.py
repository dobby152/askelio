#!/usr/bin/env python3
"""
Test script to distinguish real OCR implementations from fallback implementations
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
    img = Image.new('RGB', (800, 400), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()
    
    test_text = """Real OCR Test
Invoice: INV-2024-001
Date: 2024-07-21
Amount: $1,234.56
Company: Test Ltd."""
    
    draw.text((50, 50), test_text, fill='black', font=font)
    
    test_image_path = "test_real_ocr.png"
    img.save(test_image_path)
    return test_image_path

def analyze_ocr_authenticity():
    """Analyze which OCR methods are real vs fallback"""
    logger.info("Analyzing OCR method authenticity...")
    
    test_image_path = create_test_image()
    
    try:
        ocr_manager = OCRManager()
        
        # Check initialization details
        analysis = {
            'real_implementations': [],
            'fallback_implementations': [],
            'failed_implementations': [],
            'details': {}
        }
        
        # Analyze each provider
        for provider in ['google_vision', 'azure_computer_vision', 'tesseract', 'easy_ocr', 'paddle_ocr']:
            provider_obj = ocr_manager.providers.get(provider)
            
            if provider_obj is None:
                analysis['failed_implementations'].append(provider)
                analysis['details'][provider] = {
                    'status': 'failed',
                    'reason': 'Not initialized',
                    'is_real': False
                }
            elif provider == 'azure_computer_vision' and provider_obj == "mock_client":
                analysis['fallback_implementations'].append(provider)
                analysis['details'][provider] = {
                    'status': 'fallback',
                    'reason': 'Using mock client (Tesseract fallback)',
                    'is_real': False
                }
            elif provider == 'google_vision':
                # Check if using real credentials
                credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'google-credentials.json')
                if os.path.exists(credentials_path):
                    analysis['real_implementations'].append(provider)
                    analysis['details'][provider] = {
                        'status': 'real',
                        'reason': 'Real Google Vision API with credentials',
                        'is_real': True
                    }
                else:
                    analysis['failed_implementations'].append(provider)
                    analysis['details'][provider] = {
                        'status': 'failed',
                        'reason': 'No credentials found',
                        'is_real': False
                    }
            elif provider in ['tesseract', 'easy_ocr']:
                analysis['real_implementations'].append(provider)
                analysis['details'][provider] = {
                    'status': 'real',
                    'reason': f'Native {provider} implementation',
                    'is_real': True
                }
            elif provider == 'paddle_ocr':
                # PaddleOCR has issues but attempts real implementation
                analysis['fallback_implementations'].append(provider)
                analysis['details'][provider] = {
                    'status': 'fallback',
                    'reason': 'PaddleOCR with Tesseract fallback due to API issues',
                    'is_real': False
                }
        
        # Test each method to confirm analysis
        logger.info("Testing each method...")
        for provider in analysis['real_implementations'] + analysis['fallback_implementations']:
            if provider in ocr_manager.available_providers:
                start_time = time.time()
                result = ocr_manager._process_with_provider(provider, test_image_path)
                
                analysis['details'][provider]['test_result'] = {
                    'success': result.success,
                    'confidence': result.confidence,
                    'processing_time': result.processing_time,
                    'text_length': len(result.text) if result.text else 0,
                    'error_message': result.error_message
                }
        
        # Generate report
        logger.info("\n" + "="*60)
        logger.info("OCR AUTHENTICITY ANALYSIS REPORT")
        logger.info("="*60)
        
        logger.info(f"\n✅ REAL IMPLEMENTATIONS ({len(analysis['real_implementations'])}):")
        for provider in analysis['real_implementations']:
            details = analysis['details'][provider]
            logger.info(f"  • {provider}: {details['reason']}")
            if 'test_result' in details:
                test = details['test_result']
                logger.info(f"    - Success: {test['success']}, Confidence: {test['confidence']:.3f}, Time: {test['processing_time']:.2f}s")
        
        logger.info(f"\n⚠️  FALLBACK IMPLEMENTATIONS ({len(analysis['fallback_implementations'])}):")
        for provider in analysis['fallback_implementations']:
            details = analysis['details'][provider]
            logger.info(f"  • {provider}: {details['reason']}")
            if 'test_result' in details:
                test = details['test_result']
                logger.info(f"    - Success: {test['success']}, Confidence: {test['confidence']:.3f}, Time: {test['processing_time']:.2f}s")
        
        logger.info(f"\n❌ FAILED IMPLEMENTATIONS ({len(analysis['failed_implementations'])}):")
        for provider in analysis['failed_implementations']:
            details = analysis['details'][provider]
            logger.info(f"  • {provider}: {details['reason']}")
        
        # Summary
        total_real = len(analysis['real_implementations'])
        total_fallback = len(analysis['fallback_implementations'])
        total_failed = len(analysis['failed_implementations'])
        
        logger.info(f"\n📊 SUMMARY:")
        logger.info(f"  Real OCR methods: {total_real}/5")
        logger.info(f"  Fallback methods: {total_fallback}/5")
        logger.info(f"  Failed methods: {total_failed}/5")
        logger.info(f"  Total functional: {total_real + total_fallback}/5")
        
        # Save detailed analysis
        with open('ocr_authenticity_analysis.json', 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
        
        logger.info(f"\nDetailed analysis saved to: ocr_authenticity_analysis.json")
        
        return analysis
        
    finally:
        if os.path.exists(test_image_path):
            os.remove(test_image_path)

if __name__ == "__main__":
    analyze_ocr_authenticity()
