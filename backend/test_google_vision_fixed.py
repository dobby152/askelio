#!/usr/bin/env python3
"""
Test Google Vision API with proper image handling and real PDF
"""
import os
from dotenv import load_dotenv

load_dotenv()

def test_google_vision_with_image():
    """Test Google Vision API with a simple image"""
    try:
        from google.cloud import vision
        from PIL import Image, ImageDraw, ImageFont
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

        # Create a simple test image with text
        img = Image.new('RGB', (400, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Add some text to the image
        try:
            # Try to use a default font
            font = ImageFont.load_default()
        except:
            font = None
            
        draw.text((50, 50), "Test Invoice", fill='black', font=font)
        draw.text((50, 80), "Amount: 1000 CZK", fill='black', font=font)
        draw.text((50, 110), "Date: 2025-01-29", fill='black', font=font)
        
        # Convert to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_content = img_byte_arr.getvalue()

        # Test with image content
        image = vision.Image(content=img_content)
        response = client.document_text_detection(image=image)

        if response.error.message:
            print(f"❌ Google Vision error: {response.error.message}")
            return False

        text = response.full_text_annotation.text if response.full_text_annotation else ""
        print(f"✅ Google Vision API working! Extracted text: '{text.strip()}'")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_google_vision_with_real_pdf():
    """Test Google Vision API with real PDF file"""
    try:
        from google.cloud import vision
        import fitz  # PyMuPDF

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

        # Convert PDF to image using PyMuPDF
        doc = fitz.open(pdf_path)
        page = doc[0]  # Get first page
        
        # Convert to image with good resolution
        mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        
        doc.close()
        print(f"✅ PDF converted to image ({len(img_data)} bytes)")

        # Test with converted image
        image = vision.Image(content=img_data)
        response = client.document_text_detection(image=image)

        if response.error.message:
            print(f"❌ Google Vision error: {response.error.message}")
            return False

        text = response.full_text_annotation.text if response.full_text_annotation else ""
        print(f"✅ Google Vision API working! Extracted text length: {len(text)} characters")
        print(f"📝 First 200 characters: '{text[:200].strip()}...'")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_pdf_to_image_conversion():
    """Test PDF to image conversion functionality"""
    try:
        import fitz  # PyMuPDF
        
        pdf_path = r"C:\Users\askelatest\Downloads\Zálohová_faktura_250800001.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"❌ PDF file not found: {pdf_path}")
            return False
            
        print(f"📄 Testing PDF conversion: {pdf_path}")

        # Test PyMuPDF conversion
        doc = fitz.open(pdf_path)
        print(f"✅ PDF opened successfully, pages: {len(doc)}")
        
        page = doc[0]  # Get first page
        print(f"✅ Page 0 accessed, size: {page.rect}")
        
        # Convert to image with different resolutions
        for zoom in [1.0, 1.5, 2.0]:
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            print(f"✅ Zoom {zoom}x: {len(img_data)} bytes")
        
        doc.close()
        print("✅ PDF to image conversion working correctly")
        return True
        
    except Exception as e:
        print(f"❌ PDF conversion error: {e}")
        return False

if __name__ == "__main__":
    print("=== Testing Google Vision API ===")
    
    print("\n1. Testing with simple image...")
    test_google_vision_with_image()
    
    print("\n2. Testing PDF to image conversion...")
    test_pdf_to_image_conversion()
    
    print("\n3. Testing with real PDF...")
    test_google_vision_with_real_pdf()
