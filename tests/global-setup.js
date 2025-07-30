const TestEnvironmentSetup = require('./setup-test-environment');

async function globalSetup() {
  console.log('🌍 Global setup for ASKELIO AI endpoints tests...');
  
  const setup = new TestEnvironmentSetup();
  
  try {
    // Setup test environment
    await setup.setupEnvironment();
    
    // Create test user
    await setup.createTestUser();
    
    // Store setup instance for cleanup
    global.testSetup = setup;
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

module.exports = globalSetup;
