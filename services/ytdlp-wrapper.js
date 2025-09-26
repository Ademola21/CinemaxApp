
/**
 * Custom yt-dlp wrapper for VPS compatibility
 * Pure JavaScript version that directly uses downloaded binary
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const YTDLP_BINARY = path.resolve(__dirname, '../bin/yt-dlp');

/**
 * Execute yt-dlp with given URL and options
 */
function ytdlp(url, options = {}) {
  return new Promise((resolve, reject) => {
    // Check if binary exists first
    if (!fs.existsSync(YTDLP_BINARY)) {
      reject(new Error(`yt-dlp binary not found at ${YTDLP_BINARY}. Please run the setup script first.`));
      return;
    }

    const args = [url];
    
    // Convert options to command line arguments
    Object.entries(options).forEach(([key, value]) => {
      if (value === true) {
        // Boolean flags - convert camelCase to kebab-case with double dashes
        const flag = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
        args.push(flag);
      } else if (value !== false && value !== undefined) {
        // Value flags - convert camelCase to kebab-case with double dashes
        const flag = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
        args.push(flag, String(value));
      }
    });

    console.log('🔧 Executing yt-dlp:', YTDLP_BINARY, args.join(' '));
    
    const process = spawn(YTDLP_BINARY, args, {
      stdio: options.dumpSingleJson ? ['pipe', 'pipe', 'pipe'] : ['pipe', 'inherit', 'inherit']
    });

    let stdout = '';
    let stderr = '';

    if (process.stdout) {
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (process.stderr) {
      process.stderr.on('data', (data) => {
        stderr += data.toString();
        if (!options.noWarnings) {
          console.log('yt-dlp:', data.toString().trim());
        }
      });
    }

    process.on('close', (code) => {
      if (code === 0) {
        if (options.dumpSingleJson) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse JSON output: ${e}`));
          }
        } else {
          resolve(stdout);
        }
      } else {
        reject(new Error(`yt-dlp process exited with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Failed to spawn yt-dlp process: ${error.message}`));
    });
  });
}

// Export for both CommonJS and ES modules
module.exports = { ytdlp };
exports.ytdlp = ytdlp;
