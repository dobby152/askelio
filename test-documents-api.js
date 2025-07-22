// Test documents API exactly like frontend does
async function testDocumentsAPI() {
  console.log('🧪 Testing documents API like frontend...');
  
  try {
    console.log('📡 Fetching documents from backend...');
    const response = await fetch('http://localhost:8000/documents');
    
    if (response.ok) {
      const data = await response.json();
      console.log('📄 Raw backend data:', data);

      // Transform backend data to frontend format (exactly like frontend does)
      const transformedDocs = data.map((doc) => {
        console.log('🔄 Transforming document:', doc);

        const transformed = {
          id: doc.id.toString(),
          name: doc.file_name || doc.filename || doc.name || 'Unknown',
          type: doc.type === 'application/pdf' ? 'pdf' : 'image',
          status: doc.status === 'completed' ? 'completed' :
                 doc.status === 'processing' ? 'processing' :
                 doc.status === 'failed' ? 'error' : 'error',
          accuracy: typeof doc.accuracy === 'string' 
            ? parseFloat(doc.accuracy.replace('%', '') || '0')
            : parseFloat(doc.accuracy?.toString() || '0'),
          processedAt: doc.processed_at || doc.created_at || new Date().toISOString(),
          size: doc.size || '0 MB',
          pages: doc.pages || 1,
          extractedData: doc.extracted_data || doc.extracted_text,
          errorMessage: doc.error_message
        };

        console.log('✅ Transformed document:', transformed);
        return transformed;
      });

      console.log('📋 Final documents array:', transformedDocs);
      console.log(`🎉 Successfully transformed ${transformedDocs.length} documents`);
      
      // Show summary
      transformedDocs.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.name} - ${doc.status} (${doc.accuracy}%)`);
      });
      
    } else {
      console.error('❌ Failed to fetch documents:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('💥 Error fetching documents:', error);
  }
}

// Run test
testDocumentsAPI();
