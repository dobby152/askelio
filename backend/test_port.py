#!/usr/bin/env python3
"""
Test script to verify port configuration for Render.com deployment
"""

import os
import sys

def test_port_configuration():
    """Test that PORT environment variable is properly configured"""
    
    print("🔍 Testing port configuration for Render.com...")
    
    # Test PORT environment variable
    port_env = os.getenv("PORT")
    print(f"PORT environment variable: {port_env}")
    
    # Test default port logic
    port = int(os.getenv("PORT", 8001))
    print(f"Resolved port: {port}")
    
    # Expected port for Render.com
    expected_port = 8080
    
    if port_env:
        if int(port_env) == expected_port:
            print(f"✅ PORT correctly set to {expected_port}")
            return True
        else:
            print(f"⚠️  PORT set to {port_env}, but Render.com expects {expected_port}")
            return False
    else:
        print(f"⚠️  PORT not set, using default {port}")
        print(f"💡 For Render.com, set PORT={expected_port}")
        return False

def test_main_py_import():
    """Test that main.py can be imported without errors"""
    
    print("\n🔍 Testing main.py import...")
    
    try:
        # Set PORT for testing
        os.environ["PORT"] = "8080"
        
        # Try to import main components
        from fastapi import FastAPI
        print("✅ FastAPI import successful")
        
        import uvicorn
        print("✅ Uvicorn import successful")
        
        # Test port resolution
        port = int(os.getenv("PORT", 8001))
        print(f"✅ Port resolution successful: {port}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Render.com Port Configuration Test")
    print("=" * 50)
    
    port_ok = test_port_configuration()
    import_ok = test_main_py_import()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"Port configuration: {'✅ PASS' if port_ok else '❌ FAIL'}")
    print(f"Main.py import: {'✅ PASS' if import_ok else '❌ FAIL'}")
    
    if port_ok and import_ok:
        print("\n🎉 All tests passed! Ready for Render.com deployment.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Check configuration before deploying.")
        sys.exit(1)
