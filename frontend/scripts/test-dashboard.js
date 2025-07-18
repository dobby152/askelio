#!/usr/bin/env node

/**
 * Dashboard Test Runner Script
 * 
 * This script provides easy commands to run different types of dashboard tests
 */

const { spawn } = require('child_process');
const path = require('path');

const commands = {
  // Basic dashboard tests
  basic: 'npx playwright test dashboard.spec.ts',
  
  // Interactive tests
  interactions: 'npx playwright test dashboard-interactions.spec.ts',
  
  // Visual regression tests
  visual: 'npx playwright test dashboard-visual.spec.ts --project=visual-tests',
  
  // All dashboard tests
  all: 'npx playwright test dashboard*.spec.ts',
  
  // Mobile tests only
  mobile: 'npx playwright test dashboard.spec.ts --project="Mobile Chrome"',
  
  // Desktop tests only
  desktop: 'npx playwright test dashboard.spec.ts --project=chromium',
  
  // Tablet tests only
  tablet: 'npx playwright test dashboard.spec.ts --project=Tablet',
  
  // Cross-browser tests
  crossbrowser: 'npx playwright test dashboard.spec.ts --project=chromium --project=firefox --project=webkit',
  
  // Debug mode
  debug: 'npx playwright test dashboard.spec.ts --debug',
  
  // Headed mode (show browser)
  headed: 'npx playwright test dashboard.spec.ts --headed',
  
  // Generate test report
  report: 'npx playwright show-report',
  
  // Update visual baselines
  'update-visuals': 'npx playwright test dashboard-visual.spec.ts --update-snapshots',
  
  // Performance tests
  performance: 'npx playwright test dashboard.spec.ts --grep="Performance"',
  
  // Accessibility tests
  accessibility: 'npx playwright test dashboard.spec.ts --grep="Accessibility"',
  
  // Error handling tests
  errors: 'npx playwright test dashboard-interactions.spec.ts --grep="Error"',
  
  // Upload tests
  upload: 'npx playwright test dashboard-interactions.spec.ts --grep="Upload"',
  
  // Chart tests
  charts: 'npx playwright test dashboard.spec.ts --grep="Chart"',
  
  // Responsive tests
  responsive: 'npx playwright test dashboard.spec.ts --grep="Responsive"'
};

function showHelp() {
  console.log('\n🎭 Dashboard Test Runner\n');
  console.log('Available commands:\n');
  
  Object.keys(commands).forEach(cmd => {
    console.log(`  npm run test:dashboard ${cmd.padEnd(15)} - ${getCommandDescription(cmd)}`);
  });
  
  console.log('\nExamples:');
  console.log('  npm run test:dashboard basic        # Run basic dashboard tests');
  console.log('  npm run test:dashboard visual       # Run visual regression tests');
  console.log('  npm run test:dashboard mobile       # Run tests on mobile viewport');
  console.log('  npm run test:dashboard debug        # Run tests in debug mode');
  console.log('  npm run test:dashboard all          # Run all dashboard tests');
  console.log('');
}

function getCommandDescription(cmd) {
  const descriptions = {
    basic: 'Run basic dashboard functionality tests',
    interactions: 'Run interactive feature tests',
    visual: 'Run visual regression tests',
    all: 'Run all dashboard tests',
    mobile: 'Run tests on mobile viewport',
    desktop: 'Run tests on desktop viewport',
    tablet: 'Run tests on tablet viewport',
    crossbrowser: 'Run tests across multiple browsers',
    debug: 'Run tests in debug mode',
    headed: 'Run tests with visible browser',
    report: 'Show test report',
    'update-visuals': 'Update visual test baselines',
    performance: 'Run performance tests only',
    accessibility: 'Run accessibility tests only',
    errors: 'Run error handling tests',
    upload: 'Run file upload tests',
    charts: 'Run chart-related tests',
    responsive: 'Run responsive design tests'
  };
  
  return descriptions[cmd] || 'Run specific test suite';
}

function runCommand(command) {
  console.log(`\n🚀 Running: ${command}\n`);
  
  const [cmd, ...args] = command.split(' ');
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });
  
  child.on('error', (error) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Tests completed successfully!');
    } else {
      console.log(`\n❌ Tests failed with exit code ${code}`);
      process.exit(code);
    }
  });
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }
  
  const command = args[0];
  
  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('\nAvailable commands:');
    Object.keys(commands).forEach(cmd => {
      console.log(`  ${cmd}`);
    });
    process.exit(1);
  }
  
  // Add any additional arguments
  let fullCommand = commands[command];
  if (args.length > 1) {
    fullCommand += ' ' + args.slice(1).join(' ');
  }
  
  runCommand(fullCommand);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test execution interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Test execution terminated');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { commands, runCommand };
