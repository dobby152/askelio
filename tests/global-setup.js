/**
 * Global Setup for Playwright Tests
 * Sets up test environment and creates test user
 */

const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Setting up test environment...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Check if backend is running
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
    
    console.log(`📡 Checking backend at ${backendUrl}/health`);
    
    const healthResponse = await page.goto(`${backendUrl}/health`);
    if (!healthResponse.ok()) {
      throw new Error(`Backend health check failed: ${healthResponse.status()}`);
    }
    
    console.log('✅ Backend is healthy');
    
    // Check if frontend is running
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    console.log(`🌐 Checking frontend at ${frontendUrl}`);
    
    const frontendResponse = await page.goto(frontendUrl);
    if (!frontendResponse.ok()) {
      throw new Error(`Frontend health check failed: ${frontendResponse.status()}`);
    }
    
    console.log('✅ Frontend is accessible');
    
    // Create test user if it doesn't exist
    await createTestUser(page, backendUrl);
    
    console.log('✅ Test environment setup complete');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function createTestUser(page, backendUrl) {
  const testUser = {
    email: 'premium@askelio.cz',
    password: 'PremiumTest123!',
    full_name: 'Premium Test User'
  };
  
  try {
    console.log('👤 Creating test user...');
    
    // Try to register the test user
    const registerResponse = await page.evaluate(async (data) => {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.testUser)
      });
      return {
        status: response.status,
        data: await response.json()
      };
    }, { testUser, backendUrl });
    
    if (registerResponse.status === 201 || registerResponse.status === 200) {
      console.log('✅ Test user created successfully');
    } else if (registerResponse.status === 409) {
      console.log('ℹ️ Test user already exists');
    } else {
      console.warn(`⚠️ Unexpected response when creating test user: ${registerResponse.status}`);
    }
    
    // Verify test user can login
    const loginResponse = await page.evaluate(async (data) => {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.testUser.email,
          password: data.testUser.password
        })
      });
      return {
        status: response.status,
        data: await response.json()
      };
    }, { testUser, backendUrl });
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✅ Test user login verified');
    } else {
      throw new Error(`Test user login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to create/verify test user:', error);
    throw error;
  }
}

module.exports = globalSetup;
