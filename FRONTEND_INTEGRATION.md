# Frontend Integrace: Gemini Strukturovaná Data

## 🎯 Přehled

API nyní vrací přímo strukturovaná data od Gemini AI, připravená k použití ve frontend aplikaci. Frontend dostává inteligentně zpracovaná data místo surového OCR textu.

## 📡 API Odpověď

### Hlavní Endpointy
- `POST /process-invoice` - Kompletní zpracování s Gemini strukturováním
- `POST /documents/upload` - Upload s automatickým strukturováním

### Struktura Odpovědi

```json
{
  "status": "success",
  "file_name": "faktura-2024-001.pdf",
  "processing_time": 2.45,
  "confidence": 0.95,
  "selected_provider": "google_vision",
  
  // 🎯 HLAVNÍ DATA PRO FRONTEND
  "structured_data": {
    "document_type": "invoice",
    "invoice_number": "2024-001",
    "date_issued": "2024-07-21",
    "due_date": "2024-08-05",
    "total_amount": {
      "value": "24200.00",
      "currency": "CZK"
    },
    "vendor": {
      "name": "ABC s.r.o.",
      "ico": "12345678",
      "dic": "CZ12345678",
      "address": "Hlavní 123, Praha"
    },
    "customer": {
      "name": "XYZ spol. s r.o.",
      "ico": "87654321"
    },
    "line_items": [
      {
        "description": "Software licence",
        "quantity": "1",
        "unit_price": "15000.00",
        "total_price": "15000.00"
      }
    ],
    "tax_info": {
      "vat_rate": "21",
      "vat_amount": "4200.00",
      "total_without_vat": "20000.00"
    }
  },
  
  // Informace o zdroji dat
  "data_source": {
    "method": "gemini",        // "gemini" nebo "basic"
    "gemini_used": true,
    "gemini_confidence": 0.95,
    "basic_confidence": 0.75
  },
  
  // Detaily Gemini analýzy
  "gemini_analysis": {
    "success": true,
    "confidence": 0.95,
    "validation_notes": "Standardizováno datum na ISO formát...",
    "fields_extracted": ["invoice_number", "date_issued", "total_amount"],
    "processing_time": 1.23
  }
}
```

## 🔧 Frontend Implementace

### 1. Základní Extrakce Dat

```javascript
// Extrakce hlavních dat
const data = response.structured_data;

// Číslo faktury
const invoiceNumber = data.invoice_number;

// Datum (ISO formát)
const dateIssued = data.date_issued; // "2024-07-21"

// Částka
const totalAmount = data.total_amount.value; // "24200.00"
const currency = data.total_amount.currency; // "CZK"

// Dodavatel
const vendorName = data.vendor.name;
const vendorICO = data.vendor.ico;
```

### 2. Fallback pro Basic Data

```javascript
// Univerzální extrakce s fallbackem
function getInvoiceNumber(response) {
  const data = response.structured_data;
  
  // Gemini formát
  if (data.invoice_number) {
    return data.invoice_number;
  }
  
  // Basic formát
  if (data.fields && data.fields.invoice_number) {
    return data.fields.invoice_number;
  }
  
  return null;
}
```

### 3. Kontrola Zdroje Dat

```javascript
// Zjištění, zda byla použita Gemini AI
const isGeminiUsed = response.data_source.gemini_used;
const dataSource = response.data_source.method; // "gemini" nebo "basic"

// Zobrazení indikátoru kvality
if (isGeminiUsed) {
  showBadge("🤖 Gemini AI", "high-quality");
} else {
  showBadge("📝 Basic", "standard-quality");
}
```

### 4. React Komponenta

```jsx
const InvoiceCard = ({ apiResponse }) => {
  const data = apiResponse.structured_data;
  const source = apiResponse.data_source;
  
  return (
    <div className="invoice-card">
      <div className="header">
        <h3>Faktura {data.invoice_number}</h3>
        <QualityBadge 
          geminiUsed={source.gemini_used}
          confidence={apiResponse.confidence}
        />
      </div>
      
      <div className="details">
        <div className="amount">
          <span className="value">{data.total_amount?.value}</span>
          <span className="currency">{data.total_amount?.currency}</span>
        </div>
        
        <div className="dates">
          <p>Vystaveno: {formatDate(data.date_issued)}</p>
          {data.due_date && (
            <p>Splatnost: {formatDate(data.due_date)}</p>
          )}
        </div>
        
        <div className="vendor">
          <h4>Dodavatel</h4>
          <p>{data.vendor?.name}</p>
          {data.vendor?.ico && <p>IČO: {data.vendor.ico}</p>}
        </div>
        
        {data.line_items?.length > 0 && (
          <div className="items">
            <h4>Položky ({data.line_items.length})</h4>
            {data.line_items.map((item, index) => (
              <div key={index} className="item">
                <span>{item.description}</span>
                <span>{item.total_price} {data.total_amount?.currency}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

## 📊 Typy Dat

### Gemini Strukturovaná Data
```typescript
interface GeminiStructuredData {
  document_type: string;
  invoice_number?: string;
  date_issued?: string;        // ISO format: "2024-07-21"
  due_date?: string;
  total_amount?: {
    value: string;             // "24200.00"
    currency: string;          // "CZK"
  };
  vendor?: {
    name?: string;
    ico?: string;
    dic?: string;
    address?: string;
  };
  customer?: {
    name?: string;
    ico?: string;
    dic?: string;
  };
  line_items?: Array<{
    description: string;
    quantity?: string;
    unit_price?: string;
    total_price?: string;
  }>;
  tax_info?: {
    vat_rate?: string;         // "21"
    vat_amount?: string;       // "4200.00"
    total_without_vat?: string;
  };
}
```

### Basic Strukturovaná Data (Fallback)
```typescript
interface BasicStructuredData {
  raw_text: string;
  extraction_timestamp: string;
  fields: {
    invoice_number?: string;
    date?: string;             // "21.07.2024"
    total_amount?: string;     // "24"
    vendor?: string;
  };
  extraction_confidence: number;
}
```

## 🎨 UI/UX Doporučení

### 1. Indikátory Kvality
```jsx
const QualityBadge = ({ geminiUsed, confidence }) => (
  <div className={`quality-badge ${geminiUsed ? 'gemini' : 'basic'}`}>
    {geminiUsed ? (
      <>
        <span className="icon">🤖</span>
        <span>Gemini AI</span>
      </>
    ) : (
      <>
        <span className="icon">📝</span>
        <span>Basic</span>
      </>
    )}
    <span className="confidence">{Math.round(confidence * 100)}%</span>
  </div>
);
```

### 2. Progresivní Zobrazení
```javascript
// Zobraz data postupně podle dostupnosti
function renderInvoiceData(data) {
  // Vždy dostupné
  if (data.invoice_number) renderInvoiceNumber(data.invoice_number);
  
  // Gemini obvykle extrahuje více
  if (data.vendor?.ico) renderVendorDetails(data.vendor);
  if (data.line_items?.length > 0) renderLineItems(data.line_items);
  if (data.tax_info) renderTaxInfo(data.tax_info);
  
  // Fallback pro basic data
  if (data.fields) renderBasicFields(data.fields);
}
```

### 3. Validační Poznámky
```jsx
const ValidationNotes = ({ geminiAnalysis }) => {
  if (!geminiAnalysis.validation_notes) return null;
  
  return (
    <div className="validation-notes">
      <h4>📝 Poznámky k extrakci</h4>
      <p>{geminiAnalysis.validation_notes}</p>
      <small>
        Extrahováno {geminiAnalysis.fields_extracted.length} polí 
        za {geminiAnalysis.processing_time.toFixed(2)}s
      </small>
    </div>
  );
};
```

## 🔍 Debugging

### Kontrola Dat
```javascript
// Debug informace
console.log('Data source:', response.data_source.method);
console.log('Gemini used:', response.data_source.gemini_used);
console.log('Fields extracted:', response.gemini_analysis.fields_extracted);
console.log('Validation notes:', response.gemini_analysis.validation_notes);
```

### Chybové Stavy
```javascript
// Kontrola úspěšnosti
if (response.status !== 'success') {
  showError(response.message);
  return;
}

// Kontrola dostupnosti dat
if (!response.structured_data) {
  showWarning('Žádná strukturovaná data nebyla extrahována');
  return;
}

// Kontrola Gemini
if (!response.data_source.gemini_used) {
  showInfo('Použita základní extrakce (Gemini nedostupný)');
}
```

## 🚀 Výhody pro Frontend

✅ **Připravená data**: Žádné parsování OCR textu  
✅ **Standardní formáty**: ISO data, číselné hodnoty  
✅ **Hierarchická struktura**: Dodavatel, položky, daně  
✅ **Fallback mechanismus**: Vždy nějaká data  
✅ **Kvalitní indikátory**: Confidence, zdroj dat  
✅ **Validační poznámky**: Gemini vysvětluje změny  

## 📝 Příklad Kompletní Implementace

Viz `frontend_example.js` pro kompletní ukázku s extraktorem dat a React komponentami.
