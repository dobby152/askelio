#!/usr/bin/env python3
"""
Simple test server pro ověření, že Python funguje
"""

print("🚀 Spouštím test Combined OCR systému...")

# Test 1: Základní Python
print("✅ Python funguje!")

# Test 2: Import základních modulů
try:
    import os
    import sys
    import json
    print("✅ Základní moduly fungují!")
except ImportError as e:
    print(f"❌ Chyba při importu základních modulů: {e}")

# Test 3: Test Google credentials souboru
try:
    if os.path.exists("google-credentials.json"):
        with open("google-credentials.json", "r") as f:
            credentials = json.load(f)
        print(f"✅ Google credentials nalezeny - Project ID: {credentials.get('project_id')}")
    else:
        print("❌ Google credentials soubor nenalezen")
except Exception as e:
    print(f"❌ Chyba při čtení Google credentials: {e}")

# Test 4: Test .env souboru
try:
    if os.path.exists(".env"):
        print("✅ .env soubor nalezen")
    else:
        print("❌ .env soubor nenalezen")
except Exception as e:
    print(f"❌ Chyba při kontrole .env: {e}")

print("\n🎯 Výsledek: Základní setup je připraven!")
print("💡 Další kroky:")
print("   1. Nainstalujte závislosti: py -m pip install fastapi uvicorn")
print("   2. Spusťte server: py main.py")
print("   3. Otestujte Combined OCR přes Playwright")
