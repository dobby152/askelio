#!/usr/bin/env python3
"""
Test script to verify the live system is working correctly
"""

import requests
import json
import time

def test_live_system():
    """Test the live API endpoints"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Live Askelio System...")
    print("=" * 50)
    
    # Test 1: Health check
    print("1. 🏥 Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"   ✅ Status: {health_data['status']}")
            print(f"   ✅ Mode: {health_data['mode']}")
            print(f"   ✅ Services: {health_data['services']}")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
    
    print()
    
    # Test 2: Get documents
    print("2. 📄 Testing documents endpoint...")
    try:
        response = requests.get(f"{base_url}/documents")
        if response.status_code == 200:
            documents = response.json()
            print(f"   ✅ Found {len(documents)} documents")
            
            if documents:
                latest_doc = documents[-1]  # Get latest document
                print(f"   📊 Latest document:")
                print(f"      - Filename: {latest_doc['filename']}")
                print(f"      - Status: {latest_doc['status']}")
                print(f"      - Accuracy: {latest_doc['accuracy']}%")
                print(f"      - Size: {latest_doc['size']}")
                
                # Check extracted data
                if 'extracted_data' in latest_doc:
                    data = latest_doc['extracted_data']
                    print(f"   📋 Extracted data:")
                    print(f"      - Vendor: {data.get('vendor', 'N/A')}")
                    print(f"      - Amount: {data.get('amount', 'N/A')} {data.get('currency', '')}")
                    print(f"      - Date: {data.get('date', 'N/A')}")
                    print(f"      - Invoice #: {data.get('invoice_number', 'N/A')}")
                    print(f"      - Type: {data.get('document_type', 'N/A')}")
                
                # Check OCR metadata
                if 'ocr_metadata' in latest_doc:
                    ocr_meta = latest_doc['ocr_metadata']
                    print(f"   🔍 OCR metadata:")
                    print(f"      - Methods tried: {ocr_meta.get('methods_tried', [])}")
                    print(f"      - Best method: {ocr_meta.get('best_method', 'N/A')}")
                    
                    if 'all_results' in ocr_meta:
                        for result in ocr_meta['all_results']:
                            method = result['method']
                            confidence = result['confidence']
                            text_len = len(result['text'])
                            processing_time = result['processing_time']
                            print(f"      - {method}: {confidence:.2f} confidence, {text_len} chars, {processing_time:.2f}s")
        else:
            print(f"   ❌ Documents endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Documents endpoint error: {e}")
    
    print()
    
    # Test 3: Test integrations
    print("3. 🔗 Testing integrations endpoint...")
    try:
        response = requests.get(f"{base_url}/integrations")
        if response.status_code == 200:
            integrations = response.json()
            print(f"   ✅ Available integrations:")
            for integration in integrations['integrations']:
                name = integration['name']
                status = integration['status']
                desc = integration['description']
                print(f"      - {name}: {status} - {desc}")
        else:
            print(f"   ❌ Integrations endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Integrations endpoint error: {e}")
    
    print()
    print("=" * 50)
    print("🎯 System Status Summary:")
    
    # Overall assessment
    try:
        # Check if we have processed documents
        response = requests.get(f"{base_url}/documents")
        if response.status_code == 200:
            documents = response.json()
            completed_docs = [d for d in documents if d['status'] == 'completed']
            
            if completed_docs:
                avg_accuracy = sum(d['accuracy'] for d in completed_docs) / len(completed_docs)
                print(f"   ✅ {len(completed_docs)} documents successfully processed")
                print(f"   ✅ Average accuracy: {avg_accuracy:.1f}%")
                
                # Check if both OCR engines are working
                latest_doc = completed_docs[-1]
                if 'ocr_metadata' in latest_doc:
                    methods = latest_doc['ocr_metadata'].get('methods_tried', [])
                    if 'tesseract_ocr' in methods and 'google_vision' in methods:
                        print(f"   ✅ Both OCR engines working (Tesseract + Google Vision)")
                    elif 'google_vision' in methods:
                        print(f"   ⚠️  Only Google Vision working")
                    elif 'tesseract_ocr' in methods:
                        print(f"   ⚠️  Only Tesseract working")
                    else:
                        print(f"   ❌ No OCR engines detected")
                
                print(f"   ✅ System is FULLY OPERATIONAL")
            else:
                print(f"   ⚠️  No completed documents found")
        else:
            print(f"   ❌ Cannot assess system status")
            
    except Exception as e:
        print(f"   ❌ Error assessing system: {e}")

if __name__ == "__main__":
    test_live_system()
