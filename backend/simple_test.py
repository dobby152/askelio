#!/usr/bin/env python3
"""
Simple test API to debug Gemini AI issue
"""

from fastapi import FastAPI
from dotenv import load_dotenv
from gemini_decision_engine import GeminiDecisionEngine
import uvicorn

# Load environment variables
load_dotenv()

app = FastAPI(title="Simple Gemini Test API")

# Create Gemini engine
print("🚀 Creating Gemini Decision Engine...")
gemini_engine = GeminiDecisionEngine()
print(f"✅ Gemini engine created: is_available={gemini_engine.is_available}")

@app.get("/")
async def root():
    return {"message": "Simple Gemini Test API"}

@app.get("/gemini-status")
async def gemini_status():
    """Get Gemini AI status"""
    print(f"🔍 DEBUG: gemini_engine instance: {id(gemini_engine)}")
    print(f"🔍 DEBUG: gemini_engine.is_available: {gemini_engine.is_available}")
    
    status = gemini_engine.get_status()
    print(f"🔍 DEBUG: status: {status}")
    
    return {
        "gemini_engine_id": id(gemini_engine),
        "is_available_direct": gemini_engine.is_available,
        "status": status
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002, reload=False)
