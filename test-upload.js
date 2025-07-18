const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function uploadTestFile() {
  try {
    // Create a simple test file
    const testContent = 'FAKTURA\nDodavatel: Test Company s.r.o.\nČástka: 15,000 CZK\nDatum: 2025-01-18';
    fs.writeFileSync('test-faktura.txt', testContent);
    
    const form = new FormData();
    form.append('file', fs.createReadStream('test-faktura.txt'));
    
    const response = await fetch('http://localhost:8000/documents/upload', {
      method: 'POST',
      body: form
    });
    
    const result = await response.json();
    console.log('Upload result:', result);
    
    // Clean up
    fs.unlinkSync('test-faktura.txt');
    
  } catch (error) {
    console.error('Upload error:', error);
  }
}

uploadTestFile();
