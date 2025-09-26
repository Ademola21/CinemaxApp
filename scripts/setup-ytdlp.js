import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BIN_DIR = path.resolve(__dirname, '../bin');
const YTDLP_PATH = path.resolve(BIN_DIR, 'yt-dlp');
const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

console.log('🔧 Setting up yt-dlp binary for VPS deployment...');

// Create bin directory if it doesn't exist
if (!fs.existsSync(BIN_DIR)) {
  fs.mkdirSync(BIN_DIR, { recursive: true });
  console.log(`📁 Created directory: ${BIN_DIR}`);
}

function ensureBinary() {
  return new Promise((resolve, reject) => {
    // Check if binary already exists and is valid
    if (fs.existsSync(YTDLP_PATH)) {
      try {
        const stats = fs.statSync(YTDLP_PATH);
        if (stats.size > 1000000) { // At least 1MB
          fs.chmodSync(YTDLP_PATH, 0o755);
          console.log(`✅ yt-dlp already installed (${(stats.size / 1048576).toFixed(1)} MB)`);
          resolve();
          return;
        } else {
          console.log('⚠️ Found broken yt-dlp file, deleting...');
          fs.unlinkSync(YTDLP_PATH);
        }
      } catch (e) {
        console.error('⚠️ Error checking existing binary:', e.message);
      }
    }

    console.log('⬇️ Downloading yt-dlp binary from GitHub...');
    const file = fs.createWriteStream(YTDLP_PATH);

    function download(url) {
      https.get(url, (res) => {
        // Handle redirects
        if (res.statusCode === 302 || res.statusCode === 301) {
          console.log('🔄 Following redirect...');
          download(res.headers.location);
          return;
        }
        
        if (res.statusCode !== 200) {
          if (fs.existsSync(YTDLP_PATH)) fs.unlinkSync(YTDLP_PATH);
          reject(`Failed to download yt-dlp: HTTP ${res.statusCode}`);
          return;
        }

        let downloadedBytes = 0;
        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        
        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1);
            process.stdout.write(`\r📥 Downloading... ${progress}%`);
          }
        });

        res.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log('\n'); // New line after progress
          
          try {
            // Make binary executable
            fs.chmodSync(YTDLP_PATH, 0o755);
            
            const stats = fs.statSync(YTDLP_PATH);
            if (stats.size < 1000000) { // Less than 1MB indicates failed download
              fs.unlinkSync(YTDLP_PATH);
              reject('Downloaded yt-dlp file too small, download may have failed.');
              return;
            }
            
            console.log(`✅ yt-dlp binary installed successfully (${(stats.size / 1048576).toFixed(1)} MB)`);
            console.log(`📍 Binary location: ${YTDLP_PATH}`);
            
            // Set environment variable for yt-dlp-exec to use our binary
            process.env.YTDLP_BINARY_PATH = YTDLP_PATH;
            process.env.YTDLP_BINARY = YTDLP_PATH; // Alternative env var name
            console.log('🔧 VPS-compatible environment configured for yt-dlp-exec');
            
            resolve();
          } catch (e) {
            if (fs.existsSync(YTDLP_PATH)) fs.unlinkSync(YTDLP_PATH);
            reject('⚠️ Failed to finalize yt-dlp binary: ' + e.message);
          }
        });

        file.on('error', (err) => {
          if (fs.existsSync(YTDLP_PATH)) fs.unlinkSync(YTDLP_PATH);
          reject('File write error: ' + err.message);
        });
      }).on('error', (err) => {
        if (fs.existsSync(YTDLP_PATH)) fs.unlinkSync(YTDLP_PATH);
        reject('Download error: ' + err.message);
      });
    }

    download(YTDLP_URL);
  });
}

// Main execution
(async () => {
  try {
    await ensureBinary();
    console.log('🎉 yt-dlp setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to set up yt-dlp:', error);
    process.exit(1);
  }
})();