#!/usr/bin/env python3
"""
Test API endpoint for document upload with Supabase
"""
import requests
import tempfile
import os

def test_api_upload():
    """Test document upload via API"""
    
    # Create test file
    test_content = """
    FAKTURA
    Cislo faktury: 2024001
    Datum: 15.01.2024
    Castka: 1500 Kc
    Dodavatel: Test s.r.o.
    """
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(test_content)
        temp_file = f.name
    
    try:
        # Test API endpoint
        url = "http://localhost:8001/api/v1/documents/process"
        
        # Prepare files and data
        with open(temp_file, 'rb') as f:
            files = {'file': ('test_invoice.txt', f, 'text/plain')}
            data = {
                'options': '{"mode": "cost_effective", "store_in_db": true, "user_id": "test-user-123"}'
            }
            
            headers = {
                'Authorization': 'Bearer test-token'
            }
            
            print("🚀 Testing API upload...")
            response = requests.post(url, files=files, data=data, headers=headers, timeout=30)
            
            print(f"📊 Status Code: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
            if response.status_code == 200:
                print("✅ API test successful!")
            else:
                print("❌ API test failed!")
                
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Clean up
        if os.path.exists(temp_file):
            os.unlink(temp_file)

if __name__ == "__main__":
    test_api_upload()
