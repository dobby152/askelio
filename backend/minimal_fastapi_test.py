#!/usr/bin/env python3
"""
Minimal FastAPI test to isolate the Gemini AI issue
"""

from fastapi import FastAPI
from dotenv import load_dotenv
from invoice_processor import InvoiceProcessor
import uvicorn

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(title="Minimal Gemini Test")

# Initialize Invoice Processor (same as main.py)
print("🚀 Creating invoice_processor...")
invoice_processor = InvoiceProcessor()
print(f"✅ invoice_processor created: gemini available={invoice_processor.gemini_engine.is_available}")

@app.get("/")
async def root():
    return {"message": "Minimal Gemini Test API"}

@app.get("/test-gemini")
async def test_gemini():
    """Test Gemini AI status"""
    print(f"🔍 DEBUG test_gemini: invoice_processor instance: {id(invoice_processor)}")
    print(f"🔍 DEBUG test_gemini: gemini_engine instance: {id(invoice_processor.gemini_engine)}")
    print(f"🔍 DEBUG test_gemini: gemini_engine.is_available: {invoice_processor.gemini_engine.is_available}")
    
    # Get status directly
    direct_status = invoice_processor.gemini_engine.get_status()
    print(f"🔍 DEBUG test_gemini: direct_status: {direct_status}")
    
    # Get status through get_system_status
    system_status = invoice_processor.get_system_status()
    print(f"🔍 DEBUG test_gemini: system_status gemini: {system_status['gemini_engine']}")
    
    return {
        "invoice_processor_id": id(invoice_processor),
        "gemini_engine_id": id(invoice_processor.gemini_engine),
        "is_available_direct": invoice_processor.gemini_engine.is_available,
        "direct_status": direct_status,
        "system_status_gemini": system_status['gemini_engine']
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003, reload=False)
