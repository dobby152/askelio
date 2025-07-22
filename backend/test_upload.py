#!/usr/bin/env python3
"""
Test upload endpoint
"""

import requests
from PIL import Image, ImageDraw, ImageFont

def create_test_image():
    """Create a simple test image"""
    img = Image.new('RGB', (400, 300), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", 24)
    except:
        font = ImageFont.load_default()
    
    draw.text((50, 50), "TEST INVOICE", fill='black', font=font)
    draw.text((50, 100), "Amount: $123.45", fill='black', font=font)
    draw.text((50, 150), "Date: 2024-07-21", fill='black', font=font)
    
    img.save('test_upload_image.png')
    return 'test_upload_image.png'

def test_upload():
    """Test the upload endpoint"""
    # Create test image
    image_path = create_test_image()
    
    try:
        # Test fast upload
        with open(image_path, 'rb') as f:
            files = {'file': ('test_invoice.png', f, 'image/png')}
            response = requests.post('http://localhost:8000/documents/upload-fast', files=files)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Upload test successful!")
        else:
            print("❌ Upload test failed!")
            
    except Exception as e:
        print(f"❌ Upload test error: {e}")
    
    # Clean up
    import os
    if os.path.exists(image_path):
        os.remove(image_path)

if __name__ == "__main__":
    test_upload()
