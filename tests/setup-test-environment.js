const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestEnvironmentSetup {
  constructor() {
    this.backendProcess = null;
    this.frontendProcess = null;
    this.isSetup = false;
  }

  async setupEnvironment() {
    console.log('🚀 Setting up test environment for ASKELIO AI endpoints...');

    // Check if .env files exist
    await this.checkEnvironmentFiles();
    
    // Start backend server
    await this.startBackendServer();
    
    // Wait for backend to be ready
    await this.waitForBackend();
    
    // Start frontend server
    await this.startFrontendServer();
    
    // Wait for frontend to be ready
    await this.waitForFrontend();
    
    this.isSetup = true;
    console.log('✅ Test environment setup complete!');
  }

  async checkEnvironmentFiles() {
    console.log('🔍 Checking environment files...');
    
    const backendEnvPath = path.join(__dirname, '../backend/.env');
    const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
    
    // Check backend .env
    if (!fs.existsSync(backendEnvPath)) {
      console.log('⚠️ Backend .env file not found, creating default...');
      const defaultBackendEnv = `
# Database
DATABASE_URL=sqlite:///./askelio.db

# JWT
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# OpenRouter API for AI features
OPENROUTER_API_KEY=your-openrouter-api-key

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# Logging
LOG_LEVEL=INFO
`;
      fs.writeFileSync(backendEnvPath, defaultBackendEnv.trim());
    }
    
    // Check frontend .env.local
    if (!fs.existsSync(frontendEnvPath)) {
      console.log('⚠️ Frontend .env.local file not found, creating default...');
      const defaultFrontendEnv = `
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
`;
      fs.writeFileSync(frontendEnvPath, defaultFrontendEnv.trim());
    }
    
    console.log('✅ Environment files checked');
  }

  async startBackendServer() {
    console.log('🔧 Starting backend server...');
    
    return new Promise((resolve, reject) => {
      const backendPath = path.join(__dirname, '../backend');
      
      this.backendProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--reload', '--host', '0.0.0.0', '--port', '8001'], {
        cwd: backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      this.backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[Backend] ${output.trim()}`);
        
        if (output.includes('Uvicorn running on')) {
          console.log('✅ Backend server started successfully');
          resolve();
        }
      });

      this.backendProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[Backend Error] ${error.trim()}`);
        
        if (error.includes('Address already in use')) {
          console.log('ℹ️ Backend server already running on port 8001');
          resolve();
        }
      });

      this.backendProcess.on('error', (error) => {
        console.error('❌ Failed to start backend server:', error);
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        console.log('⏰ Backend startup timeout, assuming it\'s running...');
        resolve();
      }, 30000);
    });
  }

  async startFrontendServer() {
    console.log('🔧 Starting frontend server...');
    
    return new Promise((resolve, reject) => {
      const frontendPath = path.join(__dirname, '../frontend');
      
      this.frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: frontendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      this.frontendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[Frontend] ${output.trim()}`);
        
        if (output.includes('Ready') || output.includes('localhost:3000')) {
          console.log('✅ Frontend server started successfully');
          resolve();
        }
      });

      this.frontendProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[Frontend Error] ${error.trim()}`);
        
        if (error.includes('EADDRINUSE')) {
          console.log('ℹ️ Frontend server already running on port 3000');
          resolve();
        }
      });

      this.frontendProcess.on('error', (error) => {
        console.error('❌ Failed to start frontend server:', error);
        reject(error);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        console.log('⏰ Frontend startup timeout, assuming it\'s running...');
        resolve();
      }, 60000);
    });
  }

  async waitForBackend() {
    console.log('⏳ Waiting for backend to be ready...');
    
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch('http://localhost:8001/health');
        if (response.ok) {
          console.log('✅ Backend is ready');
          return;
        }
      } catch (error) {
        // Backend not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('⚠️ Backend health check timeout, proceeding anyway...');
  }

  async waitForFrontend() {
    console.log('⏳ Waiting for frontend to be ready...');
    
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch('http://localhost:3000');
        if (response.ok) {
          console.log('✅ Frontend is ready');
          return;
        }
      } catch (error) {
        // Frontend not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('⚠️ Frontend health check timeout, proceeding anyway...');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    if (this.backendProcess) {
      this.backendProcess.kill('SIGTERM');
      console.log('🔴 Backend server stopped');
    }
    
    if (this.frontendProcess) {
      this.frontendProcess.kill('SIGTERM');
      console.log('🔴 Frontend server stopped');
    }
    
    this.isSetup = false;
    console.log('✅ Cleanup complete');
  }

  async createTestUser() {
    console.log('👤 Creating test user...');
    
    try {
      const response = await fetch('http://localhost:8001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@askelio.com',
          password: 'test123',
          full_name: 'Test User'
        })
      });
      
      if (response.ok) {
        console.log('✅ Test user created successfully');
      } else {
        console.log('ℹ️ Test user might already exist');
      }
    } catch (error) {
      console.log('⚠️ Could not create test user:', error.message);
    }
  }
}

// Export for use in tests
module.exports = TestEnvironmentSetup;

// If run directly, setup environment
if (require.main === module) {
  const setup = new TestEnvironmentSetup();
  
  setup.setupEnvironment()
    .then(() => setup.createTestUser())
    .then(() => {
      console.log('🎉 Environment ready for testing!');
      console.log('📝 Run tests with: npx playwright test tests/ai-endpoints-test.spec.js');
      
      // Keep servers running
      process.on('SIGINT', async () => {
        await setup.cleanup();
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}
