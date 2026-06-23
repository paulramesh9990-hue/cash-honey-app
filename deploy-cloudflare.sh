#!/bin/bash
# Cash Honey — Cloudflare Pages Deployment
# ==========================================
#
# Option A: Quick deploy via Wrangler CLI (recommended)
#   1. Install wrangler: npm install -g wrangler
#   2. Login: wrangler login
#   3. Build & deploy: bash deploy-cloudflare.sh
#
# Option B: GitHub + Cloudflare Pages dashboard
#   1. Push this repo to GitHub
#   2. Go to https://dash.cloudflare.com → Pages → Create a project
#   3. Connect your GitHub repo
#   4. Set build command: vite build
#   5. Set build output directory: dist
#   6. Deploy!

set -e

echo "🍯 Cash Honey — Deploying to Cloudflare Pages..."
echo ""

# Build the project
echo "📦 Building..."
bun run build

# Deploy with wrangler
echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=cash-honey

echo ""
echo "✅ Cash Honey is live! 🍯"
echo "   Your app will be available at: https://cash-honey.pages.dev"
echo "   (or a similar subdomain based on your Cloudflare account)"
