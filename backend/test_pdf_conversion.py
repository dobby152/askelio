#!/usr/bin/env python3
"""
Test PDF conversion for Google Vision API
"""

import os
import sys
import tempfile
from PIL import Image, ImageDraw, ImageFont
import fitz  # PyMuPDF

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ocr_manager import OCRManager

def create_test_pdf():
    """Create a simple test PDF with text"""
    # Create a simple image first
    img = Image.new('RGB', (600, 400), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font_large = ImageFont.truetype("arial.ttf", 28)
        font_medium = ImageFont.truetype("arial.ttf", 20)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
    
    # Draw invoice content
    draw.text((50, 50), "FAKTURA", fill='black', font=font_large)
    draw.text((50, 100), "Číslo: FAK-2024-TEST", fill='black', font=font_medium)
    draw.text((50, 130), "Datum: 21.07.2024", fill='black', font=font_medium)
    draw.text((50, 160), "Dodavatel: Test s.r.o.", fill='black', font=font_medium)
    draw.text((50, 190), "Odběratel: Zákazník a.s.", fill='black', font=font_medium)
    draw.text((50, 250), "Položka: Testovací služba", fill='black', font=font_medium)
    draw.text((50, 280), "Cena: 1 234,56 Kč", fill='black', font=font_medium)
    draw.text((50, 320), "Celkem k úhradě: 1 234,56 Kč", fill='black', font=font_large)
    
    # Save as temporary image
    temp_img_path = tempfile.mktemp(suffix='.png')
    img.save(temp_img_path)
    
    # Convert image to PDF using PyMuPDF
    pdf_path = tempfile.mktemp(suffix='.pdf')
    
    # Create PDF from image
    pdf_document = fitz.open()
    page = pdf_document.new_page(width=600, height=400)
    
    # Insert image into PDF
    page.insert_image(fitz.Rect(0, 0, 600, 400), filename=temp_img_path)
    
    # Save PDF
    pdf_document.save(pdf_path)
    pdf_document.close()
    
    # Clean up temp image
    os.remove(temp_img_path)
    
    print(f"Created test PDF: {pdf_path}")
    return pdf_path

def test_pdf_processing():
    """Test PDF processing with Google Vision API"""
    print("🔧 Testing PDF processing with Google Vision API")
    print("=" * 60)
    
    # Create test PDF
    pdf_path = create_test_pdf()
    
    try:
        # Initialize OCR Manager
        ocr_manager = OCRManager()
        
        # Test Google Vision API with PDF
        print("\n📄 Testing Google Vision API with PDF...")
        result = ocr_manager._process_with_provider('google_vision', pdf_path)
        
        print(f"Success: {result.success}")
        print(f"Confidence: {result.confidence}")
        print(f"Processing time: {result.processing_time:.2f}s")
        print(f"Error message: {result.error_message}")
        
        if result.success:
            print(f"Extracted text ({len(result.text)} chars):")
            print("-" * 40)
            print(result.text)
            print("-" * 40)
        
        # Test with regular upload endpoint
        print("\n🌐 Testing upload endpoint...")
        import requests
        
        with open(pdf_path, 'rb') as f:
            files = {'file': ('test_invoice.pdf', f, 'application/pdf')}
            response = requests.post('http://localhost:8000/documents/upload', files=files)
        
        print(f"Upload status: {response.status_code}")
        if response.status_code == 200:
            upload_result = response.json()
            print(f"Upload result: {upload_result}")
        else:
            print(f"Upload error: {response.text}")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
            print(f"\n🧹 Cleaned up: {pdf_path}")

if __name__ == "__main__":
    test_pdf_processing()
