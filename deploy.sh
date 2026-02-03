#!/bin/bash
# Deploy Script - MindMap Hub
# Este script automatiza o deployment para Vercel e Render

set -e

echo "🚀 MindMap Hub - Deployment Automation"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is clean
echo -e "${BLUE}📋 Checking git status...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes!${NC}"
    echo "Commit your changes before deploying"
    exit 1
fi

echo -e "${GREEN}✅ Git is clean${NC}"
echo ""

# Deploy Frontend
echo -e "${BLUE}📦 Deploying Frontend to Vercel...${NC}"
cd frontend

if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

echo "Run this command:"
echo "  vercel --prod"
echo ""

# Deploy Backend
echo -e "${BLUE}📦 Deploying Backend to Render...${NC}"
echo ""
echo "1. Go to: https://dashboard.render.com"
echo "2. Connect your GitHub repository"
echo "3. Create new Web Service with:"
echo "   - Root Directory: backend"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo "4. Add environment variables from backend/.env.production"
echo ""

echo -e "${GREEN}✅ All set!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy frontend: cd frontend && vercel --prod"
echo "2. Configure Render service"
echo "3. Test at https://mindmap-hub.vercel.app"
