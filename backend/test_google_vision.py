#!/usr/bin/env python3
"""
Test script pro Google Vision API
Tento script testuje, zda je Google Vision API správně nakonfigurována.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_google_vision_config():
    """Test Google Vision API configuration."""
    print("🔍 Testování konfigurace Google Vision API...")
    
    # Check environment variable
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    print(f"📁 GOOGLE_APPLICATION_CREDENTIALS: {credentials_path}")
    
    if not credentials_path:
        print("❌ GOOGLE_APPLICATION_CREDENTIALS není nastavena")
        return False
    
    # Check if file exists
    if not os.path.exists(credentials_path):
        print(f"❌ Soubor s credentials neexistuje: {credentials_path}")
        return False
    
    print(f"✅ Soubor s credentials existuje: {credentials_path}")
    
    # Try to load credentials
    try:
        from google.oauth2 import service_account
        credentials = service_account.Credentials.from_service_account_file(credentials_path)
        print("✅ Credentials byly úspěšně načteny")
        
        # Check project ID
        project_id = credentials.project_id
        print(f"📋 Project ID: {project_id}")
        
        if project_id != "crested-guru-465410-h3":
            print(f"⚠️  Neočekávané Project ID. Očekáváno: crested-guru-465410-h3, Nalezeno: {project_id}")
        
    except Exception as e:
        print(f"❌ Chyba při načítání credentials: {e}")
        return False
    
    # Try to initialize Vision client
    try:
        from google.cloud import vision
        client = vision.ImageAnnotatorClient(credentials=credentials)
        print("✅ Google Vision client byl úspěšně inicializován")
        
    except Exception as e:
        print(f"❌ Chyba při inicializaci Vision client: {e}")
        return False
    
    return True

def test_google_vision_client():
    """Test our Google Vision client wrapper."""
    print("\n🔍 Testování našeho Google Vision client...")
    
    try:
        from google_vision import google_vision_client
        
        if google_vision_client.client is None:
            print("❌ Google Vision client není inicializován")
            return False
        
        print("✅ Google Vision client je inicializován")
        return True
        
    except Exception as e:
        print(f"❌ Chyba při testování Google Vision client: {e}")
        return False

def main():
    """Main test function."""
    print("🚀 Spouštění testů Google Vision API\n")
    
    # Test 1: Configuration
    config_ok = test_google_vision_config()
    
    # Test 2: Our client wrapper
    client_ok = test_google_vision_client()
    
    print("\n" + "="*50)
    print("📊 VÝSLEDKY TESTŮ:")
    print(f"   Konfigurace: {'✅ OK' if config_ok else '❌ CHYBA'}")
    print(f"   Client:      {'✅ OK' if client_ok else '❌ CHYBA'}")
    
    if config_ok and client_ok:
        print("\n🎉 Všechny testy prošly! Google Vision API je připravena k použití.")
        print("\n💡 Další kroky:")
        print("   1. Spusťte backend: python main.py")
        print("   2. Otestujte endpoint: POST /test-vision")
        print("   3. Nahrajte dokument přes frontend")
        return 0
    else:
        print("\n❌ Některé testy selhaly. Zkontrolujte konfiguraci.")
        print("\n🔧 Řešení problémů:")
        print("   1. Zkontrolujte soubor .env")
        print("   2. Ověřte, že google-credentials.json obsahuje správný JSON")
        print("   3. Přečtěte si GOOGLE_CLOUD_SETUP.md")
        return 1

if __name__ == "__main__":
    sys.exit(main())
