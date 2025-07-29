#!/usr/bin/env python3
"""
Script to check document data in database
"""
import asyncio
from services.document_service import document_service

async def check_documents():
    print("Checking documents in database...")
    result = await document_service.get_user_documents('test-user-id', limit=5)
    
    if result['success']:
        documents = result['data']
        print(f"Found {len(documents)} documents")
        
        for i, doc in enumerate(documents):
            print(f"\nDocument {i+1}:")
            print(f"  Filename: {doc.get('filename', 'Unknown')}")
            print(f"  Status: {doc.get('status')}")
            print(f"  Invoice Direction: {doc.get('invoice_direction')}")
            print(f"  Direction Confidence: {doc.get('direction_confidence')}")
            print(f"  Financial Category: {doc.get('financial_category')}")
            
            structured_data = doc.get('structured_data', {})
            if structured_data:
                print(f"  Structured Data keys: {list(structured_data.keys())}")
                vendor = structured_data.get('vendor', {})
                if vendor:
                    print(f"  Vendor name: {vendor.get('name', 'N/A')}")
            else:
                print("  No structured data")
    else:
        print(f"Error: {result['error']}")

if __name__ == "__main__":
    asyncio.run(check_documents())
