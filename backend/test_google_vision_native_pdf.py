#!/usr/bin/env python3
"""
Test Google Vision API with native PDF support
"""
import os
from dotenv import load_dotenv

load_dotenv()

def test_google_vision_native_pdf():
    """Test Google Vision API with native PDF support"""
    try:
        from google.cloud import vision
        import base64

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

        # Read PDF file
        with open(pdf_path, 'rb') as pdf_file:
            pdf_content = pdf_file.read()
            
        print(f"✅ PDF loaded ({len(pdf_content)} bytes)")

        # Try Google Vision's native PDF support
        # Method 1: Using Document with PDF mime type
        try:
            print("🔄 Trying native PDF support...")
            
            # Create document object for PDF
            document = vision.Document(content=pdf_content, mime_type='application/pdf')
            
            # Use document_text_detection for PDF
            response = client.document_text_detection(document=document)

            if response.error.message:
                print(f"❌ Google Vision error: {response.error.message}")
                return False

            text = response.full_text_annotation.text if response.full_text_annotation else ""
            print(f"✅ Google Vision native PDF support working!")
            print(f"📝 Extracted text length: {len(text)} characters")
            print(f"📝 First 500 characters:")
            print(f"'{text[:500].strip()}...'")
            return True
            
        except Exception as e:
            print(f"❌ Native PDF support failed: {e}")
            
        # Method 2: Try with Image object (might work for some PDFs)
        try:
            print("🔄 Trying PDF as image...")
            
            image = vision.Image(content=pdf_content)
            response = client.document_text_detection(image=image)

            if response.error.message:
                print(f"❌ Google Vision error: {response.error.message}")
                return False

            text = response.full_text_annotation.text if response.full_text_annotation else ""
            print(f"✅ Google Vision PDF as image working!")
            print(f"📝 Extracted text length: {len(text)} characters")
            print(f"📝 First 500 characters:")
            print(f"'{text[:500].strip()}...'")
            return True
            
        except Exception as e:
            print(f"❌ PDF as image failed: {e}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_google_vision_with_base64_pdf():
    """Test Google Vision API with base64 encoded PDF"""
    try:
        from google.cloud import vision
        import base64

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
            
        print(f"📄 Processing PDF with base64: {pdf_path}")

        # Read and encode PDF file
        with open(pdf_path, 'rb') as pdf_file:
            pdf_content = pdf_file.read()
            pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
            
        print(f"✅ PDF encoded to base64 ({len(pdf_base64)} characters)")

        # Try with base64 content
        try:
            print("🔄 Trying base64 PDF...")
            
            # Create image with base64 content
            image = vision.Image(content=base64.b64decode(pdf_base64))
            response = client.document_text_detection(image=image)

            if response.error.message:
                print(f"❌ Google Vision error: {response.error.message}")
                return False

            text = response.full_text_annotation.text if response.full_text_annotation else ""
            print(f"✅ Google Vision base64 PDF working!")
            print(f"📝 Extracted text length: {len(text)} characters")
            print(f"📝 First 500 characters:")
            print(f"'{text[:500].strip()}...'")
            return True
            
        except Exception as e:
            print(f"❌ Base64 PDF failed: {e}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Testing Google Vision API with native PDF support ===")
    
    print("\n1. Testing native PDF support...")
    success1 = test_google_vision_native_pdf()
    
    if not success1:
        print("\n2. Testing base64 PDF approach...")
        success2 = test_google_vision_with_base64_pdf()
        
        if not success2:
            print("\n❌ All PDF methods failed. The issue might be:")
            print("   - PDF format not supported by Google Vision")
            print("   - PDF is image-based and needs conversion to image first")
            print("   - PDF is corrupted or encrypted")
    else:
        print("\n✅ Native PDF support working!")
