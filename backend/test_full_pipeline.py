#!/usr/bin/env python3
"""
Test celého OCR pipeline s reálnou fakturou
"""
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def test_full_pipeline():
    """Test celého OCR pipeline"""
    try:
        from unified_document_processor import UnifiedDocumentProcessor
        
        print("🔄 Initializing Unified Document Processor...")
        processor = UnifiedDocumentProcessor()
        
        # Path to real PDF
        pdf_path = r"C:\Users\askelatest\Downloads\Zálohová_faktura_250800001.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"❌ PDF file not found: {pdf_path}")
            return False
            
        print(f"📄 Processing PDF: {pdf_path}")

        # Create document data as dict
        document_data = {
            "filename": "Zálohová_faktura_250800001.pdf",
            "original_filename": "Zálohová_faktura_250800001.pdf",
            "file_type": "application/pdf",
            "processing_mode": "cost_effective",
            "language": "cs",
            "document_type": "invoice"
        }
        
        # Mock user ID
        user_id = "ad82b21b-e85c-4629-81ef-65dee068be51"
        
        print("🚀 Starting document processing...")
        
        # Process document
        result = processor.process_document(
            file_path=pdf_path,
            filename="Zálohová_faktura_250800001.pdf"
        )
        
        print(f"📊 Processing Result:")
        print(f"   Success: {result.success}")
        print(f"   Document ID: {getattr(result, 'document_id', 'N/A')}")
        print(f"   Processing time: {result.processing_time:.2f}s")
        print(f"   OCR Provider: {getattr(result, 'ocr_provider', 'N/A')}")
        print(f"   LLM Model: {getattr(result, 'llm_model', 'N/A')}")
        print(f"   Confidence: {result.confidence}")

        if result.success:
            structured_data = result.structured_data or {}
            print(f"📋 Structured Data:")
            for key, value in structured_data.items():
                if isinstance(value, str) and len(value) > 100:
                    print(f"   {key}: {value[:100]}...")
                else:
                    print(f"   {key}: {value}")

            return True
        else:
            error = getattr(result, 'error_message', 'Unknown error')
            print(f"❌ Processing failed: {error}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Testing Full OCR Pipeline ===")
    test_full_pipeline()
