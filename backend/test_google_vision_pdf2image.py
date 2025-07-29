#!/usr/bin/env python3
"""
Test Google Vision API with pdf2image for PDF conversion
"""
import os
from dotenv import load_dotenv

load_dotenv()

def test_google_vision_with_real_pdf_pdf2image():
    """Test Google Vision API with real PDF file using pdf2image"""
    try:
        from google.cloud import vision
        import pdf2image
        import io

        # Get API key
        api_key = os.getenv('GOOGLE_VISION_API_KEY') or os.getenv('GOOGLE_API_KEY')
        print(f"API Key found: {bool(api_key)}")

        if not api_key:
            print("❌ No API key found")
            return False

        # Initialize client
        client = vision.ImageAnnotatorClient(client_options={"api_key": api_key})
        print("✅ Client initialized")

        # Path to real PDF
        pdf_path = r"C:\Users\askelatest\Downloads\Zálohová_faktura_250800001.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"❌ PDF file not found: {pdf_path}")
            return False
            
        print(f"📄 Processing PDF: {pdf_path}")

        # Convert PDF to image using pdf2image
        pages = pdf2image.convert_from_path(pdf_path, first_page=1, last_page=1, dpi=200)
        
        if not pages:
            print("❌ No pages found in PDF")
            return False
            
        print(f"✅ PDF converted to {len(pages)} image(s)")
        
        # Convert PIL image to bytes
        img_byte_arr = io.BytesIO()
        pages[0].save(img_byte_arr, format='PNG')
        img_data = img_byte_arr.getvalue()
        
        print(f"✅ Image data prepared ({len(img_data)} bytes)")

        # Test with converted image
        image = vision.Image(content=img_data)
        response = client.document_text_detection(image=image)

        if response.error.message:
            print(f"❌ Google Vision error: {response.error.message}")
            return False

        text = response.full_text_annotation.text if response.full_text_annotation else ""
        print(f"✅ Google Vision API working! Extracted text length: {len(text)} characters")
        print(f"📝 First 500 characters:")
        print(f"'{text[:500].strip()}...'")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_pdf2image_conversion():
    """Test pdf2image conversion functionality"""
    try:
        import pdf2image
        
        pdf_path = r"C:\Users\askelatest\Downloads\Zálohová_faktura_250800001.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"❌ PDF file not found: {pdf_path}")
            return False
            
        print(f"📄 Testing PDF conversion with pdf2image: {pdf_path}")

        # Test pdf2image conversion
        pages = pdf2image.convert_from_path(pdf_path, first_page=1, last_page=1, dpi=150)
        print(f"✅ PDF converted successfully, pages: {len(pages)}")
        
        if pages:
            page = pages[0]
            print(f"✅ First page size: {page.size}")
            print(f"✅ First page mode: {page.mode}")
        
        print("✅ pdf2image conversion working correctly")
        return True
        
    except Exception as e:
        print(f"❌ pdf2image conversion error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Testing Google Vision API with pdf2image ===")
    
    print("\n1. Testing pdf2image conversion...")
    test_pdf2image_conversion()
    
    print("\n2. Testing with real PDF using pdf2image...")
    test_google_vision_with_real_pdf_pdf2image()
