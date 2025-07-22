/**
 * Frontend Example: Jak pracovat s Gemini strukturovanými daty
 * Ukazuje, jak frontend může využít nová API data
 */

// Simulace API odpovědi s Gemini strukturovanými daty
const apiResponse = {
  "status": "success",
  "file_name": "faktura-2024-001.pdf",
  "processing_time": 2.45,
  "confidence": 0.95,
  "selected_provider": "google_vision",
  
  // 🎯 HLAVNÍ STRUKTUROVANÁ DATA - Gemini nebo Basic
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
      },
      {
        "description": "Podpora",
        "quantity": "12",
        "unit_price": "416.67",
        "total_price": "5000.00"
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
    "method": "gemini",
    "gemini_used": true,
    "gemini_confidence": 0.95,
    "basic_confidence": 0.75
  },
  
  // Detaily Gemini analýzy
  "gemini_analysis": {
    "success": true,
    "confidence": 0.95,
    "validation_notes": "Standardizováno datum na ISO formát, extrahována všechna IČO/DIČ",
    "fields_extracted": ["invoice_number", "date_issued", "total_amount", "vendor"],
    "processing_time": 1.23
  }
};

/**
 * Funkce pro extrakci dat pro frontend
 */
class InvoiceDataExtractor {
  constructor(apiResponse) {
    this.response = apiResponse;
    this.structuredData = apiResponse.structured_data || {};
    this.dataSource = apiResponse.data_source || {};
    this.geminiAnalysis = apiResponse.gemini_analysis || {};
  }

  // Základní informace o dokumentu
  getDocumentInfo() {
    return {
      fileName: this.response.file_name,
      documentType: this.structuredData.document_type || 'unknown',
      processingTime: this.response.processing_time,
      confidence: this.response.confidence,
      dataSource: this.dataSource.method || 'unknown',
      geminiUsed: this.dataSource.gemini_used || false
    };
  }

  // Číslo faktury
  getInvoiceNumber() {
    return this.structuredData.invoice_number || 
           this.structuredData.fields?.invoice_number || 
           null;
  }

  // Data
  getDates() {
    return {
      issued: this.structuredData.date_issued || 
              this.structuredData.fields?.date || 
              null,
      due: this.structuredData.due_date || null
    };
  }

  // Částky
  getAmounts() {
    const totalAmount = this.structuredData.total_amount;
    const taxInfo = this.structuredData.tax_info;
    
    if (typeof totalAmount === 'object' && totalAmount.value) {
      return {
        total: {
          value: parseFloat(totalAmount.value),
          currency: totalAmount.currency || 'CZK',
          formatted: `${totalAmount.value} ${totalAmount.currency || 'CZK'}`
        },
        withoutVat: taxInfo?.total_without_vat ? parseFloat(taxInfo.total_without_vat) : null,
        vat: {
          rate: taxInfo?.vat_rate ? parseFloat(taxInfo.vat_rate) : null,
          amount: taxInfo?.vat_amount ? parseFloat(taxInfo.vat_amount) : null
        }
      };
    }
    
    // Fallback pro basic strukturování
    const basicAmount = this.structuredData.fields?.total_amount;
    return {
      total: {
        value: basicAmount ? parseFloat(basicAmount) : null,
        currency: 'CZK',
        formatted: basicAmount ? `${basicAmount} CZK` : null
      },
      withoutVat: null,
      vat: { rate: null, amount: null }
    };
  }

  // Dodavatel
  getVendor() {
    const vendor = this.structuredData.vendor;
    
    if (typeof vendor === 'object') {
      return {
        name: vendor.name || null,
        ico: vendor.ico || null,
        dic: vendor.dic || null,
        address: vendor.address || null
      };
    }
    
    // Fallback pro basic strukturování
    return {
      name: vendor || this.structuredData.fields?.vendor || null,
      ico: null,
      dic: null,
      address: null
    };
  }

  // Odběratel
  getCustomer() {
    const customer = this.structuredData.customer;
    
    if (typeof customer === 'object') {
      return {
        name: customer.name || null,
        ico: customer.ico || null,
        dic: customer.dic || null
      };
    }
    
    return { name: null, ico: null, dic: null };
  }

  // Položky faktury
  getLineItems() {
    const items = this.structuredData.line_items;
    
    if (Array.isArray(items)) {
      return items.map(item => ({
        description: item.description || '',
        quantity: item.quantity ? parseFloat(item.quantity) : null,
        unitPrice: item.unit_price ? parseFloat(item.unit_price) : null,
        totalPrice: item.total_price ? parseFloat(item.total_price) : null
      }));
    }
    
    return [];
  }

  // Kvalita extrakce
  getQualityInfo() {
    return {
      confidence: this.response.confidence,
      dataSource: this.dataSource.method,
      geminiUsed: this.dataSource.gemini_used,
      geminiConfidence: this.dataSource.gemini_confidence,
      validationNotes: this.geminiAnalysis.validation_notes,
      fieldsExtracted: this.geminiAnalysis.fields_extracted || []
    };
  }

  // Kompletní extrakce pro frontend
  extractAll() {
    return {
      document: this.getDocumentInfo(),
      invoiceNumber: this.getInvoiceNumber(),
      dates: this.getDates(),
      amounts: this.getAmounts(),
      vendor: this.getVendor(),
      customer: this.getCustomer(),
      lineItems: this.getLineItems(),
      quality: this.getQualityInfo()
    };
  }
}

/**
 * Ukázka použití ve frontend komponentě
 */
function displayInvoiceData(apiResponse) {
  const extractor = new InvoiceDataExtractor(apiResponse);
  const data = extractor.extractAll();
  
  console.log('📄 INVOICE DATA FOR FRONTEND:');
  console.log('================================');
  
  // Základní info
  console.log(`📋 Dokument: ${data.document.fileName}`);
  console.log(`🔢 Číslo faktury: ${data.invoiceNumber || 'N/A'}`);
  console.log(`📅 Datum vystavení: ${data.dates.issued || 'N/A'}`);
  console.log(`⏰ Splatnost: ${data.dates.due || 'N/A'}`);
  
  // Částky
  if (data.amounts.total.value) {
    console.log(`💰 Celkem: ${data.amounts.total.formatted}`);
    if (data.amounts.withoutVat) {
      console.log(`💸 Bez DPH: ${data.amounts.withoutVat} CZK`);
    }
    if (data.amounts.vat.rate) {
      console.log(`📊 DPH: ${data.amounts.vat.rate}% (${data.amounts.vat.amount} CZK)`);
    }
  }
  
  // Dodavatel
  const vendor = data.vendor;
  if (vendor.name) {
    console.log(`🏢 Dodavatel: ${vendor.name}`);
    if (vendor.ico) console.log(`   📋 IČO: ${vendor.ico}`);
    if (vendor.dic) console.log(`   📋 DIČ: ${vendor.dic}`);
    if (vendor.address) console.log(`   📍 Adresa: ${vendor.address}`);
  }
  
  // Odběratel
  const customer = data.customer;
  if (customer.name) {
    console.log(`👤 Odběratel: ${customer.name}`);
    if (customer.ico) console.log(`   📋 IČO: ${customer.ico}`);
  }
  
  // Položky
  if (data.lineItems.length > 0) {
    console.log(`📦 Položky (${data.lineItems.length} ks):`);
    data.lineItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.description}`);
      if (item.quantity) console.log(`      Množství: ${item.quantity}`);
      if (item.totalPrice) console.log(`      Cena: ${item.totalPrice} CZK`);
    });
  }
  
  // Kvalita
  console.log('\n📊 KVALITA EXTRAKCE:');
  console.log(`🎯 Confidence: ${data.quality.confidence}`);
  console.log(`🤖 Zdroj: ${data.quality.dataSource.toUpperCase()}`);
  console.log(`✨ Gemini použito: ${data.quality.geminiUsed ? '✅' : '❌'}`);
  if (data.quality.validationNotes) {
    console.log(`📝 Poznámky: ${data.quality.validationNotes}`);
  }
  
  return data;
}

/**
 * React komponenta příklad
 */
const InvoiceDisplay = ({ apiResponse }) => {
  const extractor = new InvoiceDataExtractor(apiResponse);
  const data = extractor.extractAll();
  
  return (
    <div className="invoice-display">
      <div className="invoice-header">
        <h2>Faktura {data.invoiceNumber}</h2>
        <div className="quality-badge">
          {data.quality.geminiUsed ? (
            <span className="badge-gemini">🤖 Gemini AI</span>
          ) : (
            <span className="badge-basic">📝 Basic</span>
          )}
          <span className="confidence">{Math.round(data.quality.confidence * 100)}%</span>
        </div>
      </div>
      
      <div className="invoice-details">
        <div className="dates">
          <p>📅 Vystaveno: {data.dates.issued}</p>
          {data.dates.due && <p>⏰ Splatnost: {data.dates.due}</p>}
        </div>
        
        <div className="amount">
          <h3>💰 {data.amounts.total.formatted}</h3>
          {data.amounts.vat.rate && (
            <p>DPH {data.amounts.vat.rate}%: {data.amounts.vat.amount} CZK</p>
          )}
        </div>
        
        <div className="parties">
          {data.vendor.name && (
            <div className="vendor">
              <h4>🏢 Dodavatel</h4>
              <p>{data.vendor.name}</p>
              {data.vendor.ico && <p>IČO: {data.vendor.ico}</p>}
            </div>
          )}
          
          {data.customer.name && (
            <div className="customer">
              <h4>👤 Odběratel</h4>
              <p>{data.customer.name}</p>
            </div>
          )}
        </div>
        
        {data.lineItems.length > 0 && (
          <div className="line-items">
            <h4>📦 Položky</h4>
            {data.lineItems.map((item, index) => (
              <div key={index} className="line-item">
                <span>{item.description}</span>
                <span>{item.totalPrice} CZK</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Spuštění ukázky
console.log('🚀 FRONTEND EXAMPLE: Gemini Structured Data');
console.log('='.repeat(60));
displayInvoiceData(apiResponse);
