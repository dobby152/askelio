#!/usr/bin/env python3
"""
Demo script for Enhanced Multi-Technology OCR System
Shows the capabilities without requiring all cloud dependencies
"""

import cv2
import numpy as np
import pytesseract
from PIL import Image, ImageDraw, ImageFont
import time
import json
from typing import Dict, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_demo_invoice():
    """Create a demo invoice image for testing"""
    # Create a white image
    width, height = 800, 600
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Try to use a default font
    try:
        font = ImageFont.truetype("arial.ttf", 14)
        title_font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()
    
    # Sample Czech invoice text
    invoice_lines = [
        "FAKTURA č. 2025001",
        "",
        "Dodavatel: ABC s.r.o.",
        "Adresa: Hlavní 123, 110 00 Praha 1",
        "IČO: 12345678, DIČ: CZ12345678",
        "",
        "Odběratel: XYZ spol. s r.o.",
        "Adresa: Nová 456, 120 00 Praha 2",
        "IČO: 87654321",
        "",
        "Datum vystavení: 15.01.2025",
        "Datum splatnosti: 15.02.2025",
        "Variabilní symbol: 2025001",
        "",
        "Položka                    Množství    Cena/ks    Celkem",
        "─────────────────────────────────────────────────────────",
        "Konzultační služby         10 hod      1,500 Kč   15,000 Kč",
        "DPH 21%                                           3,150 Kč",
        "─────────────────────────────────────────────────────────",
        "CELKEM K ÚHRADĚ:                                  18,150 Kč"
    ]
    
    # Draw the invoice
    y_position = 50
    for i, line in enumerate(invoice_lines):
        if i == 0:  # Title
            draw.text((50, y_position), line, fill='black', font=title_font)
        else:
            draw.text((50, y_position), line, fill='black', font=font)
        y_position += 25
    
    # Add some noise to make it more realistic
    img_array = np.array(image)
    noise = np.random.normal(0, 5, img_array.shape).astype(np.uint8)
    img_array = np.clip(img_array + noise, 0, 255)
    
    # Save the image
    demo_image = Image.fromarray(img_array)
    demo_image.save("demo_invoice.png")
    logger.info("Created demo invoice: demo_invoice.png")
    
    return "demo_invoice.png"

def enhanced_tesseract_processing(image_path: str) -> Dict:
    """Demonstrate enhanced Tesseract processing with multiple configurations"""
    logger.info("=== Enhanced Tesseract Processing ===")
    
    image = cv2.imread(image_path)
    results = {}
    
    # Different Tesseract configurations
    configs = [
        ("Default", "", ""),
        ("PSM 6 - Uniform block", "--psm 6", ""),
        ("PSM 8 - Single word", "--psm 8", ""),
        ("PSM 13 - Raw line", "--psm 13", ""),
        ("OEM 3 - Default", "--oem 3", ""),
        ("Enhanced", "--psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ.,:-/ ", "")
    ]
    
    for name, config, lang_config in configs:
        try:
            start_time = time.time()
            
            # Convert to PIL Image
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            
            # Extract text
            text = pytesseract.image_to_string(pil_image, config=config, lang='ces+eng')
            
            # Get confidence data
            data = pytesseract.image_to_data(pil_image, config=config, lang='ces+eng', output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = np.mean(confidences) / 100.0 if confidences else 0.0
            
            processing_time = time.time() - start_time
            
            # Extract structured data
            structured_data = extract_invoice_data(text)
            
            results[name] = {
                'text': text.strip(),
                'confidence': avg_confidence,
                'processing_time': processing_time,
                'text_length': len(text.strip()),
                'word_count': len(text.split()),
                'structured_data': structured_data,
                'config': config
            }
            
            logger.info(f"{name}: confidence={avg_confidence:.3f}, time={processing_time:.3f}s")
            
        except Exception as e:
            logger.error(f"Error with {name}: {e}")
            results[name] = {'error': str(e)}
    
    return results

def extract_invoice_data(text: str) -> Dict:
    """Extract structured data from invoice text"""
    import re
    
    structured_data = {}
    
    # Patterns for Czech invoices
    patterns = {
        'invoice_number': r'(?:faktura|invoice)[\s\w]*?č\.?\s*([A-Z0-9\-/]+)',
        'date_issued': r'(?:datum vystavení|date issued)[\s:]*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})',
        'date_due': r'(?:datum splatnosti|due date)[\s:]*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})',
        'total_amount': r'(?:celkem k úhradě|total)[\s:]*(\d+[,.]?\d*)\s*kč',
        'ico_supplier': r'(?:dodavatel[\s\S]*?ičo|supplier[\s\S]*?ico)[\s:]*(\d{8})',
        'ico_customer': r'(?:odběratel[\s\S]*?ičo|customer[\s\S]*?ico)[\s:]*(\d{8})',
        'variable_symbol': r'(?:variabilní symbol|variable symbol)[\s:]*(\d+)',
        'vat_amount': r'(?:dph|vat)[\s\d%]*?(\d+[,.]?\d*)\s*kč'
    }
    
    text_lower = text.lower()
    
    for key, pattern in patterns.items():
        matches = re.findall(pattern, text_lower, re.IGNORECASE | re.MULTILINE)
        if matches:
            structured_data[key] = matches[0] if isinstance(matches[0], str) else matches[0][0]
    
    return structured_data

def image_preprocessing_demo(image_path: str) -> Dict:
    """Demonstrate different image preprocessing techniques"""
    logger.info("=== Image Preprocessing Demo ===")
    
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    preprocessing_methods = {}
    
    # 1. Original
    preprocessing_methods['original'] = gray
    
    # 2. Gaussian Blur + Threshold
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh1 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    preprocessing_methods['gaussian_otsu'] = thresh1
    
    # 3. Adaptive Threshold
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    preprocessing_methods['adaptive'] = adaptive
    
    # 4. Morphological Operations
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    morph = cv2.morphologyEx(adaptive, cv2.MORPH_CLOSE, kernel)
    preprocessing_methods['morphological'] = morph
    
    # 5. Denoising
    denoised = cv2.fastNlMeansDenoising(gray)
    preprocessing_methods['denoised'] = denoised
    
    # Test each preprocessing method with Tesseract
    results = {}
    
    for method_name, processed_image in preprocessing_methods.items():
        try:
            start_time = time.time()
            
            pil_image = Image.fromarray(processed_image)
            text = pytesseract.image_to_string(pil_image, lang='ces+eng')
            
            # Get confidence
            data = pytesseract.image_to_data(pil_image, lang='ces+eng', output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = np.mean(confidences) / 100.0 if confidences else 0.0
            
            processing_time = time.time() - start_time
            
            results[method_name] = {
                'confidence': avg_confidence,
                'text_length': len(text.strip()),
                'processing_time': processing_time,
                'word_count': len(text.split()),
                'structured_data_count': len(extract_invoice_data(text))
            }
            
            # Save processed image for inspection
            cv2.imwrite(f"processed_{method_name}.png", processed_image)
            
            logger.info(f"{method_name}: confidence={avg_confidence:.3f}")
            
        except Exception as e:
            logger.error(f"Error with {method_name}: {e}")
            results[method_name] = {'error': str(e)}
    
    return results

def print_comprehensive_results(tesseract_results: Dict, preprocessing_results: Dict):
    """Print comprehensive results analysis"""
    print("\n" + "="*80)
    print("🚀 ENHANCED MULTI-TECHNOLOGY OCR SYSTEM DEMONSTRATION")
    print("="*80)
    
    # Tesseract configuration results
    print("\n📊 TESSERACT CONFIGURATION COMPARISON:")
    print("-" * 60)
    
    best_tesseract = None
    best_confidence = 0
    
    for config, result in tesseract_results.items():
        if 'error' not in result:
            confidence = result['confidence']
            if confidence > best_confidence:
                best_confidence = confidence
                best_tesseract = config
            
            print(f"\n🔧 {config}:")
            print(f"   Confidence: {confidence:.3f}")
            print(f"   Processing Time: {result['processing_time']:.3f}s")
            print(f"   Text Length: {result['text_length']} chars")
            print(f"   Word Count: {result['word_count']} words")
            print(f"   Structured Fields: {len(result['structured_data'])}")
            print(f"   Config: {result['config'] or 'default'}")
    
    # Preprocessing results
    print(f"\n🖼️  IMAGE PREPROCESSING COMPARISON:")
    print("-" * 60)
    
    best_preprocessing = None
    best_prep_confidence = 0
    
    for method, result in preprocessing_results.items():
        if 'error' not in result:
            confidence = result['confidence']
            if confidence > best_prep_confidence:
                best_prep_confidence = confidence
                best_preprocessing = method
            
            print(f"\n🎨 {method.upper()}:")
            print(f"   Confidence: {confidence:.3f}")
            print(f"   Processing Time: {result['processing_time']:.3f}s")
            print(f"   Text Length: {result['text_length']} chars")
            print(f"   Word Count: {result['word_count']} words")
            print(f"   Structured Fields: {result['structured_data_count']}")
    
    # Best results summary
    print(f"\n🏆 BEST RESULTS SUMMARY:")
    print("-" * 60)
    print(f"🥇 Best Tesseract Config: {best_tesseract} (confidence: {best_confidence:.3f})")
    print(f"🥇 Best Preprocessing: {best_preprocessing} (confidence: {best_prep_confidence:.3f})")
    
    # Show structured data from best result
    if best_tesseract and tesseract_results[best_tesseract]['structured_data']:
        print(f"\n📋 EXTRACTED STRUCTURED DATA (from {best_tesseract}):")
        print("-" * 60)
        for key, value in tesseract_results[best_tesseract]['structured_data'].items():
            print(f"   {key.replace('_', ' ').title()}: {value}")
    
    # Performance insights
    print(f"\n💡 PERFORMANCE INSIGHTS:")
    print("-" * 60)
    
    # Calculate averages
    valid_tesseract = [r for r in tesseract_results.values() if 'error' not in r]
    valid_preprocessing = [r for r in preprocessing_results.values() if 'error' not in r]
    
    if valid_tesseract:
        avg_confidence = np.mean([r['confidence'] for r in valid_tesseract])
        avg_time = np.mean([r['processing_time'] for r in valid_tesseract])
        print(f"   Average Tesseract Confidence: {avg_confidence:.3f}")
        print(f"   Average Processing Time: {avg_time:.3f}s")
    
    if valid_preprocessing:
        prep_avg_confidence = np.mean([r['confidence'] for r in valid_preprocessing])
        improvement = (best_prep_confidence - avg_confidence) / avg_confidence * 100 if avg_confidence > 0 else 0
        print(f"   Preprocessing Improvement: {improvement:.1f}%")
    
    print(f"\n✅ Demonstration completed successfully!")
    print(f"📁 Processed images saved as: processed_*.png")

def main():
    """Main demonstration function"""
    logger.info("Starting Enhanced Multi-Technology OCR Demonstration")
    
    # Create demo invoice
    image_path = create_demo_invoice()
    
    # Test different Tesseract configurations
    tesseract_results = enhanced_tesseract_processing(image_path)
    
    # Test different preprocessing methods
    preprocessing_results = image_preprocessing_demo(image_path)
    
    # Print comprehensive results
    print_comprehensive_results(tesseract_results, preprocessing_results)
    
    # Save results to JSON
    all_results = {
        'tesseract_configurations': tesseract_results,
        'preprocessing_methods': preprocessing_results,
        'demo_image': image_path,
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    with open('enhanced_ocr_demo_results.json', 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False, default=str)
    
    logger.info("Demo completed. Results saved to 'enhanced_ocr_demo_results.json'")

if __name__ == "__main__":
    main()
