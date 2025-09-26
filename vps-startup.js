
#!/usr/bin/env node

/**
 * VPS Startup Script for Yoruba Cinemax
 * This script handles the complete setup and startup process for VPS deployment
 * Run this script on your VPS: node vps-startup.js
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🚀 Yoruba Cinemax VPS Startup Script');
console.log('=====================================');

const PROJECT_DIR = process.cwd();
const BIN_DIR = path.join(PROJECT_DIR, 'bin');
const YTDLP_PATH = path.join(BIN_DIR, 'yt-dlp');
const DATA_DIR = path.join(PROJECT_DIR, 'data');

// Step 1: Create necessary directories
function createDirectories() {
  console.log('📁 Creating necessary directories...');
  
  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
    console.log('✅ Created bin directory');
  }
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('✅ Created data directory');
  }
  
  // Create public/dist directory
  const publicDistDir = path.join(PROJECT_DIR, 'public', 'dist');
  if (!fs.existsSync(publicDistDir)) {
    fs.mkdirSync(publicDistDir, { recursive: true });
    console.log('✅ Created public/dist directory');
  }
}

// Step 2: Download yt-dlp binary
function downloadYtdlp() {
  return new Promise((resolve, reject) => {
    // Check if binary already exists and is valid
    if (fs.existsSync(YTDLP_PATH)) {
      try {
        const stats = fs.statSync(YTDLP_PATH);
        if (stats.size > 1000000) { // At least 1MB
          fs.chmodSync(YTDLP_PATH, 0o755);
          console.log('✅ yt-dlp already installed');
          resolve();
          return;
        }
      } catch (e) {
        console.log('⚠️ Existing yt-dlp binary invalid, redownloading...');
      }
    }

    console.log('⬇️ Downloading yt-dlp binary...');
    const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
    const file = fs.createWriteStream(YTDLP_PATH);

    function download(url) {
      https.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          download(res.headers.location);
          return;
        }
        
        if (res.statusCode !== 200) {
          reject(`Failed to download yt-dlp: HTTP ${res.statusCode}`);
          return;
        }

        let downloadedBytes = 0;
        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        
        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1);
            process.stdout.write(`\r📥 Downloading yt-dlp... ${progress}%`);
          }
        });

        res.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log('\n✅ yt-dlp downloaded successfully');
          
          try {
            fs.chmodSync(YTDLP_PATH, 0o755);
            const stats = fs.statSync(YTDLP_PATH);
            console.log(`📍 Binary size: ${(stats.size / 1048576).toFixed(1)} MB`);
            resolve();
          } catch (e) {
            reject('Failed to set executable permissions: ' + e.message);
          }
        });

        file.on('error', (err) => {
          reject('File write error: ' + err.message);
        });
      }).on('error', (err) => {
        reject('Download error: ' + err.message);
      });
    }

    download(YTDLP_URL);
  });
}

// Step 3: Install dependencies
function installDependencies() {
  return new Promise((resolve, reject) => {
    console.log('📦 Installing Node.js dependencies...');
    
    const npmInstall = spawn('npm', ['install', '--production'], {
      stdio: 'inherit',
      cwd: PROJECT_DIR
    });

    npmInstall.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Dependencies installed successfully');
        resolve();
      } else {
        reject(`npm install failed with code ${code}`);
      }
    });

    npmInstall.on('error', (error) => {
      reject(`Failed to run npm install: ${error.message}`);
    });
  });
}

// Step 4: Build the application
function buildApplication() {
  return new Promise((resolve, reject) => {
    console.log('🔨 Building application...');
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      cwd: PROJECT_DIR
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Application built successfully');
        resolve();
      } else {
        reject(`Build failed with code ${code}`);
      }
    });

    buildProcess.on('error', (error) => {
      reject(`Failed to build: ${error.message}`);
    });
  });
}

// Step 5: Create default data files if they don't exist
function createDefaultDataFiles() {
  console.log('📄 Checking data files...');
  
  const defaultFiles = {
    'movies.json': '[]',
    'actors.json': '[]',
    'collections.json': '[]',
    'users.json': '[]',
    'comments.json': '[]',
    'watchlists.json': '[]',
    'viewingHistory.json': '[]',
    'analyticsLog.json': '[]',
    'siteConfig.json': JSON.stringify({
      siteName: "Yoruba Cinemax",
      siteDescription: "Premium Yoruba Movie Streaming Platform",
      logoUrl: "",
      primaryColor: "#dc2626",
      secondaryColor: "#1f2937"
    }, null, 2),
    'announcement.json': JSON.stringify({
      enabled: false,
      title: "",
      message: "",
      type: "info"
    }, null, 2)
  };

  Object.entries(defaultFiles).forEach(([filename, content]) => {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Created ${filename}`);
    }
  });
}

// Step 6: Start the application
function startApplication() {
  console.log('🚀 Starting application...');
  console.log('=====================================');
  
  const startProcess = spawn('node', ['dist/server.js'], {
    stdio: 'inherit',
    cwd: PROJECT_DIR,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '5019'
    }
  });

  startProcess.on('error', (error) => {
    console.error('❌ Failed to start application:', error.message);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    startProcess.kill('SIGTERM');
    process.exit(0);
  });
}

// Main execution
async function main() {
  try {
    createDirectories();
    await downloadYtdlp();
    await installDependencies();
    await buildApplication();
    createDefaultDataFiles();
    
    console.log('🎉 Setup completed successfully!');
    console.log('');
    console.log('🌐 Your website will be available at:');
    console.log('   http://YOUR_VPS_IP:5019');
    console.log('');
    
    startApplication();
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
