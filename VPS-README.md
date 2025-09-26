
# VPS Deployment - Quick Start

## One-Command Setup

1. Upload your project to your VPS
2. Navigate to the project directory
3. Run the startup script:

```bash
node vps-startup.js
```

That's it! The script will:
- ✅ Download yt-dlp binary automatically
- ✅ Install all Node.js dependencies
- ✅ Build the application
- ✅ Create necessary data files
- ✅ Start the server on port 5019

## Access Your Site

Your website will be available at:
```
http://YOUR_VPS_IP:5019
```

## Optional: Environment Variables

Create a `.env` file for additional features:

```env
# Production Environment
NODE_ENV=production
PORT=5019

# Azure OpenAI (optional - for AI features)
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment

# Telegram Bot (optional - for admin)
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_TELEGRAM_USER_ID=your_user_id
```

## Manual Commands (if needed)

```bash
# Just install dependencies and build
npm run vps:setup

# Start the application
npm run vps:start
```

## Troubleshooting

If the automatic startup fails:
1. Check that Node.js is installed: `node --version`
2. Make sure you're in the project directory
3. Check the console output for specific errors
4. Ensure port 5019 is open on your VPS
