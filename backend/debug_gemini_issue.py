#!/usr/bin/env python3
"""
Debug Gemini AI issue - find out why get_status() returns available=false
"""

import os
from dotenv import load_dotenv
from gemini_decision_engine import GeminiDecisionEngine
from invoice_processor import InvoiceProcessor

# Load environment variables
load_dotenv()

def debug_gemini_issue():
    """Debug the Gemini AI issue step by step"""
    print("🔍 DEBUGGING GEMINI AI ISSUE")
    print("=" * 50)
    
    # Step 1: Test direct Gemini engine
    print("\n1️⃣ Testing direct Gemini engine:")
    gemini_direct = GeminiDecisionEngine()
    print(f"   - is_available: {gemini_direct.is_available}")
    print(f"   - model: {gemini_direct.model is not None}")
    
    status_direct = gemini_direct.get_status()
    print(f"   - get_status() available: {status_direct['available']}")
    print(f"   - Instance ID: {id(gemini_direct)}")
    
    # Step 2: Test through InvoiceProcessor
    print("\n2️⃣ Testing through InvoiceProcessor:")
    invoice_proc = InvoiceProcessor()
    print(f"   - invoice_proc.gemini_engine.is_available: {invoice_proc.gemini_engine.is_available}")
    print(f"   - invoice_proc.gemini_engine.model: {invoice_proc.gemini_engine.model is not None}")
    
    status_through_processor = invoice_proc.gemini_engine.get_status()
    print(f"   - get_status() available: {status_through_processor['available']}")
    print(f"   - Instance ID: {id(invoice_proc.gemini_engine)}")
    
    # Step 3: Test get_system_status
    print("\n3️⃣ Testing get_system_status:")
    system_status = invoice_proc.get_system_status()
    print(f"   - system_status['gemini_engine']['available']: {system_status['gemini_engine']['available']}")
    
    # Step 4: Compare instances
    print("\n4️⃣ Comparing instances:")
    print(f"   - Direct instance ID: {id(gemini_direct)}")
    print(f"   - Processor instance ID: {id(invoice_proc.gemini_engine)}")
    print(f"   - Are they the same? {id(gemini_direct) == id(invoice_proc.gemini_engine)}")
    
    # Step 5: Check if there's any difference in the objects
    print("\n5️⃣ Detailed comparison:")
    print(f"   - Direct: is_available={gemini_direct.is_available}, model={type(gemini_direct.model)}")
    print(f"   - Processor: is_available={invoice_proc.gemini_engine.is_available}, model={type(invoice_proc.gemini_engine.model)}")
    
    # Step 6: Test multiple calls
    print("\n6️⃣ Testing multiple get_status() calls:")
    for i in range(3):
        status = invoice_proc.gemini_engine.get_status()
        print(f"   - Call {i+1}: available={status['available']}")

if __name__ == "__main__":
    debug_gemini_issue()
