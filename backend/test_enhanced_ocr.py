#!/usr/bin/env python3
"""
Test script for Enhanced Multi-Technology OCR System
Demonstrates the use of multiple OCR engines for maximum precision
"""

import os
import sys
import time
import json
from pathlib import Path

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from combined_ocr_processor import CombinedOCRProcessor
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_test_image():
    """Create a test image with Czech invoice text"""
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np
    
    # Create a white image
    width, height = 800, 600
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Try to use a default font
    try:
        font = ImageFont.truetype("arial.ttf", 16)
        title_font = ImageFont.truetype("arial.ttf", 24)
    except:
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()
    
    # Sample Czech invoice text
    invoice_text = [
        "FAKTURA č. 2025001",
        "",
        "Dodavatel:",
        "ABC s.r.o.",
        "Hlavní 123",
        "110 00 Praha 1",
        "IČO: 12345678",
        "DIČ: CZ12345678",
        "",
        "Odběratel:",
        "XYZ spol. s r.o.",
        "Nová 456",
        "120 00 Praha 2",
        "IČO: 87654321",
        "",
        "Datum vystavení: 15.01.2025",
        "Datum splatnosti: 15.02.2025",
        "Variabilní symbol: 2025001",
        "",
        "Položka                    Množství    Cena/ks    Celkem",
        "Konzultační služby         10 hod      1,500 Kč   15,000 Kč",
        "DPH 21%                                           3,150 Kč",
        "",
        "CELKEM K ÚHRADĚ:                                  18,150 Kč"
    ]
    
    # Draw title
    draw.text((50, 30), "FAKTURA č. 2025001", fill='black', font=title_font)
    
    # Draw text lines
    y_position = 80
    for line in invoice_text[1:]:  # Skip title as it's already drawn
        draw.text((50, y_position), line, fill='black', font=font)
        y_position += 25
    
    # Save the test image
    test_image_path = "test_czech_invoice.png"
    image.save(test_image_path)
    logger.info(f"Created test image: {test_image_path}")
    
    return test_image_path

def test_individual_engines(processor, image_path):
    """Test individual OCR engines"""
    logger.info("=== Testing Individual OCR Engines ===")
    
    import cv2
    image = cv2.imread(image_path)
    
    results = {}
    
    # Test Tesseract
    logger.info("Testing Tesseract OCR...")
    tesseract_result = processor.tesseract_ocr(image, "", "standard")
    results['tesseract'] = {
        'confidence': tesseract_result.confidence,
        'text_length': len(tesseract_result.text),
        'quality_score': tesseract_result.quality_score,
        'processing_time': tesseract_result.processing_time,
        'structured_data_count': len(tesseract_result.structured_data)
    }
    
    # Test Google Vision (if available)
    if "google_vision" in processor.available_engines:
        logger.info("Testing Google Vision OCR...")
        gv_result = processor.google_vision_ocr(image_path)
        results['google_vision'] = {
            'confidence': gv_result.confidence,
            'text_length': len(gv_result.text),
            'quality_score': gv_result.quality_score,
            'processing_time': gv_result.processing_time,
            'structured_data_count': len(gv_result.structured_data)
        }
    
    # Test EasyOCR (if available)
    if "easyocr" in processor.available_engines:
        logger.info("Testing EasyOCR...")
        easy_result = processor.easyocr_ocr(image)
        results['easyocr'] = {
            'confidence': easy_result.confidence,
            'text_length': len(easy_result.text),
            'quality_score': easy_result.quality_score,
            'processing_time': easy_result.processing_time,
            'structured_data_count': len(easy_result.structured_data)
        }
    
    # Test PaddleOCR (if available)
    if "paddleocr" in processor.available_engines:
        logger.info("Testing PaddleOCR...")
        paddle_result = processor.paddleocr_ocr(image)
        results['paddleocr'] = {
            'confidence': paddle_result.confidence,
            'text_length': len(paddle_result.text),
            'quality_score': paddle_result.quality_score,
            'processing_time': paddle_result.processing_time,
            'structured_data_count': len(paddle_result.structured_data)
        }
    
    return results

def test_combined_processing(processor, image_path):
    """Test the combined multi-technology processing"""
    logger.info("=== Testing Combined Multi-Technology Processing ===")
    
    start_time = time.time()
    
    # Process with parallel execution
    result_parallel = processor.process_document(image_path, use_parallel=True)
    parallel_time = time.time() - start_time
    
    start_time = time.time()
    
    # Process with sequential execution
    result_sequential = processor.process_document(image_path, use_parallel=False)
    sequential_time = time.time() - start_time
    
    return {
        'parallel': {
            'result': result_parallel,
            'total_time': parallel_time
        },
        'sequential': {
            'result': result_sequential,
            'total_time': sequential_time
        }
    }

def print_results_summary(individual_results, combined_results):
    """Print a comprehensive summary of results"""
    print("\n" + "="*80)
    print("ENHANCED MULTI-TECHNOLOGY OCR SYSTEM - TEST RESULTS")
    print("="*80)
    
    # Individual engine results
    print("\n📊 INDIVIDUAL ENGINE PERFORMANCE:")
    print("-" * 50)
    for engine, metrics in individual_results.items():
        print(f"\n🔧 {engine.upper()}:")
        print(f"   Confidence: {metrics['confidence']:.3f}")
        print(f"   Quality Score: {metrics['quality_score']:.3f}")
        print(f"   Text Length: {metrics['text_length']} chars")
        print(f"   Processing Time: {metrics['processing_time']:.3f}s")
        print(f"   Structured Data: {metrics['structured_data_count']} fields")
    
    # Combined results comparison
    print(f"\n🚀 COMBINED PROCESSING COMPARISON:")
    print("-" * 50)
    
    parallel_result = combined_results['parallel']['result']
    sequential_result = combined_results['sequential']['result']
    
    print(f"\n⚡ PARALLEL PROCESSING:")
    print(f"   Final Confidence: {parallel_result['final_result']['confidence']:.3f}")
    print(f"   Quality Score: {parallel_result['final_result']['quality_score']:.3f}")
    print(f"   Total Time: {combined_results['parallel']['total_time']:.3f}s")
    print(f"   Methods Used: {parallel_result['comparison']['methods_used']}")
    print(f"   Successful Methods: {parallel_result['comparison']['successful_methods']}")
    
    print(f"\n🔄 SEQUENTIAL PROCESSING:")
    print(f"   Final Confidence: {sequential_result['final_result']['confidence']:.3f}")
    print(f"   Quality Score: {sequential_result['final_result']['quality_score']:.3f}")
    print(f"   Total Time: {combined_results['sequential']['total_time']:.3f}s")
    print(f"   Methods Used: {sequential_result['comparison']['methods_used']}")
    print(f"   Successful Methods: {sequential_result['comparison']['successful_methods']}")
    
    # Performance comparison
    speedup = combined_results['sequential']['total_time'] / combined_results['parallel']['total_time']
    print(f"\n⚡ PERFORMANCE GAIN:")
    print(f"   Parallel Speedup: {speedup:.2f}x faster")
    
    # Best result details
    best_result = parallel_result['final_result']
    print(f"\n🏆 BEST RESULT DETAILS:")
    print(f"   Method: {best_result['method_used']}")
    print(f"   Language: {best_result['language_detected']}")
    print(f"   Word Count: {best_result['word_count']}")
    print(f"   Character Count: {best_result['character_count']}")
    print(f"   Structured Data Fields: {len(best_result['structured_data'])}")
    
    if best_result['structured_data']:
        print(f"\n📋 EXTRACTED STRUCTURED DATA:")
        for key, value in best_result['structured_data'].items():
            print(f"   {key}: {value}")

def main():
    """Main test function"""
    logger.info("Starting Enhanced Multi-Technology OCR System Test")
    
    # Initialize the processor
    processor = CombinedOCRProcessor()
    
    print(f"\n🔧 Available OCR Engines: {processor.available_engines}")
    
    # Create or use existing test image
    test_image_path = "test_czech_invoice.png"
    if not os.path.exists(test_image_path):
        test_image_path = create_test_image()
    
    # Test individual engines
    individual_results = test_individual_engines(processor, test_image_path)
    
    # Test combined processing
    combined_results = test_combined_processing(processor, test_image_path)
    
    # Print comprehensive summary
    print_results_summary(individual_results, combined_results)
    
    # Save detailed results to JSON
    detailed_results = {
        'individual_engines': individual_results,
        'combined_processing': combined_results,
        'available_engines': processor.available_engines,
        'test_image': test_image_path
    }
    
    with open('enhanced_ocr_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(detailed_results, f, indent=2, ensure_ascii=False, default=str)
    
    logger.info("Test completed. Detailed results saved to 'enhanced_ocr_test_results.json'")
    
    print(f"\n✅ Test completed successfully!")
    print(f"📄 Detailed results saved to: enhanced_ocr_test_results.json")

if __name__ == "__main__":
    main()
