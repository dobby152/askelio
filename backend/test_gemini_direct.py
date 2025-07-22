#!/usr/bin/env python3
"""
Direct test of Gemini AI to debug the issue
"""

import os
from dotenv import load_dotenv
from gemini_decision_engine import GeminiDecisionEngine

# Load environment variables
load_dotenv()

def test_gemini_direct():
    """Test Gemini AI directly"""
    print("🚀 Testing Gemini AI directly...")
    
    # Check API key
    api_key = os.getenv('GOOGLE_API_KEY')
    print(f"🔑 API Key configured: {bool(api_key)}")
    if api_key:
        print(f"🔑 API Key length: {len(api_key)}")
        print(f"🔑 API Key starts with: {api_key[:10]}...")
    
    # Create Gemini engine
    print("\n🎯 Creating Gemini Decision Engine...")
    gemini_engine = GeminiDecisionEngine()
    
    # Check status
    print(f"\n📊 Gemini engine status:")
    print(f"   - is_available: {gemini_engine.is_available}")
    print(f"   - model: {gemini_engine.model}")
    
    # Get status
    status = gemini_engine.get_status()
    print(f"\n📋 Status from get_status():")
    for key, value in status.items():
        print(f"   - {key}: {value}")
    
    # Test simple structuring
    if gemini_engine.is_available:
        print(f"\n🧪 Testing simple structuring...")
        try:
            result = gemini_engine.structure_data_with_gemini(
                "Faktura č. 2025-001 od společnosti ABC s.r.o. Celková částka: 15,000 Kč včetně DPH.",
                {}
            )
            print(f"✅ Structuring successful: {result.success}")
            if result.success:
                print(f"📄 Structured data: {result.data}")
            else:
                print(f"❌ Error: {result.error_message}")
        except Exception as e:
            print(f"❌ Exception during structuring: {e}")
    else:
        print("❌ Gemini AI not available, skipping structuring test")

if __name__ == "__main__":
    test_gemini_direct()
