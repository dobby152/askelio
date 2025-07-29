#!/usr/bin/env python3
"""
Test script to verify API endpoints without authentication
"""
import asyncio
import json
from services.document_service import document_service

async def test_documents_api():
    """Test documents API directly"""
    print("🧪 Testing Documents API...")
    
    # Get a real user ID from database
    from services.supabase_client import get_supabase
    supabase = get_supabase()
    
    try:
        # Get users to find a real user ID
        users_result = supabase.table('users').select('id, email').limit(1).execute()
        
        if users_result.data:
            user_id = users_result.data[0]['id']
            user_email = users_result.data[0]['email']
            print(f"📧 Using user: {user_email} (ID: {user_id})")
            
            # Get documents for this user
            result = await document_service.get_user_documents(str(user_id))
            
            if result['success']:
                documents = result['data']
                print(f"📄 Found {len(documents)} documents")
                
                for i, doc in enumerate(documents[:3]):  # Show first 3 documents
                    print(f"\n📋 Document {i+1}:")
                    print(f"  ID: {doc.get('id')}")
                    print(f"  Filename: {doc.get('filename')}")
                    print(f"  Status: {doc.get('status')}")
                    print(f"  Invoice Direction: {doc.get('invoice_direction')}")
                    print(f"  Direction Confidence: {doc.get('direction_confidence')}")
                    print(f"  Financial Category: {doc.get('financial_category')}")
                    
                    # Check structured data
                    structured_data = doc.get('structured_data', {})
                    if structured_data:
                        print(f"  Structured Data Keys: {list(structured_data.keys())}")
                        
                        vendor = structured_data.get('vendor', {})
                        if vendor:
                            print(f"  Vendor: {vendor.get('name', 'N/A')}")
                        
                        customer = structured_data.get('customer', {})
                        if customer:
                            print(f"  Customer: {customer.get('name', 'N/A')}")
                    else:
                        print("  ⚠️ No structured data")
                
                # Test API response format
                print("\n🔄 Testing API response format...")
                api_response = [
                    {
                        "id": doc.get('id'),
                        "filename": doc.get('filename'),
                        "file_name": doc.get('filename'),
                        "status": doc.get('status'),
                        "confidence": doc.get('confidence_score'),
                        "accuracy": doc.get('confidence_score'),
                        "processing_time": doc.get('processing_time'),
                        "cost_czk": doc.get('processing_cost', 0.0),
                        "provider_used": doc.get('ocr_provider'),
                        "created_at": doc.get('created_at'),
                        "processed_at": doc.get('processed_at'),
                        "file_path": doc.get('file_path'),
                        "size": doc.get('file_size'),
                        "file_size": doc.get('file_size'),
                        "pages": doc.get('pages'),
                        "type": doc.get('file_type'),
                        "file_type": doc.get('file_type'),
                        "structured_data": doc.get('structured_data', {}),
                        "extracted_data": doc.get('structured_data', {}),
                        "invoice_direction": doc.get('invoice_direction'),
                        "direction_confidence": doc.get('direction_confidence'),
                        "direction_method": doc.get('direction_method'),
                        "financial_category": doc.get('financial_category'),
                        "requires_manual_review": doc.get('requires_manual_review', False),
                        "error_message": doc.get('error_message')
                    }
                    for doc in documents[:2]  # Test with first 2 documents
                ]
                
                print(f"✅ API Response format test:")
                for i, doc in enumerate(api_response):
                    print(f"\n📋 Document {i+1} API format:")
                    print(f"  Has structured_data: {bool(doc['structured_data'])}")
                    print(f"  Has invoice_direction: {doc['invoice_direction'] is not None}")
                    print(f"  Vendor in structured_data: {bool(doc['structured_data'].get('vendor'))}")
                    
                    if doc['structured_data'].get('vendor'):
                        vendor_name = doc['structured_data']['vendor'].get('name', 'N/A')
                        print(f"  Vendor name: {vendor_name}")
                
            else:
                print(f"❌ Error: {result['error']}")
        else:
            print("❌ No users found in database")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_documents_api())
