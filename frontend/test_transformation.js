/**
 * Test script to verify frontend data transformation
 */

// Mock API data (based on real data from backend)
const mockApiData = [
  {
    "id": "aa87cdc0-38e0-45bc-a9d1-fc3f283b8e64",
    "filename": "test-outgoing-invoice.pdf",
    "file_name": "test-outgoing-invoice.pdf",
    "status": "completed",
    "confidence": 0.98,
    "accuracy": 0.98,
    "processing_time": 2.5,
    "cost_czk": 0.15,
    "provider_used": "google_vision",
    "created_at": "2025-01-15T10:30:00Z",
    "processed_at": "2025-01-15T10:30:05Z",
    "file_path": "/uploads/test-outgoing-invoice.pdf",
    "size": 245760,
    "file_size": 245760,
    "pages": 1,
    "type": "application/pdf",
    "file_type": "application/pdf",
    "structured_data": {
      "totals": {
        "total": 50000,
        "vat_amount": 10500
      },
      "vendor": {
        "dic": "CZ26757125",
        "ico": "26757125",
        "name": "Askela s.r.o."
      },
      "customer": {
        "dic": "CZ98765432",
        "ico": "98765432",
        "name": "External Customer Ltd."
      }
    },
    "extracted_data": {
      "totals": {
        "total": 50000,
        "vat_amount": 10500
      },
      "vendor": {
        "dic": "CZ26757125",
        "ico": "26757125",
        "name": "Askela s.r.o."
      },
      "customer": {
        "dic": "CZ98765432",
        "ico": "98765432",
        "name": "External Customer Ltd."
      }
    },
    "invoice_direction": "outgoing",
    "direction_confidence": 0.98,
    "direction_method": "automatic",
    "financial_category": "revenue",
    "requires_manual_review": false,
    "error_message": null
  },
  {
    "id": "e3e36300-0341-4493-8f03-b40f0f1d0589",
    "filename": "faktura_003.pdf",
    "file_name": "faktura_003.pdf",
    "status": "pending_approval",
    "confidence": 0.0,
    "accuracy": 0.0,
    "processing_time": null,
    "cost_czk": 0.0,
    "provider_used": null,
    "created_at": "2025-01-15T09:00:00Z",
    "processed_at": null,
    "file_path": "/uploads/faktura_003.pdf",
    "size": 180000,
    "file_size": 180000,
    "pages": 1,
    "type": "application/pdf",
    "file_type": "application/pdf",
    "structured_data": {},
    "extracted_data": {},
    "invoice_direction": "unknown",
    "direction_confidence": 0.0,
    "direction_method": null,
    "financial_category": null,
    "requires_manual_review": false,
    "error_message": null
  }
];

// Frontend transformation function (copied from documents-table.tsx)
function transformDocument(doc) {
  console.log('🔄 Transforming document:', doc);

  // Extract vendor information from structured data
  const structuredData = doc.structured_data || doc.extracted_data || {};
  const vendorInfo = structuredData.vendor || {};
  
  const transformed = {
    id: doc.id?.toString() || 'unknown',
    name: doc.file_name || doc.filename || doc.name || 'Unknown Document',
    type: doc.type === 'application/pdf' || doc.file_type === 'application/pdf' ? 'pdf' : 'image',
    status: doc.status === 'completed' ? 'completed' :
           doc.status === 'processing' ? 'processing' :
           doc.status === 'failed' ? 'error' : 'error',
    accuracy: typeof doc.accuracy === 'string'
      ? parseFloat(doc.accuracy.replace('%', '') || '0')
      : parseFloat(doc.accuracy?.toString() || '0'),
    processedAt: doc.processed_at || doc.created_at || new Date().toISOString(),
    size: doc.size || doc.file_size || '0 MB',
    pages: doc.pages || 1,
    extractedData: {
      vendor: vendorInfo.name || 'Neznámý dodavatel',
      amount: structuredData.total_amount || structuredData.amount,
      currency: structuredData.currency || 'CZK',
      date: structuredData.date,
      invoice_number: structuredData.invoice_number
    },
    // Invoice direction fields
    invoice_direction: doc.invoice_direction || 'unknown',
    direction_confidence: doc.direction_confidence || 0,
    direction_method: doc.direction_method,
    financial_category: doc.financial_category || 'unknown',
    requires_manual_review: doc.requires_manual_review || false,
    errorMessage: doc.error_message
  };

  console.log('✅ Transformed document:', transformed);
  return transformed;
}

// Test transformation
console.log('🧪 Testing Frontend Data Transformation\n');

mockApiData.forEach((doc, index) => {
  console.log(`\n📋 Testing Document ${index + 1}: ${doc.filename}`);
  console.log('📥 Input data:');
  console.log(`  Status: ${doc.status}`);
  console.log(`  Invoice Direction: ${doc.invoice_direction}`);
  console.log(`  Has structured_data: ${Object.keys(doc.structured_data).length > 0}`);
  console.log(`  Vendor in structured_data: ${!!doc.structured_data.vendor}`);
  
  const transformed = transformDocument(doc);
  
  console.log('📤 Transformed data:');
  console.log(`  Name: ${transformed.name}`);
  console.log(`  Status: ${transformed.status}`);
  console.log(`  Vendor: ${transformed.extractedData.vendor}`);
  console.log(`  Invoice Direction: ${transformed.invoice_direction}`);
  console.log(`  Direction Confidence: ${transformed.direction_confidence}`);
  console.log(`  Financial Category: ${transformed.financial_category}`);
  
  // Check if transformation is correct
  if (doc.status === 'completed') {
    if (transformed.extractedData.vendor === 'Neznámý dodavatel') {
      console.log('❌ ERROR: Completed document should have vendor name!');
    } else {
      console.log('✅ OK: Vendor name correctly extracted');
    }
    
    if (transformed.invoice_direction === 'unknown') {
      console.log('❌ ERROR: Completed document should have known direction!');
    } else {
      console.log('✅ OK: Invoice direction correctly set');
    }
  } else {
    if (transformed.extractedData.vendor === 'Neznámý dodavatel') {
      console.log('✅ OK: Pending document shows unknown vendor (expected)');
    }
    
    if (transformed.invoice_direction === 'unknown') {
      console.log('✅ OK: Pending document has unknown direction (expected)');
    }
  }
});

console.log('\n🎯 Test Summary:');
console.log('- Completed documents should show vendor name and direction');
console.log('- Pending documents should show "Neznámý dodavatel" and unknown direction');
console.log('- Frontend transformation should handle both cases correctly');
