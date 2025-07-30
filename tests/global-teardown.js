async function globalTeardown() {
  console.log('🧹 Global teardown for ASKELIO AI endpoints tests...');
  
  try {
    // Cleanup test environment if setup instance exists
    if (global.testSetup) {
      await global.testSetup.cleanup();
    }
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

module.exports = globalTeardown;
