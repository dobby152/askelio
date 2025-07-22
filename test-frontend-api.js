// Test frontend API calls
async function testFrontendAPI() {
  console.log('🧪 Testing frontend API calls...');
  
  try {
    // Test backend API directly
    console.log('📡 Testing backend API directly...');
    const backendResponse = await fetch('http://localhost:8000/documents');
    const backendData = await backendResponse.json();
    console.log('✅ Backend API response:', backendData);
    
    // Test if frontend can reach backend
    console.log('🌐 Testing frontend to backend connection...');
    const frontendResponse = await fetch('http://localhost:3000/api/test');
    console.log('Frontend API test:', frontendResponse.status);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run test
testFrontendAPI();
