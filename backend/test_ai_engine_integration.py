#!/usr/bin/env python3
"""
Test AI Engine Integration with OCR System
Tests complete multilayer OCR with AI decision making
"""

import os
import sys
import json
import time
from pathlib import Path

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ocr_manager import OCRManager
from gemini_decision_engine import GeminiDecisionEngine
from invoice_processor import InvoiceProcessor
from PIL import Image, ImageDraw, ImageFont
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_test_invoice():
    """Create a test invoice image"""
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font_large = ImageFont.truetype("arial.ttf", 32)
        font_medium = ImageFont.truetype("arial.ttf", 24)
        font_small = ImageFont.truetype("arial.ttf", 18)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Invoice header
    draw.text((50, 30), "FAKTURA / INVOICE", fill='black', font=font_large)
    draw.text((50, 80), "Askelio s.r.o.", fill='black', font=font_medium)
    draw.text((50, 110), "Technologická 123, Praha 6", fill='black', font=font_small)
    
    # Invoice details
    draw.text((50, 160), "Číslo faktury: FAK-2024-001", fill='black', font=font_medium)
    draw.text((50, 190), "Datum vystavení: 21.07.2024", fill='black', font=font_medium)
    draw.text((50, 220), "Datum splatnosti: 04.08.2024", fill='black', font=font_medium)
    
    # Customer info
    draw.text((50, 270), "Odběratel:", fill='black', font=font_medium)
    draw.text((50, 300), "Test Company Ltd.", fill='black', font=font_small)
    draw.text((50, 325), "Business Street 456", fill='black', font=font_small)
    draw.text((50, 350), "10000 Praha", fill='black', font=font_small)
    
    # Items
    draw.text((50, 400), "Položky:", fill='black', font=font_medium)
    draw.text((50, 430), "1x Software License OCR Pro", fill='black', font=font_small)
    draw.text((50, 455), "2x Konzultace AI implementace", fill='black', font=font_small)
    
    # Total
    draw.text((50, 500), "Celkem k úhradě: 45 678,90 Kč", fill='black', font=font_large)
    draw.text((50, 540), "DPH 21%: 7 956,90 Kč", fill='black', font=font_small)
    
    test_image_path = "test_ai_invoice.png"
    img.save(test_image_path)
    logger.info(f"Created test invoice: {test_image_path}")
    return test_image_path

def test_ai_engine_integration():
    """Test complete AI engine integration"""
    logger.info("🤖 Testing AI Engine Integration with OCR System")
    logger.info("=" * 60)
    
    # Create test invoice
    test_image_path = create_test_invoice()
    
    try:
        # Test 1: OCR Manager
        logger.info("\n📋 Test 1: OCR Manager")
        ocr_manager = OCRManager()
        available_providers = ocr_manager.get_available_providers()
        logger.info(f"Available OCR providers: {available_providers}")
        
        # Test 2: Gemini AI Engine
        logger.info("\n🧠 Test 2: Gemini AI Engine")
        gemini_engine = GeminiDecisionEngine()
        logger.info(f"Gemini AI available: {gemini_engine.is_available}")
        
        # Test 3: Sequential OCR Processing
        logger.info("\n🔄 Test 3: Sequential OCR Processing")
        start_time = time.time()
        ocr_results = ocr_manager.process_image_sequential(test_image_path)
        ocr_time = time.time() - start_time
        
        logger.info(f"OCR processing completed in {ocr_time:.2f}s")
        logger.info(f"Results from {len(ocr_results)} providers:")
        
        for result in ocr_results:
            status = "✅" if result.success else "❌"
            logger.info(f"  {status} {result.provider}: confidence={result.confidence:.3f}, time={result.processing_time:.2f}s")
        
        # Test 4: AI Decision Making
        logger.info("\n🎯 Test 4: AI Decision Making")
        start_time = time.time()
        ai_decision = gemini_engine.analyze_ocr_results(ocr_results, "invoice")
        ai_time = time.time() - start_time
        
        logger.info(f"AI decision completed in {ai_time:.2f}s")
        logger.info(f"Selected provider: {ai_decision.selected_provider}")
        logger.info(f"AI confidence: {ai_decision.confidence_score:.3f}")
        logger.info(f"AI reasoning: {ai_decision.reasoning[:100]}...")
        
        # Test 5: Complete Invoice Processing
        logger.info("\n📄 Test 5: Complete Invoice Processing")
        invoice_processor = InvoiceProcessor()
        start_time = time.time()
        final_result = invoice_processor.process_invoice(test_image_path, "test_ai_invoice.png")
        total_time = time.time() - start_time
        
        logger.info(f"Complete processing finished in {total_time:.2f}s")
        logger.info(f"Final success: {final_result.success}")
        logger.info(f"Final confidence: {final_result.confidence:.3f}")
        
        # Test 6: Results Analysis
        logger.info("\n📊 Test 6: Results Analysis")
        
        # Count successful OCR methods
        successful_ocr = len([r for r in ocr_results if r.success])
        
        # Analyze AI decision quality
        ai_quality_score = ai_decision.confidence_score if ai_decision.success else 0.0
        
        # Calculate overall system performance
        system_performance = {
            'ocr_providers_available': len(available_providers),
            'ocr_providers_successful': successful_ocr,
            'ai_engine_available': gemini_engine.is_available,
            'ai_decision_success': ai_decision.success,
            'ai_quality_score': ai_quality_score,
            'total_processing_time': total_time,
            'final_confidence': final_result.confidence,
            'system_ready': True
        }
        
        logger.info("System Performance Summary:")
        for key, value in system_performance.items():
            logger.info(f"  {key}: {value}")
        
        # Save detailed results
        detailed_results = {
            'test_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'system_performance': system_performance,
            'ocr_results': [
                {
                    'provider': r.provider,
                    'success': r.success,
                    'confidence': r.confidence,
                    'processing_time': r.processing_time,
                    'text_length': len(r.text) if r.text else 0,
                    'error_message': r.error_message
                } for r in ocr_results
            ],
            'ai_decision': {
                'selected_provider': ai_decision.selected_provider,
                'confidence_score': ai_decision.confidence_score,
                'reasoning': ai_decision.reasoning,
                'quality_analysis': ai_decision.quality_analysis,
                'success': ai_decision.success,
                'processing_time': ai_decision.processing_time
            },
            'final_result': {
                'success': final_result.success,
                'confidence': final_result.confidence,
                'processing_time': final_result.processing_time,
                'structured_data': final_result.structured_data if hasattr(final_result, 'structured_data') else {}
            }
        }
        
        with open('ai_engine_integration_test.json', 'w', encoding='utf-8') as f:
            json.dump(detailed_results, f, indent=2, ensure_ascii=False)
        
        logger.info(f"\n💾 Detailed results saved to: ai_engine_integration_test.json")
        
        # Final Summary
        logger.info(f"\n🎉 AI ENGINE INTEGRATION TEST SUMMARY")
        logger.info("=" * 60)
        logger.info(f"✅ OCR Providers: {successful_ocr}/{len(available_providers)} successful")
        logger.info(f"✅ AI Engine: {'Available' if gemini_engine.is_available else 'Not Available'}")
        logger.info(f"✅ AI Decision: {'Success' if ai_decision.success else 'Failed'}")
        logger.info(f"✅ Final Processing: {'Success' if final_result.success else 'Failed'}")
        logger.info(f"✅ Total Time: {total_time:.2f}s")
        logger.info(f"✅ Final Confidence: {final_result.confidence:.1%}")
        
        # Determine overall success
        overall_success = (
            successful_ocr > 0 and
            gemini_engine.is_available and
            ai_decision.success and
            final_result.success
        )
        
        if overall_success:
            logger.info(f"\n🚀 AI ENGINE INTEGRATION: FULLY OPERATIONAL!")
        else:
            logger.info(f"\n⚠️  AI ENGINE INTEGRATION: PARTIAL FUNCTIONALITY")
        
        return overall_success
        
    except Exception as e:
        logger.error(f"❌ Test failed with exception: {str(e)}")
        return False
        
    finally:
        # Clean up test image
        if os.path.exists(test_image_path):
            os.remove(test_image_path)
            logger.info(f"Cleaned up test image: {test_image_path}")

if __name__ == "__main__":
    success = test_ai_engine_integration()
    if success:
        logger.info("✅ AI Engine integration test completed successfully!")
        sys.exit(0)
    else:
        logger.error("❌ AI Engine integration test failed!")
        sys.exit(1)
