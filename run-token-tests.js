#!/usr/bin/env node

/**
 * Token Persistence Test Runner
 * Runs Playwright tests for token persistence and automatic refresh
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Starting Token Persistence Tests...\n');

// Check if required dependencies are installed
const requiredPackages = ['@playwright/test'];
const missingPackages = [];

for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
  } catch (error) {
    missingPackages.push(pkg);
  }
}

if (missingPackages.length > 0) {
  console.error('❌ Missing required packages:');
  missingPackages.forEach(pkg => console.error(`   - ${pkg}`));
  console.error('\nPlease install them with:');
  console.error(`npm install ${missingPackages.join(' ')}`);
  process.exit(1);
}

// Run Playwright tests
const playwrightArgs = [
  'test',
  'tests/token-persistence.spec.js',
  '--config=playwright.config.js',
  '--reporter=html,json',
  '--headed', // Run in headed mode to see the browser
];

// Add additional arguments from command line
const additionalArgs = process.argv.slice(2);
playwrightArgs.push(...additionalArgs);

console.log('🚀 Running Playwright tests with arguments:', playwrightArgs.join(' '));
console.log('');

const playwrightProcess = spawn('npx', ['playwright', ...playwrightArgs], {
  stdio: 'inherit',
  cwd: process.cwd()
});

playwrightProcess.on('close', (code) => {
  console.log('');
  if (code === 0) {
    console.log('✅ All token persistence tests passed!');
    console.log('');
    console.log('📊 Test results available at:');
    console.log('   - HTML Report: playwright-report/index.html');
    console.log('   - JSON Report: test-results/results.json');
  } else {
    console.log('❌ Some tests failed. Check the reports for details.');
    console.log('');
    console.log('📊 Test results available at:');
    console.log('   - HTML Report: playwright-report/index.html');
    console.log('   - JSON Report: test-results/results.json');
  }
  
  process.exit(code);
});

playwrightProcess.on('error', (error) => {
  console.error('❌ Failed to start Playwright tests:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted');
  playwrightProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated');
  playwrightProcess.kill('SIGTERM');
});
