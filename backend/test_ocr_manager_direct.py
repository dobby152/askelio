#!/usr/bin/env python3
"""
Test OCR Manager directly with the real PDF
"""
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def test_ocr_manager_with_pdf():
    """Test OCR Manager with real PDF file"""
    try:
        from ocr_manager import OCRManager
        
        print("🔄 Initializing OCR Manager...")
        ocr_manager = OCRManager()
        
        print(f"✅ OCR Manager initialized")
        print(f"📋 Available providers: {ocr_manager.get_available_providers()}")
        print(f"📊 Provider status: {ocr_manager.get_provider_status()}")
        
        # Path to real PDF
        pdf_path = r"C:\Users\askelatest\Downloads\Zálohová_faktura_250800001.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"❌ PDF file not found: {pdf_path}")
            return False
            
        print(f"📄 Processing PDF: {pdf_path}")

        # Test with the OCR manager's process_image_with_structuring method
        result = ocr_manager.process_image_with_structuring(pdf_path, "invoice")
        
        print(f"📊 OCR Result:")
        print(f"   Success: {result.get('success', False)}")
        print(f"   Provider: {result.get('provider', 'unknown')}")
        print(f"   Confidence: {result.get('confidence', 0.0)}")
        print(f"   Processing time: {result.get('processing_time', 0.0):.2f}s")
        
        if result.get('success', False):
            text = result.get('raw_text', '')
            print(f"   Text length: {len(text)} characters")
            print(f"📝 First 500 characters:")
            print(f"'{text[:500].strip()}...'")
            
            # Check structured data
            structured_data = result.get('structured_data')
            if structured_data:
                print(f"📋 Structured data available: {type(structured_data)}")
                print(f"   Fields extracted: {result.get('fields_extracted', [])}")
            else:
                print(f"📋 No structured data extracted")
                
            return True
        else:
            error = result.get('error', 'Unknown error')
            print(f"❌ OCR failed: {error}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_ocr_manager_providers():
    """Test OCR Manager provider initialization"""
    try:
        from ocr_manager import OCRManager
        
        print("🔄 Testing OCR Manager provider initialization...")
        ocr_manager = OCRManager()
        
        # Check Google Vision specifically
        if 'google_vision' in ocr_manager.available_providers:
            print("✅ Google Vision provider available")
            
            # Try to access the provider directly
            google_client = ocr_manager.providers.get('google_vision')
            if google_client:
                print("✅ Google Vision client initialized")
                
                # Test with a simple image
                from PIL import Image, ImageDraw
                import io
                
                # Create a test image
                img = Image.new('RGB', (400, 200), color='white')
                draw = ImageDraw.Draw(img)
                draw.text((50, 50), "Test Invoice 12345", fill='black')
                draw.text((50, 80), "Amount: 1000 CZK", fill='black')
                
                # Save to bytes
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='PNG')
                img_content = img_byte_arr.getvalue()
                
                # Test with Google Vision directly
                from google.cloud import vision
                image = vision.Image(content=img_content)
                response = google_client.document_text_detection(image=image)
                
                if response.error.message:
                    print(f"❌ Google Vision test failed: {response.error.message}")
                else:
                    text = response.full_text_annotation.text if response.full_text_annotation else ""
                    print(f"✅ Google Vision test successful: '{text.strip()}'")
                    
            else:
                print("❌ Google Vision client not initialized")
        else:
            print("❌ Google Vision provider not available")
            
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Testing OCR Manager ===")
    
    print("\n1. Testing provider initialization...")
    test_ocr_manager_providers()
    
    print("\n2. Testing with real PDF...")
    test_ocr_manager_with_pdf()
