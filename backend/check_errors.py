#!/usr/bin/env python3
import requests
import json

try:
    r = requests.get('http://localhost:8000/documents')
    data = r.json()
    
    print("All documents:")
    for doc in data:
        print(f"- {doc['file_name']}: {doc['status']}")
        if doc['status'] == 'failed' and 'error_message' in doc:
            print(f"  Error: {doc['error_message']}")
    
    failed_docs = [d for d in data if d['status'] == 'failed']
    print(f"\nFailed documents: {len(failed_docs)}")
    
    for doc in failed_docs:
        print(f"\nDocument: {doc['file_name']}")
        print(f"Status: {doc['status']}")
        print(f"Error: {doc.get('error_message', 'No error message')}")
        print(f"Full doc: {json.dumps(doc, indent=2)}")
        
except Exception as e:
    print(f"Error: {e}")
