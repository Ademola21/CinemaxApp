import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BIN_DIR = path.resolve(__dirname, '../bin');
const YTDLP_PATH = path.resolve(BIN_DIR, 'yt-dlp');

/**
 * Configure yt-dlp-exec to use our downloaded binary
 * This ensures compatibility with VPS environments that can't install Python
 */
export function configureYtdlp() {
  // Set the binary path for yt-dlp-exec
  if (!process.env.YTDLP_BINARY_PATH) {
    process.env.YTDLP_BINARY_PATH = YTDLP_PATH;
    console.log('🔧 yt-dlp-exec configured to use downloaded binary:', YTDLP_PATH);
  }
  
  return YTDLP_PATH;
}

/**
 * Get the path to the yt-dlp binary
 */
export function getYtdlpPath() {
  return YTDLP_PATH;
}

/**
 * Get ytdlp options with explicit binary path for VPS compatibility
 */
export function getYtdlpOptions(additionalOptions = {}) {
  const binaryExists = fs.existsSync(YTDLP_PATH);
  
  const options = {
    // Only set binary path if our downloaded binary exists
    ...(binaryExists ? { binary: YTDLP_PATH } : {}),
    ...additionalOptions
  };
  
  if (binaryExists) {
    console.log('🔧 Using explicit binary path for yt-dlp-exec:', YTDLP_PATH);
  } else {
    console.log('⚠️ Downloaded binary not found, yt-dlp-exec will use default resolution');
  }
  
  return options;
}

// Auto-configure when this module is imported
configureYtdlp();