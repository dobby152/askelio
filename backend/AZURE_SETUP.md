# Azure Computer Vision Setup

Tento dokument popisuje, jak nastavit skutečné Azure Computer Vision credentials pro produkční použití.

## Aktuální stav

- ✅ **Demo implementace**: Funkční demo Azure Computer Vision service
- ⚠️ **Produkční credentials**: Vyžadují Azure účet a nastavení

## Demo vs. Produkční credentials

### Demo credentials (aktuálně aktivní)
```env
AZURE_COMPUTER_VISION_ENDPOINT=https://demo-ocr-service.cognitiveservices.azure.com/
AZURE_COMPUTER_VISION_KEY=demo-key-12345678901234567890123456789012
```

- Používá Tesseract jako backend
- Simuluje Azure API responses
- Confidence: 0.92
- Vhodné pro vývoj a testování

### Produkční credentials
Pro skutečné Azure Computer Vision API potřebujete:

```env
AZURE_COMPUTER_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_COMPUTER_VISION_KEY=your-32-character-azure-key
```

## Jak získat produkční Azure credentials

### Metoda 1: Azure Portal (Web UI)

1. **Přihlaste se do Azure Portal**
   - Jděte na https://portal.azure.com
   - Přihlaste se pomocí Microsoft účtu

2. **Vytvořte Computer Vision resource**
   - Klikněte na "Create a resource"
   - Vyhledejte "Computer Vision"
   - Klikněte na "Create"

3. **Nakonfigurujte resource**
   - **Subscription**: Vyberte vaši Azure subscription
   - **Resource Group**: Vytvořte novou nebo použijte existující
   - **Region**: Vyberte nejbližší region (např. West Europe)
   - **Name**: Zadejte jedinečný název (např. "askelio-ocr-service")
   - **Pricing tier**: Vyberte F0 (Free) pro testování nebo S1 pro produkci

4. **Získejte credentials**
   - Po vytvoření jděte do resource
   - V levém menu klikněte na "Keys and Endpoint"
   - Zkopírujte:
     - **Endpoint**: URL endpoint
     - **Key 1**: Primární klíč

### Metoda 2: Azure CLI

```bash
# Přihlášení
az login

# Vytvoření resource group
az group create --name askelio-rg --location westeurope

# Vytvoření Computer Vision service
az cognitiveservices account create \
  --name askelio-ocr-service \
  --resource-group askelio-rg \
  --kind ComputerVision \
  --sku F0 \
  --location westeurope

# Získání klíčů
az cognitiveservices account keys list \
  --name askelio-ocr-service \
  --resource-group askelio-rg

# Získání endpoint
az cognitiveservices account show \
  --name askelio-ocr-service \
  --resource-group askelio-rg \
  --query "properties.endpoint"
```

### Metoda 3: Azure PowerShell

```powershell
# Přihlášení
Connect-AzAccount

# Vytvoření resource group
New-AzResourceGroup -Name "askelio-rg" -Location "West Europe"

# Vytvoření Computer Vision service
New-AzCognitiveServicesAccount `
  -ResourceGroupName "askelio-rg" `
  -Name "askelio-ocr-service" `
  -Type "ComputerVision" `
  -SkuName "F0" `
  -Location "West Europe"

# Získání klíčů
Get-AzCognitiveServicesAccountKey `
  -ResourceGroupName "askelio-rg" `
  -Name "askelio-ocr-service"
```

## Aktualizace .env souboru

Po získání credentials aktualizujte `.env` soubor:

```env
# Nahraďte demo credentials skutečnými
AZURE_COMPUTER_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_COMPUTER_VISION_KEY=your-32-character-azure-key
```

## Ověření nastavení

Spusťte test pro ověření:

```bash
cd backend
python test_ocr_real_vs_fallback.py
```

Měli byste vidět:
- Azure Computer Vision: status "real" (místo "fallback")
- Vyšší přesnost a rychlost než demo implementace

## Cenové informace

### Free tier (F0)
- 20 transakcí za minutu
- 5,000 transakcí za měsíc
- Zdarma

### Standard tier (S1)
- 10 transakcí za sekundu
- $1.00 za 1,000 transakcí
- Bez měsíčního limitu

## Troubleshooting

### Chyba: "Access denied"
- Zkontrolujte, že máte správné permissions v Azure
- Ověřte, že resource je správně vytvořený

### Chyba: "Invalid endpoint"
- Endpoint musí končit lomítkem `/`
- Formát: `https://your-name.cognitiveservices.azure.com/`

### Chyba: "Invalid key"
- Klíč musí být 32 znaků dlouhý
- Zkontrolujte, že používáte Key 1 nebo Key 2 (ne connection string)

## Kontakt

Pro další pomoc s nastavením Azure credentials kontaktujte administrátora systému.
