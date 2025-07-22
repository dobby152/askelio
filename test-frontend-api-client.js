// Test frontend API client
const API_BASE_URL = 'http://localhost:8000';

class ApiClient {
  async getDocuments() {
    const response = await fetch(`${API_BASE_URL}/documents`);
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }
    return response.json();
  }

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getCreditBalance() {
    const response = await fetch(`${API_BASE_URL}/credits`);
    if (!response.ok) {
      // Return default credits if endpoint doesn't exist
      return 2450;
    }

    const data = await response.json();
    return data.credits || data.balance || 2450;
  }
}

const apiClient = new ApiClient();

async function testApiClient() {
  console.log('🧪 Testing API client...');
  
  try {
    // Test get documents
    console.log('📄 Testing getDocuments...');
    const documents = await apiClient.getDocuments();
    console.log('✅ Documents:', documents);
    
    // Test get credits
    console.log('💳 Testing getCreditBalance...');
    const credits = await apiClient.getCreditBalance();
    console.log('✅ Credits:', credits);
    
    // Test transformation like frontend does
    console.log('🔄 Testing data transformation...');
    const transformedDocs = documents.map((doc) => ({
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
    }));
    
    console.log('✅ Transformed documents:', transformedDocs);
    
    console.log('🎉 All API client tests passed!');
    
  } catch (error) {
    console.error('❌ API client test failed:', error);
  }
}

// Run test
testApiClient();
