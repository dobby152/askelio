#!/usr/bin/env python3
"""
Real-time monitoring script for document uploads
"""

import requests
import time
import json
from datetime import datetime

def monitor_documents():
    """Monitor document processing in real-time"""
    
    base_url = "http://localhost:8000"
    last_count = 0
    
    print("🔍 Monitoring Askelio Document Processing...")
    print("📋 Waiting for new document uploads...")
    print("=" * 60)
    
    while True:
        try:
            # Get current documents
            response = requests.get(f"{base_url}/documents")
            if response.status_code == 200:
                documents = response.json()
                current_count = len(documents)
                
                # Check for new documents
                if current_count > last_count:
                    print(f"\n🆕 NEW DOCUMENT DETECTED! ({current_count} total)")
                    
                    # Get the latest document
                    latest_doc = documents[-1]
                    doc_id = latest_doc['id']
                    filename = latest_doc['filename']
                    status = latest_doc['status']
                    
                    print(f"📄 Document: {filename}")
                    print(f"🆔 ID: {doc_id}")
                    print(f"📊 Status: {status}")
                    
                    # Monitor processing
                    if status == "processing":
                        print("⏳ Processing started... monitoring progress:")
                        monitor_processing(base_url, doc_id, filename)
                    elif status == "completed":
                        print("✅ Document already completed!")
                        show_results(latest_doc)
                    
                    last_count = current_count
                
                # Show current status
                processing_docs = [d for d in documents if d['status'] == 'processing']
                if processing_docs:
                    print(f"⏳ {len(processing_docs)} documents currently processing...")
                
            time.sleep(2)  # Check every 2 seconds
            
        except KeyboardInterrupt:
            print("\n👋 Monitoring stopped by user")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(5)

def monitor_processing(base_url, doc_id, filename):
    """Monitor a specific document's processing"""
    
    start_time = time.time()
    
    while True:
        try:
            # Get document status
            response = requests.get(f"{base_url}/documents/{doc_id}")
            if response.status_code == 200:
                doc = response.json()
                status = doc['status']
                elapsed = time.time() - start_time
                
                if status == "processing":
                    print(f"   ⏱️  Processing... ({elapsed:.1f}s elapsed)")
                    time.sleep(1)
                    continue
                    
                elif status == "completed":
                    print(f"   ✅ Processing completed in {elapsed:.1f}s!")
                    show_results(doc)
                    break
                    
                elif status == "error":
                    print(f"   ❌ Processing failed after {elapsed:.1f}s")
                    error_msg = doc.get('error_message', 'Unknown error')
                    print(f"   💥 Error: {error_msg}")
                    break
                    
            else:
                print(f"   ⚠️  Could not get document status: {response.status_code}")
                break
                
        except Exception as e:
            print(f"   ❌ Monitoring error: {e}")
            break

def show_results(doc):
    """Show processing results"""
    
    print("\n" + "="*50)
    print("📊 PROCESSING RESULTS:")
    print("="*50)
    
    # Basic info
    print(f"📄 File: {doc['filename']}")
    print(f"📏 Size: {doc['size']}")
    print(f"🎯 Accuracy: {doc['accuracy']}%")
    print(f"⏱️  Processed: {doc['processed_at']}")
    
    # Extracted data
    if 'extracted_data' in doc and doc['extracted_data']:
        data = doc['extracted_data']
        print(f"\n📋 EXTRACTED DATA:")
        print(f"   🏢 Vendor: {data.get('vendor', 'N/A')}")
        print(f"   💰 Amount: {data.get('amount', 'N/A')} {data.get('currency', '')}")
        print(f"   📅 Date: {data.get('date', 'N/A')}")
        print(f"   🔢 Invoice #: {data.get('invoice_number', 'N/A')}")
        print(f"   📑 Type: {data.get('document_type', 'N/A')}")
    
    # OCR metadata
    if 'ocr_metadata' in doc and doc['ocr_metadata']:
        ocr = doc['ocr_metadata']
        print(f"\n🔍 OCR ANALYSIS:")
        print(f"   🎯 Best method: {ocr.get('best_method', 'N/A')}")
        print(f"   🔧 Methods tried: {', '.join(ocr.get('methods_tried', []))}")
        
        if 'all_results' in ocr:
            print(f"   📊 Detailed results:")
            for result in ocr['all_results']:
                method = result['method']
                confidence = result['confidence']
                text_len = len(result['text'])
                proc_time = result['processing_time']
                
                if method == 'tesseract_ocr':
                    print(f"      🔤 Tesseract: {confidence:.2f} confidence, {text_len} chars, {proc_time:.2f}s")
                elif method == 'google_vision':
                    print(f"      🤖 Google Vision: {confidence:.2f} confidence, {text_len} chars, {proc_time:.2f}s")
    
    # Raw text preview
    if 'raw_text' in doc and doc['raw_text']:
        raw_text = doc['raw_text']
        preview = raw_text[:200] + "..." if len(raw_text) > 200 else raw_text
        print(f"\n📝 RAW TEXT PREVIEW:")
        print(f"   {preview}")
    
    print("="*50)
    print("✅ Analysis complete! Waiting for next document...\n")

if __name__ == "__main__":
    monitor_documents()
