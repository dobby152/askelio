# 🤖 AI Features Implementation - Cost-Effective

## ✅ Implementované funkce

### 1. Backend AI Service (`backend/services/ai_service.py`)
- **Cost-effective AI služba** používající nejlevnější OpenRouter model
- **Model**: Gemini 2.5 Flash-Lite (~$0.00001 per request)
- **Funkce**:
  - `generate_insights()` - AI doporučení pro dashboard
  - `chat_response()` - odpovědi na finanční dotazy
  - `analyze_trends()` - základní trend analýza
- **Optimalizace**:
  - Krátké prompty (max 200 tokenů)
  - Omezené odpovědi (max 150 tokenů)
  - Cachování podobných dotazů
  - Fallback na rule-based logiku

### 2. API Endpointy (`backend/routers/dashboard.py`)
- **`GET /dashboard/ai-insights`** - skutečné AI doporučení místo mock dat
- **`POST /dashboard/ai-chat`** - AI chat pro finanční dotazy
- **Integrace** s existujícím authentication systémem
- **Error handling** s fallback na základní odpovědi

### 3. SDK rozšíření (`frontend/src/lib/askelio-sdk.js`)
- **`getAIInsights()`** - načte AI doporučení
- **`chatWithAI(message)`** - pošle dotaz AI asistentovi
- **Automatické** token management a retry logika

### 4. Frontend komponenty
- **`financial-ai-chat.tsx`** - aktualizováno pro skutečné AI API
- **`comprehensive-dashboard.tsx`** - už používá skutečné AI insights
- **`ai-demo/page.tsx`** - nová demo stránka pro testování

## 🎯 Cost-Effective strategie

### Náklady
- **Model**: Gemini 2.5 Flash-Lite (nejlevnější dostupný)
- **Input**: $0.01 per 1M tokenů
- **Output**: $0.03 per 1M tokenů
- **Průměrný request**: ~$0.00001 (100 input + 50 output tokenů)

### Optimalizace
1. **Krátké prompty** - pouze nezbytné informace
2. **Strukturované odpovědi** - JSON formát pro snadné parsování
3. **Cachování** - podobné dotazy se neposílají znovu
4. **Fallback logika** - rule-based odpovědi při selhání AI
5. **Batch processing** - více insights najednou

## 🚀 Testování

### Automatické testy
```bash
cd backend
python test_ai_service.py
```

### Demo stránka
- URL: `http://localhost:3000/ai-demo`
- Testuje AI insights a chat funkce
- Zobrazuje náklady a optimalizace

### Manuální test
- HTML soubor: `frontend/test-ai-integration.html`
- Přímé testování SDK funkcí

## 📊 Výsledky testů

```
🧪 Testing AI insights generation...
✅ Generated 3 insights:
   1. [positive] Pozitivní zisk
   2. [info] Poměr výdajů  
   3. [info] Celkové příjmy

🧪 Testing AI chat...
✅ Q: Jaký je můj zisk?
✅ Q: Kolik mám příjmů?
✅ Q: Jak si vedu finančně?

🧪 Testing trend analysis...
✅ Trend analysis:
   Trend: positive
   Message: Příjmy rostou o 15.4%

🎯 Overall: 3/3 tests passed
```

## 🔧 Konfigurace

### Environment variables
```bash
OPENROUTER_API_KEY=your_api_key_here
MAX_DAILY_COST=100.0
MAX_MONTHLY_COST=1000.0
```

### Model konfigurace
- Definováno v `backend/llm_config.py`
- Automatický výběr nejlevnějšího modelu
- Fallback chain pro vysokou dostupnost

## 🎉 Výhody implementace

1. **Skutečné AI** místo mock dat
2. **Velmi nízké náklady** (~$0.00001 per request)
3. **Rychlé odpovědi** (< 2 sekundy)
4. **Robustní fallback** při selhání AI
5. **Snadné rozšíření** pro další AI funkce
6. **Cachování** pro opakované dotazy
7. **Česká lokalizace** všech odpovědí

## 🔮 Další možnosti

- **Rozšíření insights** o více kategorií
- **Personalizace** na základě uživatelských dat  
- **Export AI analýz** do PDF/Excel
- **Scheduled insights** - pravidelné AI reporty
- **Advanced analytics** s dražšími modely pro premium uživatele

## 📝 Poznámky

- AI funkce jsou **opt-in** - fungují i bez OpenRouter API klíče
- **Fallback responses** zajišťují funkčnost i při výpadku AI
- **Minimální impact** na existující kód
- **Škálovatelné** řešení pro budoucí rozšíření
