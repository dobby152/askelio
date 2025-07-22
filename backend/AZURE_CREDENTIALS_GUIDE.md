
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
python azure_credentials_setup.py --real \
  --endpoint "https://your-resource.cognitiveservices.azure.com/" \
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
az cognitiveservices account create \
  --name askelio-ocr-service \
  --resource-group askelio-rg \
  --kind ComputerVision \
  --sku F0 \
  --location westeurope

# Získej credentials
az cognitiveservices account keys list \
  --name askelio-ocr-service \
  --resource-group askelio-rg

az cognitiveservices account show \
  --name askelio-ocr-service \
  --resource-group askelio-rg \
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
