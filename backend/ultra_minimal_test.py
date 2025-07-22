#!/usr/bin/env python3
"""
Ultra minimal test to isolate the issue
"""

from fastapi import FastAPI
from dotenv import load_dotenv
from invoice_processor import InvoiceProcessor
import uvicorn

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(title="Ultra Minimal Test")

# Initialize Invoice Processor
invoice_processor = InvoiceProcessor()

@app.get("/")
async def root():
    return {"message": "Ultra Minimal Test API"}

@app.get("/simple-status")
async def simple_status():
    """Simple status check"""
    return {
        "gemini_available": invoice_processor.gemini_engine.is_available,
        "gemini_status": invoice_processor.gemini_engine.get_status()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8005, reload=False)
