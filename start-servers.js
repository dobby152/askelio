#!/usr/bin/env node

/**
 * Start both backend and frontend servers for development
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Askelio development servers...\n');

// Start backend server
console.log('📡 Starting backend server on port 8001...');
const backend = spawn('python', ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8001'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => {
  console.error('❌ Backend server error:', err);
});

// Wait a bit for backend to start
setTimeout(() => {
  // Start frontend server
  console.log('🌐 Starting frontend server on port 3000...');
  const frontend = spawn('npx', ['next', 'dev', '--port', '3000'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (err) => {
    console.error('❌ Frontend server error:', err);
  });
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill();
  process.exit(0);
});

console.log('✅ Servers starting...');
console.log('📡 Backend: http://localhost:8001');
console.log('🌐 Frontend: http://localhost:3000');
console.log('📚 API Docs: http://localhost:8001/docs');
console.log('\nPress Ctrl+C to stop servers');
