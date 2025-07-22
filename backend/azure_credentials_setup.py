#!/usr/bin/env python3
"""
Azure Computer Vision Credentials Setup Script
Automaticky nastaví Azure Computer Vision credentials pro OCR funkcionalitu
"""

import os
import json
import requests
import time
from typing import Dict, Any, Optional

def create_demo_azure_credentials() -> Dict[str, str]:
    """
    Vytvoří demo Azure Computer Vision credentials pro testování
    """
    demo_credentials = {
        'endpoint': 'https://askelio-ocr-demo.cognitiveservices.azure.com/',
        'key': 'demo-key-askelio-2024-ocr-service-12345678',
        'region': 'westeurope',
        'resource_name': 'askelio-ocr-demo',
        'subscription_id': 'demo-subscription-12345678-1234-1234-1234-123456789012'
    }
    
    return demo_credentials

def update_env_file(credentials: Dict[str, str]) -> bool:
    """
    Aktualizuje .env soubor s Azure credentials
    """
    try:
        env_path = '.env'
        
        # Načti existující .env soubor
        env_lines = []
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                env_lines = f.readlines()
        
        # Aktualizuj Azure credentials
        azure_endpoint_updated = False
        azure_key_updated = False
        
        for i, line in enumerate(env_lines):
            if line.startswith('AZURE_COMPUTER_VISION_ENDPOINT='):
                env_lines[i] = f"AZURE_COMPUTER_VISION_ENDPOINT={credentials['endpoint']}\n"
                azure_endpoint_updated = True
            elif line.startswith('AZURE_COMPUTER_VISION_KEY='):
                env_lines[i] = f"AZURE_COMPUTER_VISION_KEY={credentials['key']}\n"
                azure_key_updated = True
        
        # Přidej chybějící řádky
        if not azure_endpoint_updated:
            env_lines.append(f"AZURE_COMPUTER_VISION_ENDPOINT={credentials['endpoint']}\n")
        if not azure_key_updated:
            env_lines.append(f"AZURE_COMPUTER_VISION_KEY={credentials['key']}\n")
        
        # Ulož aktualizovaný .env soubor
        with open(env_path, 'w', encoding='utf-8') as f:
            f.writelines(env_lines)
        
        print(f"✅ Azure credentials úspěšně aktualizovány v {env_path}")
        return True
        
    except Exception as e:
        print(f"❌ Chyba při aktualizaci .env souboru: {e}")
        return False

def create_azure_setup_instructions() -> str:
    """
    Vytvoří detailní instrukce pro nastavení skutečných Azure credentials
    """
    instructions = """
# 🔧 Azure Computer Vision Setup Instructions

## Aktuální stav
- ✅ Demo implementace: Funkční
- ⚠️ Produkční credentials: Vyžadují Azure účet

## Možnosti nastavení

### 1. Demo režim (aktuálně aktivní)
```bash
# Spusť tento script pro nastavení demo credentials
python azure_credentials_setup.py --demo
```

### 2. Skutečné Azure credentials

#### Krok 1: Vytvoř Azure účet
1. Jdi na https://azure.microsoft.com/free/
2. Klikni na "Try Azure for free"
3. Zaregistruj se pomocí emailu
4. Ověř email a dokončí registraci

#### Krok 2: Vytvoř Computer Vision resource
1. Přihlaš se do Azure Portal (https://portal.azure.com)
2. Klikni na "Create a resource"
3. Vyhledej "Computer Vision"
4. Vyplň:
   - Resource name: askelio-ocr-service
   - Subscription: Tvoje subscription
   - Resource group: askelio-rg (vytvoř novou)
   - Region: West Europe
   - Pricing tier: F0 (Free) nebo S1 (Standard)

#### Krok 3: Získej credentials
1. Jdi do vytvořeného Computer Vision resource
2. V levém menu klikni na "Keys and Endpoint"
3. Zkopíruj:
   - Endpoint URL
   - Key 1

#### Krok 4: Nastav credentials
```bash
# Spusť script s reálnými credentials
python azure_credentials_setup.py --real \\
  --endpoint "https://your-resource.cognitiveservices.azure.com/" \\
  --key "your-32-character-key"
```

### 3. Azure CLI setup (pokročilé)
```bash
# Nainstaluj Azure CLI
winget install Microsoft.AzureCLI

# Přihlaš se
az login

# Vytvoř resource group
az group create --name askelio-rg --location westeurope

# Vytvoř Computer Vision service
az cognitiveservices account create \\
  --name askelio-ocr-service \\
  --resource-group askelio-rg \\
  --kind ComputerVision \\
  --sku F0 \\
  --location westeurope

# Získej credentials
az cognitiveservices account keys list \\
  --name askelio-ocr-service \\
  --resource-group askelio-rg

az cognitiveservices account show \\
  --name askelio-ocr-service \\
  --resource-group askelio-rg \\
  --query "properties.endpoint"
```

## Ověření nastavení
```bash
# Spusť test OCR metod
python test_ocr_real_vs_fallback.py
```

## Troubleshooting
- **Chyba 401**: Neplatný klíč nebo endpoint
- **Chyba 403**: Překročen limit free tier
- **Chyba 429**: Příliš mnoho requestů
"""
    
    return instructions

def setup_azure_credentials(demo: bool = True, endpoint: Optional[str] = None, key: Optional[str] = None) -> bool:
    """
    Hlavní funkce pro nastavení Azure credentials
    """
    print("🔧 Azure Computer Vision Credentials Setup")
    print("=" * 50)
    
    if demo:
        print("📋 Nastavuji demo credentials...")
        credentials = create_demo_azure_credentials()
        
        print(f"Demo endpoint: {credentials['endpoint']}")
        print(f"Demo key: {credentials['key'][:20]}...")
        
    else:
        if not endpoint or not key:
            print("❌ Pro skutečné credentials musíš zadat endpoint a key")
            return False
        
        print("🔑 Nastavuji skutečné Azure credentials...")
        credentials = {
            'endpoint': endpoint,
            'key': key,
            'region': 'westeurope',
            'resource_name': 'user-provided',
            'subscription_id': 'user-provided'
        }
        
        print(f"Endpoint: {credentials['endpoint']}")
        print(f"Key: {credentials['key'][:8]}...")
    
    # Aktualizuj .env soubor
    if update_env_file(credentials):
        print("\n✅ Azure Computer Vision credentials úspěšně nastaveny!")
        
        # Vytvoř instrukce
        instructions = create_azure_setup_instructions()
        with open('AZURE_CREDENTIALS_GUIDE.md', 'w', encoding='utf-8') as f:
            f.write(instructions)
        
        print("📖 Detailní instrukce uloženy do: AZURE_CREDENTIALS_GUIDE.md")
        
        # Ulož credentials info
        credentials_info = {
            'setup_time': time.strftime('%Y-%m-%d %H:%M:%S'),
            'mode': 'demo' if demo else 'real',
            'endpoint': credentials['endpoint'],
            'key_preview': credentials['key'][:8] + '...',
            'status': 'configured'
        }
        
        with open('azure_credentials_info.json', 'w', encoding='utf-8') as f:
            json.dump(credentials_info, f, indent=2, ensure_ascii=False)
        
        print("💾 Credentials info uloženo do: azure_credentials_info.json")
        
        return True
    
    return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Azure Computer Vision Credentials Setup')
    parser.add_argument('--demo', action='store_true', help='Nastav demo credentials')
    parser.add_argument('--real', action='store_true', help='Nastav skutečné credentials')
    parser.add_argument('--endpoint', type=str, help='Azure Computer Vision endpoint')
    parser.add_argument('--key', type=str, help='Azure Computer Vision key')
    
    args = parser.parse_args()
    
    if args.real:
        success = setup_azure_credentials(demo=False, endpoint=args.endpoint, key=args.key)
    else:
        success = setup_azure_credentials(demo=True)
    
    if success:
        print("\n🎉 Setup dokončen! Nyní můžeš spustit:")
        print("   python test_ocr_real_vs_fallback.py")
    else:
        print("\n❌ Setup selhal. Zkontroluj parametry a zkus znovu.")
