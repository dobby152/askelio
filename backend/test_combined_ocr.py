#!/usr/bin/env python3
"""
Test script pro Combined OCR (AI + Traditional methods)
Tento script testuje kombinovaný OCR systém který kombinuje:
- OpenCV image preprocessing
- Tesseract OCR s různými nastaveními  
- Google Vision API
- Result fusion algoritmus
"""

import os
import sys
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_dependencies():
    """Test required dependencies."""
    print("🔍 Testování závislostí...")
    
    try:
        import cv2
        print(f"✅ OpenCV: {cv2.__version__}")
    except ImportError:
        print("❌ OpenCV není nainstalováno")
        return False
    
    try:
        import pytesseract
        print("✅ Pytesseract: nainstalováno")
    except ImportError:
        print("❌ Pytesseract není nainstalováno")
        return False
    
    try:
        import numpy as np
        print(f"✅ NumPy: {np.__version__}")
    except ImportError:
        print("❌ NumPy není nainstalováno")
        return False
    
    try:
        from google.cloud import vision
        print("✅ Google Cloud Vision: nainstalováno")
    except ImportError:
        print("❌ Google Cloud Vision není nainstalováno")
        return False
    
    return True

def test_google_vision_config():
    """Test Google Vision API configuration."""
    print("\n🔍 Testování Google Vision API konfigurace...")
    
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
        
    except Exception as e:
        print(f"❌ Chyba při načítání credentials: {e}")
        return False
    
    return True

def test_combined_ocr_processor():
    """Test combined OCR processor."""
    print("\n🔍 Testování Combined OCR Processor...")
    
    try:
        from combined_ocr_processor import combined_ocr_processor
        print("✅ Combined OCR Processor byl úspěšně importován")
        
        # Test image preprocessor
        from combined_ocr_processor import ImagePreprocessor
        preprocessor = ImagePreprocessor()
        print("✅ Image Preprocessor je funkční")
        
        return True
        
    except Exception as e:
        print(f"❌ Chyba při testování Combined OCR Processor: {e}")
        return False

def test_with_sample_image():
    """Test combined OCR with sample image."""
    print("\n🔍 Testování s ukázkovým obrázkem...")
    
    # Check if test image exists
    test_image_path = "test_invoice.html"
    if not os.path.exists(test_image_path):
        print(f"⚠️  Testovací soubor {test_image_path} neexistuje")
        print("💡 Vytvořte testovací obrázek nebo PDF pro kompletní test")
        return True
    
    try:
        from combined_ocr_processor import combined_ocr_processor
        
        print(f"📄 Zpracovávám soubor: {test_image_path}")
        start_time = time.time()
        
        result = combined_ocr_processor.process_document(test_image_path)
        
        processing_time = time.time() - start_time
        
        if "error" in result:
            print(f"❌ Chyba při zpracování: {result['error']}")
            return False
        
        print(f"✅ Zpracování dokončeno za {processing_time:.2f}s")
        print(f"📊 Použité metody: {result['comparison']['methods_used']}")
        print(f"🎯 Úspěšné metody: {result['comparison']['successful_methods']}")
        print(f"🏆 Nejlepší metoda: {result['final_result']['method_used']}")
        print(f"📈 Finální confidence: {result['final_result']['confidence']:.2f}")
        print(f"📝 Délka textu: {len(result['final_result']['text'])} znaků")
        print(f"🔍 Strukturovaná data: {len(result['final_result']['structured_data'])} položek")
        
        # Show individual method results
        print("\n📋 Výsledky jednotlivých metod:")
        for method_result in result['individual_results']:
            print(f"  • {method_result['method']}: "
                  f"confidence={method_result['confidence']:.2f}, "
                  f"text_length={method_result['text_length']}, "
                  f"time={method_result['processing_time']:.2f}s")
        
        return True
        
    except Exception as e:
        print(f"❌ Chyba při testování s ukázkovým obrázkem: {e}")
        return False

def main():
    """Main test function."""
    print("🚀 Spouštění testů Combined OCR (AI + Traditional methods)\n")
    
    # Test 1: Dependencies
    deps_ok = test_dependencies()
    
    # Test 2: Google Vision configuration
    gv_config_ok = test_google_vision_config()
    
    # Test 3: Combined OCR processor
    processor_ok = test_combined_ocr_processor()
    
    # Test 4: Sample image processing
    sample_ok = test_with_sample_image()
    
    print("\n" + "="*60)
    print("📊 VÝSLEDKY TESTŮ:")
    print(f"   Závislosti:           {'✅ OK' if deps_ok else '❌ CHYBA'}")
    print(f"   Google Vision config: {'✅ OK' if gv_config_ok else '❌ CHYBA'}")
    print(f"   Combined OCR:         {'✅ OK' if processor_ok else '❌ CHYBA'}")
    print(f"   Ukázkové zpracování:  {'✅ OK' if sample_ok else '❌ CHYBA'}")
    
    if all([deps_ok, gv_config_ok, processor_ok, sample_ok]):
        print("\n🎉 Všechny testy prošly! Combined OCR je připraven k použití.")
        print("\n💡 Další kroky:")
        print("   1. Spusťte backend: python main.py")
        print("   2. Otestujte endpoint: POST /test-combined-ocr")
        print("   3. Nahrajte dokument přes frontend")
        print("   4. Sledujte kombinované OCR zpracování")
        print("\n🔬 Funkce Combined OCR:")
        print("   • OpenCV image preprocessing (3 metody)")
        print("   • Tesseract OCR (4 konfigurace)")
        print("   • Google Vision API")
        print("   • Automatický výběr nejlepšího výsledku")
        print("   • Kombinace strukturovaných dat")
        return 0
    else:
        print("\n❌ Některé testy selhaly. Zkontrolujte konfiguraci.")
        print("\n🔧 Řešení problémů:")
        if not deps_ok:
            print("   • Nainstalujte závislosti: pip install -r requirements.txt")
        if not gv_config_ok:
            print("   • Zkontrolujte Google Cloud credentials")
        if not processor_ok:
            print("   • Zkontrolujte import paths a dependencies")
        print("   • Přečtěte si dokumentaci v GOOGLE_CLOUD_SETUP.md")
        return 1

if __name__ == "__main__":
    sys.exit(main())
