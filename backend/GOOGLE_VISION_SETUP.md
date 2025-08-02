# 🔍 Google Vision API Setup pro Askelio Backend

Tento návod vás provede nastavením Google Vision API pro OCR funkcionalitu v Askelio backendu.

## 📋 Předpoklady

- ✅ Google Cloud projekt: `crested-guru-465410-h3`
- ✅ Cloud Run služba: `askelio-backend`
- ✅ Přihlášený gcloud CLI

## 🚀 Rychlé nastavení

### 1. Povolení Google Vision API

```bash
# Nastavte projekt
gcloud config set project crested-guru-465410-h3

# Povolte Vision API
gcloud services enable vision.googleapis.com
```

### 2. Vytvoření Service Account (už vytvořen)

Service account `askelio-backend@crested-guru-465410-h3.iam.gserviceaccount.com` už existuje s oprávněními:
- `roles/vision.admin` - pro Google Vision API
- `roles/storage.admin` - pro Cloud Storage
- `roles/secretmanager.secretAccessor` - pro tajné klíče

### 3. Ověření oprávnění

```bash
# Zkontrolujte oprávnění service accountu
gcloud projects get-iam-policy crested-guru-465410-h3 \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:askelio-backend@crested-guru-465410-h3.iam.gserviceaccount.com"
```

## 🔧 Testování Google Vision API

### Test z Cloud Shell

```bash
# Otevřete Cloud Shell
gcloud cloud-shell ssh

# Vytvořte test script
cat > test_vision.py << 'EOF'
from google.cloud import vision
import io

def test_vision_api():
    """Test Google Vision API"""
    try:
        client = vision.ImageAnnotatorClient()
        
        # Test s jednoduchým textem
        image = vision.Image()
        image.source.image_uri = "gs://cloud-samples-data/vision/ocr/sign.jpg"
        
        response = client.text_detection(image=image)
        texts = response.text_annotations
        
        if texts:
            print("✅ Google Vision API funguje!")
            print(f"Detekovaný text: {texts[0].description[:100]}...")
        else:
            print("⚠️  Žádný text nebyl detekován")
            
        if response.error.message:
            raise Exception(f'{response.error.message}')
            
    except Exception as e:
        print(f"❌ Chyba: {e}")

if __name__ == "__main__":
    test_vision_api()
EOF

# Spusťte test
python3 test_vision.py
```

## 🔐 Credentials v Cloud Run

V Cloud Run se credentials nastavují automaticky pomocí service accountu. **Nepotřebujete** nastavovat:
- `GOOGLE_APPLICATION_CREDENTIALS`
- JSON klíče
- Manuální autentizaci

Cloud Run automaticky poskytne credentials pro service account `askelio-backend`.

## 📊 Monitoring a Logs

### Sledování API volání

```bash
# Zobrazit logy Cloud Run
gcloud run services logs read askelio-backend --region=europe-west1

# Sledovat logy v reálném čase
gcloud run services logs tail askelio-backend --region=europe-west1
```

### Monitoring v Cloud Console

1. Jděte na [Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Enabled APIs**
3. Klikněte na **Cloud Vision API**
4. Sledujte **Quotas**, **Metrics** a **Credentials**

## 💰 Náklady a Limity

### Pricing (aktuální ceny)
- **OCR Detection**: $1.50 za 1,000 obrázků
- **Text Detection**: $1.50 za 1,000 obrázků
- **Document Text Detection**: $1.50 za 1,000 obrázků

### Doporučené limity
```bash
# Nastavte denní limit (volitelné)
gcloud services quota update \
  --service=vision.googleapis.com \
  --consumer=projects/crested-guru-465410-h3 \
  --metric=vision.googleapis.com/requests \
  --unit=1/d \
  --value=10000
```

## 🧪 Testování v Askelio Backend

### Test endpoint

Po nasazení backendu můžete testovat OCR:

```bash
# URL vašeho backendu
BACKEND_URL="https://askelio-backend-742213261617.europe-west1.run.app"

# Test health check
curl $BACKEND_URL/health

# Test OCR endpoint (s obrázkem)
curl -X POST $BACKEND_URL/api/v1/ocr/extract \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_image.jpg"
```

## 🔧 Troubleshooting

### Časté problémy

1. **"Permission denied"**
   ```bash
   # Zkontrolujte service account oprávnění
   gcloud projects get-iam-policy crested-guru-465410-h3
   ```

2. **"API not enabled"**
   ```bash
   # Povolte Vision API
   gcloud services enable vision.googleapis.com
   ```

3. **"Quota exceeded"**
   - Zkontrolujte [Quotas & Limits](https://console.cloud.google.com/iam-admin/quotas)
   - Zvyšte limity nebo optimalizujte použití

### Debug logy

V backendu můžete povolit debug logy:

```bash
# Nastavte debug level
gcloud run services update askelio-backend \
  --region=europe-west1 \
  --set-env-vars="LOG_LEVEL=DEBUG"
```

## ✅ Checklist

- [ ] Vision API povoleno
- [ ] Service account má správná oprávnění
- [ ] Cloud Run služba běží
- [ ] Environment variables nastaveny
- [ ] Test OCR endpoint funguje
- [ ] Monitoring nastaven

## 🎉 Hotovo!

Váš Askelio backend je nyní připraven používat Google Vision API pro OCR funkcionalitu!

Pro další pomoc:
- [Google Vision API dokumentace](https://cloud.google.com/vision/docs)
- [Cloud Run dokumentace](https://cloud.google.com/run/docs)
- [Askelio deployment návod](./DEPLOYMENT.md)
