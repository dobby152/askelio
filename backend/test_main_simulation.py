#!/usr/bin/env python3
"""
Simulate exactly what happens in main.py to find the issue
"""

import os
from dotenv import load_dotenv
from invoice_processor import InvoiceProcessor

# Load environment variables (same as main.py)
load_dotenv()

# Initialize Invoice Processor (same as main.py line 20)
print("🚀 Creating invoice_processor (same as main.py line 20)...")
invoice_processor = InvoiceProcessor()

def test_main_simulation():
    """Test exactly what happens in main.py"""
    print("🔍 TESTING MAIN.PY SIMULATION")
    print("=" * 50)
    
    # Test the global invoice_processor instance
    print(f"\n📊 Global invoice_processor:")
    print(f"   - Instance ID: {id(invoice_processor)}")
    print(f"   - gemini_engine.is_available: {invoice_processor.gemini_engine.is_available}")
    print(f"   - gemini_engine Instance ID: {id(invoice_processor.gemini_engine)}")
    
    # Test get_system_status (same as system_status endpoint)
    print(f"\n📋 Testing get_system_status():")
    status = invoice_processor.get_system_status()
    print(f"   - gemini_engine available: {status['gemini_engine']['available']}")
    
    # Test direct access to gemini_engine.get_status()
    print(f"\n🎯 Testing direct gemini_engine.get_status():")
    gemini_status = invoice_processor.gemini_engine.get_status()
    print(f"   - available: {gemini_status['available']}")
    
    # Test multiple calls
    print(f"\n🔄 Testing multiple calls:")
    for i in range(3):
        status = invoice_processor.get_system_status()
        print(f"   - Call {i+1}: available={status['gemini_engine']['available']}")

if __name__ == "__main__":
    test_main_simulation()
