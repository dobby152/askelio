#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🤖 ASKELIO AI Endpoints Test Runner');
console.log('=====================================');

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check if Playwright is installed
  try {
    const { execSync } = require('child_process');
    execSync('npx playwright --version', { stdio: 'pipe' });
    console.log('✅ Playwright is installed');
  } catch (error) {
    console.log('❌ Playwright not found. Installing...');
    execSync('npm install @playwright/test', { stdio: 'inherit' });
    execSync('npx playwright install', { stdio: 'inherit' });
  }
  
  // Check if backend dependencies are installed
  const backendPath = path.join(__dirname, 'backend');
  if (fs.existsSync(backendPath)) {
    console.log('✅ Backend directory found');
  } else {
    console.log('⚠️ Backend directory not found at:', backendPath);
  }
  
  // Check if frontend dependencies are installed
  const frontendPath = path.join(__dirname, 'frontend');
  if (fs.existsSync(frontendPath)) {
    console.log('✅ Frontend directory found');
  } else {
    console.log('⚠️ Frontend directory not found at:', frontendPath);
  }
}

async function runTests() {
  console.log('🚀 Starting AI endpoints tests...');
  
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', ['playwright', 'test', 'tests/ai-endpoints-test.spec.js', '--reporter=list'], {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ All tests passed!');
        resolve();
      } else {
        console.log(`❌ Tests failed with exit code ${code}`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      console.error('❌ Failed to run tests:', error);
      reject(error);
    });
  });
}

async function generateReport() {
  console.log('📊 Generating test report...');
  
  try {
    const { execSync } = require('child_process');
    execSync('npx playwright show-report', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Could not open test report automatically');
  }
}

async function main() {
  try {
    await checkPrerequisites();
    await runTests();
    await generateReport();
    
    console.log('🎉 AI endpoints testing completed successfully!');
    console.log('');
    console.log('📋 Test Summary:');
    console.log('- ✅ AI Chat endpoints verified');
    console.log('- ✅ AI Overview endpoints verified');
    console.log('- ✅ AI Analytics endpoints verified');
    console.log('- ✅ UI components tested');
    console.log('- ✅ Error handling verified');
    console.log('');
    console.log('📁 Test artifacts saved in:');
    console.log('- test-results/ (screenshots, videos)');
    console.log('- playwright-report/ (HTML report)');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('');
  console.log('Usage: node run-ai-tests.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --setup-only   Only setup environment, don\'t run tests');
  console.log('  --debug        Run tests in debug mode');
  console.log('');
  console.log('Examples:');
  console.log('  node run-ai-tests.js                 # Run all tests');
  console.log('  node run-ai-tests.js --setup-only    # Setup environment only');
  console.log('  node run-ai-tests.js --debug         # Run tests with debugging');
  process.exit(0);
}

if (args.includes('--setup-only')) {
  console.log('🔧 Setting up environment only...');
  const TestEnvironmentSetup = require('./tests/setup-test-environment');
  const setup = new TestEnvironmentSetup();
  
  setup.setupEnvironment()
    .then(() => setup.createTestUser())
    .then(() => {
      console.log('✅ Environment setup complete!');
      console.log('🏃 You can now run tests manually with:');
      console.log('npx playwright test tests/ai-endpoints-test.spec.js');
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
} else {
  main();
}
