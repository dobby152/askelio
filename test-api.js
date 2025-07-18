// Test API calls
async function testAPI() {
  try {
    console.log('Testing documents API...');
    
    // Test get all documents
    const response = await fetch('http://localhost:8000/documents');
    const documents = await response.json();
    console.log('Documents:', documents);
    
    if (documents.length > 0) {
      const docId = documents[0].id;
      console.log('Testing specific document with ID:', docId);
      
      // Test get specific document
      const docResponse = await fetch(`http://localhost:8000/documents/${docId}`);
      const document = await docResponse.json();
      console.log('Document details:', document);
      
      // Test preview URL
      const previewUrl = `http://localhost:8000/documents/${docId}/preview`;
      console.log('Preview URL:', previewUrl);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
