#!/usr/bin/env bash
# 🧠 MindMap - Setup Automático

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║        🧠 MindMap Colaborativo - Setup Automático            ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Backend
echo -e "${BLUE}[1/4]${NC} Instalando dependências do Backend..."
cd backend
npm install > /dev/null 2>&1
echo -e "${GREEN}✅ Backend pronto${NC}"
cd ..

# Step 2: Frontend
echo -e "${BLUE}[2/4]${NC} Instalando dependências do Frontend..."
cd frontend
npm install > /dev/null 2>&1
echo -e "${GREEN}✅ Frontend pronto${NC}"
cd ..

# Step 3: Show instructions
echo ""
echo -e "${BLUE}[3/4]${NC} Configuração de Banco de Dados"
echo ""
echo "Para completar o setup, você precisa executar o SQL no Supabase."
echo ""
echo "  1. Abra: https://mvkrlvjyocynmwslklzu.supabase.co"
echo "  2. SQL Editor → New Query"
echo "  3. Cole o conteúdo de: database/schema.sql"
echo "  4. Clique em RUN"
echo ""
echo "Ou deixe que a aplicação faça automaticamente quando iniciar."
echo ""

# Step 4: Start servers
echo -e "${BLUE}[4/4]${NC} Iniciando servidores..."
echo ""
echo -e "${YELLOW}⚠️  Você precisa abrir DOIS terminais diferentes:${NC}"
echo ""
echo "Terminal 1:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Depois acesse: http://localhost:5173"
echo ""
echo -e "${GREEN}✨ Setup concluído! Pronto para usar!${NC}"
echo ""
