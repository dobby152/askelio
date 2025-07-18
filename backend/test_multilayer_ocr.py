#!/usr/bin/env python3
"""
Test script for Multilayer OCR System
Tests the new multilayer OCR engine with various providers and configurations
"""
import asyncio
import os
import sys
import logging
from pathlib import Path

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from multilayer_ocr import (
    create_multilayer_ocr_engine,
    OCRProviderType,
    ProcessingMethod
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def create_test_config():
    """Create test configuration for multilayer OCR"""
    return {
        'engine': {
            'max_workers': 3,
            'timeout': 120
        },
        'providers': {
            'tesseract': {
                'enabled': True,
                'tesseract_path': r'C:\Program Files\Tesseract-OCR\tesseract.exe' if os.name == 'nt' else None
            },
            'google_vision': {
                'enabled': True,
                'credentials_path': 'backend/google-credentials.json'
            },
            'azure_vision': {
                'enabled': False,  # Set to True if you have Azure credentials
                'subscription_key': os.getenv('AZURE_COMPUTER_VISION_SUBSCRIPTION_KEY'),
                'endpoint': os.getenv('AZURE_COMPUTER_VISION_ENDPOINT')
            },
            'paddle_ocr': {
                'enabled': False,  # Set to True if you want to test PaddleOCR
                'lang': 'en',
                'use_gpu': False
            }
        },
        'ai_decision': {
            'provider_weights': {
                'google_vision': 1.0,
                'azure_computer_vision': 0.95,
                'paddle_ocr': 0.85,
                'tesseract': 0.75
            },
            'scoring_weights': {
                'confidence': 0.25,
                'text_quality': 0.20,
                'structured_data_completeness': 0.20,
                'provider_reliability': 0.15,
                'cross_validation': 0.15,
                'language_consistency': 0.05
            }
        },
        'fusion': {
            'similarity_threshold': 0.6,
            'confidence_threshold': 0.3
        }
    }


async def test_multilayer_ocr():
    """Test the multilayer OCR system"""
    print("🚀 Testing Multilayer OCR System")
    print("=" * 50)
    
    # Create OCR engine
    config = create_test_config()
    ocr_engine = create_multilayer_ocr_engine(config)
    
    # Check engine status
    status = ocr_engine.get_engine_status()
    print(f"📊 Engine Status:")
    print(f"   Available providers: {status['available_providers']}")
    print(f"   Total providers: {status['total_providers']}")
    print(f"   AI Decision Engine: {status['ai_decision_engine']}")
    print(f"   Result Fusion Engine: {status['result_fusion_engine']}")
    print()
    
    # Test with sample images (if available)
    test_images = [
        "uploads/test_invoice.png",
        "uploads/test_receipt.jpg",
        "uploads/sample_document.pdf"
    ]
    
    # Find available test images
    available_images = []
    for image_path in test_images:
        if os.path.exists(image_path):
            available_images.append(image_path)
    
    if not available_images:
        print("⚠️  No test images found in uploads/ directory")
        print("   Please add some test images to test the OCR system")
        print("   Supported formats: PNG, JPG, PDF")
        return
    
    # Test each available image
    for i, image_path in enumerate(available_images, 1):
        print(f"🔍 Test {i}: Processing {os.path.basename(image_path)}")
        print("-" * 40)
        
        try:
            # Process with different methods
            processing_methods = [
                ProcessingMethod.BASIC,
                ProcessingMethod.GENTLE,
                ProcessingMethod.AGGRESSIVE
            ]
            
            # Run multilayer OCR
            result = await ocr_engine.process_document(
                image_path=image_path,
                processing_methods=processing_methods
            )
            
            # Display results
            print(f"✅ Processing completed!")
            print(f"   Best provider: {result.best_result.provider.value}")
            print(f"   Final confidence: {result.final_confidence:.3f}")
            print(f"   Fusion applied: {result.fusion_applied}")
            print(f"   Processing time: {result.processing_summary['processing_time']:.2f}s")
            print(f"   Successful providers: {result.processing_summary['successful_providers']}")
            
            # Show extracted text (first 200 characters)
            text = result.best_result.text
            if text:
                preview = text[:200] + "..." if len(text) > 200 else text
                print(f"   Text preview: {repr(preview)}")
            
            # Show structured data
            structured = result.best_result.structured_data
            print(f"   Structured data:")
            if structured.document_type:
                print(f"     Document type: {structured.document_type}")
            if structured.vendor:
                print(f"     Vendor: {structured.vendor}")
            if structured.amount:
                print(f"     Amount: {structured.amount} {structured.currency or 'CZK'}")
            if structured.date:
                print(f"     Date: {structured.date}")
            if structured.invoice_number:
                print(f"     Invoice number: {structured.invoice_number}")
            
            # Show AI decision metadata
            ai_metadata = result.ai_decision_metadata
            if 'all_scores' in ai_metadata:
                print(f"   Provider scores:")
                for score_info in ai_metadata['all_scores']:
                    print(f"     {score_info['provider']}: {score_info['score']:.3f}")
            
            print()
            
        except Exception as e:
            print(f"❌ Error processing {image_path}: {e}")
            print()
    
    print("🎉 Multilayer OCR testing completed!")


async def test_individual_providers():
    """Test individual OCR providers"""
    print("🔧 Testing Individual OCR Providers")
    print("=" * 50)
    
    config = create_test_config()
    ocr_engine = create_multilayer_ocr_engine(config)
    
    # Get provider information
    for provider in ocr_engine.providers:
        info = provider.get_provider_info()
        print(f"📋 {info['provider'].upper()}")
        print(f"   Available: {info['available']}")
        if 'version' in info:
            print(f"   Version: {info['version']}")
        if 'features' in info:
            print(f"   Features: {', '.join(info['features'])}")
        print()


async def benchmark_performance():
    """Benchmark OCR performance"""
    print("⚡ Performance Benchmark")
    print("=" * 50)
    
    # Find a test image
    test_image = None
    for path in ["uploads/test_invoice.png", "uploads/test_receipt.jpg"]:
        if os.path.exists(path):
            test_image = path
            break
    
    if not test_image:
        print("⚠️  No test image found for benchmarking")
        return
    
    config = create_test_config()
    ocr_engine = create_multilayer_ocr_engine(config)
    
    # Test different configurations
    test_configs = [
        {
            'name': 'Basic Processing',
            'methods': [ProcessingMethod.BASIC]
        },
        {
            'name': 'Multiple Methods',
            'methods': [ProcessingMethod.BASIC, ProcessingMethod.GENTLE]
        },
        {
            'name': 'All Methods',
            'methods': [ProcessingMethod.BASIC, ProcessingMethod.GENTLE, ProcessingMethod.AGGRESSIVE]
        }
    ]
    
    for test_config in test_configs:
        print(f"🏃 {test_config['name']}")
        
        try:
            import time
            start_time = time.time()
            
            result = await ocr_engine.process_document(
                image_path=test_image,
                processing_methods=test_config['methods']
            )
            
            end_time = time.time()
            
            print(f"   Time: {end_time - start_time:.2f}s")
            print(f"   Confidence: {result.final_confidence:.3f}")
            print(f"   Providers used: {len(result.all_results)}")
            print(f"   Best provider: {result.best_result.provider.value}")
            print()
            
        except Exception as e:
            print(f"   Error: {e}")
            print()


async def main():
    """Main test function"""
    print("🧪 Multilayer OCR System Test Suite")
    print("=" * 60)
    print()
    
    try:
        # Test 1: Basic functionality
        await test_multilayer_ocr()
        
        # Test 2: Individual providers
        await test_individual_providers()
        
        # Test 3: Performance benchmark
        await benchmark_performance()
        
    except KeyboardInterrupt:
        print("\n⏹️  Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Check if we're in the right directory
    if not os.path.exists("multilayer_ocr"):
        print("❌ Error: multilayer_ocr module not found")
        print("   Make sure you're running this script from the backend directory")
        sys.exit(1)
    
    # Run tests
    asyncio.run(main())
