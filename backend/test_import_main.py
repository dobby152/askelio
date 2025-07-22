#!/usr/bin/env python3
"""
Test importing main.py and checking its invoice_processor
"""

def test_import_main():
    """Test importing main.py and checking its invoice_processor"""
    print("🔍 TESTING IMPORT OF MAIN.PY")
    print("=" * 50)
    
    try:
        # Import main.py
        print("📦 Importing main.py...")
        import main
        
        # Test the imported invoice_processor
        print(f"\n📊 Imported main.invoice_processor:")
        print(f"   - Instance ID: {id(main.invoice_processor)}")
        print(f"   - gemini_engine.is_available: {main.invoice_processor.gemini_engine.is_available}")
        print(f"   - gemini_engine Instance ID: {id(main.invoice_processor.gemini_engine)}")
        
        # Test get_system_status
        print(f"\n📋 Testing main.invoice_processor.get_system_status():")
        status = main.invoice_processor.get_system_status()
        print(f"   - gemini_engine available: {status['gemini_engine']['available']}")
        
        # Test direct access
        print(f"\n🎯 Testing direct main.invoice_processor.gemini_engine.get_status():")
        gemini_status = main.invoice_processor.gemini_engine.get_status()
        print(f"   - available: {gemini_status['available']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error importing main.py: {e}")
        return False

if __name__ == "__main__":
    test_import_main()
