#!/usr/bin/env python3
"""
Test Google Vision API directly with real PDF
"""
import os
from dotenv import load_dotenv

load_dotenv()

def test_google_vision_with_pdf():
    """Test Google Vision API with PDF"""
    try:
        from google.cloud import vision

        # Get API key
        api_key = os.getenv('GOOGLE_VISION_API_KEY') or os.getenv('GOOGLE_API_KEY')
        print(f"API Key found: {bool(api_key)}")

        if not api_key:
            print("❌ No API key found")
            return False

        # Initialize client
        client = vision.ImageAnnotatorClient(client_options={"api_key": api_key})
        print("✅ Client initialized")

        # Create a simple test PDF content
        test_pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Invoice 12345) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000206 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF"""

        # Test with PDF content
        image = vision.Image(content=test_pdf_content)
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

if __name__ == "__main__":
    test_google_vision_with_pdf()
