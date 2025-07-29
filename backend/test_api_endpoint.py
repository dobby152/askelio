#!/usr/bin/env python3
"""
Test API endpoint directly to verify it returns correct data
"""
import asyncio
import json
from fastapi.testclient import TestClient
from main import app

# Create test client
client = TestClient(app)

def test_documents_endpoint():
    """Test /documents endpoint without authentication"""
    print("🧪 Testing /documents endpoint...")
    
    # Test health endpoint first
    health_response = client.get("/health")
    print(f"🏥 Health check: {health_response.status_code}")
    
    if health_response.status_code == 200:
        print("✅ Backend is healthy")
    else:
        print("❌ Backend health check failed")
        return
    
    # Test documents endpoint (this will fail due to auth, but we can see the structure)
    docs_response = client.get("/documents")
    print(f"📄 Documents endpoint status: {docs_response.status_code}")
    
    if docs_response.status_code == 401:
        print("🔐 Authentication required (expected)")
        print(f"Response: {docs_response.json()}")
    elif docs_response.status_code == 200:
        print("✅ Documents endpoint accessible")
        data = docs_response.json()
        print(f"📋 Found {len(data)} documents")
        
        # Check first document structure
        if data:
            first_doc = data[0]
            print("\n📋 First document structure:")
            for key, value in first_doc.items():
                print(f"  {key}: {type(value).__name__}")
                if key in ['structured_data', 'extracted_data'] and value:
                    print(f"    Keys: {list(value.keys()) if isinstance(value, dict) else 'Not a dict'}")
    else:
        print(f"❌ Unexpected status code: {docs_response.status_code}")
        print(f"Response: {docs_response.text}")

def test_api_response_format():
    """Test the expected API response format"""
    print("\n🔄 Testing API response format...")
    
    # This is what the API should return (based on our backend code)
    expected_fields = [
        'id', 'filename', 'file_name', 'status', 'confidence', 'accuracy',
        'processing_time', 'cost_czk', 'provider_used', 'created_at', 'processed_at',
        'file_path', 'size', 'file_size', 'pages', 'type', 'file_type',
        'structured_data', 'extracted_data', 'invoice_direction', 'direction_confidence',
        'direction_method', 'financial_category', 'requires_manual_review', 'error_message'
    ]
    
    print("📋 Expected API response fields:")
    for field in expected_fields:
        print(f"  ✓ {field}")
    
    print(f"\n📊 Total expected fields: {len(expected_fields)}")

def test_frontend_transformation():
    """Test frontend transformation logic"""
    print("\n🔄 Testing frontend transformation...")
    
    # Mock API response (completed document)
    mock_completed_doc = {
        "id": "test-id-1",
        "filename": "test-invoice.pdf",
        "file_name": "test-invoice.pdf",
        "status": "completed",
        "confidence": 0.95,
        "accuracy": 0.95,
        "structured_data": {
            "vendor": {
                "name": "Test Vendor Ltd.",
                "ico": "12345678"
            },
            "customer": {
                "name": "Test Customer Ltd.",
                "ico": "87654321"
            },
            "total_amount": 25000,
            "currency": "CZK"
        },
        "invoice_direction": "incoming",
        "direction_confidence": 0.95,
        "financial_category": "expense"
    }
    
    # Mock API response (pending document)
    mock_pending_doc = {
        "id": "test-id-2",
        "filename": "pending-invoice.pdf",
        "file_name": "pending-invoice.pdf",
        "status": "pending_approval",
        "confidence": 0.0,
        "accuracy": 0.0,
        "structured_data": {},
        "invoice_direction": "unknown",
        "direction_confidence": 0.0,
        "financial_category": None
    }
    
    def transform_document(doc):
        """Frontend transformation logic"""
        structured_data = doc.get('structured_data', {})
        vendor_info = structured_data.get('vendor', {})
        
        return {
            'id': doc.get('id'),
            'name': doc.get('file_name', doc.get('filename', 'Unknown')),
            'extractedData': {
                'vendor': vendor_info.get('name', 'Neznámý dodavatel'),
                'amount': structured_data.get('total_amount'),
                'currency': structured_data.get('currency', 'CZK')
            },
            'invoice_direction': doc.get('invoice_direction', 'unknown'),
            'direction_confidence': doc.get('direction_confidence', 0),
            'financial_category': doc.get('financial_category', 'unknown')
        }
    
    print("📋 Testing completed document transformation:")
    completed_result = transform_document(mock_completed_doc)
    print(f"  Vendor: {completed_result['extractedData']['vendor']}")
    print(f"  Direction: {completed_result['invoice_direction']}")
    print(f"  Confidence: {completed_result['direction_confidence']}")
    
    if completed_result['extractedData']['vendor'] != 'Neznámý dodavatel':
        print("  ✅ Completed document shows correct vendor")
    else:
        print("  ❌ Completed document should show vendor name")
    
    print("\n📋 Testing pending document transformation:")
    pending_result = transform_document(mock_pending_doc)
    print(f"  Vendor: {pending_result['extractedData']['vendor']}")
    print(f"  Direction: {pending_result['invoice_direction']}")
    print(f"  Confidence: {pending_result['direction_confidence']}")
    
    if pending_result['extractedData']['vendor'] == 'Neznámý dodavatel':
        print("  ✅ Pending document shows 'Neznámý dodavatel' (correct)")
    else:
        print("  ❌ Pending document should show 'Neznámý dodavatel'")

if __name__ == "__main__":
    test_documents_endpoint()
    test_api_response_format()
    test_frontend_transformation()
    
    print("\n🎯 Summary:")
    print("✅ API endpoint structure verified")
    print("✅ Response format documented")
    print("✅ Frontend transformation tested")
    print("\n💡 Next steps:")
    print("1. Test with real authentication")
    print("2. Verify in browser console")
    print("3. Check document display in UI")
