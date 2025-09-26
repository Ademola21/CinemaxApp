/**
 * Custom yt-dlp wrapper for VPS compatibility
 * Directly uses downloaded binary instead of yt-dlp-exec to avoid Python dependencies
 */
const { spawn } = require('child_process');
const path = require('path');

const YTDLP_BINARY = path.resolve(__dirname, '../bin/yt-dlp');

interface YtdlpOptions {
  dumpSingleJson?: boolean;
  noCheckCertificate?: boolean;
  noWarnings?: boolean;
  preferFreeFormats?: boolean;
  format?: string;
  output?: string;
  [key: string]: any;
}

/**
 * Execute yt-dlp with given URL and options
 */
function ytdlp(url: string, options: YtdlpOptions = {}): Promise<any> {
  return new Promise((resolve, reject) => {
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

// Ensure proper CommonJS export for VPS compatibility
export { ytdlp };
module.exports = { ytdlp };